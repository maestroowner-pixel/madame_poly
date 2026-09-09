import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon, ShareIcon } from './icons';
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
  onClose: () => void;
}

const KIND_LABELS: Record<ExerciseKind, string> = {
  fill: t.kindFill,
  fix: t.kindFix,
  translate: t.kindTranslate,
};

/**
 * Тетрадь: всё, что когда-либо было составлено, разделами по темам. Список
 * собирается из архива на лету — отдельно хранить его значило бы чинить после
 * каждого удаления беседы.
 */
export function NotebookScreen({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    void loadNotebook().then(setEntries);
  }, [visible]);

  const total = entries.reduce((sum, entry) => sum + entry.homework.exercises.length, 0);

  const exportPdf = async () => {
    if (entries.length === 0 || exporting) return;
    setExporting(true);
    try {
      await exportNotebookPdf(entries);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.notebookTitle}</Text>
            <View style={styles.actions}>
              {entries.length > 0 && (
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
            {error && <Text style={styles.error}>{error}</Text>}

            {entries.length === 0 ? (
              <Text style={styles.empty}>{t.notebookEmpty}</Text>
            ) : (
              <>
                <Text style={styles.total}>{t.totalExercises(total)}</Text>

                {entries.map((entry) => {
                  const topic = findTopic(entry.language, entry.topicId);
                  return (
                    <View key={entry.id} style={styles.section}>
                      <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle} numberOfLines={1}>
                          {LANGUAGES[entry.language].flag} {topic ? topic.label : t.freeTopic}
                        </Text>
                        <Text style={styles.level}>{entry.level}</Text>
                      </View>

                      {entry.homework.exercises.map((exercise, index) => (
                        <View key={index} style={styles.task}>
                          <Text style={styles.kind}>
                            {KIND_LABELS[exercise.kind]} · {exercise.rule}
                          </Text>
                          <Text style={styles.prompt}>{exercise.task}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </>
            )}

          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
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
    total: { color: theme.textMuted, fontSize: 12 },
    error: { color: theme.dangerText, fontSize: 12 },
    empty: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      paddingTop: 40,
      paddingHorizontal: 20,
    },

    section: {
      gap: 8,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    sectionTitle: { color: theme.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
    level: { color: theme.accent, fontSize: 12, fontWeight: '700' },

    task: { gap: 2 },
    kind: { color: theme.textMuted, fontSize: 11 },
    prompt: { color: theme.text, fontSize: 14, lineHeight: 19 },
  });
