import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExamDialogue } from './ExamDialogue';
import { ExamReport } from './ExamReport';
import { ScreenTitle } from './ScreenMenu';
import type { SpeechMode } from '../config';
import {
  EXAM_LEVELS,
  defaultExamLevel,
  examFormat,
  examTopicGloss,
  examTopics,
  findExamTopic,
  type ExamLevel,
} from '../exam';
import { formatDate } from '../format';
import { useExamSession } from '../hooks/useExamSession';
import { loadExamLevel, saveExamLevel } from '../storage';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { useStyles, type Theme } from '../theme';
import type { LanguageCode, Level, Profile, TurnMode } from '../types';

interface Props {
  /** Домик со списком разделов. */
  menu: ReactNode;
  language: LanguageCode;
  /** Уровень беседы — от него экзамен берёт уровень, пока его не выбрали. */
  level: Level;
  profile: Profile;
  turnMode: TurnMode;
  onToggleMode: () => void;
  speechRate: SpeechMode;
  /** Идёт беседа: микрофон занят ею, экзамен начинать нельзя. */
  talkBusy: boolean;
  /** Можно ли начать ещё одну сессию; false — App сам покажет, почему нельзя. */
  onBeforeStart: () => Promise<boolean>;
  /** Сессия закончилась — пора перечитать счётчики подписки. */
  onSessionEnd: () => void;
}

/**
 * Раздел «Экзамен»: выбор темы и история, сама сессия и разбор. Экраны сменяют
 * друг друга внутри раздела, а не открываются поверх: на экзамене некуда
 * отвлекаться, и слой над слоем здесь только мешал бы.
 */
export function ExamScreen({
  menu,
  language,
  level,
  profile,
  turnMode,
  onToggleMode,
  speechRate,
  talkBusy,
  onBeforeStart,
  onSessionEnd,
}: Props) {
  const styles = useStyles(createStyles);
  const [examLevel, setExamLevel] = useState<ExamLevel>(defaultExamLevel(level));

  useEffect(() => {
    void loadExamLevel(language).then((stored) =>
      setExamLevel(stored === 'B1' || stored === 'B2' ? stored : defaultExamLevel(level)),
    );
  }, [language, level]);

  const chooseLevel = (next: ExamLevel) => {
    setExamLevel(next);
    void saveExamLevel(language, next);
  };

  const exam = useExamSession({
    language,
    level: examLevel,
    turnMode,
    speechRate,
    name: profile.name || undefined,
  });

  const startTopic = async (topicId: string) => {
    if (talkBusy || !(await onBeforeStart())) return;
    await exam.start(topicId);
  };

  if (exam.stage === 'talk' && exam.session) {
    return (
      <ExamDialogue
        // Во время экзамена домик прячем: уйти из раздела значило бы бросить
        // микрофон открытым посреди ответа.
        menu={exam.sessionActive ? null : menu}
        exam={exam}
        session={exam.session}
        profile={profile}
        turnMode={turnMode}
        onToggleMode={onToggleMode}
        onSessionEnd={onSessionEnd}
      />
    );
  }

  if (exam.stage === 'report' && exam.session) {
    return <ExamReport menu={menu} exam={exam} session={exam.session} profile={profile} />;
  }

  const format = examFormat(examLevel, language);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="exam" />
        {/* Уровень меняет формат экзамена, план частей и строгость разбора. */}
        <View style={styles.levels}>
          {EXAM_LEVELS.map((item) => (
            <Pressable
              key={item}
              onPress={() => chooseLevel(item)}
              style={[styles.levelChip, item === examLevel && styles.levelChipActive]}
            >
              <Text style={[styles.levelLabel, item === examLevel && styles.levelLabelActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.examName}>{format.name}</Text>
          <Text style={styles.intro}>{t.examIntro(format.name)}</Text>
        </View>

        {talkBusy && <Text style={styles.error}>{t.examTalkBusy}</Text>}
        {exam.error && (
          <Pressable onPress={exam.dismissError}>
            <Text style={styles.error}>{exam.error}</Text>
          </Pressable>
        )}

        <Text style={styles.caption}>{t.examPick}</Text>
        {examTopics(language).map((topic) => (
          <Pressable
            key={topic.id}
            onPress={() => void startTopic(topic.id)}
            disabled={talkBusy}
            style={[styles.topic, talkBusy && styles.disabled]}
          >
            <View style={styles.topicText}>
              <Text style={styles.topicLabel}>{topic.label}</Text>
              {examTopicGloss(topic.id) !== topic.label && (
                <Text style={styles.topicGloss}>{examTopicGloss(topic.id)}</Text>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        {exam.history.length > 0 && <Text style={styles.caption}>{t.examHistory}</Text>}
        {exam.history.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => void exam.openSession(item.id)}
            style={styles.row}
          >
            <View style={styles.topicText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {findExamTopic(item.language, item.topicId)?.label ?? item.topicId}
              </Text>
              <Text style={styles.rowMeta}>
                {item.level} · {formatDate(item.startedAt)} · {t.examAnswers(item.answerCount)} ·{' '}
                {item.errorCount === null ? t.examNoReview : t.examErrors(item.errorCount)}
              </Text>
            </View>
            <Pressable onPress={() => void exam.remove(item.id)} hitSlop={10}>
              <Text style={styles.delete}>{t.delete}</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1 },
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
    levels: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
    levelChip: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: theme.surfaceAlt,
    },
    levelChipActive: { backgroundColor: theme.accent },
    levelLabel: { color: theme.textMuted, fontSize: 12, fontWeight: '700' },
    levelLabelActive: { color: theme.accentText },

    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 10,
    },
    card: {
      gap: 6,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    examName: { color: theme.text, fontSize: 15, fontWeight: '700' },
    intro: { color: theme.textMuted, fontSize: 13, lineHeight: 19 },
    error: { color: theme.dangerText, fontSize: 12, lineHeight: 17 },
    caption: { color: theme.textMuted, fontSize: 12, marginTop: 8 },

    topic: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
    },
    disabled: { opacity: 0.5 },
    topicText: { flex: 1, gap: 2 },
    topicLabel: { color: theme.text, fontSize: 15, fontWeight: '600' },
    topicGloss: { color: theme.textMuted, fontSize: 12 },
    chevron: { color: theme.textMuted, fontSize: 18, lineHeight: 20 },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowTitle: { color: theme.text, fontSize: 14, fontWeight: '600' },
    rowMeta: { color: theme.textMuted, fontSize: 12 },
    delete: { color: theme.dangerText, fontSize: 12, fontWeight: '600' },
  });
