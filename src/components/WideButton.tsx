import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme';
import { WaveThread } from './WaveThread';

/** Сколько полос в плавном переходе: меньше — видны ступеньки. */
const FADE_STEPS = 28;
/** Нить осциллограммы: на тёмном фоне — яркое золото, на белом — потемнее. */
export const THREAD_GOLD = { dark: '#F2C230', light: '#C99A0E' };

/**
 * Плавный переход прозрачности сверху вниз — вместо градиента: библиотеки для
 * него в сборке нет, а ради кнопок пересобирать нативную часть незачем.
 */
export function Fade({
  from,
  to,
  color,
  style,
}: {
  from: number;
  to: number;
  color: string;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents="none" style={style}>
      {Array.from({ length: FADE_STEPS }, (_, step) => (
        <View
          key={step}
          style={{
            flex: 1,
            backgroundColor: `rgba(${color},${from + ((to - from) * step) / (FADE_STEPS - 1)})`,
          }}
        />
      ))}
    </View>
  );
}

/**
 * Уровень «голоса» Мадам Поли, пока она говорит. Громкость воспроизведения
 * плеер не отдаёт, поэтому уровень придуман: неровный, как речь, с паузами
 * между словами. Этого хватает, чтобы нить на кнопке жила вместе со звуком.
 */
export function useSpeechWave(active: boolean): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      return;
    }
    let current = 0.4;
    const timer = setInterval(() => {
      // Изредка «пауза между словами», в остальное время — плавные колебания.
      const target = Math.random() < 0.12 ? 0.05 : 0.3 + Math.random() * 0.6;
      current += (target - current) * 0.55;
      setLevel(current);
    }, 80);
    return () => clearInterval(timer);
  }, [active]);

  return level;
}

/** Выпуклость клавиши: блик сверху, затемнение снизу. Кладётся внутрь кнопки. */
export function Volume() {
  return (
    <>
      <Fade from={0.16} to={0} color="255,255,255" style={volume.shine} />
      <Fade from={0} to={0.2} color="0,0,0" style={volume.shade} />
    </>
  );
}

interface Props {
  onPress: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** Размер, цвет и рамка — стиль экрана (styles.cta, styles.secondary…). */
  style: StyleProp<ViewStyle>;
  children: ReactNode;
  /** Мадам Поли сейчас говорит — по кнопке бежит золотая нить. */
  speaking?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

/**
 * Широкая кнопка-клавиша: приподнята тенью, выпуклая бликом и проседает при
 * нажатии. Вид (цвет, высота, рамка) задаёт экран, объём добавляет она сама.
 */
export function WideButton({
  onPress,
  onLongPress,
  disabled,
  style,
  children,
  speaking = false,
  accessibilityLabel,
  accessibilityRole = 'button',
}: Props) {
  const { scheme } = useTheme();
  const level = useSpeechWave(speaking);
  const flat = StyleSheet.flatten(style) ?? {};
  const radius = flat.borderRadius ?? 14;
  // Внешние отступы и растяжение — у обёртки с тенью, иначе тень уедет.
  const {
    margin,
    marginTop,
    marginBottom,
    marginVertical,
    marginHorizontal,
    alignSelf,
    flex,
    width,
    ...inner
  } = flat;

  return (
    <View
      style={[
        volume.lift,
        { borderRadius: radius },
        { margin, marginTop, marginBottom, marginVertical, marginHorizontal, alignSelf, flex, width },
        disabled && volume.liftOff,
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          inner,
          volume.clip,
          width !== undefined && { width: '100%' },
          pressed && volume.pressed,
        ]}
      >
        <Volume />
        {speaking && (
          <View pointerEvents="none" style={volume.wave}>
            <WaveThread level={level} active height={30} color={THREAD_GOLD[scheme]} />
          </View>
        )}
        {children}
      </Pressable>
    </View>
  );
}

export const volume = StyleSheet.create({
  /** Тень под клавишей: снизу и чуть размытая — кнопка приподнята над фоном. */
  lift: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 5,
  },
  liftOff: { shadowOpacity: 0.1, elevation: 1 },
  clip: { overflow: 'hidden' },
  /** Нажатие: клавиша проседает — сдвиг вниз и чуть тусклее. */
  pressed: { transform: [{ translateY: 1.5 }], opacity: 0.92 },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
  shade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%' },
  wave: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 16,
    right: 16,
    justifyContent: 'center',
    opacity: 0.7,
  },
});
