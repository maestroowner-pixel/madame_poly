import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { REVIEW_REMINDER_TIMES, formatTime, syncReminders } from '../services/reminders';
import { loadReminderSettings, saveReminderSettings } from '../storage';
import { useStyles, type Theme } from '../theme';
import type { ClockTime, ReminderSettings } from '../types';

/** Шаг стрелок времени: полчаса — точнее для напоминания не нужно. */
const STEP_MINUTES = 30;
const DAY_MINUTES = 24 * 60;

const shift = ({ hour, minute }: ClockTime, step: number): ClockTime => {
  const total = (hour * 60 + minute + step + DAY_MINUTES) % DAY_MINUTES;
  return { hour: Math.floor(total / 60), minute: total % 60 };
};

/**
 * Две строки в настройках: «повторить слова» — включено или нет, время
 * фиксировано, и «позаниматься» — своё время, стрелки двигают его на полчаса.
 * Строки сами хранят настройки и перестраивают расписание в системе.
 */
export function ReminderRows() {
  const styles = useStyles(createStyles);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    void loadReminderSettings().then(setSettings);
  }, []);

  const apply = (next: ReminderSettings) => {
    setSettings(next);
    void saveReminderSettings(next).then(syncReminders).then((ok) => setDenied(!ok));
  };

  if (!settings) return null;

  const practice = settings.practice;

  return (
    <View style={styles.block}>
      <Text style={styles.caption}>{t.reminders}</Text>

      <Pressable onPress={() => apply({ ...settings, review: !settings.review })} style={styles.row}>
        <Text style={styles.label}>{t.remindReview}</Text>
        <Text style={[styles.value, !settings.review && styles.valueOff]}>
          {settings.review ? REVIEW_REMINDER_TIMES.map(formatTime).join(' · ') : t.remindOff}
        </Text>
      </Pressable>

      <View style={styles.row}>
        <Pressable
          onPress={() => apply({ ...settings, practice: practice ? null : { hour: 18, minute: 0 } })}
          style={styles.grow}
        >
          <Text style={styles.label}>{t.remindPractice}</Text>
        </Pressable>
        {practice ? (
          <View style={styles.stepper}>
            <Pressable
              onPress={() => apply({ ...settings, practice: shift(practice, -STEP_MINUTES) })}
              hitSlop={8}
              style={styles.arrow}
            >
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
            <Text style={styles.value}>{formatTime(practice)}</Text>
            <Pressable
              onPress={() => apply({ ...settings, practice: shift(practice, STEP_MINUTES) })}
              hitSlop={8}
              style={styles.arrow}
            >
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => apply({ ...settings, practice: { hour: 18, minute: 0 } })}>
            <Text style={[styles.value, styles.valueOff]}>{t.remindOff}</Text>
          </Pressable>
        )}
      </View>

      {denied && <Text style={styles.denied}>{t.remindDenied}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    block: { gap: 8 },
    caption: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 46,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
    },
    grow: { flex: 1, justifyContent: 'center', minHeight: 34 },
    label: { color: theme.text, fontSize: 14, fontWeight: '600', flex: 1 },
    value: { color: theme.neon, fontSize: 14, fontWeight: '700' },
    valueOff: { color: theme.textMuted, fontWeight: '600' },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    arrow: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    arrowText: { color: theme.neon, fontSize: 22, lineHeight: 26, fontWeight: '600' },
    denied: { color: theme.dangerText, fontSize: 12, lineHeight: 17 },
  });
