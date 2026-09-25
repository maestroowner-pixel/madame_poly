import { File } from 'expo-file-system';

import { LANGUAGES } from '../languages';
import type { LanguageCode } from '../types';
import { assertBudget, charge, whisperCost } from './meter';
import { proxy } from './proxy';

/**
 * Распознаёт записанный файл через Whisper — на сервере. Файл уходит телом
 * запроса как есть, форму для OpenAI собирает прокси: так не нужен FormData,
 * с которым у fetch Expo свои счёты. Язык — подсказка Whisper: заметно
 * повышает точность и не даёт ему «переключиться».
 */
export async function transcribe(fileUri: string, language: LanguageCode): Promise<string> {
  await assertBudget();

  const file = new File(fileUri);
  const response = await proxy(`/transcribe?language=${LANGUAGES[language].whisper}`, {
    body: await file.bytes(),
    contentType: 'audio/m4a',
  });

  await charge(whisperCost(file.size ?? 0));

  const { text } = (await response.json()) as { text: string };
  return text.trim();
}
