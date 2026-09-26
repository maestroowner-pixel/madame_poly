import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

import { t } from '../i18n';

/**
 * Разрешение на микрофон — одно на всё приложение. Спрашиваем не на старте
 * вслепую, а после заставки (App) и перед каждой записью: системный диалог
 * поверх ролика ставил приложение на паузу, а вместе с запросом уведомлений
 * два диалога сталкивались, и Android отвечал отказом, не показав первый.
 * Параллельные вызовы ждут один и тот же запрос.
 */
let asking: Promise<boolean> | null = null;

export function ensureMicrophone(): Promise<boolean> {
  asking ??= (async () => {
    const current = await getRecordingPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await requestRecordingPermissionsAsync()).granted;
  })().finally(() => {
    asking = null;
  });
  return asking;
}

/** Перед записью: нет разрешения — понятная ошибка вместо падения рекордера. */
export async function requireMicrophone(): Promise<void> {
  if (!(await ensureMicrophone())) throw new Error(t.noMicrophone);
}
