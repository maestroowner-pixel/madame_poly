/**
 * Как Мадам Поли открывает беседу с разными собеседниками — тот же промпт,
 * что в приложении, через прокси. Для проверки характера и манеры по возрасту.
 *
 *   npm run persona-check -- en B1 travel 8 15 30 52
 */
import { readFileSync } from 'node:fs';

import Anthropic from '@anthropic-ai/sdk';

import { buildSystemPrompt } from '../src/prompts';
import { TOPICS } from '../src/topics';
import type { LanguageCode, Level } from '../src/types';

function loadEnv(): void {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match && match[2]) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, '');
  }
}

async function main(): Promise<void> {
  loadEnv();
  const [language = 'en', level = 'B1', topicId = 'travel', ...ages] = process.argv.slice(2) as [
    LanguageCode,
    Level,
    string,
    ...string[],
  ];
  const topic = TOPICS[language].find((item) => item.id === topicId);
  if (!topic) throw new Error(`Неизвестная тема: ${topicId}`);

  const project = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const api = process.env.EXPO_PUBLIC_API_URL || `https://europe-west1-${project}.cloudfunctions.net/api`;
  const auth = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const { idToken } = (await auth.json()) as { idToken: string };
  const client = new Anthropic({
    apiKey: 'proxy',
    baseURL: `${api}/claude`,
    defaultHeaders: { Authorization: `Bearer ${idToken}` },
  });

  for (const raw of ages.length ? ages : ['']) {
    const age = raw ? Number(raw) : null;
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: buildSystemPrompt(language, level, topic, 'Alex', undefined, age),
      messages: [
        {
          role: 'user',
          content:
            `(Not spoken by the learner. They have just opened the app and chosen the subject "${topic.label}". ` +
            'Greet them warmly, ask in a few words how they are and whether they are in the mood to practise today, ' +
            'then lead into the subject with your first question — two or three short sentences in all. ' +
            'Reply with the spoken text only.)',
        },
      ],
    });
    const text = message.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
    console.log(`\nвозраст ${age ?? 'не указан'}:\n  ${text.trim()}`);
  }
}

main().catch((error: unknown) => {
  console.error(`\nОшибка: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
