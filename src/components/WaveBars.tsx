import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

/** Сколько отсчётов держим в памяти: рисуем столько, сколько влезло по ширине. */
const HISTORY = 72;
const BAR_WIDTH = 3;
const BAR_GAP = 3;
const MIN_BAR = 3;

interface Props {
  /** Уровень входа 0…1. */
  level: number;
  /** Идёт ли запись: на паузе полоски схлопываются в ровную линию. */
  active: boolean;
  color: string;
  height: number;
}

/**
 * Осциллограмма входа. Число полосок не задано числом, а считается по
 * фактической ширине — так она одинаково ложится и в узкую кнопку, и в
 * широкую панель на планшете.
 */
export function WaveBars({ level, active, color, height }: Props) {
  const [samples, setSamples] = useState<number[]>(() => new Array(HISTORY).fill(0));
  const [width, setWidth] = useState(0);
  const lastLevel = useRef(0);

  useEffect(() => {
    if (!active) {
      if (lastLevel.current !== 0) {
        lastLevel.current = 0;
        setSamples(new Array(HISTORY).fill(0));
      }
      return;
    }
    lastLevel.current = level;
    setSamples((previous) => [...previous.slice(1), level]);
  }, [level, active]);

  const count = Math.max(8, Math.floor(width / (BAR_WIDTH + BAR_GAP)));

  return (
    <View
      style={[styles.row, { height }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {samples.slice(-count).map((value, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            { height: Math.max(MIN_BAR, value * height), backgroundColor: color },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: BAR_GAP,
  },
  bar: { width: BAR_WIDTH, borderRadius: 2 },
});
