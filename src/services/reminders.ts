import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '../i18n';
import { LANGUAGE_CODES } from '../languages';
import { loadReminderSettings, loadReviewCards } from '../storage';
import type { ClockTime } from '../types';

/** Слова напоминаем повторить дважды в день — утром и вечером. */
export const REVIEW_REMINDER_TIMES: ClockTime[] = [
  { hour: 10, minute: 0 },
  { hour: 19, minute: 0 },
];

const CHANNEL = 'reminders';

/** Часы:минуты для подписи в настройках. */
export const formatTime = ({ hour, minute }: ClockTime): string =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

// Пришло, пока приложение открыто, — всё равно показываем: человек мог
// открыть его не ради слов.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Разрешение спрашиваем, только когда есть что напоминать. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function hasReviewCards(): Promise<boolean> {
  for (const language of LANGUAGE_CODES) {
    if ((await loadReviewCards(language)).length > 0) return true;
  }
  return false;
}

async function schedule(title: string, body: string, time: ClockTime): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: CHANNEL,
      hour: time.hour,
      minute: time.minute,
    },
  });
}

/**
 * Приводит расписание в системе к настройкам: снимает всё и ставит заново.
 * Зовётся при запуске, при смене настроек и когда меняется очередь
 * повторения — напоминать о словах, которых нет, незачем. Возвращает false,
 * если напоминания нужны, а разрешения на них нет.
 */
export async function syncReminders(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const settings = await loadReminderSettings();
  const review = settings.review && (await hasReviewCards());
  const practice = settings.practice;

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!review && !practice) return true;
  if (!(await ensurePermission())) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: t.reminders,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (review) {
    for (const time of REVIEW_REMINDER_TIMES) {
      await schedule(t.notifyReviewTitle, t.notifyReviewBody, time);
    }
  }
  if (practice) await schedule(t.notifyPracticeTitle, t.notifyPracticeBody, practice);
  return true;
}
