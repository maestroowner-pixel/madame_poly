import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { QUIZ_OPTIONS, buildQuiz, flatEntries, type QuizQuestion } from '../review';
import { useStyles, type Theme } from '../theme';
import type { CardDirection, Vocabulary, VocabularyEntry } from '../types';

interface Props {
  vocabulary: Vocabulary;
  direction: CardDirection;
  /** Ошибки теста можно разом отправить в очередь повторения. */
  onLater: (entries: VocabularyEntry[]) => void;
}

/**
 * Тест по набору: вопрос — слово или перевод, четыре варианта, ответ
 * подсвечивается сразу. В конце — счёт, список ошибок и кнопка отложить их
 * на повторение: тест тогда не просто проверяет, а подсказывает, что учить.
 */
export function VocabularyQuiz({ vocabulary, direction, onLater }: Props) {
  const styles = useStyles(createStyles);

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<QuizQuestion[]>([]);
  const [postponed, setPostponed] = useState(false);

  const start = () => {
    setQuestions(buildQuiz(vocabulary, direction));
    setIndex(0);
    setChosen(null);
    setMistakes([]);
    setPostponed(false);
  };

  if (flatEntries(vocabulary).length < QUIZ_OPTIONS) {
    return <Text style={styles.note}>{t.wordsQuizTooFew}</Text>;
  }

  if (!questions) {
    return (
      <View style={styles.stack}>
        <Text style={styles.note}>{t.wordsQuizIntro}</Text>
        <Pressable onPress={start} style={styles.primary}>
          <Text style={styles.primaryLabel}>{t.wordsQuizStart}</Text>
        </Pressable>
      </View>
    );
  }

  const question = questions[index];

  if (!question) {
    const right = questions.length - mistakes.length;
    return (
      <View style={styles.stack}>
        <Text style={styles.score}>{t.wordsQuizScore(right, questions.length)}</Text>
        {mistakes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.wordsQuizMistakes}</Text>
            {mistakes.map((item) => (
              <View key={item.entry.term} style={styles.mistake}>
                <Text style={styles.mistakePrompt}>{item.prompt}</Text>
                <Text style={styles.mistakeAnswer}>{item.answer}</Text>
              </View>
            ))}
          </View>
        )}
        {mistakes.length > 0 && !postponed && (
          <Pressable
            onPress={() => {
              onLater(mistakes.map((item) => item.entry));
              setPostponed(true);
            }}
            style={styles.primary}
          >
            <Text style={styles.primaryLabel}>{t.wordsQuizReviewMistakes}</Text>
          </Pressable>
        )}
        <Pressable onPress={start} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>{t.wordsQuizAgain}</Text>
        </Pressable>
      </View>
    );
  }

  const answered = chosen !== null;
  const last = index === questions.length - 1;

  const choose = (option: string) => {
    if (answered) return;
    setChosen(option);
    if (option !== question.answer) setMistakes((prev) => [...prev, question]);
  };

  return (
    <View style={styles.stack}>
      <Text style={styles.progress}>{t.wordsQuizQuestion(index + 1, questions.length)}</Text>
      <View style={styles.card}>
        <Text style={styles.prompt}>{question.prompt}</Text>
      </View>
      {question.options.map((option) => {
        const right = answered && option === question.answer;
        const wrong = answered && option === chosen && option !== question.answer;
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
        <Pressable
          onPress={() => {
            setIndex(index + 1);
            setChosen(null);
          }}
          style={styles.primary}
        >
          <Text style={styles.primaryLabel}>{last ? t.wordsQuizFinish : t.wordsQuizNext}</Text>
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    stack: { gap: 10 },
    note: { color: theme.textMuted, fontSize: 14, lineHeight: 20 },
    progress: { color: theme.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    score: { color: theme.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },

    card: {
      gap: 6,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
    prompt: { color: theme.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },

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
      paddingVertical: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    mistakePrompt: { color: theme.dangerText, fontSize: 14, fontWeight: '600' },
    mistakeAnswer: { color: theme.text, fontSize: 14 },

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
