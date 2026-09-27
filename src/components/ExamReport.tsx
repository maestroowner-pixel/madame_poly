import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WideButton } from './WideButton';
import { MessageBubble } from './MessageBubble';
import { findExamTopic } from '../exam';
import { formatDate } from '../format';
import type { useExamSession } from '../hooks/useExamSession';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { useStyles, useTheme, type Theme } from '../theme';
import {
  ERROR_CATEGORIES,
  type DialogueTurn,
  type ErrorCategory,
  type Profile,
  type SessionReport,
} from '../types';

export function categoryLabel(category: ErrorCategory): string {
  return {
    grammar: t.categoryGrammar,
    vocabulary: t.categoryVocabulary,
    collocation: t.categoryCollocation,
    fluency: t.categoryFluency,
  }[category];
}

interface Props {
  menu: ReactNode;
  exam: ReturnType<typeof useExamSession>;
  session: SessionReport;
  profile: Profile;
}

/**
 * Разбор сессии: счёт по категориям сверху — чтобы сразу видеть, где провал, —
 * затем что подтянуть и сами ошибки. Стенограмма свёрнута: к ней возвращаются,
 * когда хотят вспомнить, в каком ответе ошибка случилась.
 */
export function ExamReport({ menu, exam, session, profile }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const topic = findExamTopic(session.language, session.topicId);
  const report = session.report;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <Pressable onPress={() => void exam.back()} hitSlop={10}>
          <Text style={styles.back}>{t.examBack}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View>
          <Text style={styles.title}>{topic?.label ?? session.topicId}</Text>
          <Text style={styles.meta}>
            {session.level} · {formatDate(session.startedAt)} · {t.examAnswers(session.answerCount)}
          </Text>
        </View>

        {exam.reviewing && (
          <View style={styles.waiting}>
            <ActivityIndicator color={theme.neon} />
            <Text style={styles.meta}>{t.examReviewing}</Text>
          </View>
        )}

        {exam.error && <Text style={styles.error}>{exam.error}</Text>}

        {!report && !exam.reviewing && session.answerCount > 0 && (
          <WideButton onPress={() => void exam.review()} style={styles.cta}>
            <Text style={styles.ctaLabel}>{t.examReviewAgain}</Text>
          </WideButton>
        )}

        {report && (
          <>
            <View style={styles.tiles}>
              {ERROR_CATEGORIES.map((category) => (
                <View key={category} style={styles.tile}>
                  <Text style={styles.tileCount}>{report.summary[category]}</Text>
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {categoryLabel(category)}
                  </Text>
                </View>
              ))}
            </View>

            {report.recommendations.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.caption}>{t.examRecommendations}</Text>
                {report.recommendations.map((line, index) => (
                  <Text key={index} style={styles.recommendation}>
                    {'•  '}
                    {line}
                  </Text>
                ))}
              </View>
            )}

            {report.errors.length === 0 && <Text style={styles.meta}>{t.examNoErrors}</Text>}

            {report.errors.map((error, index) => (
              <View key={index} style={styles.fix}>
                <Text style={styles.category}>{categoryLabel(error.category)}</Text>
                <Text style={styles.fixLine}>
                  <Text style={styles.wrong}>{error.original}</Text>
                  <Text style={styles.arrow}> → </Text>
                  <Text style={styles.right}>{error.corrected}</Text>
                </Text>
                <Text style={styles.explain}>{error.explanation}</Text>
              </View>
            ))}
          </>
        )}

        <WideButton onPress={() => setTranscriptOpen((open) => !open)} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>
            {t.examTranscript} {transcriptOpen ? '▴' : '▾'}
          </Text>
        </WideButton>

        {transcriptOpen &&
          session.turns.map((turn) => (
            <MessageBubble
              key={turn.id}
              message={turn}
              profile={profile}
              topicId={null}
              onReplay={(message) => void exam.replay(message as DialogueTurn)}
            />
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
    back: { color: theme.neon, fontSize: 14, fontWeight: '600' },

    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 12,
    },
    title: { color: theme.text, fontSize: 18, fontWeight: '700' },
    meta: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
    waiting: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
    error: { color: theme.dangerText, fontSize: 12, lineHeight: 17 },

    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tile: {
      flexGrow: 1,
      flexBasis: '22%',
      minWidth: 72,
      alignItems: 'center',
      gap: 2,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tileCount: { color: theme.neon, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
    tileLabel: { color: theme.textMuted, fontSize: 11 },

    card: {
      gap: 6,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    caption: { color: theme.textMuted, fontSize: 12 },
    recommendation: { color: theme.text, fontSize: 14, lineHeight: 20 },

    /** Ошибка выглядит так же, как в письме и в ленте беседы. */
    fix: {
      gap: 4,
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.correctionBg,
      borderWidth: 1,
      borderColor: theme.correctionBorder,
    },
    category: {
      color: theme.correctionText,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    fixLine: { fontSize: 14, lineHeight: 20 },
    wrong: { color: theme.textMuted, textDecorationLine: 'line-through' },
    arrow: { color: theme.textMuted },
    right: { color: theme.correctionText, fontWeight: '700' },
    explain: { color: theme.text, fontSize: 13, lineHeight: 18 },

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
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    secondaryLabel: { color: theme.neon, fontSize: 14, fontWeight: '600' },
  });
