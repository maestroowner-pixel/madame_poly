import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';
import type { Status } from '../hooks/useConversation';
import type { TurnMode } from '../types';
import { WaveBars } from './WaveBars';

interface Props {
  status: Status;
  sessionActive: boolean;
  durationMillis: number;
  mode: TurnMode;
  /** Уровень входа 0…1 — рисуется прямо в кнопке. */
  inputLevel: number;
  onToggleSession: () => void;
  /** Закончить реплику в ручном режиме. */
  onEndTurn: () => void;
  /** Открыть микрофон в ручном режиме, когда человек готов отвечать. */
  onBeginTurn: () => void;
  onToggleMode: () => void;
}

function formatDuration(millis: number): string {
  const seconds = Math.floor(millis / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Полоса на всю ширину и слева от неё переключатель авторежима. Подсвечен —
 * приложение само ловит паузу; погашен — конец фразы отмечаете вы, и полоса
 * превращается в «Готово». Отдельной строки под режим не выделяем: на
 * маленьком экране место дороже.
 */
export function RecordButton({
  status,
  sessionActive,
  durationMillis,
  mode,
  inputLevel,
  onToggleSession,
  onEndTurn,
  onBeginTurn,
  onToggleMode,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const auto = mode === 'auto';
  const listening = status === 'listening';
  const working = status === 'transcribing' || status === 'thinking' || status === 'speaking';
  const timer = formatDuration(durationMillis);

  // В ручном режиме полоса заканчивает реплику, а беседу закрывает долгий тап.
  const manualTurn = sessionActive && !auto && listening;
  // Ответ доиграл, микрофон закрыт: ждём, пока человек прочитает и будет готов.
  const manualWait = sessionActive && !auto && !listening && !working;

  const label = !sessionActive
    ? t.start
    : working
      ? status === 'transcribing'
        ? t.transcribing
        : status === 'thinking'
          ? t.thinking
          : t.answering
      : manualTurn
        ? `${t.done} · ${timer}`
        : manualWait
          ? t.answer
          : listening
          ? `${t.stop} · ${timer}`
          : t.stop;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={onToggleMode}
          disabled={sessionActive}
          style={[styles.auto, auto && styles.autoOn, sessionActive && styles.dimmed]}
        >
          <Text style={[styles.autoLabel, auto && styles.autoLabelOn]}>{t.auto}</Text>
        </Pressable>

        <Pressable
          onPress={manualTurn ? onEndTurn : manualWait ? onBeginTurn : onToggleSession}
          onLongPress={manualTurn || manualWait ? onToggleSession : undefined}
          style={[styles.bar, listening && styles.barListening]}
        >
          {/* Осциллограмма живёт фоном под подписью: видно, что микрофон открыт. */}
          {listening && (
            <View style={styles.waves} pointerEvents="none">
              <WaveBars level={inputLevel} active height={26} color={theme.danger} />
            </View>
          )}

          {working && <ActivityIndicator size="small" color={theme.danger} />}
          <Text style={[styles.label, listening && styles.labelListening]}>{label}</Text>
        </Pressable>
      </View>

      {(manualTurn || manualWait) && <Text style={styles.hint}>{t.longPressToFinish}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, gap: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    auto: {
      width: 58,
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
    },
    /** Подсветка включённого авторежима — тот же кант, что у главной кнопки. */
    autoOn: { backgroundColor: theme.ctaBg, borderColor: theme.ctaBorder },
    autoLabel: { color: theme.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    autoLabelOn: { color: theme.ctaText },
    dimmed: { opacity: 0.5 },

    bar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      borderRadius: 14,
      borderWidth: 2,
      backgroundColor: theme.ctaBg,
      borderColor: theme.ctaBorder,
    },
    barListening: { backgroundColor: theme.surface, borderColor: theme.danger },
    waves: {
      position: 'absolute',
      top: 0,
      left: 10,
      right: 10,
      bottom: 0,
      justifyContent: 'center',
      opacity: 0.28,
    },
    label: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], color: theme.ctaText },
    labelListening: { color: theme.danger },
    hint: { color: theme.textMuted, fontSize: 11, textAlign: 'center' },
  });
