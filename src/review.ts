import type { CardDirection, ReviewCard, Vocabulary, VocabularyEntry } from './types';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/**
 * Через сколько показать слово после каждого удачного повтора. Первые повторы
 * идут часто, потом всё реже — так память закрепляет надёжнее, чем ежедневная
 * зубрёжка. Вспомнилось столько раз подряд, сколько тут интервалов, — слово
 * считается выученным и уходит из очереди: иначе она росла бы без конца.
 */
export const REVIEW_INTERVALS = [10 * MINUTE, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY, 60 * DAY];

/** Сколько карточек берём за один заход: длинную очередь проходят по частям. */
export const REVIEW_BATCH = 25;

/** С такого размера очереди напоминаем, что повторять надо понемногу каждый день. */
export const REVIEW_PILE = 100;

/** Карточки, чей срок подошёл, — самые просроченные первыми. */
export function dueCards(cards: ReviewCard[], now = Date.now()): ReviewCard[] {
  return cards.filter((card) => card.due <= now).sort((a, b) => a.due - b.due);
}

/** Ближайший срок среди тех, что ещё не подошли. */
export function nextDue(cards: ReviewCard[], now = Date.now()): number | null {
  const pending = cards.filter((card) => card.due > now);
  return pending.length ? Math.min(...pending.map((card) => card.due)) : null;
}

/**
 * Новая карточка: срок — сейчас, чтобы её можно было повторить сразу же.
 */
export function newCard(entry: VocabularyEntry, now = Date.now()): ReviewCard {
  return {
    term: entry.term,
    translation: entry.translation,
    transcription: entry.transcription,
    step: 0,
    due: now,
    addedAt: now,
  };
}

/**
 * Ответ на карточке. Вспомнилось — шаг вперёд и срок по таблице; не вспомнилось —
 * возвращаемся к началу лестницы и показываем снова в этом же заходе. null —
 * лестница пройдена, слово выучено.
 */
export function answer(card: ReviewCard, remembered: boolean, now = Date.now()): ReviewCard | null {
  if (!remembered) return { ...card, step: 0, due: now };
  const interval = REVIEW_INTERVALS[card.step];
  if (interval === undefined) return null;
  return { ...card, step: card.step + 1, due: now + interval };
}

export interface CardSides {
  front: string;
  back: string;
  /** Транскрипция — под словом, на той стороне, где оно. */
  frontNote?: string;
  backNote?: string;
  /** Слово видно на лицевой стороне — озвучиваем сразу, иначе после переворота. */
  termInFront: boolean;
}

/** Что показывать на лицевой и обратной стороне при выбранном направлении. */
export function sides(entry: VocabularyEntry, direction: CardDirection): CardSides {
  return direction === 'forward'
    ? { front: entry.term, back: entry.translation, frontNote: entry.transcription, termInFront: true }
    : { front: entry.translation, back: entry.term, backNote: entry.transcription, termInFront: false };
}

// --- Тест ---

/** Меньше вариантов ответа не набрать. */
export const QUIZ_OPTIONS = 4;
export const QUIZ_LENGTH = 10;

export interface QuizQuestion {
  entry: VocabularyEntry;
  prompt: string;
  answer: string;
  /** Правильный ответ и три чужих, перемешаны. */
  options: string[];
}

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Все записи набора вместе с видом группы: слово путать со словом, фразу — с фразой. */
export function flatEntries(vocabulary: Vocabulary): { entry: VocabularyEntry; kind: 'words' | 'phrases' }[] {
  return vocabulary.sections.flatMap((section) =>
    section.entries.map((entry) => ({ entry, kind: section.kind })),
  );
}

/**
 * Тест по набору: случайные записи, к каждой — правильный ответ и отвлекающие
 * из того же набора, по возможности того же вида. Собирается на месте, без
 * модели: варианты и так под рукой.
 */
export function buildQuiz(vocabulary: Vocabulary, direction: CardDirection): QuizQuestion[] {
  const all = flatEntries(vocabulary);
  if (all.length < QUIZ_OPTIONS) return [];
  const answerOf = (entry: VocabularyEntry) => sides(entry, direction).back;

  return shuffle(all)
    .slice(0, QUIZ_LENGTH)
    .map(({ entry, kind }) => {
      const right = answerOf(entry);
      const others = (pool: typeof all) =>
        pool.map((item) => answerOf(item.entry)).filter((text) => text !== right);
      // Своего вида может не хватить — добираем из остальных.
      const same = shuffle([...new Set(others(all.filter((item) => item.kind === kind)))]);
      const rest = shuffle([...new Set(others(all))].filter((text) => !same.includes(text)));
      const distractors = [...same, ...rest].slice(0, QUIZ_OPTIONS - 1);
      return {
        entry,
        prompt: sides(entry, direction).front,
        answer: right,
        options: shuffle([right, ...distractors]),
      };
    });
}
