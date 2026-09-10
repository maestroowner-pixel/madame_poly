import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ZoomModal } from './ZoomModal';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { LANGUAGES } from '../languages';
import { loadArchivedMessages, loadHomework } from '../storage';
import { CONTENT_MAX_WIDTH } from '../layout';
import { formatDate } from '../format';
import { measureAnchor, type Anchor } from '../anchor';
import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';
import { findTopic } from '../topics';
import type { ArchivedSession, Homework, Message, Profile } from '../types';
import { HomeworkScreen } from './HomeworkScreen';
import { MessageBubble } from './MessageBubble';

interface Props {
  visible: boolean;
  /** Значок, из которого экран вырос. */
  anchor: Anchor | null;
  archive: ArchivedSession[];
  profile: Profile;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function ArchiveScreen({ visible, anchor, archive, profile, onDelete, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [homework, setHomework] = useState<Homework | null>(null);
  const [homeworkOpen, setHomeworkOpen] = useState(false);
  const [homeworkAnchor, setHomeworkAnchor] = useState<Anchor | null>(null);
  const taskRef = useRef<View>(null);

  const opened = archive.find((session) => session.id === openId) ?? null;

  const drilled = useMemo(
    () =>
      new Set(
        (homework?.exercises ?? [])
          .map((exercise) => exercise.sourceOriginal)
          .filter((value): value is string => Boolean(value)),
      ),
    [homework],
  );

  useEffect(() => {
    if (!openId) {
      setHomework(null);
      return;
    }
    void loadArchivedMessages(openId).then(setMessages);
    void loadHomework(openId).then(setHomework);
  }, [openId]);

  // Закрыли окно — забываем, что было открыто, иначе вернёмся внутрь беседы.
  useEffect(() => {
    if (!visible) setOpenId(null);
  }, [visible]);

  return (
    <ZoomModal visible={visible} anchor={anchor} onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            {opened ? (
              <Pressable onPress={() => setOpenId(null)} hitSlop={12}>
                <Text style={styles.action}>{t.back}</Text>
              </Pressable>
            ) : (
              <Text style={styles.title}>{t.archiveTitle}</Text>
            )}

            {opened ? (
              <View style={styles.headerActions}>
                {homework && (
                  <Pressable
                    ref={taskRef}
                    onPress={() =>
                      measureAnchor(taskRef, (point) => {
                        setHomeworkAnchor(point);
                        setHomeworkOpen(true);
                      })
                    }
                    hitSlop={12}
                  >
                    <Text style={styles.action}>{t.task}</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    onDelete(opened.id);
                    setOpenId(null);
                  }}
                  hitSlop={12}
                >
                  <Text style={styles.delete}>{t.delete}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={styles.action}>{t.close}</Text>
              </Pressable>
            )}
          </View>

          {opened ? (
            <FlatList
              data={messages}
              keyExtractor={(message) => message.id}
              contentContainerStyle={styles.transcript}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  profile={profile}
                  topicId={opened.topicId}
                  drilled={drilled}
                  onReplay={() => {}}
                />
              )}
            />
          ) : (
            <FlatList
              data={archive}
              keyExtractor={(session) => session.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {t.archiveEmpty}
                </Text>
              }
              renderItem={({ item }) => {
                const topic = findTopic(item.language, item.topicId);
                return (
                  <Pressable onPress={() => setOpenId(item.id)} style={styles.row}>
                    <View style={styles.rowHead}>
                      <Text style={styles.rowTitle}>
                        {LANGUAGES[item.language].flag} {topic ? topic.label : t.freeTopic}
                      </Text>
                      <Text style={styles.rowLevel}>{item.level}</Text>
                    </View>
                    <Text style={styles.preview} numberOfLines={2}>
                      {item.preview}
                    </Text>
                    <Text style={styles.meta}>
                      {formatDate(item.startedAt)} · {t.lines(item.messageCount)} ·{' '}
                      {t.mistakes(item.correctionCount)}
                      {item.hasHomework ? ` · ${t.withTask}` : ''}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
          <HomeworkScreen
            visible={homeworkOpen}
            anchor={homeworkAnchor}
            homework={homework}
            correctionCount={opened?.correctionCount ?? 0}
            busy={false}
            messages={messages}
            title={
              opened
                ? (findTopic(opened.language, opened.topicId)?.label ??
                  `${LANGUAGES[opened.language].label} — ${t.freeTopic}`)
                : ''
            }
            subtitle={
              opened
                ? `${LANGUAGES[opened.language].label} · ${opened.level} · ${formatDate(opened.startedAt)}`
                : ''
            }
            onClose={() => setHomeworkOpen(false)}
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    title: { color: theme.text, fontSize: 18, fontWeight: '700' },
    action: { color: theme.neon, fontSize: 15 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    delete: { color: theme.danger, fontSize: 15 },

    list: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
    transcript: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24 },
    empty: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      paddingHorizontal: 24,
      paddingTop: 40,
    },

    row: {
      gap: 6,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    rowTitle: { color: theme.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
    rowLevel: { color: theme.neon, fontSize: 12, fontWeight: '700' },
    preview: { color: theme.textMuted, fontSize: 13, lineHeight: 18 },
    meta: { color: theme.textMuted, fontSize: 11, opacity: 0.85 },
  });
