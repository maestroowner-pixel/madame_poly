import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { useStyles, type Theme } from '../theme';
import type { PhrasalDrill, Vocabulary, VocabularyEntry } from '../types';
import { SpeakerIcon } from './icons';
import { WideButton } from './WideButton';

/** Сколько предложений за заход — как в тесте. */
export const DRILL_ROUND = 10;

/** Заход: случайные предложения листа, не больше DRILL_ROUND. */
export function drillRound(drills: PhrasalDrill[]): PhrasalDrill[] {
  const copy = [...drills];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, DRILL_ROUND);
}

/** Предложение целиком — с ответом на месте пропуска. */
export function filled(drill: PhrasalDrill): string {
  return drill.sentence.replace('___', drill.answer);
}

/** Записи листа под ошибки — чтобы отложить их в очередь повторения. */
export function entriesOf(vocabulary: Vocabulary, drills: PhrasalDrill[]): VocabularyEntry[] {
  const terms = new Set(drills.map((drill) => drill.term));
  return vocabulary.sections.flatMap((section) => section.entries).filter((entry) => terms.has(entry.term));
}

interface Props {
  vocabulary: Vocabulary;
  drills: PhrasalDrill[];
  speaking: string | null;
  onSpeak: (text: string) => void;
  onLater: (entries: VocabularyEntry[]) => void;
}

/**
 * «Пропуски»: предложение, где вместо фразового глагола — пропуск, и четыре
 * варианта того же глагола с разными частицами. Ответ подсвечивается сразу,
 * под ним — предложение целиком с переводом и озвучкой. В конце — счёт и
 * кнопка отложить ошибки на повторение, как в тесте.
 */
export function PhrasalGaps({ vocabulary, drills, speaking, onSpeak, onLater }: Props) {
  const styles = useStyles(createStyles);

  const [round, setRound] = useState<PhrasalDrill[] | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<PhrasalDrill[]>([]);
  const [postponed, setPostponed] = useState(false);

  const start = () => {
    setRound(drillRound(drills));
    setIndex(0);
    setChosen(null);
    setMistakes([]);
    setPostponed(false);
  };

  if (!round) {
    return (
      <View style={styles.stack}>
        <Text style={styles.note}>{t.gapsIntro}</Text>
        <WideButton onPress={start} style={styles.primary}>
          <Text style={styles.primaryLabel}>{t.wordsQuizStart}</Text>
        </WideButton>
      </View>
    );
  }

  const drill = round[index];

  if (!drill) {
    return (
      <View style={styles.stack}>
        <Text style={styles.score}>{t.wordsQuizScore(round.length - mistakes.length, round.length)}</Text>
        {mistakes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.wordsQuizMistakes}</Text>
            {mistakes.map((item) => (
              <View key={item.sentence} style={styles.mistake}>
                <Text style={styles.mistakeAnswer}>{filled(item)}</Text>
                <Text style={styles.mistakeHint}>{item.translation}</Text>
              </View>
            ))}
          </View>
        )}
        {mistakes.length > 0 && !postponed && (
          <WideButton
            onPress={() => {
              onLater(entriesOf(vocabulary, mistakes));
              setPostponed(true);
            }}
            style={styles.primary}
          >
            <Text style={styles.primaryLabel}>{t.wordsQuizReviewMistakes}</Text>
          </WideButton>
        )}
        <WideButton onPress={start} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>{t.wordsQuizAgain}</Text>
        </WideButton>
      </View>
    );
  }

  const answered = chosen !== null;
  const last = index === round.length - 1;
  const [before, after] = drill.sentence.split('___');

  const choose = (option: string) => {
    if (answered) return;
    setChosen(option);
    if (option !== drill.answer) setMistakes((prev) => [...prev, drill]);
    // Правильное предложение — сразу вслух: так оно и запоминается.
    onSpeak(filled(drill));
  };

  return (
    <View style={styles.stack}>
      <Text style={styles.progress}>{t.wordsQuizQuestion(index + 1, round.length)}</Text>
      <View style={styles.card}>
        <Text style={styles.sentence}>
          {before}
          <Text style={[styles.gap, answered && styles.gapRight]}>
            {answered ? drill.answer : ' ______ '}
          </Text>
          {after}
        </Text>
        {answered && (
          <View style={styles.after}>
            <Text style={styles.translation}>{drill.translation}</Text>
            <Pressable
              onPress={() => onSpeak(filled(drill))}
              disabled={speaking !== null}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.speakListen}
            >
              <SpeakerIcon size={20} color={styles.speaker.color} />
            </Pressable>
          </View>
        )}
      </View>
      {drill.options.map((option) => {
        const right = answered && option === drill.answer;
        const wrong = answered && option === chosen && option !== drill.answer;
        return (
          <Pressable
            key={option}
            onPress={() => choose(option)}
            style={[styles.option, right && styles.optionRight, wrong && styles.optionWrong]}
          >
            <Text style={[styles.optionLabel, right && styles.optionLabelRight, wrong && styles.optionLabelWrong]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
      {answered && (
        <WideButton
          onPress={() => {
            setIndex(index + 1);
            setChosen(null);
          }}
          style={styles.primary}
        >
          <Text style={styles.primaryLabel}>{last ? t.wordsQuizFinish : t.wordsQuizNext}</Text>
        </WideButton>
      )}
    </View>
  );
}

export const createDrillStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: 10 },
    note: { color: theme.textMuted, fontSize: 14, lineHeight: 20 },
    progress: { color: theme.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    score: { color: theme.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },

    card: {
      gap: 8,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
    sentence: { color: theme.text, fontSize: 19, lineHeight: 28, fontWeight: '600', textAlign: 'center' },
    gap: { color: theme.neon, fontWeight: '800' },
    gapRight: { color: theme.correctionText },
    after: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    translation: { color: theme.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center', flexShrink: 1 },
    speaker: { color: theme.neon },

    option: {
      minHeight: 46,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.surfaceAlt,
    },
    optionRight: { backgroundColor: theme.correctionBg, borderColor: theme.correctionBorder },
    optionWrong: { backgroundColor: theme.dangerBg, borderColor: theme.danger },
    optionLabel: { color: theme.text, fontSize: 15, fontWeight: '600' },
    optionLabelRight: { color: theme.correctionText },
    optionLabelWrong: { color: theme.dangerText },

    mistake: {
      gap: 2,
      paddingVertical: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    mistakeAnswer: { color: theme.text, fontSize: 14, fontWeight: '600' },
    mistakeHint: { color: theme.textMuted, fontSize: 13 },

    primary: {
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      backgroundColor: theme.ctaBg,
      borderColor: theme.ctaBorder,
    },
    primaryLabel: { color: theme.ctaText, fontSize: 15, fontWeight: '700' },
    secondary: {
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    secondaryLabel: { color: theme.neon, fontSize: 14, fontWeight: '600' },
  });

const createStyles = createDrillStyles;
