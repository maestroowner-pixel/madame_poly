import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ZoomModal } from './ZoomModal';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { CONTENT_MAX_WIDTH } from '../layout';
import type { Anchor } from '../anchor';
import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';
import { TOPICS, topicGloss, type Topic } from '../topics';
import type { LanguageCode } from '../types';

interface Props {
  visible: boolean;
  /** Значок, из которого экран вырос. */
  anchor: Anchor | null;
  language: LanguageCode;
  topicId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}

/** Псевдотема «свободная»: тот же ряд списка, но без темы в промпте. */
const FREE: Topic = { id: '', label: t.freeTopic };

/** Ролевые ситуации и обычные темы читаются по-разному — разводим заголовками. */
type Row = { kind: 'header'; title: string } | { kind: 'topic'; topic: Topic };

export function TopicPicker({ visible, anchor, language, topicId, onSelect, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const data = useMemo<Row[]>(() => {
    const all = TOPICS[language];
    const roleplay = all.filter((topic) => topic.kind === 'roleplay');
    const talk = all.filter((topic) => topic.kind !== 'roleplay');

    return [
      { kind: 'topic', topic: FREE },
      ...(roleplay.length
        ? ([{ kind: 'header', title: t.sectionRoleplay }] as Row[])
        : []),
      ...roleplay.map<Row>((topic) => ({ kind: 'topic', topic })),
      { kind: 'header', title: t.sectionTalk },
      ...talk.map<Row>((topic) => ({ kind: 'topic', topic })),
    ];
  }, [language]);

  return (
    <ZoomModal visible={visible} anchor={anchor} onRequestClose={onClose}>
      {/* Внутрь Modal контекст отступов снаружи не попадает — нужен свой провайдер. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.topicTitle}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>{t.close}</Text>
            </Pressable>
          </View>

          <FlatList
            data={data}
            keyExtractor={(row) =>
              row.kind === 'header' ? `h-${row.title}` : row.topic.id || 'free'
            }
            contentContainerStyle={styles.list}
            renderItem={({ item: row }) => {
              if (row.kind === 'header') {
                return <Text style={styles.sectionTitle}>{row.title}</Text>;
              }

              const item = row.topic;
              const isFree = item.id === '';
              const active = isFree ? topicId === null : topicId === item.id;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(isFree ? null : item.id);
                    onClose();
                  }}
                  style={[styles.row, active && styles.rowActive]}
                >
                  <View style={styles.rowText}>
                    <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
                    <Text style={[styles.gloss, active && styles.glossActive]}>
                    {isFree ? t.freeTopicHint : topicGloss(item.id)}
                  </Text>
                  </View>
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            }}
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
    close: { color: theme.accent, fontSize: 15 },
    list: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
    sectionTitle: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 12,
      marginBottom: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    rowText: { flexShrink: 1, gap: 2 },
    label: { color: theme.text, fontSize: 16, fontWeight: '600' },
    labelActive: { color: theme.accentText },
    gloss: { color: theme.textMuted, fontSize: 13 },
    glossActive: { color: theme.accentText, opacity: 0.85 },
    check: { color: theme.accentText, fontSize: 17, fontWeight: '700' },
  });
