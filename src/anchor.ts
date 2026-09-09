import type { RefObject } from 'react';
import type { View } from 'react-native';

/** Точка в координатах окна, из которой разворачивается модальный экран. */
export interface Anchor {
  x: number;
  y: number;
}

/**
 * Центр элемента в координатах окна. Промах молча даёт null: анимация тогда
 * идёт от центра экрана — это лучше, чем не открыть экран вовсе.
 */
export function measureAnchor(
  ref: RefObject<View | null>,
  then: (anchor: Anchor | null) => void,
): void {
  const node = ref.current;
  if (!node) {
    then(null);
    return;
  }
  node.measureInWindow((x, y, width, height) => {
    then(Number.isFinite(x) ? { x: x + width / 2, y: y + height / 2 } : null);
  });
}
