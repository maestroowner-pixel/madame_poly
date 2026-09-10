import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Modal, StyleSheet, useWindowDimensions } from 'react-native';

import type { Anchor } from '../anchor';
import { useTheme } from '../theme';

const OPEN_MS = 260;
/** Сколько экран складывается: столько же ждут те, кто размонтируется следом. */
export const ZOOM_CLOSE_MS = 220;
/** Во что схлопывается экран — примерно размер значка, из которого он вырос. */
const MIN_SCALE = 0.06;

interface Props {
  visible: boolean;
  /** Значок, из которого экран разворачивается и в который сворачивается. */
  anchor: Anchor | null;
  onRequestClose: () => void;
  children: ReactNode;
}

/**
 * Модальный экран, растущий из своего значка и схлопывающийся обратно в него.
 * Штатная анимация Modal ездит снизу и не говорит, куда именно экран делся;
 * привязка к значку показывает, где его снова искать.
 */
export function ZoomModal({ visible, anchor, onRequestClose, children }: Props) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  // Держим экран смонтированным до конца схлопывания, иначе он пропадёт разом.
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  /** Свежее значение для колбэка анимации: он переживает смену пропсов. */
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  // Анимация запускается только после того, как вид смонтирован: нативный
  // драйвер цепляется к живому узлу, а запущенный до монтирования застревает
  // на полпути.
  useEffect(() => {
    if (!mounted) return;

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? OPEN_MS : ZOOM_CLOSE_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Признак finished намеренно не проверяем: прерванная анимация оставляла
      // бы невидимую модалку поверх экрана, и она съедала бы все касания.
      if (!visibleRef.current) setMounted(false);
    });
  }, [mounted, visible, progress]);

  // Сдвиг считается до масштаба, поэтому это смещение центра экрана к значку.
  const originX = anchor ? anchor.x - width / 2 : 0;
  const originY = anchor ? anchor.y - height / 2 : 0;

  /**
   * Интерполяции считаются один раз: пересобранные на перерисовке узлы теряют
   * связь с уже идущей нативной анимацией, и экран замирает недоехавшим.
   */
  const animation = useMemo(
    () => ({
      opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.9, 1] }),
      transform: [
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [originX, 0] }) },
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [originY, 0] }) },
        { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [MIN_SCALE, 1] }) },
      ],
    }),
    [progress, originX, originY],
  );

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onRequestClose}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }, animation]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}
