import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import type { Status } from '../hooks/useConversation';
import { t } from '../i18n';
import { PORTRAIT_SCALE, useTablet } from '../layout';
import { useStyles, useTheme } from '../theme';
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

/** Цвет мерцания: светлая сирень на тёмном фоне, золото — на светлом. */
const GLOW = { dark: '#D9B8FF', light: '#E3A70F' };

/**
 * Портрет собеседницы в центре шапки. Пока микрофон открыт, контур портрета
 * тихо мерцает — это заменяет подпись «слушаю»: строка текста занимала место и
 * читалась дольше, чем свет. Микрофон закрыт — рамки нет. Тап по портрету
 * увеличивает его.
 */
export function TutorStrip({ status, topicId }: Props) {
  const { scheme } = useTheme();
  const styles = useStyles(createStyles);
  const pulse = useRef(new Animated.Value(0)).current;

  const [expanded, setExpanded] = useState(false);
  const tablet = useTablet();
  const { height: screenHeight } = useWindowDimensions();
  const size = tablet ? tabletSize(screenHeight) : expanded ? LARGE : SMALL;
  const listening = status === 'listening';
  const glow = GLOW[scheme];

  useEffect(() => {
    if (!listening) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  return (
    <View style={styles.wrapper}>
      <Pressable
        disabled={tablet}
        accessibilityLabel={listening ? t.listening : t.notListening}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded((open) => !open);
        }}
      >
        <TutorPortrait width={size.width} height={size.height} topicId={topicId} />

        {listening && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                borderColor: glow,
                shadowColor: glow,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              },
            ]}
          />
        )}
      </Pressable>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    wrapper: { alignItems: 'center' },
    /**
     * Контур чуть снаружи снимка: скругление больше портретного (16) на ширину
     * отступа, чтобы линия шла ровно параллельно краю. Свечение вокруг — тенью
     * на iOS; на Android тени цветной не бывает, там мерцает только линия.
     */
    ring: {
      position: 'absolute',
      top: -3,
      left: -3,
      right: -3,
      bottom: -3,
      borderRadius: 19,
      borderWidth: 2,
      ...Platform.select({
        ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6 },
        default: {},
      }),
    },
  });
