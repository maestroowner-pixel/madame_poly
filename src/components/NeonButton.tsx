import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useButtonScale } from "../layout";
import { useStyles, useTheme, type Theme } from "../theme";

interface Props {
  onPress: () => void;
  /** Второе действие кнопки — например, открыть то, куда первое что-то кладёт. */
  onLongPress?: () => void;
  accessibilityLabel: string;
  children: ReactNode;
  disabled?: boolean;
  /** Без подложки и свечения — для неактивных вкладок. */
  quiet?: boolean;
  /** Число в уголке кнопки; 0 и пусто — без значка. */
  badge?: number;
  /** Выглядит погашенной, но остаётся нажимаемой (долгое нажатие и т. п.). */
  dim?: boolean;
}

/**
 * Кнопка шапки со значком. В тёмной теме под ним медленно разгорается и гаснет
 * сиреневое пятно: тёмно-синяя кнопка и без того скрадывает значок, а мерцание
 * подсказывает, что она живая. В светлой теме свечения нет — на белом оно
 * выглядит грязью.
 */
export function NeonButton({
  onPress,
  onLongPress,
  accessibilityLabel,
  children,
  disabled,
  quiet,
  badge,
  dim,
}: Props) {
  const { theme, scheme } = useTheme();
  const styles = useStyles(createStyles);
  const glow = useRef(new Animated.Value(0)).current;
  /** На планшете кнопка крупнее; значок внутри увеличивает тот, кто его передаёт. */
  const scale = useButtonScale();
  const box = {
    width: 42 * scale,
    height: 42 * scale,
    borderRadius: 14 * scale,
  };
  const spot = {
    width: 34 * scale,
    height: 34 * scale,
    borderRadius: 17 * scale,
  };

  const lit = scheme === "dark" && !disabled && !quiet && !dim;

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

  const button = (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        box,
        quiet && styles.quiet,
        (disabled || dim) && styles.dimmed,
      ]}
    >
      {lit && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            spot,
            {
              backgroundColor: theme.neon,
              opacity: glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.32],
              }),
              transform: [
                {
                  scale: glow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.72, 1],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      <View>{children}</View>
    </Pressable>
  );

  if (!badge) return button;

  // Значок — поверх угла, снаружи кнопки: у неё overflow hidden ради свечения.
  return (
    <View>
      {button}
      <View
        pointerEvents="none"
        style={[
          styles.badge,
          { minWidth: 18 * scale, height: 18 * scale, borderRadius: 9 * scale },
        ]}
      >
        <Text style={[styles.badgeText, { fontSize: 11 * scale }]}>
          {badge > 99 ? "99+" : badge}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: theme.surfaceAlt,
    },
    quiet: { backgroundColor: "transparent" },
    dimmed: { opacity: 0.4 },
    /** Пятно шире значка и мягче кнопки — свет, а не вторая кнопка. */
    badge: {
      position: "absolute",
      top: -5,
      right: -5,
      paddingHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.neon,
    },
    badgeText: {
      color: theme.surface,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    glow: {
      position: "absolute",
      width: 34,
      height: 34,
      borderRadius: 17,
    },
  });
