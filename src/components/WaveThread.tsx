import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/** Сколько отсчётов держим в памяти: рисуем столько, сколько влезло по ширине. */
const HISTORY = 110;
/** Шаг нити по горизонтали: реже — ломаная, чаще — лишние отрезки. */
const STEP = 3.5;
const THREAD = 1.1;

interface Props {
  /** Уровень входа 0…1. */
  level: number;
  /** Идёт ли запись: на паузе нить выпрямляется. */
  active: boolean;
  color: string;
  height: number;
}

/**
 * Осциллограмма тонкой нитью. Каждый отсчёт — точка, соседние соединены
 * отрезком, повёрнутым на нужный угол (SVG в проекте нет, линия собрана из
 * View, как корона). Чтобы нить колебалась, а не ползла одной горкой, знак
 * отклонения идёт по синусоиде: громче голос — шире размах волны.
 */
export function WaveThread({ level, active, color, height }: Props) {
  const [samples, setSamples] = useState<number[]>(() => new Array(HISTORY).fill(0));
  const [width, setWidth] = useState(0);
  const lastLevel = useRef(0);
  /** Сдвиг фазы с каждым отсчётом — волна бежит, а не стоит на месте. */
  const tick = useRef(0);

  useEffect(() => {
    if (!active) {
      if (lastLevel.current !== 0) {
        lastLevel.current = 0;
        setSamples(new Array(HISTORY).fill(0));
      }
      return;
    }
    lastLevel.current = level;
    tick.current += 1;
    setSamples((previous) => [...previous.slice(1), level]);
  }, [level, active]);

  const count = Math.min(HISTORY, Math.max(8, Math.floor(width / STEP) + 1));
  const recent = samples.slice(-count);
  const middle = height / 2;
  const offset = width - (count - 1) * STEP;

  const points = recent.map((value, index) => ({
    x: offset + index * STEP,
    y: middle + Math.sin((index + tick.current) * 0.45) * value * (height / 2 - THREAD),
  }));

  return (
    <View
      style={[styles.box, { height }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 &&
        points.slice(1).map((point, index) => {
          const from = points[index];
          const dx = point.x - from.x;
          const dy = point.y - from.y;
          const length = Math.hypot(dx, dy);
          return (
            <View
              key={index}
              style={[
                styles.segment,
                {
                  width: length + THREAD,
                  left: (from.x + point.x) / 2 - (length + THREAD) / 2,
                  top: (from.y + point.y) / 2 - THREAD / 2,
                  backgroundColor: color,
                  shadowColor: color,
                  transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                },
              ]}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignSelf: 'stretch' },
  segment: {
    position: 'absolute',
    height: THREAD,
    borderRadius: THREAD / 2,
    // Нить светится — на iOS тенью её же цвета; на Android цветной тени нет.
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 2.5 },
      default: {},
    }),
  },
});
