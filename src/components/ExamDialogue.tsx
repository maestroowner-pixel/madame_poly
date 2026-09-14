import { useEffect, useRef, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { MessageBubble } from './MessageBubble';
import { RecordButton } from './RecordButton';
import { ScreenTitle } from './ScreenMenu';
import { findExamTopic, partOfAnswer } from '../exam';
import type { useExamSession } from '../hooks/useExamSession';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { useStyles, type Theme } from '../theme';
import type { DialogueTurn, ExamPart, Profile, SessionReport, TurnMode } from '../types';

export function partLabel(part: ExamPart): string {
  return {
    interview: t.examPartInterview,
    longTurn: t.examPartLongTurn,
    discussion: t.examPartDiscussion,
  }[part];
}

interface Props {
  menu: ReactNode;
  exam: ReturnType<typeof useExamSession>;
  session: SessionReport;
  profile: Profile;
  turnMode: TurnMode;
  onToggleMode: () => void;
  onSessionEnd: () => void;
}

/**
 * Идущий экзамен: стенограмма, какая часть сейчас и сколько осталось. Ошибок в
 * ленте нет — экзаменатор их не показывает, они придут в разборе.
 */
export function ExamDialogue({
  menu,
  exam,
  session,
  profile,
  turnMode,
  onToggleMode,
  onSessionEnd,
}: Props) {
  const styles = useStyles(createStyles);
  const listRef = useRef<FlatList<DialogueTurn>>(null);

  const topic = findExamTopic(session.language, session.topicId);
  const part = partOfAnswer(session.level, exam.answers) ?? 'discussion';

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [session.turns.length]);

  // Сессия встала — по паузе, ошибке или прощанию: счётчики подписки устарели.
  const wasActive = useRef(exam.sessionActive);
  useEffect(() => {
    if (wasActive.current && !exam.sessionActive) onSessionEnd();
    wasActive.current = exam.sessionActive;
  }, [exam.sessionActive, onSessionEnd]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="exam" title={topic?.label} />
        {menu && (
          <Pressable onPress={() => void exam.back()} hitSlop={10} style={styles.backButton}>
            <Text style={styles.back}>{t.examBack}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.progress}>
        <Text style={styles.part}>{partLabel(part)}</Text>
        <Text style={styles.count}>{t.examProgress(exam.answers, exam.total)}</Text>
      </View>

      {exam.error && (
        <Pressable onPress={exam.dismissError} style={styles.error}>
          <Text style={styles.errorText}>{exam.error}</Text>
        </Pressable>
      )}

      <FlatList
        ref={listRef}
        data={session.turns}
        keyExtractor={(turn) => turn.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            profile={profile}
            topicId={null}
            onReplay={(message) => void exam.replay(message as DialogueTurn)}
          />
        )}
      />

      {part === 'longTurn' && turnMode === 'auto' && (
        <Text style={styles.hint}>{t.examManualHint}</Text>
      )}

      <Pressable
        onPress={() => void exam.finish()}
        disabled={exam.reviewing}
        style={styles.finish}
      >
        <Text style={styles.finishLabel}>{t.examFinish}</Text>
      </Pressable>

      <RecordButton
        status={exam.status}
        sessionActive={exam.sessionActive}
        durationMillis={exam.durationMillis}
        mode={turnMode}
        inputLevel={exam.inputLevel}
        onToggleSession={() => void (exam.sessionActive ? exam.pause() : exam.resume())}
        onEndTurn={() => void exam.endTurn()}
        onBeginTurn={() => void exam.beginTurn()}
        onToggleMode={onToggleMode}
      />
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
      minHeight: 56,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    backButton: { marginLeft: 'auto' },
    back: { color: theme.neon, fontSize: 14, fontWeight: '600' },

    progress: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.surfaceAlt,
    },
    part: { color: theme.neon, fontSize: 14, fontWeight: '700' },
    count: { color: theme.textMuted, fontSize: 12, fontVariant: ['tabular-nums'] },

    error: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.dangerBg,
      borderWidth: 1,
      borderColor: theme.danger,
    },
    errorText: { color: theme.dangerText, fontSize: 12 },

    list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 8 },
    hint: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
      paddingHorizontal: 24,
      marginBottom: 6,
    },

    finish: {
      height: 42,
      marginHorizontal: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    finishLabel: { color: theme.neon, fontSize: 14, fontWeight: '700' },
  });
