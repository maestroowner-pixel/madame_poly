import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';
import type { Status } from '../hooks/useConversation';
import type { TurnMode } from '../types';
import { WaveThread } from './WaveThread';
import { THREAD_GOLD, Volume, useSpeechWave } from './WideButton';

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
 * Полоса беседы и слева от неё — квадратная клавиша «АВТО», того же цвета и
 * объёма, через узкий зазор: читается как часть одной кнопки. Включена —
 * яркая, приложение само ловит паузу; выключена — тусклая, конец фразы
 * отмечаете вы, и полоса превращается в «Готово». Отдельной строки под режим
 * не выделяем: на маленьком экране место дороже.
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
  const { theme, scheme } = useTheme();
  const styles = useStyles(createStyles);

  const auto = mode === 'auto';
  const listening = status === 'listening';
  const working = status === 'transcribing' || status === 'thinking' || status === 'speaking';
  /** Мадам Поли отвечает вслух — нить бежит и тогда, в такт её речи. */
  const speaking = status === 'speaking';
  const speechLevel = useSpeechWave(speaking);
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

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Клавиша работает и во время беседы: из авторежима нужно уметь выйти
            посреди разговора, иначе микрофон открывается снова и снова. */}
        <View style={[styles.lift, styles.autoLift, listening && styles.liftListening, !auto && styles.autoOff]}>
          <Pressable
            onPress={onToggleMode}
            accessibilityRole="switch"
            accessibilityState={{ checked: auto }}
            accessibilityLabel={t.auto}
            style={({ pressed }) => [
              styles.bar,
              styles.autoKey,
              listening && styles.barListening,
              pressed && styles.barPressed,
            ]}
          >
            <Volume />
            <Text style={[styles.autoLabel, listening && styles.labelListening]}>{t.auto}</Text>
          </Pressable>
        </View>

        {/* Тень — на обёртке: у самой полосы overflow hidden ради блика. */}
        <View style={[styles.lift, styles.mainLift, listening && styles.liftListening]}>
          <Pressable
            onPress={manualTurn ? onEndTurn : manualWait ? onBeginTurn : onToggleSession}
            onLongPress={longPress}
            style={({ pressed }) => [
              styles.bar,
              styles.mainBar,
              listening && styles.barListening,
              pressed && styles.barPressed,
            ]}
          >
            {/* Объём: светлый блик сверху и тень внизу — полоса как выпуклая клавиша. */}
            <Volume />

            {/* Осциллограмма — золотой нитью под подписью: видно, что микрофон открыт. */}
            {(listening || speaking) && (
              <View style={styles.waves} pointerEvents="none">
                <WaveThread
                  level={listening ? inputLevel : speechLevel}
                  active
                  height={34}
                  color={THREAD_GOLD[scheme]}
                />
              </View>
            )}

            {working && <ActivityIndicator size="small" color={theme.danger} />}
            <Text style={[styles.label, listening && styles.labelListening]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        </View>
      </View>

      {sessionActive && (
        <Text style={styles.hint}>{auto ? t.longPressToManual : t.longPressToFinish}</Text>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, gap: 4 },

    row: { flexDirection: 'row', gap: 4 },

    /**
     * Клавиша «АВТО» — квадрат высотой с полосу. Стык с полосой скруглён
     * меньше наружных углов: две клавиши читаются как одна кнопка.
     */
    autoLift: { width: 50, borderTopRightRadius: 6, borderBottomRightRadius: 6 },
    autoKey: { paddingHorizontal: 0, borderTopRightRadius: 6, borderBottomRightRadius: 6 },
    /** Выключена — тусклая, но различимая: по ней видно, что режим есть. */
    autoOff: { opacity: 0.4 },
    autoLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: theme.ctaText },
    mainLift: { flex: 1, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
    mainBar: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },

    /** Тень под клавишей: снизу и чуть размытая — полоса приподнята над фоном. */
    lift: {
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 7,
      elevation: 6,
    },
    liftListening: { shadowColor: theme.danger, shadowOpacity: 0.3 },
    bar: {
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 2,
      backgroundColor: theme.ctaBg,
      borderColor: theme.ctaBorder,
    },
    barListening: { backgroundColor: theme.surface, borderColor: theme.danger },
    /** Нажатие: клавиша проседает — сдвиг вниз и блик тускнеет. */
    barPressed: { transform: [{ translateY: 1.5 }], opacity: 0.92 },
    waves: {
      position: 'absolute',
      top: 0,
      left: 16,
      right: 16,
      bottom: 0,
      justifyContent: 'center',
      opacity: 0.7,
    },
    label: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], color: theme.ctaText },
    labelListening: { color: theme.danger },
    hint: { color: theme.textMuted, fontSize: 11, textAlign: 'center' },
  });
