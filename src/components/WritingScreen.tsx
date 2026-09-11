import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenTitle } from './ScreenMenu';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { TopicPicker } from './TopicPicker';
import { measureAnchor, type Anchor } from '../anchor';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { generateHomework, generateWritingTask, reviewWriting } from '../services/llm';
import {
  EMPTY_WRITING,
  loadWriting,
  saveLesson,
  saveWriting,
  type WritingState,
} from '../storage';
import { useStyles, useTheme, type Theme } from '../theme';
import { findTopic } from '../topics';
import type { LanguageCode, Level } from '../types';

interface Props {
  /** Домик со списком разделов. */
  menu: ReactNode;
  language: LanguageCode;
  level: Level;
  topicId: string | null;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Письмо: единственное место, где над фразой можно подумать. Задание даётся под
 * уровень и тему, написанное разбирается так же, как речь, но строже — текст
 * перед глазами целиком, поэтому в разбор попадают и знаки, и связность.
 */
export function WritingScreen({ menu, language, level, topicId }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [state, setState] = useState<WritingState>(EMPTY_WRITING);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [drilling, setDrilling] = useState(false);
  /** Сколько упражнений уехало в тетрадь — показываем вместо кнопки. */
  const [drilled, setDrilled] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Тема письма своя: писать про аптеку можно и посреди бесед о Риме. */
  const [topic, setTopic] = useState<string | null>(topicId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<Anchor | null>(null);
  /** Смена темы рвёт черновик — спрашиваем, пока текст не проверен. */
  const [pending, setPending] = useState<string | null | undefined>(undefined);
  const topicRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  /** Высота клавиатуры: на её месте экран сам отводит себе отступ. */
  const keyboard = useKeyboardInset();
  const typing = keyboard > 0;

  useEffect(() => {
    setError(null);
    void loadWriting(language).then((stored) => {
      setState(stored);
      // Тема готового задания, а если его нет — тема беседы.
      setTopic(stored.task ? stored.task.topicId : topicId);
    });
  }, [language, topicId]);

  /** Набранное сохраняем сами: раздел закроют, а текст должен пережить это. */
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => () => void saveWriting(language, stateRef.current), [language]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const setTask = async (subject: string | null) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const chosen = findTopic(language, subject);
      const task = await generateWritingTask({ language, level, topic: chosen ?? undefined });
      const next = { task, text: '', review: null };
      setState(next);
      setDrilled(null);
      await saveWriting(language, next);
    } catch (e: unknown) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    if (!state.task || checking) return;
    setChecking(true);
    setError(null);
    try {
      const review = await reviewWriting({ text: state.text, task: state.task });
      const next = { ...state, review };
      setState(next);
      await saveWriting(language, next);
    } catch (e: unknown) {
      fail(e);
    } finally {
      setChecking(false);
    }
  };

  /**
   * Ошибки письма — такой же материал для упражнений, как ошибки речи. Кладём
   * их в тетрадь отдельным занятием: оттуда они уходят в общий PDF вместе с
   * остальными, и повторять экспорт отдельно для письма не нужно.
   */
  const drill = async () => {
    if (!state.task || !state.review || drilling) return;
    if (state.review.corrections.length === 0) return;

    setDrilling(true);
    setError(null);
    try {
      const homework = await generateHomework({
        corrections: state.review.corrections,
        language,
        level,
      });
      await saveLesson(
        {
          id: `writing-${Date.now()}`,
          language,
          level,
          topicId: state.task.topicId,
          createdAt: homework.createdAt,
        },
        homework,
      );
      setDrilled(homework.exercises.length);
    } catch (e: unknown) {
      fail(e);
    } finally {
      setDrilling(false);
    }
  };

  const rewrite = () => {
    const next = { ...state, review: null };
    setState(next);
    setDrilled(null);
    void saveWriting(language, next);
  };

  /** Есть что терять: текст набран и ещё не проверен. */
  const unsaved = state.text.trim().length > 0 && state.review === null;

  const changeTopic = (id: string | null) => {
    if (unsaved) setPending(id);
    else {
      setTopic(id);
      void setTask(id);
    }
  };

  const words = countWords(state.text);
  /** Пишем — значит задание есть, а разбора ещё нет. */
  const composing = state.task !== null && state.review === null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="write" />
        <Text style={styles.level}>{level}</Text>
      </View>

      <View style={[styles.flex, { paddingBottom: keyboard }]}>
        {composing ? (
          /**
           * Пока человек пишет, поле не едет внутри списка, а занимает всё
           * свободное место: клавиатура сжимает окно, вместе с ним сжимается
           * поле — и оно остаётся на виду целиком, чего прокруткой добиться не
           * удавалось.
           */
          <View style={styles.compose}>
            <Pressable
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

            {error && <Text style={styles.error}>{error}</Text>}

            {/* Задание прокручивается в своей рамке — длинное не съест поле. */}
            <ScrollView
              style={[styles.taskBox, typing && styles.taskBoxShort]}
              contentContainerStyle={styles.taskInner}
            >
              <Text style={styles.prompt}>{state.task?.prompt}</Text>
              <Text style={styles.hint}>{state.task?.hint}</Text>
            </ScrollView>

            <TextInput
              value={state.text}
              onChangeText={(text) => setState((current) => ({ ...current, text }))}
              placeholder={t.writingPlaceholder}
              placeholderTextColor={theme.textMuted}
              style={styles.composer}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.words}>{t.writingWords(words, state.task?.words ?? 0)}</Text>

            <Pressable onPress={() => void check()} disabled={checking} style={styles.cta}>
              {checking ? (
                <ActivityIndicator color={theme.ctaText} size="small" />
              ) : (
                <Text style={styles.ctaLabel}>{t.writingCheck}</Text>
              )}
            </Pressable>

            <Pressable onPress={() => void setTask(topic)} disabled={busy} style={styles.secondary}>
              {busy ? (
                <ActivityIndicator color={theme.neon} size="small" />
              ) : (
                <Text style={styles.secondaryLabel}>{t.writingTaskNew}</Text>
              )}
            </Pressable>
          </View>
        ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {error && <Text style={styles.error}>{error}</Text>}

          {/* Тема из общего списка — та же, что у беседы и диктантов. */}
          <View ref={topicRef} collapsable={false}>
            <Pressable
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
          </View>

          {!state.task ? (
            <>
              <Text style={styles.intro}>{t.writingIntro}</Text>
              <Pressable onPress={() => void setTask(topic)} disabled={busy} style={styles.cta}>
                {busy ? (
                  <ActivityIndicator color={theme.ctaText} size="small" />
                ) : (
                  <Text style={styles.ctaLabel}>{t.writingTaskFirst}</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.prompt}>{state.task.prompt}</Text>
                <Text style={styles.hint}>{state.task.hint}</Text>
              </View>

              {state.review ? (
                <>
                  <View style={styles.card}>
                    <Text style={styles.summary}>{state.review.summary}</Text>
                  </View>

                  {state.review.corrections.map((correction, index) => (
                    <View key={index} style={styles.fix}>
                      <Text style={styles.fixLine}>
                        <Text style={styles.wrong}>{correction.original}</Text>
                        <Text style={styles.arrow}> → </Text>
                        <Text style={styles.right}>{correction.corrected}</Text>
                      </Text>
                      <Text style={styles.rule}>{correction.rule}</Text>
                      <Text style={styles.explain}>{correction.explanation}</Text>
                      <Text style={styles.details}>{correction.details}</Text>
                    </View>
                  ))}

                  <View style={styles.card}>
                    <Text style={styles.caption}>{t.writingImproved}</Text>
                    <Text style={styles.improved}>{state.review.improved}</Text>
                  </View>

                  {state.review.corrections.length > 0 &&
                    (drilled === null ? (
                      <Pressable
                        onPress={() => void drill()}
                        disabled={drilling}
                        style={styles.cta}
                      >
                        {drilling ? (
                          <ActivityIndicator color={theme.ctaText} size="small" />
                        ) : (
                          <Text style={styles.ctaLabel}>{t.writingDrill}</Text>
                        )}
                      </Pressable>
                    ) : (
                      <Text style={styles.done}>{t.writingDrillDone(drilled)}</Text>
                    ))}

                  <Pressable onPress={rewrite} style={styles.secondary}>
                    <Text style={styles.secondaryLabel}>{t.writingAgain}</Text>
                  </Pressable>
                </>
              ) : (
                <></>
              )}

              <Pressable onPress={() => void setTask(topic)} disabled={busy} style={styles.secondary}>
                {busy ? (
                  <ActivityIndicator color={theme.neon} size="small" />
                ) : (
                  <Text style={styles.secondaryLabel}>{t.writingTaskNew}</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
        )}
      </View>

      {pending !== undefined && (
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t.writingDropTitle}</Text>
            <Text style={styles.confirmText}>{t.writingDropWarning}</Text>
            <View style={styles.confirmRow}>
              <Pressable onPress={() => setPending(undefined)} style={styles.confirmGhost}>
                <Text style={styles.confirmGhostLabel}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const id = pending;
                  setPending(undefined);
                  setTopic(id ?? null);
                  void setTask(id ?? null);
                }}
                style={styles.confirmDanger}
              >
                <Text style={styles.confirmDangerLabel}>{t.writingDrop}</Text>
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
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1 },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    level: { color: theme.neon, fontSize: 12, fontWeight: '700', marginLeft: 'auto' },

    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 12,
    },
    error: { color: theme.dangerText, fontSize: 12, lineHeight: 17 },
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

    confirmBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: 'rgba(4,10,30,0.6)',
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
    intro: { color: theme.textMuted, fontSize: 13, lineHeight: 19 },

    card: {
      gap: 6,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    prompt: { color: theme.text, fontSize: 15, lineHeight: 21, fontWeight: '600' },
    hint: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
    summary: { color: theme.text, fontSize: 14, lineHeight: 20 },
    caption: { color: theme.textMuted, fontSize: 12 },
    improved: { color: theme.text, fontSize: 15, lineHeight: 22 },

    compose: {
      flex: 1,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    /** Задание не должно занимать больше трети экрана — дальше оно прокручивается. */
    taskBox: {
      maxHeight: 150,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    taskBoxShort: { maxHeight: 84 },
    taskInner: { gap: 6, padding: 14 },
    composer: {
      flex: 1,
      minHeight: 120,
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    words: { color: theme.textMuted, fontSize: 12, textAlign: 'right' },
    done: { color: theme.correctionText, fontSize: 13, textAlign: 'center', lineHeight: 18 },

    /** Разбор ошибки повторяет вид ленты: то же читается в беседе. */
    fix: {
      gap: 4,
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.correctionBg,
      borderWidth: 1,
      borderColor: theme.correctionBorder,
    },
    fixLine: { fontSize: 14, lineHeight: 20 },
    wrong: { color: theme.textMuted, textDecorationLine: 'line-through' },
    arrow: { color: theme.textMuted },
    right: { color: theme.correctionText, fontWeight: '700' },
    rule: { color: theme.neon, fontSize: 12, fontWeight: '700' },
    explain: { color: theme.text, fontSize: 13, lineHeight: 18 },
    details: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },

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
  });
