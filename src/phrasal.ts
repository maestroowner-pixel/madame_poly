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

const GAP = '___';

/**
 * Пропуск, разорванный дополнением: «couldn't ___ his main point ___» с
 * ответом «get ... across». Дополнение уходит внутрь ответа и вариантов —
 * «couldn't ___.» и «get his main point across», — и упражнение остаётся.
 * Без многоточия в ответе глагол — первое слово, частицы — остальные.
 * Не получилось — возвращаем как было: такое упражнение потом отбросят.
 */
export function joinSplitGap<T extends { sentence: string; answer: string; options: string[] }>(drill: T): T {
  const pieces = drill.sentence.split(GAP);
  if (pieces.length !== 3) return drill;
  const object = pieces[1].trim();
  if (!object || /[.,;:!?]/.test(object)) return drill;

  const fill = (option: string): string | null => {
    const parts = /\.\.\.|…/.test(option)
      ? option.split(/\s*(?:\.\.\.|…)\s*/)
      : [option.split(' ')[0], option.split(' ').slice(1).join(' ')];
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    return `${parts[0]} ${object} ${parts[1]}`;
  };

  const answer = fill(drill.answer);
  const options = drill.options.map(fill);
  if (!answer || options.some((option) => option === null)) return drill;
  return { ...drill, sentence: `${pieces[0]}${GAP}${pieces[2]}`, answer, options: options as string[] };
}
