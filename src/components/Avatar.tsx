import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { findAvatar } from '../avatars';
import { useStyles, useTheme, type Theme } from '../theme';

interface UserProps {
  avatarId: string | null;
  /** Своё фото: если есть, показываем его вместо готовой аватарки. */
  photoUri?: string | null;
  name: string;
  size: number;
}

/** Первые буквы имени — запасной вариант, пока аватарка не выбрана. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** То же для аватарки пользователя: своё фото важнее готового портрета. */
export function userSource(avatarId: string | null, photoUri?: string | null) {
  return photoUri ? { uri: photoUri } : (findAvatar(avatarId)?.photo ?? null);
}

export function UserAvatar({ avatarId, photoUri, name, size }: UserProps) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const avatar = findAvatar(avatarId);
  const letters = initials(name);

  // Своё фото важнее готового, готовое — важнее инициалов.
  const source = photoUri ? { uri: photoUri } : avatar?.photo;

  if (source) {
    return (
      <Image
        source={source}
        style={[styles.photo, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.surfaceAlt,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{letters || '?'}</Text>
    </View>
  );
}

/**
 * Лица собеседника по ролям. Metro требует статических путей, поэтому карта, а
 * не сборка имени файла на лету: добавить роль — положить картинку и вписать
 * сюда одну строку.
 */
const TUTOR_DEFAULT = require('../../assets/tutor.png');
const TUTOR_BY_TOPIC: Record<string, number> = {
  clinic: require('../../assets/tutor-clinic.png'),
  bank: require('../../assets/tutor-bank.png'),
  repair: require('../../assets/tutor-repair.png'),
};

/** Источник картинки собеседницы: нужен, чтобы вставить её прямо в строку текста. */
export function tutorSource(topicId?: string | null) {
  return (topicId && TUTOR_BY_TOPIC[topicId]) || TUTOR_DEFAULT;
}

/** Лицо собеседника: в ролевой теме — соответствующее роли. */
export function TutorAvatar({ size, topicId }: { size: number; topicId?: string | null }) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Image
      source={tutorSource(topicId)}
      style={[styles.tutor, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

/** То же лицо, но прямоугольной карточкой — для панели над лентой. */
export function TutorPortrait({
  width,
  height,
  topicId,
}: {
  width: number;
  height: number;
  topicId?: string | null;
}) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Image
      source={tutorSource(topicId)}
      style={[styles.portrait, { width, height }]}
      resizeMode="cover"
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    circle: { alignItems: 'center', justifyContent: 'center' },
    photo: { borderWidth: 1, borderColor: theme.border },
    initials: { color: theme.textMuted, fontWeight: '700' },
    tutor: { borderWidth: 1, borderColor: theme.border },
    portrait: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
  });
