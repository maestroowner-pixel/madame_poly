import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookIcon, ChatIcon, EarIcon, HomeIcon, PenIcon } from './icons';
import { NeonButton } from './NeonButton';
import { measureAnchor, type Anchor } from '../anchor';
import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';

/** Пять разделов приложения. Порядок — от ежедневного к редкому. */
export type Screen = 'talk' | 'listen' | 'write' | 'book' | 'settings';

export const SCREEN_ICONS = {
  talk: ChatIcon,
  listen: EarIcon,
  write: PenIcon,
  book: BookIcon,
  settings: HomeIcon,
};

export function screenLabels(): Record<Screen, string> {
  return {
    talk: t.tabTalk,
    listen: t.tabListen,
    write: t.tabWrite,
    book: t.tabBook,
    settings: t.tabSettings,
  };
}

/**
 * Домик в левом углу — он же вход в список разделов. Замеряет себя при нажатии:
 * список должен висеть ровно под ним, а не гадать про высоту шапки и вырез.
 */
export function MenuButton({ onPress }: { onPress: (anchor: Anchor | null) => void }) {
  const { theme } = useTheme();
  const ref = useRef<View>(null);

  return (
    <View ref={ref} collapsable={false}>
      <NeonButton onPress={() => measureAnchor(ref, onPress)} accessibilityLabel={t.screens}>
        <HomeIcon size={24} color={theme.neon} />
      </NeonButton>
    </View>
  );
}

/** Медленное разгорание — то же дыхание, что у значков в шапке. */
function usePulse(): Animated.Value {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return pulse;
}

/** Заголовок раздела: свой значок и название, оба неоном и с мерцанием. */
export function ScreenTitle({ screen, title }: { screen: Screen; title?: string }) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  const pulse = usePulse();
  const Icon = SCREEN_ICONS[screen];

  return (
    <Animated.View
      style={[
        styles.titleRow,
        { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) },
      ]}
    >
      <Icon size={20} color={theme.neon} />
      <Text style={styles.titleText} numberOfLines={1}>
        {title ?? screenLabels()[screen]}
      </Text>
    </Animated.View>
  );
}

interface MenuProps {
  current: Screen;
  /** Где стоит домик — под ним и раскрывается список. */
  anchor: Anchor | null;
  onSelect: (screen: Screen) => void;
  onClose: () => void;
}

/**
 * Список разделов, выпадающий из-под домика. Нижней панели у нас нет намеренно:
 * она отнимала бы полоску экрана у ленты, а внизу и без того живёт кнопка
 * беседы — главный орган управления.
 */
export function ScreenMenu({ current, anchor, onSelect, onClose }: MenuProps) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  const labels = screenLabels();

  return (
    <View style={styles.overlay}>
      {/* Нажатие мимо списка закрывает его — так ведут себя все меню. */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.card, anchor ? { top: anchor.y + 28 } : null]}>
        {(Object.keys(SCREEN_ICONS) as Screen[]).map((screen) => {
          const Icon = SCREEN_ICONS[screen];
          const active = screen === current;
          return (
            <Pressable
              key={screen}
              onPress={() => {
                onSelect(screen);
                onClose();
              }}
              style={[styles.row, active && styles.rowActive]}
            >
              <Icon size={20} color={active ? theme.neon : theme.textMuted} />
              <Text style={[styles.label, active && styles.labelActive]}>{labels[screen]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    /** Под домиком, а не по центру: видно, откуда список появился. */
    card: {
      position: 'absolute',
      top: 96,
      left: 16,
      minWidth: 196,
      padding: 6,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    rowActive: { backgroundColor: theme.surfaceAlt },
    label: { color: theme.textMuted, fontSize: 15, fontWeight: '600' },
    labelActive: { color: theme.neon, fontWeight: '700' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    titleText: { color: theme.neon, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  });
