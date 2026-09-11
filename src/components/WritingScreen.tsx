import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenTitle } from './ScreenMenu';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { generateWritingTask, reviewWriting } from '../services/llm';
import { EMPTY_WRITING, loadWriting, saveWriting, type WritingState } from '../storage';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    void loadWriting(language).then(setState);
  }, [language]);

  /** Набранное сохраняем сами: раздел закроют, а текст должен пережить это. */
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => () => void saveWriting(language, stateRef.current), [language]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const setTask = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const topic = findTopic(language, topicId);
      const task = await generateWritingTask({ language, level, topic: topic ?? undefined });
      const next = { task, text: '', review: null };
      setState(next);
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

  const rewrite = () => {
    const next = { ...state, review: null };
    setState(next);
    void saveWriting(language, next);
  };

  const words = countWords(state.text);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="write" />
        <Text style={styles.level}>{level}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {error && <Text style={styles.error}>{error}</Text>}

          {!state.task ? (
            <>
              <Text style={styles.intro}>{t.writingIntro}</Text>
              <Pressable onPress={() => void setTask()} disabled={busy} style={styles.cta}>
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

                  <Pressable onPress={rewrite} style={styles.secondary}>
                    <Text style={styles.secondaryLabel}>{t.writingAgain}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <TextInput
                    value={state.text}
                    onChangeText={(text) => setState((current) => ({ ...current, text }))}
                    placeholder={t.writingPlaceholder}
                    placeholderTextColor={theme.textMuted}
                    style={styles.input}
                    multiline
                    textAlignVertical="top"
                  />
                  <Text style={styles.words}>{t.writingWords(words, state.task.words)}</Text>

                  <Pressable onPress={() => void check()} disabled={checking} style={styles.cta}>
                    {checking ? (
                      <ActivityIndicator color={theme.ctaText} size="small" />
                    ) : (
                      <Text style={styles.ctaLabel}>{t.writingCheck}</Text>
                    )}
                  </Pressable>
                </>
              )}

              <Pressable onPress={() => void setTask()} disabled={busy} style={styles.secondary}>
                {busy ? (
                  <ActivityIndicator color={theme.neon} size="small" />
                ) : (
                  <Text style={styles.secondaryLabel}>{t.writingTaskNew}</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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

    input: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 22,
      minHeight: 220,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    words: { color: theme.textMuted, fontSize: 12, textAlign: 'right' },

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
