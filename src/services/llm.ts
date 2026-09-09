import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import * as z from 'zod/v4';

import { ANTHROPIC_API_KEY, CLAUDE_MAX_TOKENS, CLAUDE_MODEL, HISTORY_WINDOW } from '../config';
import { buildHomeworkPrompt, buildSystemPrompt, formatCorrections } from '../prompts';
import type { Topic } from '../topics';
import type { Correction, Homework, LanguageCode, Level, Message } from '../types';
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
}): Promise<TurnResult> {
  const { history, userText, language, level, topic, name } = params;

  if (!ANTHROPIC_API_KEY) throw new Error(t.noAnthropicKey);

  const context: Anthropic.MessageParam[] = history
    .slice(-HISTORY_WINDOW)
    .map((message) => ({ role: message.role, content: message.text }));

  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    system: buildSystemPrompt(language, level, topic, name),
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
}): Promise<string> {
  const { language, level, topic, name } = params;

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
  });

  return turn.reply;
}
