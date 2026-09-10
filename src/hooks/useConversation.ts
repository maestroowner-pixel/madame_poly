import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AUTOPLAY_TTS,
  MAX_TURN_MS,
  METERING_INTERVAL_MS,
  MIN_SPEECH_MS,
  NOISE_FLOOR_MAX_DB,
  NOISE_FLOOR_MIN_DB,
  NOISE_MARGIN_DB,
  NOISE_RISE,
  NOISE_RISE_SPEECH,
  SILENCE_HOLD_MS,
  SPEECH_LEVEL_DB,
} from '../config';
import { generateHomework, openConversation, respond } from '../services/llm';
import { transcribe } from '../services/stt';
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
  loadTurnMode,
  saveHistory,
  saveLanguage,
  saveLevels,
  saveEnglishVariant,
  saveHomework,
  saveProfile,
  saveTopic,
  saveTurnMode,
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

export type Status = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

let messageCounter = 0;
const nextId = () => `${Date.now()}-${messageCounter++}`;

/** Переводит dBFS в 0…1 для индикатора уровня. */
function levelToUnit(db: number | undefined): number {
  if (db === undefined) return 0;
  return Math.max(0, Math.min(1, (db + 60) / 60));
}

export function useConversation() {
  // Метеринг нужен, чтобы услышать паузу и закончить реплику без тапа.
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, METERING_INTERVAL_MS);
  const player = useAudioPlayer(null);

  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [levels, setLevels] = useState<LevelMap | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [sessionActive, setSessionActive] = useState(false);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [archive, setArchive] = useState<ArchivedSession[]>([]);
  const [profile, setProfileState] = useState<Profile>(EMPTY_PROFILE);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [homeworkBusy, setHomeworkBusy] = useState(false);
  const [turnMode, setTurnModeState] = useState<TurnMode>('auto');
  const [englishVariant, setVariantState] = useState<EnglishVariant>('british');
  const [error, setError] = useState<string | null>(null);

  // Актуальные значения для колбэков конвейера — состояние обновляется асинхронно.
  const messagesRef = useRef<Message[]>([]);
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
  const variantRef = useRef<EnglishVariant>(englishVariant);
  variantRef.current = englishVariant;
  const sessionRef = useRef(false);

  // Состояние определения границы реплики.
  const lastSoundAtRef = useRef(0);
  const speechMsRef = useRef(0);
  /**
   * Приходил ли вообще уровень входа. Без него речь не измерить, и каждая
   * реплика уходила бы в тишину — на iPhone так и случилось.
   */
  const meteringSeenRef = useRef(false);
  /** Длительность записи для колбэков: пересоздавать их на каждый тик незачем. */
  const durationRef = useRef(0);
  /**
   * Уровень фона. Оценивается по паузам в речи и живёт всю беседу: тихая
   * музыка или шум улицы могут появиться на середине разговора.
   */
  const noiseFloorRef = useRef(NOISE_FLOOR_MIN_DB);
  const turnBusyRef = useRef(false);
  /** listen() вызывается из слушателя плеера — держим свежую версию в ref. */
  const listenRef = useRef<() => Promise<void>>(async () => {});
  /** Человек попрощался: доиграть ответ и закончить, а не слушать снова. */
  const endAfterPlaybackRef = useRef(false);

  useEffect(() => {
    (async () => {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) setError(t.noMicrophone);

      const [storedLanguage, storedLevels] = await Promise.all([loadLanguage(), loadLevels()]);
      setLanguage(storedLanguage);
      setLevels(storedLevels);
      setMessages(await loadHistory(storedLanguage));
      setTopicId(await loadTopic(storedLanguage));
      setArchive(await loadArchive());
      setProfileState(await loadProfile());
      setHomework(await loadHomework(storedLanguage));
      setTurnModeState(await loadTurnMode());
      setVariantState(await loadEnglishVariant());
      setReady(true);
    })().catch((e: unknown) => setError(String(e)));
  }, []);

  const persist = useCallback((updater: (previous: Message[]) => Message[]) => {
    setMessages((previous) => {
      const next = updater(previous);
      messagesRef.current = next;
      void saveHistory(languageRef.current, next);
      return next;
    });
  }, []);

  /** Начинает слушать следующую реплику. */
  const listen = useCallback(async () => {
    if (!sessionRef.current) {
      setStatus('idle');
      return;
    }
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      lastSoundAtRef.current = Date.now();
      speechMsRef.current = 0;
      setStatus('listening');
    } catch (e: unknown) {
      sessionRef.current = false;
      setSessionActive(false);
      setError(e instanceof Error ? e.message : String(e));
      setStatus('idle');
    }
  }, [recorder]);
  listenRef.current = listen;

  const play = useCallback(
    async (uri: string) => {
      // На iOS режим записи приглушает воспроизведение — переключаем перед play.
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      player.replace({ uri });
      player.play();
    },
    [player],
  );

  /**
   * Завершает реплику: останавливает запись и гонит её через Whisper → Claude →
   * TTS. Слушать снова начинаем после того, как ответ доиграет.
   */
  const finishTurn = useCallback(async () => {
    if (turnBusyRef.current || !sessionRef.current) return;
    turnBusyRef.current = true;

    try {
      // Без уровня входа судить не о чем: считаем, что человек говорил, и
      // отдаём запись Whisper — пусть решает он.
      const spokeEnough = meteringSeenRef.current
        ? speechMsRef.current >= MIN_SPEECH_MS
        : durationRef.current >= MIN_SPEECH_MS;
      await recorder.stop();

      // Тишина или посторонний шум — молча слушаем дальше, не тратя Whisper.
      if (!spokeEnough) {
        turnBusyRef.current = false;
        await listenRef.current();
        return;
      }

      const uri = recorder.uri;
      if (!uri) throw new Error(t.recordingLost);

      const currentLanguage = languageRef.current;
      const currentLevels = levelsRef.current;
      if (!currentLevels) throw new Error(t.levelsNotReady);

      setStatus('transcribing');
      const text = await transcribe(uri, currentLanguage);
      if (!text) {
        turnBusyRef.current = false;
        await listenRef.current();
        return;
      }

      const userMessage: Message = {
        id: nextId(),
        role: 'user',
        text,
        createdAt: Date.now(),
      };
      const history = messagesRef.current;
      persist((previous) => [...previous, userMessage]);

      setStatus('thinking');
      const turn = await respond({
        history,
        userText: text,
        language: currentLanguage,
        level: currentLevels[currentLanguage],
        topic: findTopic(currentLanguage, topicRef.current),
        name: profileRef.current.name || undefined,
        variant: variantRef.current,
      });

      persist((previous) =>
        previous.map((message) =>
          message.id === userMessage.id ? { ...message, corrections: turn.corrections } : message,
        ),
      );

      const assistantMessage: Message = {
        id: nextId(),
        role: 'assistant',
        text: turn.reply,
        createdAt: Date.now(),
      };
      persist((previous) => [...previous, assistantMessage]);

      setStatus('speaking');
      const audioUri = await synthesize(turn.reply);
      persist((previous) =>
        previous.map((message) =>
          message.id === assistantMessage.id ? { ...message, audioUri } : message,
        ),
      );

      turnBusyRef.current = false;
      // Кнопку «остановить» могли нажать, пока реплика ходила по сети. Ответ уже
      // сохранён в ленте, но озвучивать его вдогонку и открывать микрофон нельзя.
      if (!sessionRef.current) {
        setStatus('idle');
        return;
      }

      // Прощание не обрываем на полуслове: сначала даём ответу доиграть.
      endAfterPlaybackRef.current = turn.farewell;

      if (AUTOPLAY_TTS) {
        await play(audioUri);
      } else if (turn.farewell) {
        sessionRef.current = false;
        setSessionActive(false);
        setStatus('idle');
      } else {
        await listenRef.current();
      }
    } catch (e: unknown) {
      turnBusyRef.current = false;
      sessionRef.current = false;
      setSessionActive(false);
      setError(e instanceof Error ? e.message : String(e));
      setStatus('idle');
    }
  }, [persist, play, recorder]);

  /** Граница реплики по уровню сигнала: говорил → замолчал дольше паузы. */
  useEffect(() => {
    if (status !== 'listening') return;

    const now = Date.now();
    if (typeof recorderState.metering === 'number') meteringSeenRef.current = true;
    durationRef.current = recorderState.durationMillis;
    const level = recorderState.metering ?? -160;

    const floor = noiseFloorRef.current;
    const threshold = Math.max(SPEECH_LEVEL_DB, floor + NOISE_MARGIN_DB);
    const isSpeech = level > threshold;

    if (isSpeech) {
      lastSoundAtRef.current = now;
      speechMsRef.current += METERING_INTERVAL_MS;
    }

    // Фон меряем прежде всего по тишине между словами: вниз сразу, вверх плавно.
    // Во время речи фон тоже ползёт вверх, но на порядок медленнее — это
    // страховка от шума, который появился громче порога и сошёл за речь.
    const rise = isSpeech ? NOISE_RISE_SPEECH : NOISE_RISE;
    const next = !isSpeech && level < floor ? level : floor + (level - floor) * rise;
    noiseFloorRef.current = Math.min(
      NOISE_FLOOR_MAX_DB,
      Math.max(NOISE_FLOOR_MIN_DB, next),
    );

    const silentFor = now - lastSoundAtRef.current;
    const spokeEnough = speechMsRef.current >= MIN_SPEECH_MS;
    const tooLong = recorderState.durationMillis >= MAX_TURN_MS;

    // Паузу ловим только в авторежиме; потолок реплики работает всегда —
    // он страхует от записи, которую забыли остановить.
    const pauseEnds = turnModeRef.current === 'auto' && spokeEnough && silentFor >= SILENCE_HOLD_MS;

    if (pauseEnds || tooLong) {
      void finishTurn();
    }
  }, [recorderState, status, finishTurn]);

  /** Ответ доиграл — слушаем следующую реплику или закрываем беседу. */
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (playback) => {
      if (!playback.didJustFinish) return;

      if (endAfterPlaybackRef.current) {
        endAfterPlaybackRef.current = false;
        sessionRef.current = false;
        setSessionActive(false);
        setStatus('idle');
        return;
      }

      // В ручном режиме микрофон открывает нажатие: человеку нужно время
      // прочитать ответ и придумать свой, а не отвечать сразу после гудка.
      if (turnModeRef.current === 'manual') {
        setStatus('idle');
        return;
      }

      void listenRef.current();
    });
    return () => subscription.remove();
  }, [player]);

  const startSession = useCallback(async () => {
    setError(null);
    endAfterPlaybackRef.current = false;
    noiseFloorRef.current = NOISE_FLOOR_MIN_DB;
    sessionRef.current = true;
    setSessionActive(true);

    const topic = findTopic(languageRef.current, topicRef.current);
    const levelMap = levelsRef.current;

    // С выбранной темой первым говорит партнёр — иначе непонятно, с чего начать.
    if (topic && levelMap && messagesRef.current.length === 0) {
      try {
        setStatus('thinking');
        const reply = await openConversation({
          language: languageRef.current,
          level: levelMap[languageRef.current],
          topic,
          name: profileRef.current.name || undefined,
          variant: variantRef.current,
        });

        const opening: Message = {
          id: nextId(),
          role: 'assistant',
          text: reply,
          createdAt: Date.now(),
        };
        persist((previous) => [...previous, opening]);

        setStatus('speaking');
        const audioUri = await synthesize(reply);
        persist((previous) =>
          previous.map((message) =>
            message.id === opening.id ? { ...message, audioUri } : message,
          ),
        );

        // Слушать начнём, когда реплика доиграет — этим займётся слушатель плеера.
        await play(audioUri);
        return;
      } catch (e: unknown) {
        sessionRef.current = false;
        setSessionActive(false);
        setError(e instanceof Error ? e.message : String(e));
        setStatus('idle');
        return;
      }
    }

    await listen();
  }, [listen, persist, play]);

  const stopSession = useCallback(async () => {
    endAfterPlaybackRef.current = false;
    sessionRef.current = false;
    setSessionActive(false);
    player.pause();
    if (recorderState.isRecording) {
      try {
        await recorder.stop();
      } catch {
        // Запись могла уже остановиться сама — состояние всё равно сбрасываем.
      }
    }
    setStatus('idle');
  }, [player, recorder, recorderState.isRecording]);

  /** Ручное начало реплики: человек готов отвечать. */
  const beginTurn = useCallback(async () => {
    if (!sessionRef.current || turnBusyRef.current) return;
    await listen();
  }, [listen]);

  /** Ручное окончание реплики. */
  const endTurn = useCallback(async () => {
    if (!sessionRef.current) return;
    await finishTurn();
  }, [finishTurn]);

  const setEnglishVariant = useCallback(async (next: EnglishVariant) => {
    setVariantState(next);
    variantRef.current = next;
    await saveEnglishVariant(next);
  }, []);

  const setTurnMode = useCallback(async (next: TurnMode) => {
    setTurnModeState(next);
    turnModeRef.current = next;
    await saveTurnMode(next);
  }, []);

  const toggleSession = useCallback(async () => {
    if (sessionRef.current) await stopSession();
    else await startSession();
  }, [startSession, stopSession]);

  const switchLanguage = useCallback(
    async (next: LanguageCode) => {
      if (next === language || sessionRef.current) return;
      setLanguage(next);
      languageRef.current = next;
      await saveLanguage(next);
      const history = await loadHistory(next);
      messagesRef.current = history;
      setMessages(history);
      setTopicId(await loadTopic(next));
      setHomework(await loadHomework(next));
    },
    [language],
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
      if (sessionRef.current) return;
      setTopicId(next);
      topicRef.current = next;
      await saveTopic(language, next);
    },
    [language],
  );

  /**
   * Завершает беседу: складывает её в архив и очищает ленту. Стирать без следа
   * незачем — разбор ошибок и есть то, ради чего к беседе возвращаются.
   */
  const finishConversation = useCallback(async () => {
    if (sessionRef.current) return;

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
  }, [homework, language]);

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
      setError(e instanceof Error ? e.message : String(e));
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
      if (sessionRef.current) return;
      try {
        const uri = message.audioUri ?? (await synthesize(message.text));
        if (!message.audioUri) {
          persist((previous) =>
            previous.map((m) => (m.id === message.id ? { ...m, audioUri: uri } : m)),
          );
        }
        await play(uri);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [language, persist, play],
  );

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
    status,
    sessionActive,
    error,
    durationMillis: recorderState.durationMillis,
    /** Уровень входного сигнала 0…1 — для индикатора «тебя слышно». */
    inputLevel: status === 'listening' ? levelToUnit(recorderState.metering) : 0,
    toggleSession,
    switchLanguage,
    setLevel,
    setTopic,
    setProfile,
    setTurnMode,
    setEnglishVariant,
    endTurn,
    beginTurn,
    makeHomework,
    replay,
    finishConversation,
    removeArchived,
    dismissError: () => setError(null),
  };
}
