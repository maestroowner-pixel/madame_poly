import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WideButton } from './WideButton';
import { FlipCard } from './FlipCard';
import { t } from '../i18n';
import { flatEntries, sides } from '../review';
import { useStyles, type Theme } from '../theme';
import type { CardDirection, Vocabulary, VocabularyEntry } from '../types';

interface Props {
  vocabulary: Vocabulary;
  known: Set<string>;
  direction: CardDirection;
  speaking: string | null;
  onSpeak: (text: string) => void;
  onKnow: (entry: VocabularyEntry) => void;
  onLater: (entry: VocabularyEntry) => void;
}

/**
 * Колода по набору: одна карточка за раз, лицом — слово или перевод, смотря
 * куда повёрнуто направление. Под карточкой два ответа: «знаю» ставит галочку в
 * списке, «повторить позже» отправляет слово в очередь повторения. Уже
 * известные слова колода пропускает — их можно пройти отдельно.
 */
export function VocabularyCards({ vocabulary, known, direction, speaking, onSpeak, onKnow, onLater }: Props) {
  const styles = useStyles(createStyles);

  /** Колода держит только слова: записи берём из набора при каждом рендере,
      чтобы подоспевшая транскрипция попала на уже открытую карточку. */
  const entries = new Map(flatEntries(vocabulary).map((item) => [item.entry.term, item.entry]));
  const build = (all: boolean) => [...entries.keys()].filter((term) => all || !known.has(term));

  const [deck, setDeck] = useState<string[]>(() => build(false));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState({ known: 0, later: 0 });

  const restart = (all: boolean) => {
    setDeck(build(all));
    setIndex(0);
    setFlipped(false);
    setCounts({ known: 0, later: 0 });
  };

  const entry: VocabularyEntry | undefined = deck[index] === undefined ? undefined : entries.get(deck[index]);
  const shown = entry ? sides(entry, direction) : null;

  // Слово звучит само, как только показалось: сразу или после переворота.
  // Хук стоит до ранних выходов — порядок хуков между рендерами меняться не должен.
  useEffect(() => {
    if (entry && shown && (shown.termInFront ? !flipped : flipped)) onSpeak(entry.term);
    // Озвучка зависит только от карточки и стороны — не от смены колбэка.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.term, flipped, shown?.termInFront]);

  const advance = (remembered: boolean) => {
    if (!entry) return;
    if (remembered) onKnow(entry);
    else onLater(entry);
    setCounts((prev) => ({
      known: prev.known + (remembered ? 1 : 0),
      later: prev.later + (remembered ? 0 : 1),
    }));
    setFlipped(false);
    setIndex(index + 1);
  };

  if (deck.length === 0) {
    return (
      <View style={styles.stack}>
        <Text style={styles.note}>{t.wordsDeckAllKnown}</Text>
        <WideButton onPress={() => restart(true)} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>{t.wordsDeckAll}</Text>
        </WideButton>
      </View>
    );
  }

  if (!entry || !shown) {
    return (
      <View style={styles.stack}>
        <Text style={styles.note}>{t.wordsDeckDone(counts.known, counts.later)}</Text>
        <WideButton onPress={() => restart(false)} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>{t.wordsDeckRestart}</Text>
        </WideButton>
        <WideButton onPress={() => restart(true)} style={styles.secondary}>
          <Text style={styles.secondaryLabel}>{t.wordsDeckAll}</Text>
        </WideButton>
      </View>
    );
  }

  const { front, back, frontNote, backNote } = shown;

  return (
    <View style={styles.stack}>
      <Text style={styles.progress}>{t.wordsDeckProgress(index + 1, deck.length)}</Text>
      <FlipCard
        front={front}
        back={back}
        frontNote={frontNote}
        backNote={backNote}
        flipped={flipped}
        onFlip={() => setFlipped((value) => !value)}
        onSpeak={() => onSpeak(entry.term)}
        speaking={speaking === entry.term}
      />
      <View style={styles.answers}>
        <Pressable onPress={() => advance(false)} style={styles.later}>
          <Text style={styles.laterLabel}>{t.wordsLater}</Text>
        </Pressable>
        <Pressable onPress={() => advance(true)} style={styles.know}>
          <Text style={styles.knowLabel}>{t.wordsKnow}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Общие стили ответов под карточкой — ими же пользуется повторение. */
export const createCardStyles = (theme: Theme) => ({
  stack: { gap: 12 },
  progress: { color: theme.textMuted, fontSize: 12, fontWeight: '600' as const, textAlign: 'center' as const },
  note: { color: theme.textMuted, fontSize: 14, lineHeight: 20 },
  answers: { flexDirection: 'row' as const, gap: 10 },
  later: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.surfaceAlt,
  },
  laterLabel: { color: theme.neon, fontSize: 15, fontWeight: '600' as const },
  know: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.correctionText,
  },
  knowLabel: { color: theme.surface, fontSize: 15, fontWeight: '700' as const },
  secondary: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.surfaceAlt,
  },
  secondaryLabel: { color: theme.neon, fontSize: 14, fontWeight: '600' as const },
});

const createStyles = (theme: Theme) => StyleSheet.create(createCardStyles(theme));
