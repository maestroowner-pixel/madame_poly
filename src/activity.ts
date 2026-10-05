/**
 * Учёт занятий по дням — для экрана «Сегодня»: сколько минут говорили,
 * сколько карточек повторили, сколько упражнений тренажёров решили. Только
 * счётчики, без подробностей: чтобы показать план дня и неделю, их хватает.
 */

/** Цели дня: по ним отмечаются задачи «Сегодня». */
export const DAILY_TALK_MINUTES = 10;
export const DAILY_DRILLS = 10;

export interface DayActivity {
  talkMs: number;
  cards: number;
  drills: number;
}

/** Ключ — местная дата «2026-10-06»: день кончается в полночь у человека, а не по Гринвичу. */
export type ActivityLog = Record<string, DayActivity>;

export const EMPTY_DAY: DayActivity = { talkMs: 0, cards: 0, drills: 0 };

export function dayKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Последние n дней, от старого к сегодняшнему. */
export function lastDays(n: number, today: Date = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (n - 1 - i));
    return day;
  });
}

export function isActive(day: DayActivity | undefined): boolean {
  return Boolean(day && (day.talkMs > 0 || day.cards > 0 || day.drills > 0));
}

/**
 * Дней подряд с занятиями. Сегодня ещё не занимались — серия не рвётся, а
 * считается со вчерашнего дня: день не кончился.
 */
export function streak(log: ActivityLog, today: Date = new Date()): number {
  const day = new Date(today);
  if (!isActive(log[dayKey(day)])) day.setDate(day.getDate() - 1);
  let count = 0;
  while (isActive(log[dayKey(day)])) {
    count += 1;
    day.setDate(day.getDate() - 1);
  }
  return count;
}

/** Сколько дней держать: на неделю и серию с запасом, больше ни к чему. */
export const KEEP_DAYS = 120;
