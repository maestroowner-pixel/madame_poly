import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';

import { OPENAI_API_KEY } from '../config';
import { LANGUAGES } from '../languages';
import type { LanguageCode } from '../types';
import { t } from '../i18n';

const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Распознаёт записанный файл через Whisper.
 *
 * Файл кладём объектом `File` из expo-file-system, а не привычным для React
 * Native `{ uri, name, type }`: fetch у Expo принимает в форму только строку,
 * Blob или объект с методом `bytes()`, а на остальном падает с
 * «Unsupported FormDataPart implementation». В Expo Go это не всплывало —
 * там глобальный fetch был реализацией React Native.
 */
export async function transcribe(fileUri: string, language: LanguageCode): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error(t.noOpenAiKey);

  const form = new FormData();
  form.append('file', new File(fileUri) as unknown as Blob);
  form.append('model', 'whisper-1');
  // Подсказка языка заметно повышает точность и не даёт Whisper «переключиться».
  form.append('language', LANGUAGES[language].whisper);


  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Whisper ${response.status}: ${await response.text()}`);
  }

  const { text } = (await response.json()) as { text: string };
  return text.trim();
}
