import { Directory, File, Paths } from 'expo-file-system';

import { t } from '../i18n';
import { assertBudget, charge, ttsCost } from './meter';
import { proxy } from './proxy';

/** Озвучка складывается в кэш — её всегда можно перегенерировать. */
const AUDIO_DIR = new Directory(Paths.cache, 'tts');

function audioFile(): File {
  if (!AUDIO_DIR.exists) AUDIO_DIR.create({ intermediates: true });
  return new File(AUDIO_DIR, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`);
}

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

/** Голос и модель выбирает сервер: приложение передаёт только текст и темп. */
async function synthesizeOpenAI(text: string, speed: number): Promise<Uint8Array> {
  await assertBudget();

  const response = await proxy('/speak', {
    body: JSON.stringify({ text, speed }),
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
export async function synthesize(text: string, speed = 1): Promise<string> {
  // Пустую строку сервис отвергает с ошибкой — ловим её здесь, не тратя запрос.
  if (!text.trim()) throw new Error(t.nothingToSpeak);

  const bytes = await synthesizeOpenAI(text, speed);

  const file = audioFile();
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}
