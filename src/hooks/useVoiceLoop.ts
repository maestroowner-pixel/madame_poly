import {
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
  PEAK_DECAY_DB,
  QUIET_RISE_DB,
  SILENCE_FLOOR_DB,
  SILENCE_HOLD_MS,
  SPEECH_SHARE,
  VOICE_RANGE_DB,
  WORK_RANGE_DB,
} from '../config';
import { transcribe } from '../services/stt';
import { synthesize } from '../services/tts';
import type { LanguageCode, TurnMode } from '../types';
import { t } from '../i18n';
import { requireMicrophone } from '../services/microphone';
import { errorText } from '../errors';

export type Status = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

/** Что партнёр ответил на реплику — цикл озвучит это и решит, слушать ли дальше. */
export interface Reply {
  text: string;
  /** Разговор закончен: доиграть ответ и закрыть беседу, а не слушать снова. */
  farewell: boolean;
  /** Озвучка готова — владелец кладёт путь к ней в свою реплику. */
  onVoiced?: (uri: string) => void;
}

export interface VoiceLoopOptions {
  /** Язык подсказывается Whisper — берём свежий на каждой реплике. */
  language: () => LanguageCode;
  turnMode: TurnMode;
  /** Темп озвучки на момент ответа. */
  rate: () => number;
  /**
   * Реплика распознана. Здесь владелец сохраняет её, спрашивает модель и
   * возвращает ответ. Ошибка обрывает беседу и уходит в onError.
   */
  onHeard: (text: string, durationMs: number) => Promise<Reply>;
  /** Сообщение для человека; null — прежнее больше не актуально. */
  onError: (message: string | null) => void;
  /** Потолок одной реплики. В экзамене монолог длиннее обычной фразы. */
  maxTurnMs?: number;
  /** Сколько тишины завершает реплику в авторежиме. */
  silenceHoldMs?: number;
}

/** Переводит dBFS в 0…1 для индикатора уровня. */
function levelToUnit(db: number | undefined): number {
  if (db === undefined) return 0;
  return Math.max(0, Math.min(1, (db + 60) / 60));
}

/**
 * Голосовой цикл без привязки к тому, о чём разговор: слушает, ловит конец
 * реплики, распознаёт, отдаёт текст владельцу, озвучивает ответ и слушает
 * снова. Беседа и экзамен разнятся только тем, что делают с услышанным, —
 * шкала пауз настраивалась десятком коммитов, и держать её в двух копиях
 * значило бы чинить каждую находку дважды.
 */
export function useVoiceLoop(options: VoiceLoopOptions) {
  // Метеринг нужен, чтобы услышать паузу и закончить реплику без тапа.
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, METERING_INTERVAL_MS);
  const player = useAudioPlayer(null);

  const [status, setStatus] = useState<Status>('idle');
  const [sessionActive, setSessionActive] = useState(false);

  // Колбэки владельца меняются на каждом рендере — держим свежие в ref, чтобы
  // не пересоздавать конвейер и слушатель плеера.
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const turnModeRef = useRef<TurnMode>(options.turnMode);
  turnModeRef.current = options.turnMode;

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
  /** Шкала текущей реплики: самое громкое и самое тихое, что в ней слышали. */
  const peakRef = useRef(-160);
  const quietRef = useRef(0);
  /** Наибольший разброс за реплику — по нему судим, был ли вообще голос. */
  const rangeMaxRef = useRef(0);
  const turnBusyRef = useRef(false);
  /** listen() вызывается из слушателя плеера — держим свежую версию в ref. */
  const listenRef = useRef<() => Promise<void>>(async () => {});
  /** Человек попрощался: доиграть ответ и закончить, а не слушать снова. */
  const endAfterPlaybackRef = useRef(false);

  /** Беседа обрывается ошибкой: микрофон закрыт, текст — человеку. */
  const fail = useCallback((e: unknown) => {
    turnBusyRef.current = false;
    sessionRef.current = false;
    setSessionActive(false);
    optionsRef.current.onError(errorText(e));
    setStatus('idle');
  }, []);

  /** Начинает слушать следующую реплику. */
  const listen = useCallback(async () => {
    if (!sessionRef.current) {
      setStatus('idle');
      return;
    }
    try {
      await requireMicrophone();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      lastSoundAtRef.current = Date.now();
      speechMsRef.current = 0;
      peakRef.current = -160;
      quietRef.current = 0;
      rangeMaxRef.current = 0;
      setStatus('listening');
    } catch (e: unknown) {
      fail(e);
    }
  }, [recorder, fail]);
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
   * Озвучивает ответ и решает, что дальше. Слушать снова начинаем после того,
   * как ответ доиграет, — этим занимается слушатель плеера.
   */
  const speak = useCallback(
    async (reply: Reply) => {
      setStatus('speaking');
      const audioUri = await synthesize(reply.text, optionsRef.current.rate());
      reply.onVoiced?.(audioUri);

      turnBusyRef.current = false;
      // Кнопку «остановить» могли нажать, пока реплика ходила по сети. Ответ уже
      // сохранён в ленте, но озвучивать его вдогонку и открывать микрофон нельзя.
      if (!sessionRef.current) {
        setStatus('idle');
        return;
      }

      // Прощание не обрываем на полуслове: сначала даём ответу доиграть.
      endAfterPlaybackRef.current = reply.farewell;

      if (AUTOPLAY_TTS) {
        await play(audioUri);
      } else if (reply.farewell) {
        sessionRef.current = false;
        setSessionActive(false);
        setStatus('idle');
      } else {
        await listenRef.current();
      }
    },
    [play],
  );

  /**
   * Завершает реплику: останавливает запись и гонит её через Whisper → владельца
   * → TTS.
   */
  const finishTurn = useCallback(async () => {
    if (turnBusyRef.current || !sessionRef.current) return;
    turnBusyRef.current = true;

    try {
      /**
       * В ручном режиме конец фразы отмечает человек — выбрасывать его запись
       * как тишину нельзя, каким бы тихим ни вышел уровень. Порог по уровню
       * остаётся авторежиму, где он бережёт Whisper от фонового шума; если
       * уровень не приходит вовсе, судим по длительности.
       */
      const spokeEnough =
        turnModeRef.current === 'manual' || !meteringSeenRef.current
          ? durationRef.current >= MIN_SPEECH_MS
          : speechMsRef.current >= MIN_SPEECH_MS;
      await recorder.stop();

      // Молчание не должно быть неотличимо от зависания: говорим, что не
      // услышали, и слушаем дальше.
      if (!spokeEnough) {
        optionsRef.current.onError(t.tooQuiet);
        turnBusyRef.current = false;
        await listenRef.current();
        return;
      }

      const uri = recorder.uri;
      if (!uri) throw new Error(t.recordingLost);

      setStatus('transcribing');
      const text = await transcribe(uri, optionsRef.current.language());
      if (!text) {
        optionsRef.current.onError(t.notRecognised);
        turnBusyRef.current = false;
        await listenRef.current();
        return;
      }

      // Реплика дошла — прежняя жалоба на слышимость больше не актуальна.
      optionsRef.current.onError(null);

      setStatus('thinking');
      const reply = await optionsRef.current.onHeard(text, durationRef.current);
      await speak(reply);
    } catch (e: unknown) {
      fail(e);
    }
  }, [recorder, speak, fail]);

  /**
   * Граница реплики по спаду уровня. Абсолютных порогов здесь нет намеренно:
   * один и тот же голос на разных микрофонах даёт разные децибелы, и порог,
   * подобранный на одном устройстве, на другом не слышит либо голоса, либо
   * пауз. Речь же всегда громче собственных пауз — на это и опираемся.
   */
  useEffect(() => {
    if (status !== 'listening') return;

    const now = Date.now();
    if (typeof recorderState.metering === 'number') meteringSeenRef.current = true;
    durationRef.current = recorderState.durationMillis;
    const level = recorderState.metering ?? -160;

    // Пустые отсчёты в начале записи не сообщают о комнате ничего — пропускаем,
    // иначе они станут «самым тихим» и перекосят всю шкалу реплики.
    if (level <= SILENCE_FLOOR_DB) return;

    // Пик оседает, отметка тишины падает сразу и ползёт вверх: так шкала
    // подстраивается под комнату и не застревает на случайном хлопке.
    peakRef.current = Math.max(peakRef.current - PEAK_DECAY_DB, level);
    quietRef.current =
      level < quietRef.current ? level : quietRef.current + QUIET_RISE_DB;

    // Границу речи берём долей от разброса, а не в децибелах: тихую фразу на
    // сжатом микрофоне фиксированный отступ от пика уже не признавал речью.
    const range = peakRef.current - quietRef.current;
    rangeMaxRef.current = Math.max(rangeMaxRef.current, range);
    const isSpeech = range >= WORK_RANGE_DB && level > quietRef.current + range * SPEECH_SHARE;

    /**
     * Был ли в реплике голос, судим по наибольшему разбросу за всю реплику, а
     * не по нынешнему: у тихой фразы разброс во время речи мал и расширяется
     * только на паузе после неё. Проверять в тот же миг значило бы никогда не
     * признать её речью.
     */
    const hasVoice = rangeMaxRef.current >= VOICE_RANGE_DB;

    if (isSpeech) {
      lastSoundAtRef.current = now;
      speechMsRef.current += METERING_INTERVAL_MS;
    }

    const silentFor = now - lastSoundAtRef.current;
    const spokeEnough = speechMsRef.current >= MIN_SPEECH_MS;
    const tooLong =
      recorderState.durationMillis >= (optionsRef.current.maxTurnMs ?? MAX_TURN_MS);
    const hold = optionsRef.current.silenceHoldMs ?? SILENCE_HOLD_MS;

    // Паузу ловим только в авторежиме; потолок реплики работает всегда —
    // он страхует от записи, которую забыли остановить.
    const pauseEnds =
      turnModeRef.current === 'auto' && hasVoice && spokeEnough && silentFor >= hold;

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

  /**
   * Начинает беседу. Если передан зачин, первым говорит партнёр: зачин
   * возвращает его реплику, а null — значит начинает человек.
   */
  const start = useCallback(
    async (opening?: () => Promise<Reply | null>) => {
      optionsRef.current.onError(null);
      endAfterPlaybackRef.current = false;
      sessionRef.current = true;
      setSessionActive(true);

      if (opening) {
        try {
          setStatus('thinking');
          turnBusyRef.current = true;
          const reply = await opening();
          if (reply) {
            await speak(reply);
            return;
          }
          turnBusyRef.current = false;
        } catch (e: unknown) {
          fail(e);
          return;
        }
      }

      await listen();
    },
    [listen, speak, fail],
  );

  const stop = useCallback(async () => {
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

  /** Идёт ли беседа прямо сейчас — для проверок внутри колбэков владельца. */
  const isActive = useCallback(() => sessionRef.current, []);

  return {
    status,
    sessionActive,
    durationMillis: recorderState.durationMillis,
    /** Уровень входного сигнала 0…1 — для индикатора «тебя слышно». */
    inputLevel: status === 'listening' ? levelToUnit(recorderState.metering) : 0,
    isActive,
    start,
    stop,
    beginTurn,
    endTurn,
    play,
  };
}
