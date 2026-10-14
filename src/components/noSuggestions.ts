import type { TextInputProps } from 'react-native';

/**
 * Поле без подсказок клавиатуры: ни автозамены, ни строки предложений, ни
 * подчёркивания орфографии, ни автозаполнения, ни сама собой поставленной
 * заглавной буквы. В ответах на изучаемом языке клавиатура иначе сама
 * исправляет ошибки — а находить их должен человек, и Poly должна видеть,
 * как он написал на самом деле.
 *
 * На iOS этого мало: дописывание слова серым, «умные» кавычки и Writing Tools
 * выключает plugins/withPlainKeyboard.js — для всех полей с autoCorrect={false}.
 */
export const NO_SUGGESTIONS = {
  autoCorrect: false,
  spellCheck: false,
  autoCapitalize: 'none',
  autoComplete: 'off',
  textContentType: 'none',
  importantForAutofill: 'no',
} as const satisfies TextInputProps;
