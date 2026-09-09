import { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';

import type { Status } from '../hooks/useConversation';
import { useStyles, useTheme, type Theme } from '../theme';
import { TutorPortrait } from './Avatar';
import { Waveform } from './Waveform';

interface Props {
  status: Status;
  topicId: string | null;
}

const SMALL = { width: 74, height: 88 };
const LARGE = { width: 156, height: 186 };

/**
 * Портрет собеседницы и строка состояния под ним. Живёт в центре шапки, вровень
 * со строкой языка: отдельная полоса под шапкой съедала высоту зря.
 * Тап по портрету увеличивает его.
 */
export function TutorStrip({ status, topicId }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [expanded, setExpanded] = useState(false);
  const size = expanded ? LARGE : SMALL;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded((open) => !open);
        }}
      >
        <TutorPortrait width={size.width} height={size.height} topicId={topicId} />
      </Pressable>

      <Waveform status={status} />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { alignItems: 'center', gap: 4 },
  });
