import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MessageBubble } from './MessageBubble';
import { RecordButton } from './RecordButton';
import { ScreenTitle } from './ScreenMenu';
import { WideButton } from './WideButton';
import type { SpeechMode } from '../config';
import { usePlacement } from '../hooks/usePlacement';
import { useSwipeBack } from '../hooks/useSectionSwipe';
import { t } from '../i18n';
import { LANGUAGES } from '../languages';
import { CONTENT_MAX_WIDTH } from '../layout';
import { useStyles, useTheme, type Theme } from '../theme';
import type { LanguageCode, Level, Message, Profile, TurnMode } from '../types';

interface Props {
  language: LanguageCode;
  /** Уровень сейчас — чтобы предложить «оставить» или «поставить». */
  level: Level;
  profile: Profile;
  turnMode: TurnMode;
  onToggleMode: () => void;
  speechRate: SpeechMode;
  onApplyLevel: (level: Level) => void;
  onClose: () => void;
}

/**
 * Тест уровня: что будет → разговор с Poly из восьми вопросов → итог с уровнем.
 * Занимает весь раздел, как экзамен: отвлекаться посреди ответа некуда.
 */
export function PlacementScreen({ language, level, profile, turnMode, onToggleMode, speechRate, onApplyLevel, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  const test = usePlacement({ language, turnMode, speechRate, name: profile.name || undefined });
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [test.turns.length]);

  const close = useCallback(() => void test.close().then(onClose), [test.close, onClose]);
  // Тест открыт поверх «Сегодня»: свайп вправо закрывает его, пока не идёт разговор.
  useSwipeBack(test.sessionActive ? 'lock' : close);

  const header = (
    <View style={styles.header}>
      <ScreenTitle screen="today" title={t.placementTitle} />
      {!test.sessionActive && (
        <Pressable onPress={close} hitSlop={10} style={styles.closeButton}>
          <Text style={styles.close}>{t.close}</Text>
        </Pressable>
      )}
    </View>
  );

  const error = test.error && (
    <Pressable onPress={test.dismissError} style={styles.error}>
      <Text style={styles.errorText}>{test.error}</Text>
    </Pressable>
  );

  if (test.stage === 'intro') {
    return (
      <View style={styles.screen}>
        {header}
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.lead}>{t.placementIntro(LANGUAGES[language].label)}</Text>
          {error}
          <WideButton onPress={() => void test.start()} style={styles.primary}>
            <Text style={styles.primaryLabel}>{t.placementStart}</Text>
          </WideButton>
        </ScrollView>
      </View>
    );
  }

  if (test.stage === 'assessing') {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={theme.neon} />
          <Text style={styles.note}>{t.placementAssessing}</Text>
        </View>
      </View>
    );
  }

  if (test.stage === 'result' && test.result) {
    const found = test.result.level;
    return (
      <View style={styles.screen}>
        {header}
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.caption}>{t.placementYourLevel}</Text>
          <Text style={styles.level}>{found}</Text>
          <Text style={styles.summary}>{test.result.summary}</Text>

          {test.result.strengths.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.placementStrengths}</Text>
              {test.result.strengths.map((line) => (
                <Text key={line} style={styles.point}>• {line}</Text>
              ))}
            </View>
          )}
          {test.result.improve.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.placementImprove}</Text>
              {test.result.improve.map((line) => (
                <Text key={line} style={styles.point}>• {line}</Text>
              ))}
            </View>
          )}

          {found === level ? (
            <WideButton onPress={close} style={styles.primary}>
              <Text style={styles.primaryLabel}>{t.placementSame(found)}</Text>
            </WideButton>
          ) : (
            <>
              <WideButton
                onPress={() => {
                  onApplyLevel(found);
                  close();
                }}
                style={styles.primary}
              >
                <Text style={styles.primaryLabel}>{t.placementApply(found)}</Text>
              </WideButton>
              <Pressable onPress={close} style={styles.secondary}>
                <Text style={styles.secondaryLabel}>{t.placementKeep(level)}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header}
      <View style={styles.progress}>
        <Text style={styles.part}>{t.placementTitle}</Text>
        <Text style={styles.count}>{t.placementProgress(Math.min(test.answers + 1, test.total), test.total)}</Text>
      </View>
      {error}
      <FlatList
        ref={listRef}
        data={test.turns}
        keyExtractor={(turn) => turn.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <MessageBubble message={item} profile={profile} topicId={null} onReplay={(message) => void test.replay(message)} />
        )}
      />
      {test.answers > 0 && (
        <Pressable onPress={() => void test.finish()} style={styles.finish}>
          <Text style={styles.finishLabel}>{t.placementFinish}</Text>
        </Pressable>
      )}
      <RecordButton
        status={test.status}
        sessionActive={test.sessionActive}
        durationMillis={test.durationMillis}
        mode={turnMode}
        inputLevel={test.inputLevel}
        onToggleSession={() => void (test.sessionActive ? test.pause() : test.resume())}
        onEndTurn={() => void test.endTurn()}
        onBeginTurn={() => void test.beginTurn()}
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
    closeButton: { marginLeft: 'auto' },
    close: { color: theme.neon, fontSize: 14, fontWeight: '600' },
    body: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
    lead: { color: theme.text, fontSize: 16, lineHeight: 23 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
    note: { color: theme.textMuted, fontSize: 14, textAlign: 'center' },
    caption: { color: theme.textMuted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center', marginTop: 8 },
    level: { color: theme.neon, fontSize: 56, fontWeight: '800', textAlign: 'center' },
    summary: { color: theme.text, fontSize: 15, lineHeight: 22 },
    card: { padding: 14, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, gap: 6 },
    cardTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
    point: { color: theme.textMuted, fontSize: 14, lineHeight: 20 },
    primary: { marginTop: 8 },
    primaryLabel: { color: theme.ctaText, fontSize: 16, fontWeight: '700' },
    secondary: { alignItems: 'center', paddingVertical: 12 },
    secondaryLabel: { color: theme.neon, fontSize: 15, fontWeight: '600' },
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
