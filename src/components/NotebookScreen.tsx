import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { CheckIcon, CloseIcon, ShareIcon } from './icons';
import { ZoomModal } from './ZoomModal';
import { measureAnchor, type Anchor } from '../anchor';
import { formatDate } from '../format';
import { t } from '../i18n';
import { LANGUAGES } from '../languages';
import { CONTENT_MAX_WIDTH } from '../layout';
import { exportNotebookPdf } from '../services/pdf';
import { loadNotebook, type NotebookEntry } from '../storage';
import { useStyles, useTheme, type Theme } from '../theme';
import { findTopic } from '../topics';
import type { ExerciseKind } from '../types';

interface Props {
  visible: boolean;
  /** Значок тетради в шапке: из него экран растёт и в него схлопывается. */
  anchor: Anchor | null;
  onClose: () => void;
}

const KIND_LABELS: Record<ExerciseKind, string> = {
  fill: t.kindFill,
  fix: t.kindFix,
  translate: t.kindTranslate,
};

function entryTitle(entry: NotebookEntry): string {
  const topic = findTopic(entry.language, entry.topicId);
  return topic ? topic.label : t.freeTopic;
}

/**
 * Тетрадь: список занятий, а не сплошная простыня упражнений — их набирается
 * слишком много, чтобы листать. Сам список собирается из архива на лету:
 * хранить его отдельно значило бы чинить после каждого удаления беседы.
 */
export function NotebookScreen({ visible, anchor, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** null — обычный режим; массив (пусть и пустой) — режим выбора. */
  const [selected, setSelected] = useState<string[] | null>(null);
  const [opened, setOpened] = useState<NotebookEntry | null>(null);
  // Занятие раскрывается из своей строки — в неё же и складывается.
  const [openedAnchor, setOpenedAnchor] = useState<Anchor | null>(null);
  const rowRefs = useRef(new Map<string, View>());

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setSelected(null);
    setOpened(null);
    void loadNotebook().then(setEntries);
  }, [visible]);

  const total = entries.reduce((sum, entry) => sum + entry.homework.exercises.length, 0);
  const selecting = selected !== null;

  const openLesson = (entry: NotebookEntry) =>
    measureAnchor({ current: rowRefs.current.get(entry.id) ?? null }, (point) => {
      setOpenedAnchor(point);
      setOpened(entry);
    });

  const toggle = (id: string) =>
    setSelected((current) => {
      const list = current ?? [];
      return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
    });

  const exportPdf = async (chosen: NotebookEntry[]) => {
    if (chosen.length === 0 || exporting) return;
    setExporting(true);
    setError(null);
    try {
      await exportNotebookPdf(chosen);
      setSelected(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  // Отбираем фильтром по общему списку: так занятия в PDF идут в том же
  // порядке, что и на экране, а не в порядке расстановки галочек.
  const share = () =>
    void exportPdf(
      selected === null ? entries : entries.filter((entry) => selected.includes(entry.id)),
    );

  const canShare = entries.length > 0 && (selected === null || selected.length > 0);

  return (
    <ZoomModal visible={visible} anchor={anchor} onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {selected === null ? t.notebookTitle : t.selectedCount(selected.length)}
            </Text>
            <View style={styles.actions}>
              {canShare && (
                <Pressable
                  onPress={share}
                  disabled={exporting}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t.pdf}
                  style={styles.iconButton}
                >
                  {exporting ? (
                    <ActivityIndicator color={theme.neon} size="small" />
                  ) : (
                    <ShareIcon size={22} color={theme.neon} />
                  )}
                </Pressable>
              )}
              <Pressable
                // В режиме выбора крестик отменяет выбор, а не закрывает тетрадь.
                onPress={selecting ? () => setSelected(null) : onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t.close}
                style={styles.iconButton}
              >
                <CloseIcon size={20} color={theme.neon} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {error && <Text style={styles.error}>{error}</Text>}

            {entries.length === 0 ? (
              <Text style={styles.empty}>{t.notebookEmpty}</Text>
            ) : (
              <>
                <Text style={styles.total}>
                  {t.totalExercises(total)}
                  {!selecting && ` · ${t.notebookHint}`}
                </Text>

                {entries.map((entry) => {
                  const checked = selected !== null && selected.includes(entry.id);
                  return (
                    <Pressable
                      key={entry.id}
                      ref={(node) => {
                        if (node) rowRefs.current.set(entry.id, node);
                        else rowRefs.current.delete(entry.id);
                      }}
                      onPress={() => (selecting ? toggle(entry.id) : openLesson(entry))}
                      onLongPress={() => (selecting ? toggle(entry.id) : setSelected([entry.id]))}
                      style={[styles.row, checked && styles.rowChecked]}
                    >
                      {selecting && (
                        <View style={[styles.check, checked && styles.checkOn]}>
                          {checked && <CheckIcon size={16} color={theme.ctaText} />}
                        </View>
                      )}

                      <View style={styles.rowBody}>
                        <View style={styles.rowHead}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {LANGUAGES[entry.language].flag} {entryTitle(entry)}
                          </Text>
                          <Text style={styles.level}>{entry.level}</Text>
                        </View>
                        <Text style={styles.meta}>
                          {t.totalExercises(entry.homework.exercises.length)} ·{' '}
                          {formatDate(entry.createdAt)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>

      <LessonModal
        entry={opened}
        anchor={openedAnchor}
        onClose={() => setOpened(null)}
        onShare={exportPdf}
      />
    </ZoomModal>
  );
}

interface LessonProps {
  entry: NotebookEntry | null;
  anchor: Anchor | null;
  onClose: () => void;
  onShare: (entries: NotebookEntry[]) => Promise<void>;
}

/** Одно занятие целиком: задания с правилом, подсказкой и ответом. */
function LessonModal({ entry, anchor, onClose, onShare }: LessonProps) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <ZoomModal visible={entry !== null} anchor={anchor} onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          {entry && (
            <>
              <View style={styles.header}>
                <View style={styles.lessonHead}>
                  <Text style={styles.title} numberOfLines={1}>
                    {LANGUAGES[entry.language].flag} {entryTitle(entry)}
                  </Text>
                  <Text style={styles.meta}>
                    {entry.level} · {formatDate(entry.createdAt)}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => void onShare([entry])}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={t.pdf}
                    style={styles.iconButton}
                  >
                    <ShareIcon size={22} color={theme.neon} />
                  </Pressable>
                  <Pressable
                    onPress={onClose}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={t.close}
                    style={styles.iconButton}
                  >
                    <CloseIcon size={20} color={theme.neon} />
                  </Pressable>
                </View>
              </View>

              <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.summary}>{entry.homework.summary}</Text>

                {entry.homework.exercises.map((exercise, index) => (
                  <View key={index} style={styles.card}>
                    <Text style={styles.kind}>
                      {index + 1}. {KIND_LABELS[exercise.kind]} · {exercise.rule}
                    </Text>
                    <Text style={styles.prompt}>{exercise.task}</Text>
                    <Text style={styles.hint}>{exercise.hint}</Text>
                    <Text style={styles.answerLine}>
                      {t.correctAnswer}: {exercise.answer}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
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
    title: { color: theme.text, fontSize: 18, fontWeight: '700' },
    lessonHead: { flexShrink: 1, gap: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 10,
    },
    total: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
    error: { color: theme.dangerText, fontSize: 12 },
    empty: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      paddingTop: 40,
      paddingHorizontal: 20,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowChecked: { borderColor: theme.accent },
    rowBody: { flex: 1, gap: 3 },
    rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    rowTitle: { color: theme.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
    level: { color: theme.neon, fontSize: 12, fontWeight: '700' },
    meta: { color: theme.textMuted, fontSize: 12 },

    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: { backgroundColor: theme.accent, borderColor: theme.accent },

    summary: { color: theme.textMuted, fontSize: 13, lineHeight: 18 },
    card: {
      gap: 3,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    kind: { color: theme.textMuted, fontSize: 11 },
    prompt: { color: theme.text, fontSize: 15, lineHeight: 21 },
    hint: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
    answerLine: { color: theme.neon, fontSize: 13, lineHeight: 18, marginTop: 3 },
  });
