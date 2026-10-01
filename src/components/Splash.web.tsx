import Constants from 'expo-constants';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';

/**
 * Заставка в браузере — не ролики, а горизонтальный снимок из шапки
 * лендинга: ролики вертикальные, на широком экране их резало по лицу, а
 * пока плеер грузил файл, мелькали оба. Снимок прижат к лицу Poly
 * (object-position), так что и на узком, и на широком окне она в кадре.
 */
const BANNER = require('../../assets/splash-web.jpg');

/** Без ролика шесть секунд — долго: хватает пары, тап снимает сразу. */
const HOLD_MS = 2500;

interface Props {
  onDone: () => void;
}

export function Splash({ onDone }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const dismissed = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: false }).start(() => onDone());
  }, [onDone, opacity]);

  useEffect(() => {
    const timer = setTimeout(dismiss, HOLD_MS);
    return () => clearTimeout(timer);
  }, [dismiss]);

  // require картинки на вебе — объект с uri или сама строка, смотря по сборке.
  const src = typeof BANNER === 'string' ? BANNER : (BANNER as { uri: string }).uri;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Pressable style={styles.tapArea} onPress={dismiss}>
        <img
          src={src}
          alt="Madame Poly"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            // Лицо Poly — чуть правее середины и в верхней трети снимка.
            objectPosition: '56% 22%',
          }}
        />

        <View style={styles.scrim} />

        <View style={styles.caption}>
          <Text style={styles.title}>Madame Poly</Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
          <Text style={styles.taglineMore}>{t.taglineMore}</Text>
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

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0B1046',
    zIndex: 10,
  },
  tapArea: { flex: 1 },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    backgroundImage: 'linear-gradient(to bottom, rgba(4,8,40,0), rgba(4,8,40,0.8))',
  } as object,
  caption: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', gap: 4 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  tagline: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', opacity: 0.9 },
  taglineMore: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 4,
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 26, alignItems: 'center', gap: 2 },
  footerText: { color: '#FFFFFF', fontSize: 12, opacity: 0.8 },
  footerVersion: { color: '#FFFFFF', fontSize: 11, opacity: 0.6, marginTop: 2 },
});
