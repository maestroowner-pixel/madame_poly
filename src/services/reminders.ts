import { Platform } from 'react-native';

import { t } from '../i18n';
import { LANGUAGE_CODES } from '../languages';
import { loadReminderSettings, loadReviewCards } from '../storage';
import type { ClockTime } from '../types';

const CHANNEL = 'reminders';

/** Часы:минуты для подписи в настройках. */
export const formatTime = ({ hour, minute }: ClockTime): string =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

type NotificationsModule = typeof import('expo-notifications');

let loaded: NotificationsModule | null | undefined;

/**
 * Модуль нативный, и статический импорт роняет приложение там, где его нет:
 * в сборке без пересборки, в Expo Go на Android, в вебе. Поэтому грузим его
 * по требованию и один раз; не загрузился — напоминаний нет, всё остальное
 * работает.
 */
function notifications(): NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  if (Platform.OS === 'web') return (loaded = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('expo-notifications') as NotificationsModule;
    // Пришло, пока приложение открыто, — всё равно показываем: человек мог
    // открыть его не ради слов.
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    loaded = module;
  } catch {
    loaded = null;
  }
  return loaded;
}

/** Разрешение спрашиваем, только когда есть что напоминать. */
export async function ensurePermission(): Promise<boolean> {
  const Notifications = notifications();
  if (!Notifications) return false;
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

async function schedule(
  Notifications: NotificationsModule,
  title: string,
  body: string,
  time: ClockTime,
): Promise<void> {
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
  const Notifications = notifications();
  if (!Notifications) return true;

  const settings = await loadReminderSettings();
  const review = settings.review && (await hasReviewCards()) ? settings.review : null;
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
    for (const time of review) {
      await schedule(Notifications, t.notifyReviewTitle, t.notifyReviewBody, time);
    }
  }
  if (practice) await schedule(Notifications, t.notifyPracticeTitle, t.notifyPracticeBody, practice);
  return true;
}
