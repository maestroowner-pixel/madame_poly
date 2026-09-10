import type { Persistence } from 'firebase/auth';

/**
 * Типы firebase/auth собраны для браузера, а Metro подставляет сборку для
 * React Native, где есть хранение сессии через AsyncStorage. Дополняем модуль
 * этой функцией, чтобы не отключать проверку типов на весь сервис.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
