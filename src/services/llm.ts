import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';

import {
  API_URL,
  CLAUDE_MAX_TOKENS,
  CLAUDE_MODEL,
  HISTORY_STEP,
  HISTORY_WINDOW,
} from '../config';
import {
  buildExamPrompt,
  buildExamReviewPrompt,
  buildExplanationPrompt,
  buildHomeworkPrompt,
  buildListeningCheckPrompt,
  buildListeningPrompt,
  buildTranscriptionPrompt,
  buildVocabularyPrompt,
  buildSystemPrompt,
  buildWritingPrompt,
  buildWritingReviewPrompt,
  examOpeningNote,
  examTurnNote,
  formatCorrections,
  formatExamTranscript,
} from '../prompts';
import { BudgetError, assertBudget, charge, claudeCost } from './meter';
import { proxiedFetch } from './proxy';
import type { Topic } from '../topics';
import {
  ERROR_CATEGORIES,
  type Correction,
  type DialogueTurn,
  type EnglishVariant,
  type ErrorCategory,
  type ErrorReport,
  type ExamTopic,
  type Homework,
  type LanguageCode,
  type Level,
  type Listening,
  type ListeningVerdict,
  type Message,
  type Vocabulary,
  type WritingReview,
  type WritingTask,
} from '../types';
import { t } from '../i18n';

const CorrectionSchema = z.object({
  original: z.string(),
  corrected: z.string(),
  explanation: z.string(),
  rule: z.string(),
  details: z.string(),
});

/** В беседе разбор правила не просим: за ним ходим отдельно и по нажатию. */
const TurnCorrectionSchema = CorrectionSchema.omit({ details: true });

const TurnSchema = z.object({
  /** Реплика партнёра на изучаемом языке — она же уходит в TTS. */
  reply: z.string(),
  /** Ошибки в последней реплике пользователя. */
  corrections: z.array(TurnCorrectionSchema),
  /** Человек попрощался: после этой реплики беседу пора закрывать. */
  farewell: z.boolean(),
});

const ExerciseSchema = z.object({
  rule: z.string(),
  kind: z.enum(['fill', 'fix', 'translate']),
  task: z.string(),
  answer: z.string(),
  hint: z.string(),
  /** Номер ошибки из переданного списка, начиная с единицы. */
  source: z.number(),
});

const HomeworkSchema = z.object({
  summary: z.string(),
  exercises: z.array(ExerciseSchema),
});

const ListeningQuestionSchema = z.object({
  prompt: z.string(),
  kind: z.enum(['choice', 'written', 'spoken']),
  /** Варианты только у 'choice'; у остальных модель возвращает пустой список. */
  options: z.array(z.string()),
  answer: z.string(),
  hint: z.string(),
});

const ListeningSchema = z.object({
  title: z.string(),
  text: z.string(),
  questions: z.array(ListeningQuestionSchema),
});

const VerdictSchema = z.object({
  correct: z.boolean(),
  comment: z.string(),
});

const WritingTaskSchema = z.object({
  prompt: z.string(),
  hint: z.string(),
  words: z.number(),
});

const WritingReviewSchema = z.object({
  summary: z.string(),
  corrections: z.array(CorrectionSchema),
  improved: z.string(),
});

const CheckSchema = z.object({
  verdicts: z.array(VerdictSchema),
});

const ExaminerSchema = z.object({
  /** Реплика экзаменатора — она же уходит в TTS. */
  reply: z.string(),
});

const ExamReviewSchema = z.object({
  errors: z.array(
    z.object({
      original: z.string(),
      corrected: z.string(),
      explanation: z.string(),
      category: z.enum(ERROR_CATEGORIES as [ErrorCategory, ...ErrorCategory[]]),
    }),
  ),
  recommendations: z.array(z.string()),
});

const VocabularySchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      gloss: z.string(),
      kind: z.enum(['words', 'phrases']),
      entries: z.array(z.object({ term: z.string(), translation: z.string(), transcription: z.string() })),
    }),
  ),
  dialogue: z.array(z.string()),
  examples: z.array(z.string()),
});

/**
 * Claude — через прокси: ключ живёт на сервере, SDK о нём не знает. apiKey
 * здесь заглушка, без неё SDK не создаётся; proxiedFetch подменяет его
 * Firebase-токеном. Флаг браузера — чтобы запускался и `expo start --web`.
 */
const client = new Anthropic({
  apiKey: 'proxy',
  baseURL: `${API_URL}/claude`,
  fetch: proxiedFetch,
  dangerouslyAllowBrowser: true,
});

/** Каждый запрос идёт через счётчик: проверка объёма до, запись расхода после. */
async function metered<T extends { usage: Anthropic.Usage }>(request: () => Promise<T>): Promise<T> {
  await assertBudget();
  let response: T;
  try {
    response = await request();
  } catch (e) {
    // Сервер ведёт свой счёт и отказывает кодом 402, когда объём исчерпан.
    if (e instanceof Anthropic.APIError && e.status === 402) throw new BudgetError();
    throw e;
  }
  await charge(claudeCost(response.usage));
  return response;
}

/** Сравниваем без регистра, знаков и диакритики: модель цитирует не буква в букву. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/**
 * Хвост беседы для контекста. Отрезаем голову ступенями: кэш опирается на то,
 * что начало запроса не меняется, а срез по одному сообщению за ход менял бы
 * его каждый раз. Так окно стоит на месте по десять ходов кряду.
 */
function windowed(history: Message[]): Message[] {
  if (history.length <= HISTORY_WINDOW) return history;
  const steps = Math.floor((history.length - HISTORY_WINDOW) / HISTORY_STEP) + 1;
  return history.slice(steps * HISTORY_STEP);
}

export interface TurnResult {
  reply: string;
  corrections: Correction[];
  /** Признак того, что человек закончил разговор. */
  farewell: boolean;
}

/**
 * Отправляет реплику пользователя партнёру и получает ответ вместе с разбором
 * ошибок. Язык и уровень прокидываются в system prompt.
 */
export async function respond(params: {
  history: Message[];
  userText: string;
  language: LanguageCode;
  level: Level;
  topic?: Topic | null;
  name?: string;
  variant?: EnglishVariant;
}): Promise<TurnResult> {
  const { history, userText, language, level, topic, name, variant } = params;


  const context: Anthropic.MessageParam[] = windowed(history).map((message) => ({
    role: message.role,
    content: message.text,
  }));

  /**
   * Точка кэширования на последней реплике истории. Всё, что до неё, от хода к
   * ходу не меняется, и повторное чтение стоит десятую часть обычного ввода —
   * а пересылать беседу целиком приходится каждый раз. Кэш живёт пять минут:
   * внутри живого разговора реплики идут чаще, так что он не остывает.
   */
  const cached: Anthropic.MessageParam[] =
    context.length === 0
      ? context
      : [
          ...context.slice(0, -1),
          {
            role: context[context.length - 1].role,
            content: [
              {
                type: 'text',
                text: context[context.length - 1].content as string,
                cache_control: { type: 'ephemeral' },
              },
            ],
          },
        ];

  const ask = async () => {
    const response = await metered(() =>
      client.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: CLAUDE_MAX_TOKENS,
        // Системный промпт неизменен всю беседу — кэшируем и его.
        system: [
          {
            type: 'text',
            text: buildSystemPrompt(language, level, topic, name, variant),
            cache_control: { type: 'ephemeral' },
          },
        ],
        // Разговорная латентность важнее глубины рассуждения: реплики короткие,
        // а пауза между «сказал» и «услышал ответ» ощущается сразу.
        thinking: { type: 'disabled' },
        messages: [...cached, { role: 'user', content: userText }],
        output_config: { format: zodOutputFormat(TurnSchema) },
      }),
    );
    return response.parsed_output;
  };

  /**
   * Пустой ответ доходил до экрана пустым пузырём, а до озвучки — пустой
   * строкой, на которую OpenAI отвечает ошибкой. Осечка редкая и случайная,
   * поэтому просим ещё раз, а не рвём беседу на первой же.
   */
  let parsed = await ask();
  if (!parsed?.reply.trim()) parsed = await ask();

  const reply = parsed?.reply.trim() ?? '';
  if (!parsed || !reply) throw new Error(t.badTurn);

  /**
   * Отсекаем разборы, которых в последней реплике нет. Модель видит всю беседу
   * и охотно возвращается к старым ошибкам — человек тогда читает под своей
   * фразой чужой разбор, а настоящие промахи теряются. Просьбы в промпте одной
   * не хватает, поэтому проверяем цитату.
   */
  const said = normalise(userText);
  const corrections = parsed.corrections.filter((correction) =>
    said.includes(normalise(correction.original)),
  );

  return {
    reply,
    corrections,
    farewell: parsed.farewell,
  };
}

/**
 * Разбор одного правила — по нажатию на «?», а не заранее. Раскрывают его
 * редко, а в общем ответе он стоил бы выходных токенов на каждую ошибку в
 * каждом ходе. Ответ обычным текстом: разбирать тут нечего, схема не нужна.
 */
export async function explainCorrection(params: {
  correction: Correction;
  language: LanguageCode;
  level: Level;
}): Promise<string> {
  const { correction, language, level } = params;


  const response = await metered(() =>
    client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: buildExplanationPrompt(language, level),
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: [
            `The learner said: "${correction.original}"`,
            `The correct form is: "${correction.corrected}"`,
            correction.rule ? `The rule is: ${correction.rule}` : '',
            `They have already read this one-line note: ${correction.explanation}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
    }),
  );

  const details = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  if (!details) throw new Error(t.badTurn);
  return details;
}

/**
 * Домашнее задание по ошибкам беседы. Отдельный вызов, а не хвост разговора:
 * здесь нужен потолок токенов побольше и другая роль — не собеседник, а
 * преподаватель, который составляет упражнения.
 */
export async function generateHomework(params: {
  corrections: Correction[];
  language: LanguageCode;
  level: Level;
}): Promise<Homework> {
  const { corrections, language, level } = params;

  if (corrections.length === 0) throw new Error(t.nothingToDrill);

  const response = await metered(() =>
    client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: buildHomeworkPrompt(language, level),
      thinking: { type: 'disabled' },
      messages: [
        {
          role: 'user',
          content: `Mistakes from the conversation:\n${formatCorrections(corrections)}`,
        },
      ],
      output_config: { format: zodOutputFormat(HomeworkSchema) },
    }),
  );

  const parsed = response.parsed_output;
  if (!parsed) throw new Error(t.badHomework);

  // Номер превращаем в текст ошибки здесь же: дальше задание живёт отдельно от беседы.
  const exercises = parsed.exercises.map(({ source, ...exercise }) => {
    const origin = corrections[source - 1];
    return origin
      ? { ...exercise, sourceOriginal: origin.original, sourceCorrected: origin.corrected }
      : exercise;
  });

  return { summary: parsed.summary, exercises, createdAt: Date.now() };
}

/**
 * Первая реплика при выбранной теме. Готовых фраз в `topics.ts` нет намеренно:
 * одна и та же заготовка звучала бы одинаково и на A1, и на C1.
 *
 * Просьбу открыть разговор передаём отдельной репликой пользователя в скобках —
 * Sonnet 5 не принимает системные сообщения внутри `messages`, а в историю это
 * сообщение не попадает: наружу уходит только ответ.
 */
export async function openConversation(params: {
  language: LanguageCode;
  level: Level;
  topic: Topic;
  name?: string;
  variant?: EnglishVariant;
}): Promise<string> {
  const { language, level, topic, name, variant } = params;

  const instruction =
    topic.kind === 'roleplay'
      ? '(Not spoken by the learner. The role play starts now — they have just walked in or called. ' +
        'Open in role with a short greeting and your first question.)'
      : '(Not spoken by the learner. They have just opened the app and chosen the subject ' +
        `"${topic.label}". Greet them in one short sentence and ask your first question about it.)`;

  const turn = await respond({
    history: [],
    userText: instruction,
    language,
    level,
    topic,
    name,
    variant,
  });

  return turn.reply;
}


/** Диктант под уровень: текст для озвучки и вопросы к нему. */
export async function generateListening(params: {
  language: LanguageCode;
  level: Level;
  topic?: Topic;
}): Promise<Listening> {
  const { language, level, topic } = params;


  const response = await metered(() =>
    client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: buildListeningPrompt(language, level, topic),
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: 'Write the passage and the questions.' }],
      output_config: { format: zodOutputFormat(ListeningSchema) },
    }),
  );

  const parsed = response.parsed_output;
  if (!parsed || parsed.questions.length === 0) throw new Error(t.badListening);

  return { ...parsed, language, level, topicId: topic?.id ?? null, createdAt: Date.now() };
}

/**
 * Проверка свободных ответов. Уходит одним запросом на все вопросы сразу:
 * отдельный вызов на каждый стоил бы дороже и отвечал бы вразнобой.
 */
export async function checkListeningAnswers(params: {
  listening: Listening;
  /** Вопрос и то, что ответил человек, — в порядке вопросов. */
  answers: { question: string; expected: string; given: string }[];
}): Promise<ListeningVerdict[]> {
  const { listening, answers } = params;

  if (answers.length === 0) return [];

  const items = answers
    .map(
      (item, index) =>
        `${index + 1}. Question: ${item.question}\n` +
        `   Model answer: ${item.expected}\n` +
        `   Learner answer: ${item.given}`,
    )
    .join('\n');

  const response = await metered(() =>
    client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: buildListeningCheckPrompt(listening.language, listening.level),
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: `Passage:\n${listening.text}\n\nItems:\n${items}` }],
      output_config: { format: zodOutputFormat(CheckSchema) },
    }),
  );

  const verdicts = response.parsed_output?.verdicts;
  if (!verdicts || verdicts.length !== answers.length) throw new Error(t.badListeningCheck);

  return verdicts;
}

/** Повод написать: письмо, отзыв, жалоба — под уровень и тему. */
export async function generateWritingTask(params: {
  language: LanguageCode;
  level: Level;
  topic?: Topic;
}): Promise<WritingTask> {
  const { language, level, topic } = params;


  const response = await metered(() =>
    client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: buildWritingPrompt(language, level, topic),
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: 'Set the task.' }],
      output_config: { format: zodOutputFormat(WritingTaskSchema) },
    }),
  );

  const parsed = response.parsed_output;
  if (!parsed?.prompt.trim()) throw new Error(t.badWritingTask);

  return { ...parsed, language, level, topicId: topic?.id ?? null, createdAt: Date.now() };
}

/** Разбор написанного: оценка, ошибки с цитатами и выправленный текст. */
export async function reviewWriting(params: {
  text: string;
  task: WritingTask;
}): Promise<WritingReview> {
  const { text, task } = params;

  if (!text.trim()) throw new Error(t.writingEmpty);

  const response = await metered(() =>
    client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: buildWritingReviewPrompt(task.language, task.level),
      thinking: { type: 'disabled' },
      messages: [
        { role: 'user', content: `Task:\n${task.prompt}\n\nWhat they wrote:\n${text}` },
      ],
      output_config: { format: zodOutputFormat(WritingReviewSchema) },
    }),
  );

  const parsed = response.parsed_output;
  if (!parsed) throw new Error(t.badWritingReview);

  // Как и в беседе, разборы без цитаты из текста до экрана не доходят.
  const said = normalise(text);
  return {
    summary: parsed.summary.trim(),
    corrections: parsed.corrections.filter((correction) =>
      said.includes(normalise(correction.original)),
    ),
    improved: parsed.improved.trim(),
    createdAt: Date.now(),
  };
}

/**
 * Реплика экзаменатора. Схема та же, что у беседы, только без разбора: на
 * экзамене ошибки не показывают по ходу, их собирает разбор в конце — так и
 * дешевле, и не сбивает человека посреди монолога.
 *
 * Пометка «что делать дальше» идёт вторым блоком последней реплики и в историю
 * не попадает: история пересылается без неё, и начало запроса остаётся тем же,
 * что было закэшировано на прошлом ходе.
 */
export async function examinerTurn(params: {
  /** Реплики до ответа — без него. Пустая история значит начало экзамена. */
  history: DialogueTurn[];
  /** Ответ человека; null — экзамен только начинается. */
  answer: string | null;
  /** Сколько ответов было до этого — по нему пометка выбирает следующий шаг. */
  answerIndex: number;
  language: LanguageCode;
  level: Level;
  topic: ExamTopic;
  name?: string;
}): Promise<string> {
  const { history, answer, answerIndex, language, level, topic, name } = params;


  const context: Anthropic.MessageParam[] = windowed(history).map((turn, index, all) => ({
    role: turn.role,
    content:
      index === all.length - 1
        ? [{ type: 'text', text: turn.text, cache_control: { type: 'ephemeral' } }]
        : turn.text,
  }));

  const note = answer === null ? examOpeningNote() : examTurnNote(level, answerIndex);
  const last: Anthropic.MessageParam = {
    role: 'user',
    content: [
      ...(answer === null ? [] : [{ type: 'text' as const, text: answer }]),
      { type: 'text', text: note },
    ],
  };

  const ask = async () => {
    const response = await metered(() =>
      client.messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: CLAUDE_MAX_TOKENS,
        system: [
          {
            type: 'text',
            text: buildExamPrompt(language, level, topic, name),
            cache_control: { type: 'ephemeral' },
          },
        ],
        thinking: { type: 'disabled' },
        messages: [...context, last],
        output_config: { format: zodOutputFormat(ExaminerSchema) },
      }),
    );
    return response.parsed_output?.reply.trim() ?? '';
  };

  /**
   * Как и в беседе: пустой ответ — редкая осечка, просим ещё раз. На экзамене
   * осечка приходила и не пустой, а строкой из точек, — её тоже не озвучиваем.
   */
  const spoken = (text: string) =>
    // Реплика с запятой или точкой впереди тоже приходила — знаки перед первым словом срезаем.
    /\p{L}{2}/u.test(text) ? text.replace(/^[^\p{L}\p{N}«"(¿¡]+/u, '') : '';
  const reply = spoken(await ask()) || spoken(await ask());
  if (!reply) throw new Error(t.badTurn);
  return reply;
}

/**
 * Разбор экзамена по всей стенограмме: ошибки по категориям и что подтянуть.
 * Счёт по категориям считаем сами, а не просим у модели, — иначе цифры
 * расходились бы со списком под ними.
 */
export async function reviewExam(params: {
  turns: DialogueTurn[];
  language: LanguageCode;
  level: Level;
}): Promise<ErrorReport> {
  const { turns, language, level } = params;

  const answers = turns.filter((turn) => turn.role === 'user');
  if (answers.length === 0) throw new Error(t.examNothingToReview);

  const response = await metered(() =>
    client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: buildExamReviewPrompt(language, level),
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: `Transcript:\n${formatExamTranscript(turns)}` }],
      output_config: { format: zodOutputFormat(ExamReviewSchema) },
    }),
  );

  const parsed = response.parsed_output;
  if (!parsed) throw new Error(t.examReviewFailed);

  // Цитату сверяем с ответами человека: реплику экзаменатора в ошибки не пускаем.
  const said = answers.map((turn) => normalise(turn.text));
  const errors = parsed.errors.filter((error) => {
    const quote = normalise(error.original);
    return quote !== '' && said.some((text) => text.includes(quote));
  });

  const summary = Object.fromEntries(
    ERROR_CATEGORIES.map((category) => [
      category,
      errors.filter((error) => error.category === category).length,
    ]),
  ) as Record<ErrorCategory, number>;

  return {
    errors,
    summary,
    recommendations: parsed.recommendations.map((line) => line.trim()).filter(Boolean),
    createdAt: Date.now(),
  };
}

/**
 * Тематический список слов. Самый длинный ответ в приложении — сотня записей,
 * диалог и примеры, — поэтому и потолок токенов выше остальных.
 */
export async function generateVocabulary(params: {
  language: LanguageCode;
  level: Level;
  topic?: Topic;
  variant?: EnglishVariant;
}): Promise<Vocabulary> {
  const { language, level, topic, variant } = params;


  const response = await metered(() =>
    client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 16384,
      system: buildVocabularyPrompt(language, level, topic, variant),
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: 'Compile the sheet.' }],
      output_config: { format: zodOutputFormat(VocabularySchema) },
    }),
  );

  const parsed = response.parsed_output;
  if (!parsed || parsed.sections.length === 0) throw new Error(t.badVocabulary);

  // Повторы и пустые строки режем сами: заучивать одно слово дважды незачем.
  const seen = new Set<string>();
  const sections = parsed.sections
    .map((section) => ({
      ...section,
      title: section.title.trim(),
      gloss: section.gloss.trim(),
      entries: section.entries
        .map((entry) => ({
          term: entry.term.trim(),
          translation: entry.translation.trim(),
          transcription: entry.transcription.trim() || undefined,
        }))
        .filter((entry) => {
          const key = entry.term.toLowerCase();
          if (!entry.term || !entry.translation || seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
    }))
    .filter((section) => section.entries.length > 0);

  return {
    title: parsed.title.trim(),
    language,
    level,
    topicId: topic?.id ?? null,
    sections,
    dialogue: parsed.dialogue.map((line) => line.trim()).filter(Boolean),
    examples: parsed.examples.map((line) => line.trim()).filter(Boolean),
    createdAt: Date.now(),
  };
}

const TranscriptionSchema = z.object({
  transcriptions: z.array(z.string()),
});

/**
 * Транскрипция для набора без неё — составленного до того, как карточки стали
 * её показывать. Один запрос на весь лист; ответ подходит, только если строк
 * столько же, сколько слов, — иначе они разъедутся.
 */
export async function transcribeVocabulary(
  vocabulary: Vocabulary,
  variant?: EnglishVariant,
): Promise<Vocabulary> {

  const terms = vocabulary.sections.flatMap((section) => section.entries.map((entry) => entry.term));
  const response = await metered(() =>
    client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: buildTranscriptionPrompt(vocabulary.language, variant),
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: terms.map((term, i) => `${i + 1}. ${term}`).join('\n') }],
      output_config: { format: zodOutputFormat(TranscriptionSchema) },
    }),
  );

  const list = response.parsed_output?.transcriptions;
  if (!list || list.length !== terms.length) throw new Error(t.badVocabulary);

  let position = 0;
  return {
    ...vocabulary,
    sections: vocabulary.sections.map((section) => ({
      ...section,
      entries: section.entries.map((entry) => ({
        ...entry,
        transcription: list[position++]?.trim() || undefined,
      })),
    })),
  };
}
