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

/**
 * Ошибки входа Firebase — «Firebase: Error (auth/email-already-in-use).»
 * человеку ничего не говорит. По коду — фраза на языке интерфейса.
 * invalid-credential — так новый SDK отвечает и на чужую почту, и на
 * неверный пароль; credential-already-in-use — когда анонимный вход пытаются
 * превратить в аккаунт с уже занятой почтой.
 */
function authText(e: unknown): string | null {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String(e.code) : '';
  if (!code.startsWith('auth/')) return null;
  switch (code) {
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
    case 'auth/account-exists-with-different-credential':
      return t.authEmailInUse;
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return t.authInvalidEmail;
    case 'auth/weak-password':
      return t.authWeakPassword;
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/missing-password':
      return t.authWrongCredentials;
    case 'auth/too-many-requests':
      return t.authTooManyRequests;
    case 'auth/user-disabled':
      return t.authUserDisabled;
    default:
      return t.authFailed;
  }
}

/** Текст ошибки для человека: сетевые сбои и ошибки входа — понятной фразой. */
export function errorText(e: unknown): string {
  if (isOffline(e)) return t.offline;
  const auth = authText(e);
  if (auth) return auth;
  return e instanceof Error ? e.message : String(e);
}
