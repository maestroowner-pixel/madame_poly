/**
 * Слова без регистра, знаков и ударений: «Got over!» и «got over» — одно и
 * то же, как и «hayas» и «hayás», если Whisper поставит лишний знак.
 */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[’‘`]/g, "'")
    .replace(/[^\p{L}' ]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Вспомогательные глаголы в начале ответа: «is looking forward to» Whisper
 * легко запишет как «she's looking forward to». Глагол с частицей — главное,
 * их и проверяем.
 */
const AUXILIARIES = new Set(['is', 'are', 'was', 'were', 'am', 'be', 'been', 'has', 'have', 'had', 'will', 'would', 'did', 'do', 'does']);

/**
 * Сказан ли ответ (фразовый глагол, форма глагола, местоимения): его слова идут подряд где-то во фразе.
 * Остальное предложение не сверяем — Whisper может переписать его по-своему,
 * а упражнение не о нём.
 */
export function saidRight(heard: string, answer: string): boolean {
  const said = words(heard);
  let core = words(answer);
  while (core.length > 2 && AUXILIARIES.has(core[0])) core = core.slice(1);
  if (core.length === 0) return false;
  for (let start = 0; start + core.length <= said.length; start += 1) {
    if (core.every((word, offset) => said[start + offset] === word)) return true;
  }
  return false;
}
