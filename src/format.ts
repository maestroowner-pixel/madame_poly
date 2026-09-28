const pad = (value: number) => String(value).padStart(2, '0');

/** Intl в Hermes есть не везде — дату собираем руками. */
export function formatDate(millis: number): string {
  const date = new Date(millis);
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Славянское склонение по числу: 1 попытка, 2 попытки, 5 попыток. */
export function plural(count: number, one: string, few: string, many: string): string {
  const tens = count % 100;
  if (tens >= 11 && tens <= 14) return many;
  const units = count % 10;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
}

/**
 * Польское склонение по числу: 1 błąd, 2 błędy, 5 błędów — но в отличие от
 * украинского 21 — снова «błędów»: форма «one» только у самой единицы.
 */
export function pluralPl(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  const tens = count % 100;
  const units = count % 10;
  if (units >= 2 && units <= 4 && !(tens >= 12 && tens <= 14)) return few;
  return many;
}

/**
 * Румынское склонение по числу: 1 greșeală, 2–19 greșeli, с 20 — через «de»:
 * 20 de greșeli, 101 greșeli. «many» передаётся уже с «de».
 */
export function pluralRo(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  const tens = count % 100;
  if (count === 0 || (tens >= 1 && tens <= 19)) return few;
  return many;
}
