import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Status } from '../hooks/useConversation';
import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';

interface Props {
  status: Status;
}

const LABELS: Record<Status, string> = {
  idle: t.notListening,
  listening: t.listening,
  transcribing: t.recognising,
  thinking: t.thinkingShort,
  speaking: t.speakingMicOff,
};

/**
 * Осциллограмма входа: пока приложение слушает, полоски дышат по громкости;
 * как только микрофон выключен, они схлопываются в ровную линию. Это главный
 * ответ на вопрос «меня сейчас слышно или нет».
 */
/**
 * Строка состояния под портретом: слушает приложение или нет. Сама
 * осциллограмма переехала в кнопку — там она отвечает на тот же вопрос, но не
 * занимает отдельной панели.
 */
export function Waveform({ status }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const listening = status === 'listening';

  return (
    <View style={styles.panel}>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: listening ? theme.highlight : theme.border }]} />
        <Text style={[styles.label, listening && styles.labelActive]}>{LABELS[status]}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    panel: { alignItems: 'center' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 7, height: 7, borderRadius: 4 },
    label: { color: theme.textMuted, fontSize: 12 },
    labelActive: { color: theme.highlight, fontWeight: '600' },
  });
