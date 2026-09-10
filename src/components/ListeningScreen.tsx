import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
} from 'expo-audio';

import { CloseIcon } from './icons';
import { TopicPicker } from './TopicPicker';
import { ZOOM_CLOSE_MS, ZoomModal } from './ZoomModal';
import { measureAnchor, type Anchor } from '../anchor';
import { LISTENING_SPEED } from '../config';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { checkListeningAnswers, generateListening } from '../services/llm';
import { transcribe } from '../services/stt';
import { synthesize } from '../services/tts';
import {
  EMPTY_LISTENING_STATS,
  loadListening,
  loadListeningStats,
  saveListening,
  saveListeningStats,
} from '../storage';
import { useStyles, useTheme, type Theme } from '../theme';
import { findTopic } from '../topics';
import type {
  LanguageCode,
  Level,
  Listening,
  ListeningStats,
  ListeningVerdict,
} from '../types';

/** Что подтверждает человек: выход или смену темы. Оба бросают диктант. */
type Pending = { kind: 'close' } | { kind: 'topic'; id: string | null };

interface Props {
  visible: boolean;
  anchor: Anchor | null;
  language: LanguageCode;
  level: Level;
  /** Тема беседы — с неё начинается выбор темы диктанта. */
  topicId: string | null;
  onClose: () => void;
}

/**
 * Оболочка, которая держит экран смонтированным только пока он нужен. Внутри
 * создаётся свой микрофон, а второй живой рекордер в приложении отбирает
 * аудиосессию iOS у беседы — там ответ переставал звучать. Размонтируем не
 * сразу: сперва должно доиграть схлопывание.
 */
export function ListeningScreen(props: Props) {
  const [mounted, setMounted] = useState(props.visible);

  useEffect(() => {
    if (props.visible) {
      setMounted(true);
      return;
    }
    const timer = setTimeout(() => setMounted(false), ZOOM_CLOSE_MS + 80);
    return () => clearTimeout(timer);
  }, [props.visible]);

  if (!mounted) return null;
  return <ListeningBody {...props} />;
}

/**
 * Аудирование: текст под уровень читается вслух, а вопросы к нему отвечаются
 * тремя способами — выбором, текстом и голосом. Сам текст до проверки скрыт,
 * иначе вопросы решаются чтением, а не на слух.
 */
function ListeningBody({ visible, anchor, language, level, topicId, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const player = useAudioPlayer(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [listening, setListening] = useState<Listening | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [verdicts, setVerdicts] = useState<ListeningVerdict[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ListeningStats>(EMPTY_LISTENING_STATS);
  const [pending, setPending] = useState<Pending | null>(null);
  /** Тема диктанта — своя: слушать про аптеку можно и посреди беседы о Риме. */
  const [topic, setTopic] = useState<string | null>(topicId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<Anchor | null>(null);
  const topicRef = useRef<View>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    void loadListeningStats(language).then(setStats);
    void loadListening(language).then((stored) => {
      setListening(stored);
      // Тема готового диктанта, а если он старый и без неё — тема беседы.
      setTopic(stored?.topicId ?? topicId);
      // Озвучка живёт в кэше и переживает не каждый запуск — соберём заново.
      setAudioUri(null);
      setAnswers({});
      setVerdicts(null);
      setPending(null);
    });
  }, [visible, language, topicId]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const record = async (right: number, total: number, abandoned: boolean) => {
    const next: ListeningStats = {
      attempts: stats.attempts + 1,
      abandoned: stats.abandoned + (abandoned ? 1 : 0),
      right: stats.right + right,
      total: stats.total + total,
    };
    setStats(next);
    await saveListeningStats(language, next);
  };

  /** Плеер может быть без источника — глушим молча, дальше всё равно идём. */
  const hush = () => {
    try {
      player.pause();
    } catch {
      // Останавливать нечего.
    }
  };

  /** Останавливаем всё, что звучит: экран уходит, а плеер бы доигрывал. */
  const leave = () => {
    hush();
    if (speaking !== null) {
      setSpeaking(null);
      void recorder.stop().catch(() => {});
    }
    onClose();
  };

  /**
   * Смена темы пересобирает диктант сразу: выбранная тема без нового текста —
   * это подпись, которая расходится с тем, что читают. Начатый диктант при
   * этом всё равно брошен, поэтому спрашиваем так же, как на выходе.
   */
  const changeTopic = (id: string | null) => {
    if (abandoning) setPending({ kind: 'topic', id });
    else rebuild(id);
  };

  const rebuild = (id: string | null) => {
    setTopic(id);
    void build(id);
  };

  /**
   * Паузы в аудировании нет: диктант либо доведён до проверки, либо брошен и
   * идёт в средний балл нулём. Предупреждаем до того, как экран закроется.
   */
  const requestClose = () => {
    if (abandoning) setPending({ kind: 'close' });
    else leave();
  };

  /** Подтверждение рисуем в самом экране: системный алерт снимается вместе с
      модалкой, и iOS терял одно из двух — кнопка «Выйти» не срабатывала. */
  const accept = (choice: Pending) => {
    setPending(null);
    if (listening) void record(0, listening.questions.length, true);
    if (choice.kind === 'close') leave();
    else rebuild(choice.id);
  };

  const build = async (subject: string | null) => {
    if (busy) return;
    hush();
    setBusy(true);
    setError(null);
    try {
      const chosen = findTopic(language, subject);
      const next = await generateListening({ language, level, topic: chosen ?? undefined });
      setListening(next);
      setAudioUri(null);
      setAnswers({});
      setVerdicts(null);
      await saveListening(language, next);
    } catch (e: unknown) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const play = async () => {
    if (!listening || busy) return;
    setBusy(true);
    setError(null);
    try {
      const uri =
        audioUri ?? (await synthesize(listening.text, LISTENING_SPEED[listening.level] ?? 1));
      setAudioUri(uri);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      player.replace({ uri });
      player.play();
    } catch (e: unknown) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  /** Голосовой ответ: первое нажатие открывает микрофон, второе — закрывает. */
  const speak = async (index: number) => {
    setError(null);
    try {
      if (speaking === index) {
        setSpeaking(null);
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error(t.recordingLost);
        setChecking(true);
        const text = await transcribe(uri, language);
        setAnswers((current) => ({ ...current, [index]: text }));
        return;
      }

      hush();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSpeaking(index);
    } catch (e: unknown) {
      setSpeaking(null);
      fail(e);
    } finally {
      setChecking(false);
    }
  };

  const check = async () => {
    if (!listening || checking) return;

    const given = listening.questions.map((_, index) => (answers[index] ?? '').trim());
    if (given.every((value) => value.length === 0)) {
      setError(t.listeningAnswerFirst);
      return;
    }

    setChecking(true);
    setError(null);
    try {
      // Выбор из списка проверяется на месте: тратить на него запрос незачем.
      const free = listening.questions
        .map((question, index) => ({ question, index }))
        .filter(({ question }) => question.kind !== 'choice');

      const judged = await checkListeningAnswers({
        listening,
        answers: free.map(({ question, index }) => ({
          question: question.prompt,
          expected: question.answer,
          given: given[index] || '—',
        })),
      });

      const byIndex = new Map(free.map(({ index }, order) => [index, judged[order]]));
      const result = listening.questions.map((question, index) => {
        if (question.kind !== 'choice') {
          return byIndex.get(index) ?? { correct: false, comment: '' };
        }
        return { correct: given[index] === question.answer, comment: '' };
      });
      setVerdicts(result);
      await record(result.filter((verdict) => verdict.correct).length, result.length, false);
    } catch (e: unknown) {
      fail(e);
    } finally {
      setChecking(false);
    }
  };

  /** Диктант начат и не доведён до проверки: уход засчитывается нулём. */
  const abandoning =
    listening !== null &&
    verdicts === null &&
    (audioUri !== null || Object.keys(answers).length > 0);

  const score = verdicts ? verdicts.filter((verdict) => verdict.correct).length : 0;

  return (
    <ZoomModal visible={visible} anchor={anchor} onRequestClose={requestClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {listening ? listening.title : t.listeningTitle}
            </Text>
            <View style={styles.actions}>
              <Text style={styles.level}>{level}</Text>
              <Pressable
                onPress={requestClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t.close}
                style={styles.iconButton}
              >
                <CloseIcon size={20} color={theme.neon} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardDismissMode="on-drag">
            {error && <Text style={styles.error}>{error}</Text>}

            {stats.total > 0 && (
              <Text style={styles.stats}>
                {t.listeningAverage(Math.round((stats.right / stats.total) * 100), stats.attempts)}
              </Text>
            )}

            {/* Тему берём из того же списка, что и для беседы: тридцать
                заготовок на язык плюс свободная. */}
            <Pressable
              ref={topicRef}
              onPress={() =>
                measureAnchor(topicRef, (point) => {
                  setPickerAnchor(point);
                  setPickerOpen(true);
                })
              }
              style={styles.topicButton}
            >
              <Text style={styles.topicCaption}>{t.topic}</Text>
              <Text style={styles.topicValue} numberOfLines={1}>
                {findTopic(language, topic)?.label ?? t.free}
              </Text>
              <Text style={styles.topicChevron}>›</Text>
            </Pressable>

            {!listening ? (
              <>
                <Text style={styles.empty}>{t.listeningEmpty}</Text>
                <Pressable onPress={() => void build(topic)} disabled={busy} style={styles.cta}>
                  {busy ? (
                    <ActivityIndicator color={theme.ctaText} size="small" />
                  ) : (
                    <Text style={styles.ctaLabel}>{t.listeningGenerate}</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={() => void play()} disabled={busy} style={styles.cta}>
                  {busy ? (
                    <ActivityIndicator color={theme.ctaText} size="small" />
                  ) : (
                    <Text style={styles.ctaLabel}>
                      {audioUri ? t.listeningReplay : t.listeningPlay}
                    </Text>
                  )}
                </Pressable>

                {listening.questions.map((question, index) => {
                  const verdict = verdicts?.[index];
                  const given = answers[index] ?? '';

                  return (
                    <View
                      key={index}
                      style={[
                        styles.card,
                        verdict && (verdict.correct ? styles.cardRight : styles.cardWrong),
                      ]}
                    >
                      <Text style={styles.prompt}>
                        {index + 1}. {question.prompt}
                      </Text>

                      {question.kind === 'choice' && (
                        <View style={styles.options}>
                          {question.options.map((option) => {
                            const picked = given === option;
                            return (
                              <Pressable
                                key={option}
                                disabled={verdicts !== null}
                                onPress={() =>
                                  setAnswers((current) => ({ ...current, [index]: option }))
                                }
                                style={[styles.option, picked && styles.optionPicked]}
                              >
                                <Text style={[styles.optionLabel, picked && styles.optionLabelOn]}>
                                  {option}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}

                      {question.kind === 'written' && (
                        <TextInput
                          value={given}
                          editable={verdicts === null}
                          onChangeText={(text) =>
                            setAnswers((current) => ({ ...current, [index]: text }))
                          }
                          placeholder={t.listeningWrite}
                          placeholderTextColor={theme.textMuted}
                          style={styles.input}
                          multiline
                        />
                      )}

                      {question.kind === 'spoken' && (
                        <>
                          {given.length > 0 && <Text style={styles.spokenText}>{given}</Text>}
                          <Pressable
                            onPress={() => void speak(index)}
                            disabled={verdicts !== null}
                            style={[styles.mic, speaking === index && styles.micOn]}
                          >
                            <Text
                              style={[
                                styles.micLabel,
                                speaking === index && styles.micLabelOn,
                              ]}
                            >
                              {speaking === index ? t.listeningRecording : t.listeningSpeak}
                            </Text>
                          </Pressable>
                        </>
                      )}

                      <Text style={styles.hint}>{question.hint}</Text>

                      {verdict && (
                        <Text style={verdict.correct ? styles.right : styles.wrong}>
                          {verdict.comment ||
                            (verdict.correct ? '' : `${t.correctAnswer}: ${question.answer}`)}
                        </Text>
                      )}
                    </View>
                  );
                })}

                {verdicts ? (
                  <>
                    <Text style={styles.score}>
                      {t.listeningScore(score, listening.questions.length)}
                    </Text>
                    <View style={styles.card}>
                      <Text style={styles.transcriptCaption}>{t.listeningTranscript}</Text>
                      <Text style={styles.transcript}>{listening.text}</Text>
                    </View>
                  </>
                ) : (
                  <Pressable onPress={() => void check()} disabled={checking} style={styles.cta}>
                    {checking ? (
                      <ActivityIndicator color={theme.ctaText} size="small" />
                    ) : (
                      <Text style={styles.ctaLabel}>{t.listeningCheck}</Text>
                    )}
                  </Pressable>
                )}

                {/* Пересобрать можно в любой момент — иначе выбранная тема
                    ждала бы, пока доделаешь текущий диктант. */}
                <Pressable onPress={() => void build(topic)} disabled={busy} style={styles.secondary}>
                  {busy ? (
                    <ActivityIndicator color={theme.accent} size="small" />
                  ) : (
                    <Text style={styles.secondaryLabel}>{t.listeningNew}</Text>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>

          {pending && (
            <View style={styles.confirmBackdrop}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>{t.listeningQuitTitle}</Text>
                <Text style={styles.confirmText}>{t.listeningQuitWarning}</Text>
                <View style={styles.confirmRow}>
                  <Pressable onPress={() => setPending(null)} style={styles.confirmGhost}>
                    <Text style={styles.confirmGhostLabel}>{t.cancel}</Text>
                  </Pressable>
                  <Pressable onPress={() => accept(pending)} style={styles.confirmDanger}>
                    <Text style={styles.confirmDangerLabel}>{t.listeningQuit}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          <TopicPicker
            visible={pickerOpen}
            anchor={pickerAnchor}
            language={language}
            topicId={topic}
            onSelect={changeTopic}
            onClose={() => setPickerOpen(false)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </ZoomModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    title: { color: theme.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    level: { color: theme.neon, fontSize: 12, fontWeight: '700' },
    iconButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 12,
    },
    error: { color: theme.dangerText, fontSize: 12 },
    stats: { color: theme.textMuted, fontSize: 12 },

    confirmBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: 'rgba(6,10,40,0.55)',
    },
    confirmCard: {
      width: '100%',
      maxWidth: 340,
      gap: 10,
      padding: 18,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    confirmTitle: { color: theme.text, fontSize: 17, fontWeight: '700' },
    confirmText: { color: theme.textMuted, fontSize: 14, lineHeight: 20 },
    confirmRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    confirmGhost: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    confirmGhostLabel: { color: theme.text, fontSize: 15, fontWeight: '600' },
    confirmDanger: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.danger,
    },
    confirmDangerLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    topicButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
    },
    topicCaption: { color: theme.textMuted, fontSize: 13 },
    topicValue: { color: theme.text, fontSize: 14, fontWeight: '600', flex: 1 },
    topicChevron: { color: theme.textMuted, fontSize: 18, lineHeight: 20 },
    empty: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      paddingTop: 30,
      paddingHorizontal: 20,
    },

    cta: {
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      backgroundColor: theme.ctaBg,
      borderColor: theme.ctaBorder,
    },
    ctaLabel: { color: theme.ctaText, fontSize: 15, fontWeight: '700' },
    secondary: {
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    secondaryLabel: { color: theme.neon, fontSize: 14, fontWeight: '600' },

    card: {
      gap: 8,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardRight: { borderColor: theme.correctionBorder },
    cardWrong: { borderColor: theme.danger },
    prompt: { color: theme.text, fontSize: 15, lineHeight: 21, fontWeight: '600' },
    hint: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
    right: { color: theme.correctionText, fontSize: 13, lineHeight: 18 },
    wrong: { color: theme.dangerText, fontSize: 13, lineHeight: 18 },

    options: { gap: 8 },
    option: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    optionPicked: { backgroundColor: theme.accent, borderColor: theme.accent },
    optionLabel: { color: theme.text, fontSize: 14, lineHeight: 19 },
    optionLabelOn: { color: theme.accentText },

    input: {
      color: theme.text,
      fontSize: 15,
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },

    spokenText: { color: theme.text, fontSize: 15, lineHeight: 21 },
    mic: {
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    micOn: { backgroundColor: theme.dangerBg, borderColor: theme.danger },
    micLabel: { color: theme.text, fontSize: 14, fontWeight: '600' },
    micLabelOn: { color: theme.dangerText },

    score: { color: theme.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
    transcriptCaption: { color: theme.textMuted, fontSize: 12 },
    transcript: { color: theme.text, fontSize: 15, lineHeight: 22 },
  });
