import { StyleSheet, View } from 'react-native';

interface Props {
  size: number;
  color: string;
}

const RAY_COUNT = 8;

/**
 * Солнце и месяц нарисованы фигурами, а не глифами: шрифтовые ☀ и ☾ выходят
 * разными по весу, а на iOS солнце ещё и подменяется цветным эмодзи.
 */
export function SunIcon({ size, color }: Props) {
  const core = size * 0.42;
  const rayLength = size * 0.2;
  const rayWidth = Math.max(2, size * 0.085);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {Array.from({ length: RAY_COUNT }, (_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            width: rayWidth,
            height: rayLength,
            borderRadius: rayWidth / 2,
            backgroundColor: color,
            // Сначала поворот, потом сдвиг — луч уезжает вдоль уже повёрнутой оси.
            transform: [
              { rotate: `${(index * 360) / RAY_COUNT}deg` },
              { translateY: -size * 0.39 },
            ],
          }}
        />
      ))}
      <View
        style={{
          width: core,
          height: core,
          borderRadius: core / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

interface MoonProps extends Props {
  /** Цвет подложки: вырез серпа закрашивается им. */
  cutout: string;
}

export function MoonIcon({ size, color, cutout }: MoonProps) {
  const disc = size * 0.82;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          backgroundColor: color,
        }}
      />
      {/* Второй круг поверх первого превращает диск в серп. */}
      <View
        style={{
          position: 'absolute',
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          backgroundColor: cutout,
          transform: [{ translateX: disc * 0.3 }, { translateY: -disc * 0.16 }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
