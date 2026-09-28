/**
 * Прогон прокси без UI: входим анонимно, озвучиваем фразу с ошибками,
 * распознаём её обратно через Whisper и просим Claude найти ошибки — всё через
 * функцию `api`, как это делает приложение. Так проверяются токен, ключи на
 * сервере и учёт расхода, не трогая симулятор.
 *
 *   npm run smoke            # английский, B1
 *   npm run smoke -- de A2   # немецкий, A2
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Anthropic from '@anthropic-ai/sdk';

import { LANGUAGES } from '../src/languages';
import { LEVELS, type LanguageCode, type Level } from '../src/types';

/** .env читаем сами: скрипт запускается вне бандлера Expo. */
function loadEnv(): void {
  let raw: string;
  try {
    raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  } catch {
    throw new Error('Нет файла .env — скопируй .env.example и впиши конфиг Firebase');
  }

  for (const line of raw.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (value && !value.startsWith('sk-...')) process.env[match[1]] ??= value;
  }
}

/** Фразы с намеренными ошибками — Claude должен их найти. */
const SAMPLES: Record<LanguageCode, string> = {
  en: 'Yesterday I go to the shop and I buyed two bread for my breakfast.',
  de: 'Gestern ich habe gegangen zum Supermarkt und ich kaufte zwei Brot.',
  fr: "Hier je suis allé au magasin et j'ai acheté deux pain pour mon petit déjeuner.",
  es: 'Ayer yo fui a la tienda y compré dos pan para mi desayuno.',
  it: 'Ieri io sono andato al negozio e ho comprato due pane per la mia colazione.',
  pt: 'Ontem eu fui na loja e comprei dois pão para o meu pequeno-almoço.',
  br: 'Ontem eu ir na loja e comprei dois pão pra meu café da manhã.',
  uk: 'Вчора я пішов в магазин і купив два хліба на мій сніданок.',
  nl: 'Gisteren ik ga naar de winkel en ik kopen twee brood voor mijn ontbijt.',
  pl: 'Wczoraj ja idę do sklep i kupiłem dwa chleba na mój śniadanie.',
  ro: 'Ieri eu merg la magazin și am cumpărat două pâine pentru micul meu dejun.',
};

/** Анонимный вход через REST: SDK Firebase тянет за собой AsyncStorage. */
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

  const language = (process.argv[2] ?? 'en') as LanguageCode;
  const level = (process.argv[3] ?? 'B1') as Level;
  const sample = SAMPLES[language];
  if (!sample) throw new Error(`Неизвестный язык: ${language}`);
  if (!LEVELS.includes(level)) throw new Error(`Неизвестный уровень: ${level}`);

  const project = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const firebaseKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!project || !firebaseKey) throw new Error('Не задан конфиг Firebase в .env');
  const api = process.env.EXPO_PUBLIC_API_URL || `https://europe-west1-${project}.cloudfunctions.net/api`;

  console.log(`\n[0/3] Анонимный вход → ${api}`);
  const token = await anonymousToken(firebaseKey);
  const auth = { Authorization: `Bearer ${token}` };
  console.log('      ok');

  console.log(`\n[1/3] TTS — озвучиваю тестовую фразу (${language}, ${level})`);
  console.log(`      «${sample}»`);
  const speech = await fetch(`${api}/speak`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sample, speed: 1 }),
  });
  if (!speech.ok) throw new Error(`TTS ${speech.status}: ${await speech.text()}`);

  const audio = Buffer.from(await speech.arrayBuffer());
  const audioPath = join(tmpdir(), `polyglotta-smoke-${language}.mp3`);
  writeFileSync(audioPath, audio);
  console.log(`      ok — ${(audio.length / 1024).toFixed(1)} КБ → ${audioPath}`);

  console.log('\n[2/3] Whisper — распознаю обратно');
  // Код Whisper, а не код языка: у бразильского португальского он «pt», «br» Whisper не знает.
  const stt = await fetch(`${api}/transcribe?language=${LANGUAGES[language].whisper}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'audio/mpeg' },
    body: audio,
  });
  if (!stt.ok) throw new Error(`Whisper ${stt.status}: ${await stt.text()}`);

  const { text } = (await stt.json()) as { text: string };
  console.log(`      ok — «${text.trim()}»`);

  console.log('\n[3/3] Claude — ищет ошибки');
  const client = new Anthropic({ apiKey: 'proxy', baseURL: `${api}/claude`, defaultHeaders: auth });
  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `A ${level} learner said: "${text.trim()}". List the mistakes briefly, one per line.`,
      },
    ],
  });
  for (const block of message.content) if (block.type === 'text') console.log(`\n${block.text}`);
  console.log(`\n  Блоки: ${message.content.map((block) => block.type).join(', ')}; stop: ${message.stop_reason}`);
  console.log(`\n  Токены: ${message.usage.input_tokens} ввод, ${message.usage.output_tokens} вывод`);
  console.log('\nГотово.\n');
}

main().catch((error: unknown) => {
  console.error(`\nОшибка: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
