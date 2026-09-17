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

// --- Экзамен ---

/** Три части устного экзамена: знакомство, монолог, обсуждение. */
export type ExamPart = 'interview' | 'longTurn' | 'discussion';

/** Тема экзамена: одна на все языки, названия — в `exam.ts`. */
export interface ExamTopic {
  id: string;
  /** Название на изучаемом языке — его же получает экзаменатор. */
  label: string;
}

/**
 * Реплика экзамена. Та же, что в беседе, плюс часть, к которой она относится:
 * по ней разбор понимает, где человек отвечал коротко, а где держал монолог.
 */
export interface DialogueTurn extends Message {
  part: ExamPart;
}

export type ErrorCategory = 'grammar' | 'vocabulary' | 'collocation' | 'fluency';

export const ERROR_CATEGORIES: ErrorCategory[] = ['grammar', 'vocabulary', 'collocation', 'fluency'];

/** Одна ошибка из разбора экзамена. */
export interface ErrorItem {
  original: string;
  corrected: string;
  /** Пояснение на языке интерфейса. */
  explanation: string;
  category: ErrorCategory;
}

/** Разбор всей сессии: ошибки, их счёт по категориям и что подтянуть. */
export interface ErrorReport {
  errors: ErrorItem[];
  summary: Record<ErrorCategory, number>;
  recommendations: string[];
  createdAt: number;
}

/**
 * Строка истории экзаменов. Реплики и разбор лежат отдельно и грузятся по
 * нажатию: список открывается сразу, сколько бы сессий ни накопилось.
 */
export interface ExamSession {
  id: string;
  language: LanguageCode;
  level: Level;
  topicId: string;
  startedAt: number;
  endedAt: number;
  /** Сколько раз говорил человек. */
  answerCount: number;
  /** Сколько ошибок нашёл разбор; null — разбора ещё нет. */
  errorCount: number | null;
}

/**
 * Сессия целиком: реплики и разбор. Сохраняется с первого ответа и после
 * каждого следующего — ни перезапуск, ни сбой сети не стоят человеку ответов,
 * а разбор можно запросить заново из истории.
 */
export interface SessionReport extends ExamSession {
  turns: DialogueTurn[];
  report: ErrorReport | null;
}

// --- Слова ---

/** Слово или фраза с переводом на язык интерфейса. */
export interface VocabularyEntry {
  /** На изучаемом языке; существительные с артиклем. */
  term: string;
  translation: string;
  /** Произношение знаками МФА, в косых чертах: /kaˈβeθa/. У старых наборов нет. */
  transcription?: string;
}

/** Группа слов или фраз: «части тела», «у врача», «как спросить о самочувствии». */
export interface VocabularySection {
  /** Название на изучаемом языке. */
  title: string;
  /** То же на языке интерфейса. */
  gloss: string;
  /** Слова и устойчивые сочетания — или целые фразы для разговора. */
  kind: 'words' | 'phrases';
  entries: VocabularyEntry[];
}

/** Тематический список лексики: группы слов, диалог и предложения-примеры. */
export interface Vocabulary {
  /** Название темы на изучаемом языке. */
  title: string;
  language: LanguageCode;
  level: Level;
  /** Тема из общего списка; null — общая лексика уровня. */
  topicId: string | null;
  sections: VocabularySection[];
  /** Диалог на тему, реплики по очереди. */
  dialogue: string[];
  /** Полные предложения с этой лексикой. */
  examples: string[];
  createdAt: number;
}

/** В какую сторону показывать карточку: слово → перевод или перевод → слово. */
export type CardDirection = 'forward' | 'reverse';

/**
 * Карточка, отложенная на повторение. Живёт по языку, а не по набору: слово из
 * списка о здоровье повторяется вместе со словом из списка о работе.
 */
export interface ReviewCard {
  term: string;
  translation: string;
  transcription?: string;
  /** Сколько раз подряд слово вспомнилось — от этого зависит, когда показать снова. */
  step: number;
  /** Когда показать в следующий раз, мс. */
  due: number;
  addedAt: number;
}

/** Строка списка сохранённых наборов — сам набор грузится по нажатию. */
export interface VocabularyIndexEntry {
  language: LanguageCode;
  level: Level;
  topicId: string | null;
  title: string;
  /** Сколько слов и фраз внутри. */
  count: number;
  createdAt: number;
}

// --- Напоминания ---

/** Время суток для ежедневного напоминания. */
export interface ClockTime {
  hour: number;
  minute: number;
}

export interface ReminderSettings {
  /** Повторить слова — два раза в день, в фиксированные часы. */
  review: boolean;
  /** Позаниматься — раз в день, во время по выбору; null — выключено. */
  practice: ClockTime | null;
}
