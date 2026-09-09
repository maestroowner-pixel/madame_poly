import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';
import type { Message, Profile } from '../types';
import { TutorAvatar, UserAvatar } from './Avatar';

interface Props {
  message: Message;
  profile: Profile;
  /** Тема беседы — от неё зависит, в какой роли показан собеседник. */
  topicId: string | null;
  /** Фразы, по которым уже составлены упражнения. */
  drilled?: ReadonlySet<string>;
  onReplay: (message: Message) => void;
}

const AVATAR_SIZE = 32;

export function MessageBubble({ message, profile, topicId, drilled, onReplay }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  // Грамматика прячется по умолчанию: в беседе она отвлекает, а после — нужна.
  const [showRules, setShowRules] = useState(false);

  const isUser = message.role === 'user';
  const corrections = message.corrections ?? [];
  const hasRules = corrections.some((correction) => correction.rule ?? correction.details);

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}>
      <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
        {!isUser && <TutorAvatar size={AVATAR_SIZE} topicId={topicId} />}

        <Pressable
          onPress={() => !isUser && onReplay(message)}
          style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}
        >
          <Text style={[styles.text, isUser && styles.textUser]}>{message.text}</Text>
          {!isUser && <Text style={styles.replayHint}>{t.tapToPlay}</Text>}
        </Pressable>

        {hasRules && (
          <Pressable
            onPress={() => setShowRules((open) => !open)}
            hitSlop={10}
            style={[styles.help, showRules && styles.helpOpen]}
          >
            <Text style={[styles.helpGlyph, showRules && styles.helpGlyphOpen]}>
              {showRules ? '×' : '?'}
            </Text>
          </Pressable>
        )}

        {isUser && (
          <UserAvatar
            avatarId={profile.avatarId}
            photoUri={profile.photoUri}
            name={profile.name}
            size={AVATAR_SIZE}
          />
        )}
      </View>

      {corrections.map((correction, index) => (
        <View key={index} style={styles.correction}>
          <Text style={styles.correctionLine}>
            <Text style={styles.strike}>{correction.original}</Text>
            <Text style={styles.arrow}>{'  →  '}</Text>
            <Text style={styles.corrected}>{correction.corrected}</Text>
          </Text>
          <View style={styles.explanationRow}>
            <Text style={styles.explanation}>{correction.explanation}</Text>
            {drilled?.has(correction.original) && (
              <Text style={styles.drilled}>{t.drilled}</Text>
            )}
          </View>

          {showRules && (correction.rule ?? correction.details) && (
            <View style={styles.rule}>
              {correction.rule && <Text style={styles.ruleTitle}>{correction.rule}</Text>}
              {correction.details && <Text style={styles.ruleText}>{correction.details}</Text>}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { marginBottom: 14, maxWidth: '88%' },
    wrapperUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    wrapperAssistant: { alignSelf: 'flex-start' },

    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    /** У пользователя пузырь прижат вправо — «?» встаёт вплотную слева от него. */
    bubbleRowUser: { justifyContent: 'flex-end' },

    bubble: { borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, flexShrink: 1 },
    bubbleUser: { backgroundColor: theme.accent, borderBottomRightRadius: 6 },
    bubbleAssistant: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomLeftRadius: 6,
    },
    text: { color: theme.text, fontSize: 16, lineHeight: 22 },
    textUser: { color: theme.accentText },
    replayHint: { color: theme.highlight, fontSize: 11, marginTop: 6, opacity: 0.8 },

    help: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.border,
    },
    helpOpen: { backgroundColor: theme.correctionBorder, borderColor: theme.correctionBorder },
    helpGlyph: { color: theme.textMuted, fontSize: 15, fontWeight: '700', lineHeight: 18 },
    helpGlyphOpen: { color: theme.surface },

    correction: {
      marginTop: 8,
      alignSelf: 'stretch',
      backgroundColor: theme.correctionBg,
      borderWidth: 1,
      borderColor: theme.correctionBorder,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    correctionLine: { fontSize: 14, lineHeight: 20 },
    strike: { color: theme.textMuted, textDecorationLine: 'line-through' },
    arrow: { color: theme.textMuted },
    corrected: { color: theme.correctionText, fontWeight: '600' },
    explanationRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
    explanation: { color: theme.textMuted, fontSize: 12, lineHeight: 17, flexShrink: 1 },
    drilled: {
      color: theme.correctionText,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    rule: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.correctionBorder,
      gap: 4,
    },
    ruleTitle: { color: theme.correctionText, fontSize: 12, fontWeight: '700' },
    ruleText: { color: theme.text, fontSize: 13, lineHeight: 19 },
  });
