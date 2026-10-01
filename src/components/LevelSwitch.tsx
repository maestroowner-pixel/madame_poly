import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { BUTTON_SCALE } from '../layout';
import { useStyles, type Theme } from '../theme';
import { Volume } from './WideButton';

/** Клавиша размером с домик в той же шапке — пара по краям. */
const SIZE = 42 * BUTTON_SCALE;

interface Props<T extends string> {
  /** Нынешнее значение — его и видно в шапке. */
  value: T;
  /** Круг значений: после последнего — снова первое. */
  steps: readonly T[];
  /** Как подписать значение; по умолчанию — как есть. */
  label?: (value: T) => string;
  onChange: (next: T) => void;
}

/**
 * Уровень в шапке раздела — он же переключатель: нажатие предлагает следующий
 * по кругу (B1 → B2 → … → C2 → A1) и меняет только после «Сменить». Без
 * подтверждения случайный тап по углу экрана молча уводил бы на другой
 * уровень — а с ним и списки, уроки, диктанты.
 */
export function LevelSwitch<T extends string>({ value, steps, label = (v) => v, onChange }: Props<T>) {
  const styles = useStyles(createStyles);
  const [asking, setAsking] = useState(false);

  const position = steps.indexOf(value);
  const next = steps[(position + 1) % steps.length];

  return (
    <>
      {/* Квадратная клавиша, как «АВТО» у кнопки беседы: тот же цвет, блик и тень. */}
      <View style={[styles.lift, { borderRadius: 14 * BUTTON_SCALE }]}>
        <Pressable
          onPress={() => setAsking(true)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${t.levelSwitchLabel}: ${label(value)}`}
          // Размер — как у домика, мимо общего масштаба стилей: он уже в SIZE.
          // Ступень грамматики «B1–B2» шире уровня — клавиша растёт вширь.
          style={({ pressed }) => [
            styles.key,
            { minWidth: SIZE, height: SIZE, borderRadius: 14 * BUTTON_SCALE },
            pressed && styles.pressed,
          ]}
        >
          <Volume />
          <Text style={styles.level} numberOfLines={1} adjustsFontSizeToFit>
            {label(value)}
          </Text>
        </Pressable>
      </View>

      <Modal visible={asking} transparent animationType="fade" onRequestClose={() => setAsking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAsking(false)}>
          {/* Нажатие по самой карточке не должно закрывать её, как нажатие мимо. */}
          <Pressable style={styles.card} onPress={() => undefined}>
            <Text style={styles.question}>{t.levelSwitchAsk(label(next))}</Text>
            <View style={styles.row}>
              <Pressable onPress={() => setAsking(false)} style={[styles.choice, styles.cancel]}>
                <Text style={styles.cancelLabel}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAsking(false);
                  onChange(next);
                }}
                style={[styles.choice, styles.confirm]}
              >
                <Text style={styles.confirmLabel}>{t.levelSwitchYes}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    lift: {
      marginLeft: 'auto',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    },
    key: {
      overflow: 'hidden',
      paddingHorizontal: 6,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.ctaBg,
      borderColor: theme.ctaBorder,
    },
    pressed: { transform: [{ translateY: 1.5 }], opacity: 0.92 },
    level: { color: theme.ctaText, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    card: {
      width: '100%',
      maxWidth: 340,
      gap: 18,
      padding: 20,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    question: { color: theme.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    row: { flexDirection: 'row', gap: 10 },
    choice: { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cancel: { backgroundColor: theme.surfaceAlt },
    cancelLabel: { color: theme.neon, fontSize: 15, fontWeight: '600' },
    confirm: { backgroundColor: theme.ctaBg, borderWidth: 2, borderColor: theme.ctaBorder },
    confirmLabel: { color: theme.ctaText, fontSize: 15, fontWeight: '700' },
  });
