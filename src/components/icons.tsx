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

/** Домик: скат — повёрнутый квадрат о двух сторонах, под ним коробка стен. */
export function HomeIcon({ size, color }: Props) {
  const line = Math.max(1.6, size * 0.085);
  const roof = size * 0.5;
  const wallWidth = size * 0.62;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.24,
          width: roof,
          height: roof,
          borderColor: color,
          borderTopWidth: line,
          borderLeftWidth: line,
          borderTopLeftRadius: line,
          transform: [{ rotate: '45deg' }],
        }}
      />

      <View
        style={{
          position: 'absolute',
          bottom: size * 0.14,
          width: wallWidth,
          height: size * 0.36,
          borderColor: color,
          borderLeftWidth: line,
          borderRightWidth: line,
          borderBottomWidth: line,
          borderBottomLeftRadius: size * 0.06,
          borderBottomRightRadius: size * 0.06,
        }}
      />
    </View>
  );
}

/** Реплика: скруглённый прямоугольник с хвостиком в нижнем углу. */
export function ChatIcon({ size, color }: Props) {
  const line = Math.max(1.6, size * 0.085);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.86,
          height: size * 0.66,
          borderRadius: size * 0.18,
          borderWidth: line,
          borderColor: color,
          marginBottom: size * 0.14,
        }}
      />
      {/* Хвостик: квадрат о двух сторонах, повёрнутый углом вниз. */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.24,
          bottom: size * 0.1,
          width: size * 0.2,
          height: size * 0.2,
          borderBottomWidth: line,
          borderLeftWidth: line,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

/** Слух: две дуги звука рядом с точкой — ухо в линиях читается хуже. */
export function EarIcon({ size, color }: Props) {
  const line = Math.max(1.6, size * 0.085);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          left: size * 0.16,
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: size * 0.08,
          backgroundColor: color,
        }}
      />
      {[0.42, 0.66].map((scale, index) => (
        <View
          key={scale}
          style={{
            position: 'absolute',
            left: size * (0.3 + index * 0.12),
            width: size * scale,
            height: size * scale,
            borderRadius: size * scale * 0.5,
            borderWidth: line,
            borderColor: color,
            // Оставляем только правую половину кольца — получается дуга.
            borderLeftColor: 'transparent',
            borderTopColor: 'transparent',
            transform: [{ rotate: '-45deg' }],
          }}
        />
      ))}
    </View>
  );
}

/** Перо: наклонная линия с остриём и черта строки под ним. */
export function PenIcon({ size, color }: Props) {
  const line = Math.max(1.6, size * 0.085);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.1,
          left: size * 0.36,
          width: size * 0.26,
          height: size * 0.6,
          borderWidth: line,
          borderColor: color,
          borderTopLeftRadius: size * 0.13,
          borderTopRightRadius: size * 0.13,
          transform: [{ rotate: '38deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.08,
          width: size * 0.74,
          height: line,
          borderRadius: line,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** Книга: две страницы, разделённые корешком. */
export function BookIcon({ size, color }: Props) {
  const line = Math.max(1.6, size * 0.085);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.84,
          height: size * 0.66,
          borderWidth: line,
          borderColor: color,
          borderRadius: size * 0.06,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: line,
          height: size * 0.66,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
