import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronIcon } from './icons';
import { t } from '../i18n';
import { formatTime, syncReminders } from '../services/reminders';
import { DEFAULT_REMINDERS, loadReminderSettings, saveReminderSettings } from '../storage';
import { useStyles, useTheme, type Theme } from '../theme';
import type { ClockTime, ReminderSettings } from '../types';

/** Шаг стрелок времени: полчаса — точнее для напоминания не нужно. */
const STEP_MINUTES = 30;
const DAY_MINUTES = 24 * 60;

const shift = ({ hour, minute }: ClockTime, step: number): ClockTime => {
  const total = (hour * 60 + minute + step + DAY_MINUTES) % DAY_MINUTES;
  return { hour: Math.floor(total / 60), minute: total % 60 };
};

/** Время со стрелками по бокам: на полчаса назад и вперёд, по кругу через полночь. */
function TimeStepper({ value, onChange }: { value: ClockTime; onChange: (next: ClockTime) => void }) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(shift(value, -STEP_MINUTES))} hitSlop={8} style={styles.arrow}>
        <ChevronIcon size={18} color={theme.neon} direction="left" />
      </Pressable>
      <Text style={styles.time}>{formatTime(value)}</Text>
      <Pressable onPress={() => onChange(shift(value, STEP_MINUTES))} hitSlop={8} style={styles.arrow}>
        <ChevronIcon size={18} color={theme.neon} direction="right" />
      </Pressable>
    </View>
  );
}

/**
 * Напоминания в настройках: «повторить слова» — два времени, утро и вечер,
 * и «позаниматься» — одно. Нажатие на название включает и выключает,
 * стрелки двигают время на полчаса. Строки сами хранят настройки и
 * перестраивают расписание в системе.
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

  const { review, practice } = settings;

  return (
    <View style={styles.block}>
      <Text style={styles.caption}>{t.reminders}</Text>

      <View style={[styles.row, review ? styles.rowTall : null]}>
        <Pressable
          onPress={() => apply({ ...settings, review: review ? null : DEFAULT_REMINDERS.review })}
          style={styles.head}
        >
          <Text style={styles.label}>{t.remindReview}</Text>
          {!review && <Text style={[styles.value, styles.valueOff]}>{t.remindOff}</Text>}
        </Pressable>
        {review && (
          <View style={styles.pair}>
            {review.map((time, position) => (
              <TimeStepper
                key={position}
                value={time}
                onChange={(next) => {
                  const times = [...review] as [ClockTime, ClockTime];
                  times[position] = next;
                  apply({ ...settings, review: times });
                }}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Pressable
          onPress={() => apply({ ...settings, practice: practice ? null : DEFAULT_REMINDERS.practice })}
          style={styles.head}
        >
          <Text style={styles.label}>{t.remindPractice}</Text>
          {!practice && <Text style={[styles.value, styles.valueOff]}>{t.remindOff}</Text>}
        </Pressable>
        {practice && (
          <TimeStepper value={practice} onChange={(next) => apply({ ...settings, practice: next })} />
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
    /** Два времени в ряд с названием не помещаются — ставим их строкой ниже. */
    rowTall: { flexDirection: 'column', alignItems: 'stretch', gap: 6 },
    head: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 34 },
    label: { color: theme.text, fontSize: 14, fontWeight: '600', flex: 1 },
    value: { color: theme.neon, fontSize: 14, fontWeight: '700' },
    valueOff: { color: theme.textMuted, fontWeight: '600' },
    pair: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 2 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    /** Фиксированная ширина: «10:00» и «19:00» стоят одинаково, стрелки не гуляют. */
    time: {
      color: theme.neon,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 20,
      width: 56,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    arrow: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    denied: { color: theme.dangerText, fontSize: 12, lineHeight: 17 },
  });
