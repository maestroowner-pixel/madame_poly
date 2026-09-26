import { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { Status } from '../hooks/useConversation';
import { t } from '../i18n';
import { PORTRAIT_SCALE, useTablet } from '../layout';
import { useStyles, useTheme, type Theme } from '../theme';
import { TutorPortrait } from './Avatar';

interface Props {
  status: Status;
  topicId: string | null;
}

const SMALL = { width: 74, height: 88 };
const LARGE = { width: 156, height: 186 };

/**
 * На планшете портрет крупнее телефонного в PORTRAIT_SCALE раз и не
 * раскрывается по тапу — он и так большой. В альбомной ориентации высота
 * ограничена 40 % экрана, иначе ленте не осталось бы места.
 */
function tabletSize(screenHeight: number): { width: number; height: number } {
  const height = Math.min(SMALL.height * PORTRAIT_SCALE, screenHeight * 0.4);
  return { width: Math.round((height * SMALL.width) / SMALL.height), height: Math.round(height) };
}

/**
 * Портрет собеседницы в центре шапки. Точка в углу заменяет подпись: зелёная —
 * микрофон открыт, красная — закрыт. Строка текста занимала место и читалась
 * дольше, чем цвет. Тап по портрету увеличивает его.
 */
export function TutorStrip({ status, topicId }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [expanded, setExpanded] = useState(false);
  const tablet = useTablet();
  const { height: screenHeight } = useWindowDimensions();
  const size = tablet ? tabletSize(screenHeight) : expanded ? LARGE : SMALL;
  const listening = status === 'listening';

  return (
    <View style={styles.wrapper}>
      <Pressable
        disabled={tablet}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded((open) => !open);
        }}
      >
        <TutorPortrait width={size.width} height={size.height} topicId={topicId} />

        <View
          accessibilityLabel={listening ? t.listening : t.notListening}
          style={[
            styles.dot,
            { backgroundColor: listening ? '#3BC46A' : '#E0453F' },
          ]}
        />
      </Pressable>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { alignItems: 'center' },
    /** Обводка в цвет фона отделяет точку от снимка под ней. */
    dot: {
      position: 'absolute',
      top: -3,
      right: -3,
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 3,
      borderColor: theme.bg,
    },
  });
