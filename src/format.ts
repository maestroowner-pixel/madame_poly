const pad = (value: number) => String(value).padStart(2, '0');

/** Intl в Hermes есть не везде — дату собираем руками. */
export function formatDate(millis: number): string {
  const date = new Date(millis);
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
