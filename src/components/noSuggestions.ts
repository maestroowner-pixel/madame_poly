import type { TextInputProps } from 'react-native';

/**
 * Поле без подсказок клавиатуры: ни автозамены, ни строки предложений, ни
 * подчёркивания орфографии, ни автозаполнения. В ответах на изучаемом языке
 * клавиатура иначе сама исправляет ошибки — а находить их должен человек,
 * и Poly должна видеть, как он написал на самом деле.
 */
export const NO_SUGGESTIONS = {
  autoCorrect: false,
  spellCheck: false,
  autoComplete: 'off',
  importantForAutofill: 'no',
} as const satisfies TextInputProps;
