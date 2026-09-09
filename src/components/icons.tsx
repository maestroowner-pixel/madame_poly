import { StyleSheet, View } from 'react-native';

interface Props {
  size: number;
  color: string;
}

const RAY_COUNT = 8;

/**
 * Значки нарисованы фигурами, а не глифами: шрифтовые символы выходят разными
 * по весу, а на iOS солнце ещё и подменяется цветным эмодзи.
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

/** Коробка архива: крышка, корпус и прорезь под ярлык. */
export function ArchiveIcon({ size, color }: Props) {
  const lid = size * 0.26;
  const gap = size * 0.08;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.86,
          height: lid,
          borderRadius: size * 0.06,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.72,
          height: size * 0.46,
          marginTop: gap,
          borderRadius: size * 0.06,
          borderWidth: Math.max(1.5, size * 0.09),
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Прорезь: без неё корпус читается просто как прямоугольник. */}
        <View
          style={{
            width: size * 0.3,
            height: Math.max(1.5, size * 0.08),
            borderRadius: size * 0.04,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

/** Тетрадь: обложка со спиралью слева и двумя строками. */
export function NotebookIcon({ size, color }: Props) {
  const line = Math.max(1.5, size * 0.08);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.78,
          height: size * 0.9,
          borderRadius: size * 0.08,
          borderWidth: line,
          borderColor: color,
          paddingLeft: size * 0.2,
          justifyContent: 'center',
          gap: size * 0.12,
        }}
      >
        <View style={{ height: line, width: size * 0.34, backgroundColor: color, borderRadius: line }} />
        <View style={{ height: line, width: size * 0.34, backgroundColor: color, borderRadius: line }} />
      </View>

      {/* Корешок: без него обложка читается как обычная рамка. */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.14,
          top: size * 0.05,
          bottom: size * 0.05,
          width: line,
          backgroundColor: color,
          borderRadius: line,
        }}
      />
    </View>
  );
}

/**
 * Системный значок «поделиться» из iOS: коробка с открытым верхом и стрелка,
 * выходящая из неё вверх. Стрелка рисуется стволом и уголком — повёрнутый
 * квадрат с двумя сторонами читается как остриё чётче, чем глиф.
 */
export function ShareIcon({ size, color }: Props) {
  const line = Math.max(1.6, size * 0.075);
  const boxWidth = size * 0.62;
  const boxHeight = size * 0.5;
  const head = size * 0.26;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.06,
          width: boxWidth,
          height: boxHeight,
          borderColor: color,
          borderLeftWidth: line,
          borderRightWidth: line,
          borderBottomWidth: line,
          borderBottomLeftRadius: size * 0.08,
          borderBottomRightRadius: size * 0.08,
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: size * 0.14,
          width: line,
          height: size * 0.5,
          backgroundColor: color,
          borderRadius: line,
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: size * 0.17,
          width: head,
          height: head,
          borderColor: color,
          borderTopWidth: line,
          borderLeftWidth: line,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

/** Крестик: две перекрещенные полоски вместо символа «×» ради ровных концов. */
export function CloseIcon({ size, color }: Props) {
  const line = Math.max(1.6, size * 0.085);
  const bar = {
    position: 'absolute' as const,
    width: size * 0.78,
    height: line,
    backgroundColor: color,
    borderRadius: line,
  };

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View style={[bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[bar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

/** Галочка: короткая и длинная полоски под углом, как в системном чекбоксе. */
export function CheckIcon({ size, color }: Props) {
  const line = Math.max(1.6, size * 0.12);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          left: size * 0.18,
          top: size * 0.46,
          width: size * 0.34,
          height: line,
          backgroundColor: color,
          borderRadius: line,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.34,
          top: size * 0.38,
          width: size * 0.58,
          height: line,
          backgroundColor: color,
          borderRadius: line,
          transform: [{ rotate: '-52deg' }],
        }}
      />
    </View>
  );
}
