import Constants from 'expo-constants';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { SPLASH_MAX_MS, SPLASH_MIN_MS, SPLASH_SOUND_MS } from '../config';
import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';

interface Props {
  onDone: () => void;
}

/**
 * Заставка на запуске: логотип под гонг. Висит ровно столько, сколько звучит
 * звук, но не мигает и не задерживает дольше потолка. Тап снимает её сразу.
 */
export function Splash({ onDone }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const player = useAudioPlayer(require('../../assets/splash.m4a'));
  const opacity = useRef(new Animated.Value(1)).current;
  const startedAt = useRef(Date.now());
  const dismissed = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    player.pause();
    Animated.timing(opacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => onDone());
  }, [onDone, opacity, player]);

  useEffect(() => {
    // Гонг должен звучать и при выключенном звонке — это не уведомление.
    void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).then(() => {
      player.play();
    });

    /** Сколько держать заставку: не мигнуть и не задержать. */
    const hold = (ms: number) => Math.min(SPLASH_MAX_MS, Math.max(SPLASH_MIN_MS, ms));

    // Ждём по длительности звука, а не по событию его окончания: на Android
    // событие приходит мгновенно, пока файл ещё грузится.
    let timer = setTimeout(dismiss, hold(SPLASH_SOUND_MS));
    let measured = false;

    const subscription = player.addListener('playbackStatusUpdate', (playback) => {
      if (measured || !playback.isLoaded || playback.duration <= 0) return;
      measured = true;

      clearTimeout(timer);
      const elapsed = Date.now() - startedAt.current;
      timer = setTimeout(dismiss, Math.max(0, hold(playback.duration * 1000) - elapsed));
    });

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [dismiss, player]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Pressable style={styles.tapArea} onPress={dismiss}>
        {/* Радиальное свечение собрано из вложенных кругов — без графических зависимостей. */}
        <Animated.View style={styles.glowOuter} />
        <Animated.View style={styles.glowInner} />

        <Image source={require('../../assets/icon.png')} style={styles.icon} />
        <Text style={styles.title}>Madame Poly</Text>
        <Text style={styles.tagline}>{t.tagline}</Text>

        <Animated.View style={styles.statusRow}>
          <ActivityIndicator size="small" color={theme.textMuted} />
          <Text style={styles.status}>{t.launching}</Text>
        </Animated.View>

        {/* Подпись внизу: чьё приложение и какой версии. */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Kuka Lab</Text>
          <Text style={styles.footerText}>Mykhaylo Osypov</Text>
          <Text style={styles.footerVersion}>{Constants.expoConfig?.version ?? ''}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.bg,
      zIndex: 10,
    },
    tapArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
    footer: { position: 'absolute', bottom: 28, alignItems: 'center', gap: 2 },
    footerText: { color: theme.textMuted, fontSize: 12 },
    footerVersion: { color: theme.textMuted, fontSize: 11, opacity: 0.7, marginTop: 2 },
    glowOuter: {
      position: 'absolute',
      width: 460,
      height: 460,
      borderRadius: 230,
      backgroundColor: theme.accent,
      opacity: 0.07,
    },
    glowInner: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: theme.accent,
      opacity: 0.1,
    },
    icon: {
      width: 168,
      height: 168,
      borderRadius: 38,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },
    title: { color: theme.text, fontSize: 26, fontWeight: '600', marginTop: 4 },
    tagline: { color: theme.textMuted, fontSize: 14, marginTop: -8 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    status: { color: theme.textMuted, fontSize: 12 },
  });
