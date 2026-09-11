export type LanguageCode = 'en' | 'de' | 'fr' | 'es';

/**
 * Вариант английского. Меняет словарь, написание и обороты собеседницы, но не
 * произношение: голоса OpenAI фиксированные, акцент у них не выбирается.
 */
export type EnglishVariant = 'british' | 'american' | 'cockney';

/**
 * Кто решает, что фраза закончилась: приложение по паузе в речи или вы
 * отдельным нажатием. Второе нужно тем, кто говорит медленно и с паузами.
 */
export type TurnMode = 'manual' | 'auto';

/** CEFR-уровень, хранится отдельно по каждому языку. */
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Одна исправленная ошибка в реплике пользователя. */
export interface Correction {
  /** Как сказал пользователь. */
  original: string;
  /** Как правильно. */
  corrected: string;
  /** Короткое пояснение на EXPLANATION_LANGUAGE — видно сразу. */
  explanation: string;
  /** Название правила, например «Past Simple: неправильные глаголы». */
  rule?: string;
  /** Разбор правила — прячется под «?», читается по желанию. */
  details?: string;
}

/** Тип упражнения — от него зависит, как показывать задание. */
export type ExerciseKind = 'fill' | 'fix' | 'translate';

export interface Exercise {
  /** Правило, которое тренируем: связывает упражнение с ошибкой из беседы. */
  rule: string;
  kind: ExerciseKind;
  /** Само задание. */
  task: string;
  /** Правильный ответ — скрыт, пока не откроют. */
  answer: string;
  /** Подсказка на языке интерфейса. */
  hint: string;
  /**
   * Из какой ошибки беседы выросло упражнение. Разрешаем номер в текст сразу
   * при генерации: задание уезжает в архив и должно читаться само по себе,
   * без обращения к той беседе.
   */
  sourceOriginal?: string;
  sourceCorrected?: string;
}

/** Домашнее задание по итогам одной беседы. */
export interface Homework {
  /** Над чем работать — две-три фразы. */
  summary: string;
  exercises: Exercise[];
  createdAt: number;
}

/** Как отвечают на вопрос по прослушанному тексту. */
export type ListeningAnswerKind = 'choice' | 'written' | 'spoken';

export interface ListeningQuestion {
  prompt: string;
  kind: ListeningAnswerKind;
  /** Варианты ответа; заполнены только у 'choice', у остальных пусто. */
  options: string[];
  answer: string;
  /** Подсказка на языке интерфейса — на случай, если вопрос непонятен. */
  hint: string;
}

/** Диктант: текст под запись и вопросы к нему. */
export interface Listening {
  title: string;
  /**
   * Текст диктора. До проверки его не показываем — иначе вопросы решаются
   * чтением, а не на слух.
   */
  text: string;
  language: LanguageCode;
  level: Level;
  /** Тема, по которой его составили; null — свободная. */
  topicId: string | null;
  questions: ListeningQuestion[];
  createdAt: number;
}

/**
 * Счёт по аудированию. Брошенный на середине диктант идёт в общий знаменатель
 * нулём: иначе средний балл легко держать высоким, выходя из каждого трудного.
 */
export interface ListeningStats {
  attempts: number;
  abandoned: number;
  right: number;
  total: number;
}

/** Задание на письмо: о чём писать и сколько. */
export interface WritingTask {
  /** Само задание на изучаемом языке — его и читает человек. */
  prompt: string;
  /** Подсказка на языке интерфейса: что показать в тексте. */
  hint: string;
  /** Сколько слов ждём — ориентир, а не правило. */
  words: number;
  language: LanguageCode;
  level: Level;
  topicId: string | null;
  createdAt: number;
}

/** Разбор написанного. */
export interface WritingReview {
  /** Две-три фразы на языке интерфейса: что удалось, над чем работать. */
  summary: string;
  corrections: Correction[];
  /** Тот же текст, выправленный, — чтобы увидеть, как он должен звучать. */
  improved: string;
  createdAt: number;
}

/** Итог проверки одного ответа. */
export interface ListeningVerdict {
  correct: boolean;
  /** Короткий разбор на языке интерфейса. */
  comment: string;
}

/** Кто занимается: имя уходит в промпт, аватарка — в ленту. */
export interface Profile {
  name: string;
  /** Идентификатор из AVATARS; null — готовая аватарка не выбрана. */
  avatarId: string | null;
  /** Своё фото; имеет приоритет над готовой аватаркой. */
  photoUri: string | null;
}

/** Завершённая беседа: метаданные лежат в списке, реплики — отдельным ключом. */
export interface ArchivedSession {
  id: string;
  language: LanguageCode;
  level: Level;
  /** Тема, с которой шла беседа; null — свободная. */
  topicId: string | null;
  startedAt: number;
  endedAt: number;
  messageCount: number;
  correctionCount: number;
  /** Первая реплика пользователя — по ней беседа узнаётся в списке. */
  preview: string;
  /** Было ли составлено задание — чтобы не грузить его ради значка в списке. */
  hasHomework: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  /** Текст реплики на изучаемом языке. */
  text: string;
  createdAt: number;
  /** Ошибки в реплике пользователя — приходят вместе с ответом ИИ. */
  corrections?: Correction[];
  /** Локальный путь к mp3 с озвучкой ответа ИИ, если она уже сгенерирована. */
  audioUri?: string;
}
