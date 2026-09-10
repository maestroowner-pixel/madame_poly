import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { useStyles, useTheme, type Theme } from '../theme';

interface Props {
  onPress: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * Кнопка шапки со значком. В тёмной теме под ним медленно разгорается и гаснет
 * сиреневое пятно: тёмно-синяя кнопка и без того скрадывает значок, а мерцание
 * подсказывает, что она живая. В светлой теме свечения нет — на белом оно
 * выглядит грязью.
 */
export function NeonButton({ onPress, accessibilityLabel, children, disabled }: Props) {
  const { theme, scheme } = useTheme();
  const styles = useStyles(createStyles);
  const glow = useRef(new Animated.Value(0)).current;

  const lit = scheme === 'dark' && !disabled;

  useEffect(() => {
    if (!lit) {
      glow.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, lit]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.button, disabled && styles.dimmed]}
    >
      {lit && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              backgroundColor: theme.neon,
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.32] }),
              transform: [
                { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) },
              ],
            },
          ]}
        />
      )}
      <View>{children}</View>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: theme.surfaceAlt,
    },
    dimmed: { opacity: 0.4 },
    /** Пятно шире значка и мягче кнопки — свет, а не вторая кнопка. */
    glow: {
      position: 'absolute',
      width: 34,
      height: 34,
      borderRadius: 17,
    },
  });
