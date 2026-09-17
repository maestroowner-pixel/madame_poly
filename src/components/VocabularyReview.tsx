import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FlipCard } from './FlipCard';
import { createCardStyles } from './VocabularyCards';
import { formatDate } from '../format';
import { t } from '../i18n';
import { REVIEW_BATCH, REVIEW_PILE, answer, dueCards, nextDue, sides } from '../review';
import { useStyles, type Theme } from '../theme';
import type { CardDirection, ReviewCard } from '../types';

interface Props {
  cards: ReviewCard[];
  direction: CardDirection;
  speaking: string | null;
  onSpeak: (text: string) => void;
  /** Ответ на карточку: next — её новое состояние, null — слово выучено насовсем. */
  onAnswer: (card: ReviewCard, next: ReviewCard | null) => void;
}

/**
 * Повторение отложенных слов. Заход — до REVIEW_BATCH карточек, чей срок
 * подошёл; «знаю» двигает слово по лестнице интервалов и убирает из захода,
 * «ещё раз» ставит его в конец захода и на первую ступень. Очередь захода
 * собирается один раз при входе, чтобы карточки не прыгали под рукой.
 */
export function VocabularyReview({ cards, direction, speaking, onSpeak, onAnswer }: Props) {
  const styles = useStyles(createStyles);

  const [queue, setQueue] = useState<ReviewCard[]>(() => dueCards(cards).slice(0, REVIEW_BATCH));
  /** Размер захода на старте — от него считаем «третья из двенадцати». */
  const [batchSize, setBatchSize] = useState(queue.length);
  const [flipped, setFlipped] = useState(false);
  const [learned, setLearned] = useState(0);

  const card = queue[0];
  const dueLeft = dueCards(cards).length;
  const shown = card ? sides(card, direction) : null;

  // Слово звучит само, как только показалось: сразу или после переворота.
  useEffect(() => {
    if (card && shown && (shown.termInFront ? !flipped : flipped)) onSpeak(card.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.term, flipped, shown?.termInFront]);

  const reply = (remembered: boolean) => {
    if (!card) return;
    const next = answer(card, remembered);
    onAnswer(card, next);
    if (next === null) setLearned((count) => count + 1);
    setQueue((rest) => (next && !remembered ? [...rest.slice(1), next] : rest.slice(1)));
    setFlipped(false);
  };

  const startBatch = () => {
    const batch = dueCards(cards).slice(0, REVIEW_BATCH);
    setQueue(batch);
    setBatchSize(batch.length);
    setFlipped(false);
    setLearned(0);
  };

  if (cards.length === 0) {
    return <Text style={styles.note}>{t.wordsReviewHint}</Text>;
  }

  if (!card) {
    const upcoming = nextDue(cards);
    const waiting = upcoming === null ? 0 : cards.filter((item) => item.due === upcoming).length;
    return (
      <View style={styles.stack}>
        <Text style={styles.note}>
          {dueLeft > 0 || learned > 0 ? t.wordsReviewBatchDone(learned) : t.wordsReviewEmpty}
        </Text>
        {upcoming !== null && dueLeft === 0 && (
          <Text style={styles.note}>{t.wordsReviewNext(waiting, formatDate(upcoming))}</Text>
        )}
        {dueLeft > 0 && (
          <Pressable onPress={startBatch} style={styles.secondary}>
            <Text style={styles.secondaryLabel}>{t.wordsReviewMore}</Text>
          </Pressable>
        )}
        {cards.length >= REVIEW_PILE && <Text style={styles.warning}>{t.wordsReviewPile(cards.length)}</Text>}
      </View>
    );
  }

  const { front, back, frontNote, backNote } = sides(card, direction);

  return (
    <View style={styles.stack}>
      <Text style={styles.progress}>
        {t.wordsDeckProgress(Math.min(batchSize, batchSize - queue.length + 1), batchSize)} ·{' '}
        {t.wordsReviewQueue(cards.length)}
      </Text>
      <FlipCard
        front={front}
        back={back}
        frontNote={frontNote}
        backNote={backNote}
        flipped={flipped}
        onFlip={() => setFlipped((value) => !value)}
        onSpeak={() => onSpeak(card.term)}
        speaking={speaking === card.term}
      />
      <View style={styles.answers}>
        <Pressable onPress={() => reply(false)} style={styles.later}>
          <Text style={styles.laterLabel}>{t.wordsAgain}</Text>
        </Pressable>
        <Pressable onPress={() => reply(true)} style={styles.know}>
          <Text style={styles.knowLabel}>{t.wordsKnow}</Text>
        </Pressable>
      </View>
      {cards.length >= REVIEW_PILE && <Text style={styles.warning}>{t.wordsReviewPile(cards.length)}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    ...createCardStyles(theme),
    warning: { color: theme.dangerText, fontSize: 13, lineHeight: 18 },
  });
