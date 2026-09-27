import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

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
 * Полоса во всю ширину, переключатель авторежима — внутри неё, у левого края.
 * Это обычный тумблер, как у уведомлений в настройках: по нему сразу видно,
 * включён режим или нет. Включён — приложение само ловит паузу; выключен —
 * конец фразы отмечаете вы, и полоса превращается в «Готово». Ни отдельной строки, ни соседней кнопки
 * под режим не выделяем: на маленьком экране место дороже.
 *
 * Беседа закрывается долгим нажатием в два шага: первое выводит из авторежима,
 * второе заканчивает разговор. Одним движением не выйдет — в авторежиме
 * микрофон открывается сам после каждой реплики, и беседа тут же начиналась
 * заново.
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
  // Первый долгий тап в авторежиме только выключает авто, беседу рвёт второй.
  const longPress = sessionActive ? (auto ? onToggleMode : onToggleSession) : undefined;

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

  // Пока идёт беседа полоса красная — подпись тумблера перекрашивается вместе с ней.
  const tint = listening ? theme.danger : theme.ctaText;
  /** Выключенный тумблер — приглушённая дорожка, видная и на цветной полосе. */
  const offTrack = listening ? theme.border : 'rgba(255,255,255,0.28)';

  return (
    <View style={styles.container}>
      <Pressable
        onPress={manualTurn ? onEndTurn : manualWait ? onBeginTurn : onToggleSession}
        onLongPress={longPress}
        style={[styles.bar, listening && styles.barListening]}
      >
        {/* Осциллограмма живёт фоном под подписью: видно, что микрофон открыт. */}
        {listening && (
          <View style={styles.waves} pointerEvents="none">
            <WaveBars level={inputLevel} active height={26} color={theme.danger} />
          </View>
        )}

        {working && <ActivityIndicator size="small" color={theme.danger} />}
        <Text style={[styles.label, listening && styles.labelListening]} numberOfLines={1}>
          {label}
        </Text>

        {/* Тумблер работает и во время беседы: из авторежима нужно уметь выйти
            посреди разговора, иначе микрофон открывается снова и снова. */}
        <View style={styles.auto}>
          <Switch
            value={auto}
            onValueChange={onToggleMode}
            trackColor={{ true: listening ? theme.danger : theme.ctaBorder, false: offTrack }}
            ios_backgroundColor={offTrack}
            thumbColor="#FFFFFF"
            style={styles.autoSwitch}
            accessibilityLabel={t.auto}
          />
          <Text style={[styles.autoLabel, { color: tint }]}>{t.auto}</Text>
        </View>
      </Pressable>

      {sessionActive && (
        <Text style={styles.hint}>{auto ? t.longPressToManual : t.longPressToFinish}</Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, gap: 4 },

    /** Тумблер лежит поверх полосы, чтобы подпись оставалась по центру. */
    auto: {
      position: 'absolute',
      left: 8,
      top: 0,
      bottom: 0,
      width: 52,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
    },
    /** Системный тумблер крупноват для полосы в 50 точек — уменьшаем. */
    autoSwitch: { transform: [{ scale: 0.72 }], marginVertical: -5 },
    autoLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      // Поля под значок режима и симметричные им справа — подпись не наезжает.
      paddingHorizontal: 68,
      borderRadius: 14,
      borderWidth: 2,
      backgroundColor: theme.ctaBg,
      borderColor: theme.ctaBorder,
    },
    barListening: { backgroundColor: theme.surface, borderColor: theme.danger },
    waves: {
      position: 'absolute',
      top: 0,
      left: 68,
      right: 16,
      bottom: 0,
      justifyContent: 'center',
      opacity: 0.28,
    },
    label: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], color: theme.ctaText },
    labelListening: { color: theme.danger },
    hint: { color: theme.textMuted, fontSize: 11, textAlign: 'center' },
  });
