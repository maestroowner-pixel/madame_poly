import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ZoomModal } from './ZoomModal';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { CloseIcon, ShareIcon } from './icons';
import { CONTENT_MAX_WIDTH } from '../layout';
import type { Anchor } from '../anchor';
import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';
import { exportHomeworkPdf } from '../services/pdf';
import type { Exercise, ExerciseKind, Homework, Message } from '../types';

interface Props {
  visible: boolean;
  /** Значок, из которого экран вырос. */
  anchor: Anchor | null;
  homework: Homework | null;
  /** Сколько ошибок в беседе — из них и составляется задание. */
  correctionCount: number;
  busy: boolean;
  /** Реплики беседы — попадают в PDF перед заданиями. */
  messages: Message[];
  /** Заголовок PDF: тема беседы и дата. */
  title: string;
  subtitle: string;
  /** Без него экран только показывает готовое: так открывается архив. */
  onGenerate?: () => void;
  onClose: () => void;
}

const KIND_LABELS: Record<ExerciseKind, string> = {
  fill: t.kindFill,
  fix: t.kindFix,
  translate: t.kindTranslate,
};

function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  // Ответ закрыт по умолчанию: иначе глаз цепляет его раньше, чем голова успеет подумать.
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.kind}>
          {index + 1}. {KIND_LABELS[exercise.kind]}
        </Text>
        <Text style={styles.rule} numberOfLines={1}>
          {exercise.rule}
        </Text>
      </View>

      <Text style={styles.task}>{exercise.task}</Text>
      <Text style={styles.hint}>{exercise.hint}</Text>

      {exercise.sourceOriginal && (
        <View style={styles.source}>
          <Text style={styles.sourceCaption}>{t.fromConversation}</Text>
          <Text style={styles.sourceLine}>
            <Text style={styles.sourceWrong}>{exercise.sourceOriginal}</Text>
            <Text style={styles.sourceArrow}>{'  →  '}</Text>
            <Text style={styles.sourceRight}>{exercise.sourceCorrected}</Text>
          </Text>
        </View>
      )}

      <Pressable onPress={() => setOpen((value) => !value)} style={styles.answerButton}>
        <Text style={styles.answerButtonText}>
          {open ? t.hideAnswer : t.showAnswer}
        </Text>
      </Pressable>

      {open && <Text style={styles.answer}>{exercise.answer}</Text>}
    </View>
  );
}

export function HomeworkScreen({
  visible,
  anchor,
  homework,
  correctionCount,
  busy,
  messages,
  title,
  subtitle,
  onGenerate,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportPdf = async () => {
    if (!homework || exporting) return;
    setExportError(null);
    setExporting(true);
    try {
      await exportHomeworkPdf({ title, subtitle, messages, homework });
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  // Ответы схлопываются при закрытии — ключом перерисовываем карточки заново.
  const [pass, setPass] = useState(0);
  useEffect(() => {
    if (!visible) setPass((value) => value + 1);
  }, [visible]);

  return (
    <ZoomModal visible={visible} anchor={anchor} onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.homeworkTitle}</Text>
            <View style={styles.headerActions}>
              {homework && (
                <Pressable
                  onPress={() => void exportPdf()}
                  disabled={exporting}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t.pdf}
                  style={styles.iconButton}
                >
                  {exporting ? (
                    <ActivityIndicator color={theme.accent} size="small" />
                  ) : (
                    <ShareIcon size={22} color={theme.accent} />
                  )}
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t.close}
                style={styles.iconButton}
              >
                <CloseIcon size={20} color={theme.accent} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {homework ? (
              <>
                {exportError && <Text style={styles.exportError}>{exportError}</Text>}
                <Text style={styles.summary}>{homework.summary}</Text>
                {homework.exercises.map((exercise, index) => (
                  <ExerciseCard key={`${pass}-${index}`} exercise={exercise} index={index} />
                ))}
              </>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {correctionCount > 0
                    ? t.homeworkOffer(correctionCount)
                    : t.homeworkNone}
                </Text>

                {onGenerate && correctionCount > 0 && (
                  <Pressable
                    onPress={onGenerate}
                    disabled={busy}
                    style={[styles.generate, busy && styles.generateBusy]}
                  >
                    {busy ? (
                      <ActivityIndicator color={theme.accentText} />
                    ) : (
                      <Text style={styles.generateText}>{t.generate}</Text>
                    )}
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    title: { color: theme.text, fontSize: 18, fontWeight: '700' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
    exportError: { color: theme.dangerText, fontSize: 12 },

    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 10,
    },
    summary: { color: theme.text, fontSize: 15, lineHeight: 21, paddingBottom: 4 },

    card: {
      gap: 6,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    kind: { color: theme.accent, fontSize: 12, fontWeight: '700' },
    rule: { color: theme.textMuted, fontSize: 12, flexShrink: 1 },
    task: { color: theme.text, fontSize: 16, lineHeight: 22 },
    hint: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },

    source: {
      marginTop: 4,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      gap: 3,
    },
    sourceCaption: {
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sourceLine: { fontSize: 13, lineHeight: 18 },
    sourceWrong: { color: theme.textMuted, textDecorationLine: 'line-through' },
    sourceArrow: { color: theme.textMuted },
    sourceRight: { color: theme.correctionText, fontWeight: '600' },

    answerButton: { alignSelf: 'flex-start', paddingVertical: 4 },
    answerButtonText: { color: theme.highlight, fontSize: 13, fontWeight: '600' },
    answer: {
      color: theme.correctionText,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 21,
      paddingTop: 2,
    },

    empty: { gap: 16, paddingTop: 24, alignItems: 'center' },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    generate: {
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 999,
      backgroundColor: theme.accent,
      minWidth: 190,
      alignItems: 'center',
    },
    generateBusy: { opacity: 0.7 },
    generateText: { color: theme.accentText, fontSize: 15, fontWeight: '700' },
  });
