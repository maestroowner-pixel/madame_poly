/**
 * Пробные листы слов без UI — тот же промпт и та же схема, что в приложении,
 * через прокси. Нужен, чтобы проверить язык перед тем, как открыть для него
 * раздел «Слова»: артикли, транскрипцию, группы, диалог.
 *
 *   npm run vocab-check -- de B1 health     # язык, уровень, тема (id)
 *   npm run vocab-check -- uk A2            # без темы — общая лексика
 *
 * Лист пишется в scripts/out/vocab-<язык>-<уровень>.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

import { buildVocabularyPrompt } from '../src/prompts';
import { TOPICS } from '../src/topics';
import { LEVELS, type LanguageCode, type Level } from '../src/types';

function loadEnv(): void {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match && match[2]) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, '');
  }
}

/** Та же схема, что VocabularySchema в src/services/llm.ts. */
const VocabularySchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      gloss: z.string(),
      kind: z.enum(['words', 'phrasal', 'phrases']),
      entries: z.array(z.object({ term: z.string(), translation: z.string(), transcription: z.string() })),
    }),
  ),
  dialogue: z.array(z.string()),
  examples: z.array(z.string()),
});

async function anonymousToken(apiKey: string): Promise<string> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`Анонимный вход ${response.status}: ${await response.text()}`);
  return ((await response.json()) as { idToken: string }).idToken;
}

async function main(): Promise<void> {
  loadEnv();
  const language = (process.argv[2] ?? 'de') as LanguageCode;
  const level = (process.argv[3] ?? 'B1') as Level;
  const topicId = process.argv[4];
  if (!LEVELS.includes(level)) throw new Error(`Неизвестный уровень: ${level}`);
  const topic = topicId ? TOPICS[language].find((item) => item.id === topicId) : undefined;
  if (topicId && !topic) throw new Error(`Неизвестная тема: ${topicId}`);

  const project = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const firebaseKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!project || !firebaseKey) throw new Error('Не задан конфиг Firebase в .env');
  const api = process.env.EXPO_PUBLIC_API_URL || `https://europe-west1-${project}.cloudfunctions.net/api`;

  const token = await anonymousToken(firebaseKey);
  const client = new Anthropic({
    apiKey: 'proxy',
    baseURL: `${api}/claude`,
    defaultHeaders: { Authorization: `Bearer ${token}` },
  });

  const started = Date.now();
  const response = await client.messages.parse({
    model: 'claude-sonnet-5',
    max_tokens: 16384,
    system: buildVocabularyPrompt(language, level, topic),
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: 'Compile the sheet.' }],
    output_config: { format: zodOutputFormat(VocabularySchema) },
  });
  const sheet = response.parsed_output;
  if (!sheet) throw new Error('Пустой ответ');

  mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
  const file = new URL(`./out/vocab-${language}-${level}.json`, import.meta.url);
  writeFileSync(file, JSON.stringify(sheet, null, 2));

  const entries = sheet.sections.reduce((sum, section) => sum + section.entries.length, 0);
  console.log(`\n${language} ${level}${topic ? ` · ${topic.id}` : ''}: «${sheet.title}»`);
  console.log(`  групп ${sheet.sections.length}, записей ${entries}, диалог ${sheet.dialogue.length}, примеров ${sheet.examples.length}`);
  console.log(`  ${((Date.now() - started) / 1000).toFixed(0)} с, токены ${response.usage.input_tokens} → ${response.usage.output_tokens}`);
  for (const section of sheet.sections.slice(0, 3)) {
    console.log(`  [${section.kind}] ${section.title}`);
    for (const entry of section.entries.slice(0, 4)) {
      console.log(`     ${entry.term}  ${entry.transcription}  — ${entry.translation}`);
    }
  }
  console.log(`  диалог: ${sheet.dialogue[0]}`);
  console.log(`  → ${file.pathname}\n`);
}

main().catch((error: unknown) => {
  console.error(`\nОшибка: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
