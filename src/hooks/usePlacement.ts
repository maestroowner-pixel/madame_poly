import { useCallback, useEffect, useRef, useState } from 'react';

import { EXAM_MAX_TURN_MS, EXAM_SILENCE_HOLD_MS, type SpeechMode } from '../config';
import { errorText } from '../errors';
import { t } from '../i18n';
import { PLACEMENT_ANSWERS } from '../prompts';
import { assessPlacement, placementTurn, recordWeakSpots } from '../services/llm';
import { synthesize } from '../services/tts';
import { savePlacement } from '../storage';
import type { LanguageCode, Message, PlacementResult, TurnMode } from '../types';
import { nextId } from './useConversation';
import { useVoiceLoop, type Reply } from './useVoiceLoop';

/** Где человек: читает, что будет, разговаривает, ждёт оценку или читает итог. */
export type PlacementStage = 'intro' | 'talk' | 'assessing' | 'result';

interface Options {
  language: LanguageCode;
  turnMode: TurnMode;
  speechRate: SpeechMode;
  name?: string;
}

const answersIn = (turns: Message[]) => turns.filter((turn) => turn.role === 'user').length;

/**
 * Тест уровня: голосовой цикл тот же, что у беседы и экзамена, а ведёт его Poly
 * по лестнице вопросов от A1 вверх. Восемь ответов — и оценка одним запросом.
 * Сам разговор не хранится: нужен только итог.
 */
export function usePlacement({ language, turnMode, speechRate, name }: Options) {
  const [stage, setStage] = useState<PlacementStage>('intro');
  const [turns, setTurns] = useState<Message[]>([]);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const turnsRef = useRef<Message[]>([]);

  const push = useCallback((turn: Message) => {
    turnsRef.current = [...turnsRef.current, turn];
    setTurns(turnsRef.current);
  }, []);

  const addTeacherTurn = useCallback(
    (text: string, farewell: boolean): Reply => {
      const turn: Message = { id: nextId(), role: 'assistant', text, createdAt: Date.now() };
      push(turn);
      return {
        text,
        farewell,
        onVoiced: (audioUri) => {
          turnsRef.current = turnsRef.current.map((item) => (item.id === turn.id ? { ...item, audioUri } : item));
          setTurns(turnsRef.current);
        },
      };
    },
    [push],
  );

  const onHeard = useCallback(
    async (text: string): Promise<Reply> => {
      const before = turnsRef.current;
      const index = answersIn(before);
      push({ id: nextId(), role: 'user', text, createdAt: Date.now() });
      const reply = await placementTurn({ history: before, answer: text, answerIndex: index, language, name });
      return addTeacherTurn(reply, index + 1 >= PLACEMENT_ANSWERS);
    },
    [push, addTeacherTurn, language, name],
  );

  const voice = useVoiceLoop({
    language: () => language,
    turnMode,
    rate: () => (speechRate === 'auto' ? 1 : speechRate),
    onHeard,
    onError: setError,
    maxTurnMs: EXAM_MAX_TURN_MS,
    silenceHoldMs: EXAM_SILENCE_HOLD_MS,
  });

  const assess = useCallback(async () => {
    if (answersIn(turnsRef.current) === 0) {
      setError(t.placementNoAnswers);
      return;
    }
    setStage('assessing');
    setError(null);
    try {
      const { result: next, errors } = await assessPlacement({ turns: turnsRef.current, language });
      await savePlacement(next);
      setResult(next);
      setStage('result');
      // Ошибки теста — к тренажёрам, как ошибки бесед; осечка итогу не мешает.
      void recordWeakSpots(language, errors).catch(() => undefined);
    } catch (e: unknown) {
      setError(errorText(e));
      setStage('talk');
    }
  }, [language]);

  /** «Закончить и узнать уровень» — можно и раньше восьми ответов. */
  const finish = useCallback(async () => {
    if (voice.isActive()) await voice.stop();
    await assess();
  }, [voice.isActive, voice.stop, assess]);

  // Последний ответ дан, Poly попрощалась и договорила — оцениваем сами.
  const wasActive = useRef(false);
  useEffect(() => {
    const ended = wasActive.current && !voice.sessionActive;
    wasActive.current = voice.sessionActive;
    if (ended && stage === 'talk' && answersIn(turnsRef.current) >= PLACEMENT_ANSWERS) void assess();
  }, [voice.sessionActive, stage, assess]);

  const start = useCallback(async () => {
    if (voice.isActive()) return;
    turnsRef.current = [];
    setTurns([]);
    setResult(null);
    setError(null);
    setStage('talk');
    await voice.start(async () => {
      const reply = await placementTurn({ history: [], answer: null, answerIndex: 0, language, name });
      return addTeacherTurn(reply, false);
    });
  }, [voice.isActive, voice.start, addTeacherTurn, language, name]);

  const resume = useCallback(async () => {
    if (voice.isActive()) return;
    await voice.start();
  }, [voice.isActive, voice.start]);

  /** Уйти из теста: микрофон закрыть, разговор забыть. */
  const close = useCallback(async () => {
    if (voice.isActive()) await voice.stop();
  }, [voice.isActive, voice.stop]);

  const replay = useCallback(
    async (turn: Message) => {
      if (voice.isActive()) return;
      try {
        await voice.play(turn.audioUri ?? (await synthesize(turn.text)));
      } catch (e: unknown) {
        setError(errorText(e));
      }
    },
    [voice.isActive, voice.play],
  );

  return {
    stage,
    turns,
    result,
    error,
    dismissError: () => setError(null),
    answers: answersIn(turns),
    total: PLACEMENT_ANSWERS,
    status: voice.status,
    sessionActive: voice.sessionActive,
    durationMillis: voice.durationMillis,
    inputLevel: voice.inputLevel,
    beginTurn: voice.beginTurn,
    endTurn: voice.endTurn,
    pause: voice.stop,
    start,
    resume,
    finish,
    close,
    replay,
  };
}
