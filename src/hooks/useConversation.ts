import { useCallback, useEffect, useRef, useState } from 'react';

import {
  SILENCE_HOLD_MS,
  SPEECH_MATCH_SHARE,
  SPEECH_RATE_MAX,
  SPEECH_RATE_MIN,
  SPEECH_REFERENCE_WPM,
  WPM_BLEND,
  type SpeechMode,
} from '../config';
import { explainCorrection, generateHomework, openConversation, respond } from '../services/llm';
import { synthesize } from '../services/tts';
import {
  archiveSession,
  clearHistory,
  deleteArchived,
  loadArchive,
  loadHistory,
  loadLanguage,
  loadLevels,
  loadEnglishVariant,
  loadHomework,
  loadProfile,
  loadTopic,
  loadSpeechRate,
  loadTurnMode,
  loadUserWpm,
  saveHistory,
  saveLanguage,
  saveLevels,
  saveEnglishVariant,
  saveHomework,
  saveProfile,
  saveTopic,
  saveSpeechRate,
  saveTurnMode,
  saveUserWpm,
  EMPTY_PROFILE,
  type LevelMap,
} from '../storage';
import { findTopic } from '../topics';
import type {
  ArchivedSession,
  Homework,
  LanguageCode,
  Level,
  EnglishVariant,
  Message,
  Profile,
  TurnMode,
} from '../types';
import { t } from '../i18n';
import { errorText } from '../errors';
import { useVoiceLoop, type Reply } from './useVoiceLoop';

export type { Status } from './useVoiceLoop';

let messageCounter = 0;
export const nextId = () => `${Date.now()}-${messageCounter++}`;

export function useConversation() {
  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [levels, setLevels] = useState<LevelMap | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [archive, setArchive] = useState<ArchivedSession[]>([]);
  const [profile, setProfileState] = useState<Profile>(EMPTY_PROFILE);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [homeworkBusy, setHomeworkBusy] = useState(false);
  const [turnMode, setTurnModeState] = useState<TurnMode>('auto');
  const [speechRate, setSpeechRateState] = useState<SpeechMode>(1);
  const [englishVariant, setVariantState] = useState<EnglishVariant>('british');
  const [error, setError] = useState<string | null>(null);

  // Актуальные значения для колбэков конвейера — состояние обновляется асинхронно.
  const messagesRef = useRef<Message[]>([]);
  /** Лимит реплик в беседе: у бесплатного тарифа, иначе null. Ставит App. */
  const turnLimitRef = useRef<number | null>(null);
  /** Сколько реплик человек сказал с начала этой беседы. */
  const sessionTurnsRef = useRef(0);
  /** Беседа закончилась, потому что кончились бесплатные реплики. */
  const [turnLimitHit, setTurnLimitHit] = useState(false);
  messagesRef.current = messages;
  const languageRef = useRef<LanguageCode>(language);
  languageRef.current = language;
  const levelsRef = useRef<LevelMap | null>(levels);
  levelsRef.current = levels;
  const topicRef = useRef<string | null>(topicId);
  topicRef.current = topicId;
  const profileRef = useRef<Profile>(profile);
  profileRef.current = profile;
  const turnModeRef = useRef<TurnMode>(turnMode);
  turnModeRef.current = turnMode;
  const speechRateRef = useRef<SpeechMode>(speechRate);
  speechRateRef.current = speechRate;
  /** Замеренный темп речи человека, слов в минуту. */
  const userWpmRef = useRef<number | null>(null);
  const variantRef = useRef<EnglishVariant>(englishVariant);
  variantRef.current = englishVariant;

  /**
   * Читает всё сохранённое в память. Вызывается при запуске и после
   * синхронизации: облако могло принести беседу, начатую на другом устройстве.
   */
  const reload = useCallback(async () => {
    const [storedLanguage, storedLevels] = await Promise.all([loadLanguage(), loadLevels()]);
    setLanguage(storedLanguage);
    setLevels(storedLevels);
    setMessages(await loadHistory(storedLanguage));
    setTopicId(await loadTopic(storedLanguage));
    setArchive(await loadArchive());
    setProfileState(await loadProfile());
    setHomework(await loadHomework(storedLanguage));
    setTurnModeState(await loadTurnMode());
    setSpeechRateState(await loadSpeechRate());
    userWpmRef.current = await loadUserWpm();
    setVariantState(await loadEnglishVariant());
  }, []);

  // Микрофон здесь не спрашиваем: диалог поверх заставки сбивал её, а данные
  // ждали ответа. Разрешение просит App после заставки и запись перед стартом.
  useEffect(() => {
    (async () => {
      await reload();
      setReady(true);
    })().catch((e: unknown) => setError(errorText(e)));
  }, [reload]);

  const persist = useCallback((updater: (previous: Message[]) => Message[]) => {
    setMessages((previous) => {
      const next = updater(previous);
      messagesRef.current = next;
      void saveHistory(languageRef.current, next);
      return next;
    });
  }, []);

  /**
   * Разбор правила приходит не с ответом, а по нажатию на «?»: в беседе его
   * раскрывают редко, и просить его заранее на каждую ошибку — платить за
   * текст, который никто не прочтёт. Забранный разбор кладём в реплику, так
   * что второй раз за ним не идём даже после перезапуска.
   */
  const explain = useCallback(
    async (messageId: string, index: number): Promise<void> => {
      const message = messagesRef.current.find((item) => item.id === messageId);
      const correction = message?.corrections?.[index];
      if (!correction || correction.details) return;

      const details = await explainCorrection({
        correction,
        language: languageRef.current,
        level: levelsRef.current?.[languageRef.current] ?? 'B1',
      });

      persist((previous) =>
        previous.map((item) =>
          item.id === messageId
            ? {
                ...item,
                corrections: item.corrections?.map((entry, position) =>
                  position === index ? { ...entry, details } : entry,
                ),
              }
            : item,
        ),
      );
    },
    [persist],
  );

  /**
   * Темп для озвучки. В режиме «как я» идём навстречу человеку: считаем его
   * слова в минуту и сдвигаем голос в ту же сторону — но не до конца, иначе
   * речь выходит неживой, да и чуть более беглую полезно слышать.
   */
  const voiceRate = useCallback((): number => {
    const mode = speechRateRef.current;
    if (mode !== 'auto') return mode;

    const wpm = userWpmRef.current;
    if (wpm === null) return 1;

    const shift = ((wpm - SPEECH_REFERENCE_WPM) / SPEECH_REFERENCE_WPM) * SPEECH_MATCH_SHARE;
    return Math.min(SPEECH_RATE_MAX, Math.max(SPEECH_RATE_MIN, 1 + shift));
  }, []);

  /**
   * Замер темпа по только что сказанному. Хвост тишины, по которому реплика и
   * закончилась, из времени вычитаем — иначе чем дольше человек молчит в
   * конце, тем медленнее он будто говорит.
   */
  const measurePace = useCallback((text: string, durationMs: number) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const tail = turnModeRef.current === 'auto' ? SILENCE_HOLD_MS : 0;
    const seconds = (durationMs - tail) / 1000;
    if (words < 4 || seconds < 1.5) return;

    const wpm = (words / seconds) * 60;
    const known = userWpmRef.current;
    const next = known === null ? wpm : known + (wpm - known) * WPM_BLEND;
    userWpmRef.current = next;
    void saveUserWpm(next);
  }, []);

  /** Ответ партнёра кладём в ленту сразу, озвучку — когда она будет готова. */
  const addReply = useCallback(
    (text: string, farewell: boolean): Reply => {
      const assistantMessage: Message = {
        id: nextId(),
        role: 'assistant',
        text,
        createdAt: Date.now(),
      };
      persist((previous) => [...previous, assistantMessage]);

      return {
        text,
        farewell,
        onVoiced: (audioUri) =>
          persist((previous) =>
            previous.map((message) =>
              message.id === assistantMessage.id ? { ...message, audioUri } : message,
            ),
          ),
      };
    },
    [persist],
  );

  /** Реплика распознана: в ленту, к партнёру, его ответ — обратно в ленту. */
  const onHeard = useCallback(
    async (text: string, durationMs: number): Promise<Reply> => {
      const currentLanguage = languageRef.current;
      const currentLevels = levelsRef.current;
      if (!currentLevels) throw new Error(t.levelsNotReady);

      measurePace(text, durationMs);

      const userMessage: Message = {
        id: nextId(),
        role: 'user',
        text,
        createdAt: Date.now(),
      };
      const history = messagesRef.current;
      persist((previous) => [...previous, userMessage]);

      sessionTurnsRef.current += 1;
      const limit = turnLimitRef.current;
      const wrapUp = limit !== null && sessionTurnsRef.current >= limit;
      if (wrapUp) setTurnLimitHit(true);

      const turn = await respond({
        history,
        userText: text,
        language: currentLanguage,
        level: currentLevels[currentLanguage],
        topic: findTopic(currentLanguage, topicRef.current),
        name: profileRef.current.name || undefined,
        variant: variantRef.current,
        wrapUp,
      });

      persist((previous) =>
        previous.map((message) =>
          message.id === userMessage.id ? { ...message, corrections: turn.corrections } : message,
        ),
      );

      return addReply(turn.reply, turn.farewell);
    },
    [persist, measurePace, addReply],
  );

  const voice = useVoiceLoop({
    language: () => languageRef.current,
    turnMode,
    rate: voiceRate,
    onHeard,
    onError: setError,
  });
  const { isActive } = voice;

  const setEnglishVariant = useCallback(async (next: EnglishVariant) => {
    setVariantState(next);
    variantRef.current = next;
    await saveEnglishVariant(next);
  }, []);

  const setSpeechRate = useCallback(async (next: SpeechMode) => {
    setSpeechRateState(next);
    speechRateRef.current = next;
    await saveSpeechRate(next);
  }, []);

  const setTurnMode = useCallback(async (next: TurnMode) => {
    setTurnModeState(next);
    turnModeRef.current = next;
    await saveTurnMode(next);
  }, []);

  const toggleSession = useCallback(async () => {
    if (voice.isActive()) {
      await voice.stop();
      return;
    }

    sessionTurnsRef.current = 0;
    setTurnLimitHit(false);

    // С выбранной темой первым говорит партнёр — иначе непонятно, с чего начать.
    await voice.start(async () => {
      const topic = findTopic(languageRef.current, topicRef.current);
      const levelMap = levelsRef.current;
      if (!topic || !levelMap || messagesRef.current.length > 0) return null;

      const reply = await openConversation({
        language: languageRef.current,
        level: levelMap[languageRef.current],
        topic,
        name: profileRef.current.name || undefined,
        variant: variantRef.current,
      });
      return addReply(reply, false);
    });
  }, [voice.isActive, voice.start, voice.stop, addReply]);

  const switchLanguage = useCallback(
    async (next: LanguageCode) => {
      if (next === language || isActive()) return;
      setLanguage(next);
      languageRef.current = next;
      await saveLanguage(next);
      const history = await loadHistory(next);
      messagesRef.current = history;
      setMessages(history);
      setTopicId(await loadTopic(next));
      setHomework(await loadHomework(next));
    },
    [language, isActive],
  );

  const setLevel = useCallback(
    async (next: Level) => {
      const current = levelsRef.current;
      if (!current) return;
      const updated = { ...current, [language]: next };
      setLevels(updated);
      await saveLevels(updated);
    },
    [language],
  );

  /** Выбор темы: null — свободный разговор. */
  const setTopic = useCallback(
    async (next: string | null) => {
      if (isActive()) return;
      setTopicId(next);
      topicRef.current = next;
      await saveTopic(language, next);
    },
    [language, isActive],
  );

  /**
   * Завершает беседу: складывает её в архив и очищает ленту. Стирать без следа
   * незачем — разбор ошибок и есть то, ради чего к беседе возвращаются.
   */
  const finishConversation = useCallback(async () => {
    if (isActive()) return;

    const current = messagesRef.current;
    if (current.length === 0) return;

    const levelMap = levelsRef.current;
    const firstUser = current.find((message) => message.role === 'user');

    const session: ArchivedSession = {
      id: `${Date.now()}`,
      language,
      level: levelMap?.[language] ?? 'B1',
      topicId: topicRef.current,
      startedAt: current[0].createdAt,
      endedAt: current[current.length - 1].createdAt,
      messageCount: current.length,
      correctionCount: current.reduce(
        (total, message) => total + (message.corrections?.length ?? 0),
        0,
      ),
      preview: firstUser?.text ?? current[0].text,
      hasHomework: homework !== null,
    };

    setArchive(await archiveSession(session, current));

    // Задание переезжает с беседы: ключ языка освобождается под следующую.
    if (homework) {
      await saveHomework(session.id, homework);
      await saveHomework(language, null);
      setHomework(null);
    }

    await clearHistory(language);
    messagesRef.current = [];
    setMessages([]);
  }, [homework, language, isActive]);

  /** Собирает упражнения по всем ошибкам текущей беседы. */
  const makeHomework = useCallback(async () => {
    const levelMap = levelsRef.current;
    if (!levelMap || homeworkBusy) return;

    const corrections = messagesRef.current.flatMap((message) => message.corrections ?? []);
    if (corrections.length === 0) {
      setError(t.nothingToDrill);
      return;
    }

    setHomeworkBusy(true);
    setError(null);
    try {
      const result = await generateHomework({
        corrections,
        language: languageRef.current,
        level: levelMap[languageRef.current],
      });
      setHomework(result);
      await saveHomework(languageRef.current, result);
    } catch (e: unknown) {
      setError(errorText(e));
    } finally {
      setHomeworkBusy(false);
    }
  }, [homeworkBusy]);

  const setProfile = useCallback(async (next: Profile) => {
    setProfileState(next);
    profileRef.current = next;
    await saveProfile(next);
  }, []);

  const removeArchived = useCallback(async (id: string) => {
    setArchive(await deleteArchived(id));
  }, []);

  /** Переслушать ответ партнёра вне беседы. */
  const replay = useCallback(
    async (message: Message) => {
      if (isActive()) return;
      try {
        const uri = message.audioUri ?? (await synthesize(message.text, voiceRate()));
        if (!message.audioUri) {
          persist((previous) =>
            previous.map((m) => (m.id === message.id ? { ...m, audioUri: uri } : m)),
          );
        }
        await voice.play(uri);
      } catch (e: unknown) {
        setError(errorText(e));
      }
    },
    [persist, voice.play, voiceRate, isActive],
  );

  /** Лимит реплик в беседе (бесплатный тариф) или null — ставит App по тарифу. */
  const setTurnLimit = useCallback((limit: number | null) => {
    turnLimitRef.current = limit;
  }, []);

  return {
    ready,
    language,
    level: levels?.[language] ?? 'B1',
    topicId,
    messages,
    archive,
    profile,
    turnMode,
    englishVariant,
    homework,
    homeworkBusy,
    status: voice.status,
    sessionActive: voice.sessionActive,
    error,
    durationMillis: voice.durationMillis,
    /** Уровень входного сигнала 0…1 — для индикатора «тебя слышно». */
    inputLevel: voice.inputLevel,
    reload,
    toggleSession,
    switchLanguage,
    setLevel,
    setTopic,
    setProfile,
    speechRate,
    setSpeechRate,
    setTurnMode,
    setEnglishVariant,
    endTurn: voice.endTurn,
    beginTurn: voice.beginTurn,
    explain,
    makeHomework,
    replay,
    finishConversation,
    removeArchived,
    dismissError: () => setError(null),
    setTurnLimit,
    turnLimitHit,
  };
}
