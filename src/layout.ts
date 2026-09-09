import { useWindowDimensions } from 'react-native';

/**
 * Потолок ширины контента. На планшете лента во весь экран даёт строки в
 * полтора десятка слов — читать такие неудобно, поэтому колонку ограничиваем
 * и центрируем, как в почте и мессенджерах.
 */
export const CONTENT_MAX_WIDTH = 640;

export function useLayout() {
  const { width } = useWindowDimensions();
  return {
    /** Планшет или повёрнутый телефон: место есть, но растягивать нечего. */
    isWide: width >= 700,
    width,
  };
}
