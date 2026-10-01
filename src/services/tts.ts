import type { MaxVoice } from '../config';
import { t } from '../i18n';
import { loadVoice } from '../storage';
import { assertBudget, charge, ttsCost } from './meter';
import { saveAudio } from './audioFiles';
import { proxy } from './proxy';

/** Собирает тело ответа в байты: arrayBuffer, а если его нет — через поток. */
async function readBytes(response: Response): Promise<Uint8Array> {
  if (typeof response.arrayBuffer === 'function') {
    return new Uint8Array(await response.arrayBuffer());
  }

  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

/**
 * Модель выбирает сервер по тарифу: Max — gpt-4o с выбранным голосом,
 * остальным — tts-1 с nova. Голос приложение шлёт всегда (из настроек, если
 * не задан явно, как при прослушивании), сервер слушает его только у Max.
 */
async function synthesizeOpenAI(text: string, speed: number, voice?: MaxVoice): Promise<Uint8Array> {
  await assertBudget();

  const response = await proxy('/speak', {
    body: JSON.stringify({ text, speed, voice: voice ?? (await loadVoice()) }),
    contentType: 'application/json',
  });

  await charge(ttsCost(text));
  return readBytes(response as unknown as Response);
}

/**
 * Озвучивает текст и возвращает локальный uri mp3-файла. Язык не параметр:
 * голос один на все четыре, модель читает их без подсказки. Темп — параметр:
 * в аудировании на A1 читают медленнее, чем на C2.
 */
export async function synthesize(text: string, speed = 1, voice?: MaxVoice): Promise<string> {
  // Пустую строку сервис отвергает с ошибкой — ловим её здесь, не тратя запрос.
  if (!text.trim()) throw new Error(t.nothingToSpeak);

  const bytes = await synthesizeOpenAI(text, speed, voice);

  return saveAudio(bytes);
}
