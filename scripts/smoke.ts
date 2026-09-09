/**
 * Прогон сервисного слоя без UI: озвучиваем фразу с ошибками, распознаём её
 * обратно через Whisper и отдаём Claude — так проверяются ключи, system prompt
 * и структурированный разбор ошибок, не трогая симулятор.
 *
 *   npm run smoke            # английский, B1
 *   npm run smoke -- de A2   # немецкий, A2
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LEVELS, type LanguageCode, type Level } from '../src/types';

/** .env читаем сами: скрипт запускается вне бандлера Expo. */
function loadEnv(): void {
  let raw: string;
  try {
    raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  } catch {
    throw new Error('Нет файла .env — скопируй .env.example и впиши ключи');
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
};

async function main(): Promise<void> {
  loadEnv();

  const language = (process.argv[2] ?? 'en') as LanguageCode;
  const level = (process.argv[3] ?? 'B1') as Level;
  const sample = SAMPLES[language];
  if (!sample) throw new Error(`Неизвестный язык: ${language}`);
  if (!LEVELS.includes(level)) throw new Error(`Неизвестный уровень: ${level}`);

  // Импорт после loadEnv: config.ts читает process.env на этапе импорта.
  const { LANGUAGES } = await import('../src/languages');
  const { generateHomework, respond } = await import('../src/services/llm');
  const { OPENAI_API_KEY, OPENAI_TTS_VOICE } = await import('../src/config');

  if (!OPENAI_API_KEY) throw new Error('Не задан EXPO_PUBLIC_OPENAI_API_KEY');

  console.log(`\n[1/4] TTS — озвучиваю тестовую фразу (${language}, ${level})`);
  console.log(`      «${sample}»`);
  const speech = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: OPENAI_TTS_VOICE,
      input: sample,
      response_format: 'mp3',
    }),
  });
  if (!speech.ok) throw new Error(`OpenAI TTS ${speech.status}: ${await speech.text()}`);

  const audio = Buffer.from(await speech.arrayBuffer());
  const audioPath = join(tmpdir(), `polyglotta-smoke-${language}.mp3`);
  writeFileSync(audioPath, audio);
  console.log(`      ok — ${(audio.length / 1024).toFixed(1)} КБ → ${audioPath}`);

  console.log('\n[2/4] Whisper — распознаю обратно');
  const form = new FormData();
  form.append('file', new File([audio], 'speech.mp3', { type: 'audio/mpeg' }));
  form.append('model', 'whisper-1');
  form.append('language', LANGUAGES[language].whisper);

  const stt = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  if (!stt.ok) throw new Error(`Whisper ${stt.status}: ${await stt.text()}`);

  const { text } = (await stt.json()) as { text: string };
  console.log(`      ok — «${text.trim()}»`);

  console.log('\n[3/4] Claude — ответ и разбор ошибок');
  const turn = await respond({
    history: [],
    userText: text.trim(),
    language,
    level,
  });

  console.log(`\n  Ответ партнёра:\n    ${turn.reply}`);
  console.log(`  Человек прощается: ${turn.farewell ? 'да — беседа закроется' : 'нет'}`);
  console.log(`\n  Ошибки (${turn.corrections.length}):`);
  for (const correction of turn.corrections) {
    console.log(`    ✗ ${correction.original}`);
    console.log(`    ✓ ${correction.corrected}`);
    console.log(`      ${correction.explanation}`);
    if (correction.rule) console.log(`      правило: ${correction.rule}`);
    if (correction.details) console.log(`      разбор: ${correction.details}`);
    console.log('');
  }

  if (turn.corrections.length === 0) {
    console.log('    — пусто. Для фразы с намеренными ошибками это подозрительно.');
    console.log('Готово.\n');
    return;
  }

  console.log('[4/4] Claude — домашнее задание по этим ошибкам');
  const homework = await generateHomework({
    corrections: turn.corrections,
    language,
    level,
  });

  console.log(`\n  ${homework.summary}`);
  console.log(`\n  Упражнений: ${homework.exercises.length}`);
  for (const [index, exercise] of homework.exercises.entries()) {
    console.log(`\n    ${index + 1}. [${exercise.kind}] ${exercise.rule}`);
    console.log(`       ${exercise.task}`);
    console.log(`       ответ: ${exercise.answer}`);
    console.log(`       подсказка: ${exercise.hint}`);
    if (exercise.sourceOriginal) {
      console.log(`       из беседы: ${exercise.sourceOriginal} → ${exercise.sourceCorrected}`);
    }
  }
  console.log('\nГотово.\n');
}

main().catch((error: unknown) => {
  console.error(`\nОшибка: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
