import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { useStyles, type Theme } from '../theme';

interface Props {
  /** Текст; null — ничего не показывать. Новый текст показывается заново. */
  message: string | null;
  /** Зовётся, когда надпись погасла, — чтобы родитель сбросил message. */
  onHide: () => void;
}

const SHOW_MS = 1800;

/**
 * Короткая надпись поверх экрана: подтверждает действие, которое ничего не
 * показывает само, — например, беседа ушла в архив и лента опустела. Не ловит
 * нажатия и гаснет сама.
 */
export function Toast({ message, onHide }: Props) {
  const styles = useStyles(createStyles);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    opacity.setValue(0);
    const run = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(SHOW_MS),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]);
    run.start(({ finished }) => finished && onHide());
    return () => run.stop();
  }, [message, onHide, opacity]);

  if (!message) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      alignSelf: 'center',
      top: '42%',
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.neon,
    },
    text: { color: theme.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  });
