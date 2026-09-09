import Constants from 'expo-constants';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { SPLASH_HOLD_MS } from '../config';
import { t } from '../i18n';
import { useStyles } from '../theme';

interface Props {
  onDone: () => void;
}

/**
 * Заставка на запуске: логотип под гонг. Висит ровно столько, сколько звучит
 * звук, но не мигает и не задерживает дольше потолка. Тап снимает её сразу.
 */
export function Splash({ onDone }: Props) {
  const styles = useStyles(createStyles);

  const player = useAudioPlayer(require('../../assets/splash.m4a'));
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
        <Image source={require('../../assets/splash.png')} style={styles.photo} resizeMode="cover" />

        {/* Затемнение снизу: по светлым участкам снимка белый текст теряется. */}
        <View style={styles.scrim} />

        <View style={styles.caption}>
          <Text style={styles.title}>Madame Poly</Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Kuka Lab</Text>
          <Text style={styles.footerText}>Mykhaylo Osypov</Text>
          <Text style={styles.footerVersion}>{Constants.expoConfig?.version ?? ''}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // Фон прибит к тёмному, а не взят из темы: пока снимок грузится, светлая
      // тема давала белую вспышку перед портретом.
      backgroundColor: '#0B1046',
      zIndex: 10,
    },
    tapArea: { flex: 1 },
    photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
    scrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 260,
      backgroundColor: 'rgba(4,8,40,0.55)',
    },
    caption: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', gap: 4 },
    title: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
    tagline: { color: '#FFFFFF', fontSize: 14, opacity: 0.85 },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 26, alignItems: 'center', gap: 2 },
    footerText: { color: '#FFFFFF', fontSize: 12, opacity: 0.8 },
    footerVersion: { color: '#FFFFFF', fontSize: 11, opacity: 0.6, marginTop: 2 },
  });
