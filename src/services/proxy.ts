import { fetch } from 'expo/fetch';

import { API_URL } from '../config';
import { idToken } from './firebase';
import { BudgetError } from './meter';

/**
 * Запрос к прокси (`functions/src/index.ts`) с Firebase-токеном. Сервер
 * отвечает 402, когда месячный объём исчерпан, — это BudgetError, как и у
 * счётчика на телефоне. Прочие ошибки — текстом, как их вернул сервер.
 */
export async function proxy(path: string, init: { body: string | Uint8Array<ArrayBuffer>; contentType: string }) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await idToken()}`, 'Content-Type': init.contentType },
    body: init.body,
  });
  if (response.status === 402) throw new BudgetError();
  if (!response.ok) throw new Error(`${path} ${response.status}: ${await response.text()}`);
  return response;
}

/**
 * fetch для Anthropic SDK: тот же токен, подставленный в каждый запрос. SDK
 * создаётся один раз, а токен живёт час, — поэтому не заголовок по умолчанию,
 * а обёртка, которая спрашивает свежий.
 */
export const proxiedFetch: typeof globalThis.fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  headers.delete('x-api-key');
  headers.set('Authorization', `Bearer ${await idToken()}`);
  return globalThis.fetch(input, { ...init, headers });
};
