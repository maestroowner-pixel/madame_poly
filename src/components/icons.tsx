import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { UI_SCALE } from '../layout';

interface Props {
  size: number;
  color: string;
}

const RAY_COUNT = 8;

/**
 * Значки нарисованы фигурами, а не глифами: шрифтовые символы выходят разными
 * по весу, а на iOS солнце ещё и подменяется цветным эмодзи.
 */
/** Нарисованное солнце: ядро и лучи заданной толщины, необязательная тень. */
function SunShape({
  size,
  color,
  thickness = 1,
  glow,
}: {
  size: number;
  color: string;
  /** Во сколько раз толще лучи и крупнее ядро — для ореола. */
  thickness?: number;
  glow?: { color: string; radius: number };
}) {
  const core = size * 0.42 * (1 + (thickness - 1) * 0.35);
  const rayLength = size * 0.2 * (1 + (thickness - 1) * 0.3);
  const rayWidth = Math.max(2, size * 0.085) * thickness;
  const shadow = glow
    ? { shadowColor: glow.color, shadowOpacity: 1, shadowRadius: glow.radius, shadowOffset: { width: 0, height: 0 } }
    : null;

  return (
    <View style={[styles.box, { position: 'absolute', width: size, height: size }]}>
      {Array.from({ length: RAY_COUNT }, (_, index) => (
        <View
          key={index}
          style={[
            {
              position: 'absolute',
              width: rayWidth,
              height: rayLength,
              borderRadius: rayWidth / 2,
              backgroundColor: color,
              // Сначала поворот, потом сдвиг — луч уезжает вдоль уже повёрнутой оси.
              transform: [{ rotate: `${(index * 360) / RAY_COUNT}deg` }, { translateY: -size * 0.39 }],
            },
            shadow,
          ]}
        />
      ))}
      <View style={[{ width: core, height: core, borderRadius: core / 2, backgroundColor: color }, shadow]} />
    </View>
  );
}

/** Жёлтое солнце кнопки светлой темы и его свечение. */
const SUN_YELLOW = '#F5B81C';
const SUN_GLOW = '#FFD84D';

/**
 * Солнце — кнопка светлой темы. Жёлтое и мерцает, как неоновая корона: под
 * ним его же копия с лучами толще — ореол, яркость которого медленно
 * разгорается и гаснет; на iOS ореол ещё и светится тенью в цвет. Цвет из
 * props не берём: солнце всегда жёлтое.
 */
export function SunIcon({ size: base }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] }),
        }}
      >
        <SunShape size={size} color={SUN_GLOW} thickness={1.8} glow={{ color: SUN_GLOW, radius: size * 0.14 }} />
      </Animated.View>
      <SunShape size={size} color={SUN_YELLOW} />
    </View>
  );
}

interface MoonProps extends Props {
  /** Цвет подложки: вырез серпа закрашивается им. */
  cutout: string;
}

export function MoonIcon({ size: base, color, cutout }: MoonProps) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function ArchiveIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function NotebookIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function ShareIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function CloseIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function CheckIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function HomeIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function ChatIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function EarIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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
export function PenIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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

/** Слова: три строки разной длины с точкой-маркером перед каждой. */
export function WordsIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
  const line = Math.max(1.6, size * 0.085);
  const dot = Math.max(3, size * 0.14);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {[
        { top: 0.2, width: 0.5 },
        { top: 0.46, width: 0.62 },
        { top: 0.72, width: 0.4 },
      ].map((row) => (
        <View
          key={row.top}
          style={{
            position: 'absolute',
            top: size * row.top,
            left: size * 0.12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: size * 0.1,
          }}
        >
          <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: color }} />
          <View style={{ width: size * row.width, height: line, borderRadius: line, backgroundColor: color }} />
        </View>
      ))}
    </View>
  );
}

/**
 * Грамматика: таблица форм, как в учебнике, — рамка, строка заголовка
 * жирнее и разделитель столбцов.
 */
export function GrammarIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
  const line = Math.max(1.6, size * 0.085);
  const inset = size * 0.12;
  const inner = size - inset * 2;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          top: inset,
          left: inset,
          width: inner,
          height: inner,
          borderWidth: line,
          borderColor: color,
          borderRadius: size * 0.1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: inset + inner * 0.3,
          left: inset,
          width: inner,
          height: line * 1.6,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: inset + inner * 0.64,
          left: inset,
          width: inner,
          height: line,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: inset,
          left: inset + inner * 0.42,
          width: line,
          height: inner,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** Экзамен: планшет экзаменатора — лист с зажимом сверху и строками ответов. */
export function ExamIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
  const line = Math.max(1.6, size * 0.085);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          top: size * 0.12,
          width: size * 0.66,
          height: size * 0.8,
          borderWidth: line,
          borderColor: color,
          borderRadius: size * 0.08,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.04,
          width: size * 0.3,
          height: size * 0.16,
          borderRadius: line,
          backgroundColor: color,
        }}
      />
      {[0.42, 0.58, 0.74].map((top) => (
        <View
          key={top}
          style={{
            position: 'absolute',
            top: size * top,
            width: size * 0.36,
            height: line,
            borderRadius: line,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

/** Книга: две страницы, разделённые корешком. */
export function BookIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
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

interface EyeProps extends Props {
  /** Закрытый глаз — тот же контур, перечёркнутый наискось. */
  closed: boolean;
  /** Цвет подложки: кант вокруг черты отделяет её от контура. */
  cutout: string;
}

/** Глаз: скруглённый контур со зрачком; закрытый — перечёркнут, как «eye-off». */
export function EyeIcon({ size: base, color, closed, cutout }: EyeProps) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
  const line = Math.max(1.6, size * 0.085);
  const pupil = size * 0.28;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: size * 0.92,
          height: size * 0.58,
          borderRadius: size * 0.32,
          borderWidth: line,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: pupil,
            height: pupil,
            borderRadius: pupil / 2,
            backgroundColor: color,
          }}
        />
      </View>
      {closed &&
        [cutout, color].map((fill, layer) => (
          <View
            key={layer}
            style={{
              position: 'absolute',
              width: size * 0.96,
              // Нижний слой шире — кант цвета подложки отделяет черту от контура.
              height: layer === 0 ? line * 2.8 : line,
              borderRadius: line * 2,
              backgroundColor: fill,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        ))}
    </View>
  );
}

/**
 * Динамик: корпус, раструб и две дуги звука. Раструб — треугольник из
 * прозрачных рамок, дуги — правая кромка скруглённой рамки.
 */
export function SpeakerIcon({ size: base, color }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
  const line = Math.max(1.6, size * 0.085);
  const cone = size * 0.62;

  const wave = (height: number, left: number) => (
    <View
      style={{
        position: 'absolute',
        left,
        width: height / 2,
        height,
        borderWidth: line,
        borderColor: 'transparent',
        borderRightColor: color,
        borderTopRightRadius: height / 2,
        borderBottomRightRadius: height / 2,
      }}
    />
  );

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          position: 'absolute',
          left: size * 0.16,
          width: 0,
          height: 0,
          borderTopWidth: cone / 2,
          borderBottomWidth: cone / 2,
          borderRightWidth: size * 0.36,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.06,
          width: size * 0.22,
          height: size * 0.32,
          borderRadius: size * 0.04,
          backgroundColor: color,
        }}
      />
      {wave(size * 0.4, size * 0.56)}
      {wave(size * 0.72, size * 0.66)}
    </View>
  );
}

interface ChevronProps extends Props {
  direction: 'left' | 'right' | 'up' | 'down';
}

/** Поворот уголка и сдвиг к его острию — иначе он кажется смещённым. */
const CHEVRON = {
  right: { rotate: '45deg', x: -0.2, y: 0 },
  left: { rotate: '225deg', x: 0.2, y: 0 },
  up: { rotate: '-45deg', x: 0, y: 0.2 },
  down: { rotate: '135deg', x: 0, y: -0.2 },
} as const;

/**
 * Уголок стрелки: квадрат с двумя сторонами, повёрнутый на 45°. Шрифтовые
 * «‹ ›» сидят ниже строки и в кнопке рядом с цифрами смотрятся криво.
 */
export function ChevronIcon({ size: base, color, direction }: ChevronProps) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
  const line = Math.max(1.8, size * 0.11);
  const side = size * 0.42;

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: side,
          height: side,
          borderColor: color,
          borderTopWidth: line,
          borderRightWidth: line,
          transform: [
            { translateX: side * CHEVRON[direction].x },
            { translateY: side * CHEVRON[direction].y },
            { rotate: CHEVRON[direction].rotate },
          ],
        }}
      />
    </View>
  );
}

/**
 * Корона шахматного ферзя — вход в подписку. Контуром, как остальные значки,
 * но золотая и с неоновым мерцанием: ломаная из пяти зубцов (центральный
 * выше всех), шарики на концах и обод. Ломаная собрана из повёрнутых
 * отрезков — фигурами иначе её не нарисовать.
 */
const CROWN_LINE: [number, number][] = [
  [0.2, 0.7],
  [0.12, 0.36],
  [0.23, 0.53],
  [0.31, 0.28],
  [0.41, 0.53],
  [0.5, 0.22],
  [0.59, 0.53],
  [0.69, 0.28],
  [0.77, 0.53],
  [0.88, 0.36],
  [0.8, 0.7],
];
const CROWN_TIPS = [1, 3, 5, 7, 9];

/** Нарисованная корона: линии заданной толщины, цвет, необязательная тень. */
function CrownShape({
  size,
  color,
  line,
  ball,
  glow,
}: {
  size: number;
  color: string;
  line: number;
  ball: number;
  /** Тень по силуэту (iOS) — неоновый ореол. */
  glow?: { color: string; radius: number };
}) {
  const shadow = glow
    ? { shadowColor: glow.color, shadowOpacity: 1, shadowRadius: glow.radius, shadowOffset: { width: 0, height: 0 } }
    : null;

  return (
    <View style={{ position: 'absolute', width: size, height: size }}>
      {CROWN_LINE.slice(1).map(([x2, y2], index) => {
        const [x1, y1] = CROWN_LINE[index];
        const dx = (x2 - x1) * size;
        const dy = (y2 - y1) * size;
        const length = Math.hypot(dx, dy);
        return (
          <View
            key={index}
            style={[
              {
                position: 'absolute',
                left: ((x1 + x2) / 2) * size - length / 2,
                top: ((y1 + y2) / 2) * size - line / 2,
                width: length + line * 0.6,
                height: line,
                borderRadius: line / 2,
                backgroundColor: color,
                transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
              },
              shadow,
            ]}
          />
        );
      })}
      {CROWN_TIPS.map((index) => {
        const [x, y] = CROWN_LINE[index];
        return (
          <View
            key={`ball-${index}`}
            style={[
              {
                position: 'absolute',
                left: x * size - ball / 2,
                top: y * size - ball * 0.85,
                width: ball,
                height: ball,
                borderRadius: ball / 2,
                backgroundColor: color,
              },
              shadow,
            ]}
          />
        );
      })}
      {/* Обод: контурная полоса под зубцами. */}
      <View
        style={[
          {
            position: 'absolute',
            left: size * 0.2 - line / 2,
            top: size * 0.7 - line / 2,
            width: size * 0.6 + line,
            height: size * 0.16,
            borderWidth: line,
            borderColor: color,
            borderRadius: line,
          },
          shadow,
        ]}
      />
    </View>
  );
}

/** Золото неоновой короны: сама корона и её свечение. */
const CROWN_GOLD = '#F2C230';
const CROWN_GLOW = '#FFD75A';

export function CrownIcon({ size: base }: Props) {
  /** На планшете значки крупнее вместе со всем интерфейсом. */
  const size = base * UI_SCALE;
  const line = Math.max(1.6, size * 0.08);
  const ball = size * 0.13;

  /**
   * Неоновое мерцание по краю силуэта: под короной её же копия с линиями
   * толще — ореол по контуру, — яркость которого медленно разгорается и
   * гаснет. На iOS ореол ещё и светится тенью в цвет золота; на Android
   * цветных теней нет, там мерцает сам ореол.
   */
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.6] }),
        }}
      >
        <CrownShape
          size={size}
          color={CROWN_GLOW}
          line={line * 1.8}
          ball={ball * 1.35}
          glow={{ color: CROWN_GLOW, radius: size * 0.12 }}
        />
      </Animated.View>
      <CrownShape size={size} color={CROWN_GOLD} line={line} ball={ball} />
    </View>
  );
}
