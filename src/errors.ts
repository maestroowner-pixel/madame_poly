import { t } from './i18n';

/**
 * Как выглядит отсутствие сети в разных слоях: fetch React Native и Expo,
 * Anthropic SDK (APIConnectionError, таймаут), iOS (NSURLErrorDomain -1009),
 * Android (UnknownHost) и Firebase Auth. Сырые тексты человеку ничего не
 * говорят — вместо них одна фраза «нет подключения».
 */
const OFFLINE = [
  /network request failed/i,
  /failed to fetch/i,
  /network ?error/i,
  /connection error/i,
  /request timed out/i,
  /internet connection appears to be offline/i,
  /not connected to the internet/i,
  /NSURLErrorDomain/i,
  /-1009/,
  /unable to resolve host/i,
  /UnknownHost/i,
  /failed to connect/i,
  /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/,
  /network-request-failed/i,
];

function isOffline(e: unknown): boolean {
  if (!e) return false;
  const name = e instanceof Error ? e.name : '';
  if (name === 'APIConnectionError' || name === 'APIConnectionTimeoutError') return true;
  const text = e instanceof Error ? `${e.message} ${String((e as { code?: unknown }).code ?? '')}` : String(e);
  if (OFFLINE.some((pattern) => pattern.test(text))) return true;
  return e instanceof Error && e.cause !== undefined && isOffline(e.cause);
}

/** Текст ошибки для человека: сетевые сбои — одной понятной фразой. */
export function errorText(e: unknown): string {
  if (isOffline(e)) return t.offline;
  return e instanceof Error ? e.message : String(e);
}
