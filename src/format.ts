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
