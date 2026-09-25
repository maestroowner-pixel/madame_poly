import { useCallback, useEffect, useRef, useState } from 'react';

import { EXAM_MAX_TURN_MS, EXAM_SILENCE_HOLD_MS, type SpeechMode } from '../config';
import { examAnswers, findExamTopic, partOfAnswer } from '../exam';
import { examinerTurn, reviewExam } from '../services/llm';
import { synthesize } from '../services/tts';
import {
  deleteExamSession,
  loadExamSessions,
  loadSessionReport,
  saveSessionReport,
} from '../storage';
import type {
  DialogueTurn,
  ExamPart,
  ExamSession,
  LanguageCode,
  Level,
  SessionReport,
  TurnMode,
} from '../types';
import { t } from '../i18n';
import { errorText } from '../errors';
import { nextId } from './useConversation';
import { useVoiceLoop, type Reply } from './useVoiceLoop';

/** Где человек сейчас: выбирает тему, сдаёт или читает разбор. */
export type ExamStage = 'pick' | 'talk' | 'report';

interface Options {
  language: LanguageCode;
  /** Уровень новой сессии; у сессии из истории — свой, сохранённый в ней. */
  level: Level;
  turnMode: TurnMode;
  speechRate: SpeechMode;
  name?: string;
}

const answersIn = (turns: DialogueTurn[]) => turns.filter((turn) => turn.role === 'user').length;

/**
 * Экзамен: голосовой цикл тот же, что у беседы, а вместо собеседницы —
 * экзаменатор, который ведёт три части по плану и ничего не исправляет по ходу.
 * Разбор приходит одним запросом в конце.
 */
export function useExamSession({ language, level, turnMode, speechRate, name }: Options) {
  const [stage, setStage] = useState<ExamStage>('pick');
  const [session, setSession] = useState<SessionReport | null>(null);
  const [history, setHistory] = useState<ExamSession[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<SessionReport | null>(null);

  useEffect(() => {
    void loadExamSessions().then(setHistory);
  }, []);

  /**
   * Каждая правка сессии сразу уходит на диск — см. SessionReport. Записи идут
   * очередью: ответ и реплика экзаменатора сохраняются почти одновременно, и
   * без очереди ранняя могла бы лечь на диск последней и стереть позднюю.
   */
  const saving = useRef<Promise<void>>(Promise.resolve());
  const update = useCallback((updater: (current: SessionReport) => SessionReport) => {
    const current = sessionRef.current;
    if (!current) return;
    const next = updater(current);
    sessionRef.current = next;
    setSession(next);
    saving.current = saving.current
      .then(() => saveSessionReport(next))
      .then(setHistory)
      .catch(() => {
        // Следующая правка сохранит сессию целиком — одна осечка ничего не теряет.
      });
  }, []);

  /** Реплика экзаменатора в стенограмму; озвучка догонит её путём к файлу. */
  const addExaminerTurn = useCallback(
    (text: string, part: ExamPart, farewell: boolean): Reply => {
      const turn: DialogueTurn = {
        id: nextId(),
        role: 'assistant',
        text,
        createdAt: Date.now(),
        part,
      };
      update((current) => ({ ...current, turns: [...current.turns, turn], endedAt: turn.createdAt }));

      return {
        text,
        farewell,
        onVoiced: (audioUri) =>
          update((current) => ({
            ...current,
            turns: current.turns.map((item) => (item.id === turn.id ? { ...item, audioUri } : item)),
          })),
      };
    },
    [update],
  );

  const onHeard = useCallback(
    async (text: string): Promise<Reply> => {
      const current = sessionRef.current;
      if (!current) throw new Error(t.examNotStarted);
      const topic = findExamTopic(current.language, current.topicId);
      if (!topic) throw new Error(t.examNotStarted);

      const index = answersIn(current.turns);
      const part = partOfAnswer(current.level, index) ?? 'discussion';
      const answer: DialogueTurn = {
        id: nextId(),
        role: 'user',
        text,
        createdAt: Date.now(),
        part,
      };
      const before = current.turns;
      update((item) => ({
        ...item,
        turns: [...item.turns, answer],
        answerCount: index + 1,
        endedAt: answer.createdAt,
      }));

      const reply = await examinerTurn({
        history: before,
        answer: text,
        answerIndex: index,
        language: current.language,
        level: current.level,
        topic,
        name,
      });

      const nextPart = partOfAnswer(current.level, index + 1);
      return addExaminerTurn(reply, nextPart ?? part, nextPart === null);
    },
    [update, addExaminerTurn, name],
  );

  const voice = useVoiceLoop({
    language: () => sessionRef.current?.language ?? language,
    turnMode,
    // «Как я» считает темп по беседе — на экзамене говорим в обычном темпе.
    rate: () => (speechRate === 'auto' ? 1 : speechRate),
    onHeard,
    onError: setError,
    maxTurnMs: EXAM_MAX_TURN_MS,
    silenceHoldMs: EXAM_SILENCE_HOLD_MS,
  });

  const review = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || reviewing) return;

    setStage('report');
    setError(null);
    if (answersIn(current.turns) === 0) {
      setError(t.examNothingToReview);
      return;
    }

    setReviewing(true);
    try {
      const report = await reviewExam({
        turns: current.turns,
        language: current.language,
        level: current.level,
      });
      update((item) => ({ ...item, report, errorCount: report.errors.length }));
    } catch (e: unknown) {
      setError(errorText(e));
    } finally {
      setReviewing(false);
    }
  }, [reviewing, update]);

  /** «Закончить и разобрать»: экзамен можно прервать в любой момент. */
  const finish = useCallback(async () => {
    if (voice.isActive()) await voice.stop();
    await review();
  }, [voice.isActive, voice.stop, review]);

  /**
   * План исчерпан, экзаменатор попрощался и договорил — разбор просим сами,
   * человеку не нужно искать для этого кнопку.
   */
  const wasActive = useRef(false);
  useEffect(() => {
    const ended = wasActive.current && !voice.sessionActive;
    wasActive.current = voice.sessionActive;
    const current = sessionRef.current;
    if (ended && stage === 'talk' && current && answersIn(current.turns) >= examAnswers(current.level)) {
      void review();
    }
  }, [voice.sessionActive, stage, review]);

  /** Новая сессия по теме; экзаменатор здоровается первым. */
  const start = useCallback(
    async (topicId: string) => {
      const topic = findExamTopic(language, topicId);
      if (!topic || voice.isActive()) return;

      const now = Date.now();
      const fresh: SessionReport = {
        id: `exam-${now}`,
        language,
        level,
        topicId,
        startedAt: now,
        endedAt: now,
        answerCount: 0,
        errorCount: null,
        turns: [],
        report: null,
      };
      sessionRef.current = fresh;
      setSession(fresh);
      setError(null);
      setStage('talk');

      await voice.start(async () => {
        const reply = await examinerTurn({
          history: [],
          answer: null,
          answerIndex: 0,
          language,
          level,
          topic,
          name,
        });
        return addExaminerTurn(reply, 'interview', false);
      });
    },
    [language, level, name, voice.isActive, voice.start, addExaminerTurn],
  );

  /** Продолжить прерванную сессию тем же голосом — после паузы или ошибки сети. */
  const resume = useCallback(async () => {
    if (!sessionRef.current || voice.isActive()) return;
    await voice.start();
  }, [voice.isActive, voice.start]);

  const openSession = useCallback(async (id: string) => {
    const full = await loadSessionReport(id);
    if (!full) return;
    sessionRef.current = full;
    setSession(full);
    setError(null);
    setStage('report');
  }, []);

  const back = useCallback(async () => {
    if (voice.isActive()) await voice.stop();
    sessionRef.current = null;
    setSession(null);
    setError(null);
    setStage('pick');
    setHistory(await loadExamSessions());
  }, [voice.isActive, voice.stop]);

  const remove = useCallback(async (id: string) => {
    setHistory(await deleteExamSession(id));
  }, []);

  /** Переслушать реплику экзаменатора в стенограмме. */
  const replay = useCallback(
    async (turn: DialogueTurn) => {
      if (voice.isActive()) return;
      try {
        const uri = turn.audioUri ?? (await synthesize(turn.text));
        await voice.play(uri);
      } catch (e: unknown) {
        setError(errorText(e));
      }
    },
    [voice.isActive, voice.play],
  );

  return {
    stage,
    session,
    history,
    reviewing,
    error,
    dismissError: () => setError(null),
    /** Сколько ответов дано и сколько ждёт план — для полоски прогресса. */
    answers: session ? answersIn(session.turns) : 0,
    total: session ? examAnswers(session.level) : 0,
    status: voice.status,
    sessionActive: voice.sessionActive,
    durationMillis: voice.durationMillis,
    inputLevel: voice.inputLevel,
    beginTurn: voice.beginTurn,
    endTurn: voice.endTurn,
    start,
    resume,
    pause: voice.stop,
    finish,
    review,
    openSession,
    back,
    remove,
    replay,
  };
}
