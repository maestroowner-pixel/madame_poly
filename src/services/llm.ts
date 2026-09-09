import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';

import { ANTHROPIC_API_KEY, CLAUDE_MAX_TOKENS, CLAUDE_MODEL, HISTORY_WINDOW } from '../config';
import {
  buildHomeworkPrompt,
  buildListeningCheckPrompt,
  buildListeningPrompt,
  buildSystemPrompt,
  formatCorrections,
} from '../prompts';
import type { Topic } from '../topics';
import type {
  Correction,
  EnglishVariant,
  Homework,
  LanguageCode,
  Level,
  Listening,
  ListeningVerdict,
  Message,
} from '../types';
import { t } from '../i18n';

const CorrectionSchema = z.object({
  original: z.string(),
  corrected: z.string(),
  explanation: z.string(),
  rule: z.string(),
  details: z.string(),
});

const TurnSchema = z.object({
  /** Реплика партнёра на изучаемом языке — она же уходит в TTS. */
  reply: z.string(),
  /** Ошибки в последней реплике пользователя. */
  corrections: z.array(CorrectionSchema),
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

const CheckSchema = z.object({
  verdicts: z.array(VerdictSchema),
});

const client = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  // Ключ и так лежит в бандле (личное приложение), а без флага SDK
  // отказывается работать в вебе — `expo start --web` тоже должен запускаться.
  dangerouslyAllowBrowser: true,
});

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

  if (!ANTHROPIC_API_KEY) throw new Error(t.noAnthropicKey);

  const context: Anthropic.MessageParam[] = history
    .slice(-HISTORY_WINDOW)
    .map((message) => ({ role: message.role, content: message.text }));

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    system: buildSystemPrompt(language, level, topic, name, variant),
    // Разговорная латентность важнее глубины рассуждения: реплики короткие,
    // а пауза между «сказал» и «услышал ответ» ощущается сразу.
    thinking: { type: 'disabled' },
    messages: [...context, { role: 'user', content: userText }],
    output_config: { format: zodOutputFormat(TurnSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error(t.badTurn);

  return {
    reply: parsed.reply.trim(),
    corrections: parsed.corrections,
    farewell: parsed.farewell,
  };
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

  if (!ANTHROPIC_API_KEY) throw new Error(t.noAnthropicKey);
  if (corrections.length === 0) throw new Error(t.nothingToDrill);

  const response = await client.messages.parse({
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
  });

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

  if (!ANTHROPIC_API_KEY) throw new Error(t.noAnthropicKey);

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: buildListeningPrompt(language, level, topic),
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: 'Write the passage and the questions.' }],
    output_config: { format: zodOutputFormat(ListeningSchema) },
  });

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

  if (!ANTHROPIC_API_KEY) throw new Error(t.noAnthropicKey);
  if (answers.length === 0) return [];

  const items = answers
    .map(
      (item, index) =>
        `${index + 1}. Question: ${item.question}\n` +
        `   Model answer: ${item.expected}\n` +
        `   Learner answer: ${item.given}`,
    )
    .join('\n');

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    system: buildListeningCheckPrompt(listening.language, listening.level),
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: `Passage:\n${listening.text}\n\nItems:\n${items}` }],
    output_config: { format: zodOutputFormat(CheckSchema) },
  });

  const verdicts = response.parsed_output?.verdicts;
  if (!verdicts || verdicts.length !== answers.length) throw new Error(t.badListeningCheck);

  return verdicts;
}
