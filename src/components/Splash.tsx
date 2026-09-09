import Constants from 'expo-constants';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { SPLASH_HOLD_MS } from '../config';
import { useStyles, type Theme } from '../theme';

interface Props {
  onDone: () => void;
}

/**
 * Заставка: одно изображение во весь экран под гонг. Звук подрезан ровно под
 * длительность показа, чтобы картинка и гонг заканчивались вместе. Тап снимает
 * её сразу, если ждать некогда.
 */
export function Splash({ onDone }: Props) {
  const player = useAudioPlayer(require('../../assets/splash.m4a'));
  const styles = useStyles(createStyles);

  const opacity = useRef(new Animated.Value(1)).current;
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

    // Держим по таймеру, а не по событию «звук доиграл»: на Android оно
    // приходит мгновенно, пока файл ещё грузится, и заставка мигала.
    const timer = setTimeout(dismiss, SPLASH_HOLD_MS);
    return () => clearTimeout(timer);
  }, [dismiss, player]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Pressable style={styles.tapArea} onPress={dismiss}>
        <Image source={require('../../assets/splash.png')} style={styles.image} resizeMode="cover" />

        {/* Затемнение снизу: без него подпись теряется на светлых участках. */}
        <View style={styles.scrim} />
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
    tapArea: { flex: 1 },
    image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
    scrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 150,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center', gap: 2 },
    footerText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    footerVersion: { color: '#FFFFFF', fontSize: 11, opacity: 0.75, marginTop: 2 },
  });
