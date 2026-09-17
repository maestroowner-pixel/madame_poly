import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { SpeakerIcon } from './icons';
import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';
import type { CardDirection } from '../types';

interface Props {
  front: string;
  back: string;
  /** Транскрипция под словом — на той стороне, где оно. */
  frontNote?: string;
  backNote?: string;
  flipped: boolean;
  onFlip: () => void;
  /** Озвучить слово — кнопка в углу, нажатие на неё карточку не переворачивает. */
  onSpeak?: () => void;
  speaking?: boolean;
}

const FLIP_MS = 320;

/**
 * Карточка, которая переворачивается вокруг вертикальной оси: две стороны
 * лежат друг на друге, задняя повёрнута на 180°, и обе прячут изнанку —
 * в каждый момент видна ровно одна. Поворот ведёт нативный поток, чтобы
 * анимация не спотыкалась о загрузку озвучки.
 */
export function FlipCard({ front, back, frontNote, backNote, flipped, onFlip, onSpeak, speaking }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  const turn = useRef(new Animated.Value(flipped ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(turn, {
      toValue: flipped ? 1 : 0,
      duration: FLIP_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [flipped, turn]);

  // Новая карточка появляется лицом сразу, без обратного поворота.
  useEffect(() => {
    turn.setValue(0);
  }, [front, turn]);

  const frontSpin = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backSpin = turn.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const speaker = onSpeak && (
    <Pressable
      onPress={onSpeak}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t.tabListen}
      style={styles.speaker}
    >
      <SpeakerIcon size={22} color={speaking ? theme.neon : theme.textMuted} />
    </Pressable>
  );

  return (
    <Pressable onPress={onFlip} style={styles.box}>
      <Animated.View style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: frontSpin }] }]}>
        <Text style={styles.frontText}>{front}</Text>
        {frontNote && <Text style={styles.note}>{frontNote}</Text>}
        <Text style={styles.hint}>{t.wordsFlipHint}</Text>
        {speaker}
      </Animated.View>
      <Animated.View
        style={[
          styles.face,
          styles.backFace,
          { transform: [{ perspective: 1000 }, { rotateY: backSpin }] },
        ]}
      >
        <Text style={styles.backCaption} numberOfLines={1}>
          {front}
        </Text>
        <Text style={styles.backText}>{back}</Text>
        {backNote && <Text style={styles.note}>{backNote}</Text>}
        {speaker}
      </Animated.View>
    </Pressable>
  );
}

interface DirectionProps {
  /** Код изучаемого языка и языка интерфейса — подписи вроде «EN → RU». */
  learning: string;
  native: string;
  value: CardDirection;
  onChange: (direction: CardDirection) => void;
}

/** Куда смотрит карточка: слово → перевод или перевод → слово. */
export function DirectionToggle({ learning, native, value, onChange }: DirectionProps) {
  const styles = useStyles(createStyles);
  const options: { key: CardDirection; label: string }[] = [
    { key: 'forward', label: `${learning.toUpperCase()} → ${native.toUpperCase()}` },
    { key: 'reverse', label: `${native.toUpperCase()} → ${learning.toUpperCase()}` },
  ];

  return (
    <View style={styles.toggle}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[styles.toggleItem, active && styles.toggleItemActive]}
          >
            <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    box: { height: 220 },
    face: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: 20,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      backfaceVisibility: 'hidden',
    },
    backFace: { backgroundColor: theme.surfaceAlt },
    frontText: { color: theme.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
    backText: { color: theme.text, fontSize: 22, fontWeight: '600', textAlign: 'center' },
    backCaption: { color: theme.textMuted, fontSize: 13 },
    note: { color: theme.textMuted, fontSize: 16, textAlign: 'center' },
    hint: { color: theme.textMuted, fontSize: 12 },
    speaker: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },

    toggle: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: 12,
      backgroundColor: theme.surfaceAlt,
    },
    toggleItem: {
      flex: 1,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleItemActive: { backgroundColor: theme.surface },
    toggleLabel: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
    toggleLabelActive: { color: theme.neon },
  });
