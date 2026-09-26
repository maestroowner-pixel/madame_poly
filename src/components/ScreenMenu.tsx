import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { BookIcon, ChatIcon, EarIcon, ExamIcon, GrammarIcon, HomeIcon, PenIcon, WordsIcon } from './icons';
import { GlassPanel } from './GlassPanel';
import { NeonButton } from './NeonButton';
import { measureAnchor, type Anchor } from '../anchor';
import { BUTTON_ICON_SCALE, BUTTON_SCALE, IS_TABLET, UI_SCALE } from '../layout';
import { t } from '../i18n';
import { scaleStyles, useStyles, useTheme, type Theme } from '../theme';

/** Восемь разделов приложения. Порядок — от ежедневного к редкому. */
export type Screen = 'talk' | 'listen' | 'write' | 'words' | 'grammar' | 'exam' | 'book' | 'settings';

export const SCREEN_ICONS = {
  talk: ChatIcon,
  listen: EarIcon,
  write: PenIcon,
  words: WordsIcon,
  grammar: GrammarIcon,
  exam: ExamIcon,
  book: BookIcon,
  settings: HomeIcon,
};

export function screenLabels(): Record<Screen, string> {
  return {
    talk: t.tabTalk,
    listen: t.tabListen,
    write: t.tabWrite,
    words: t.tabWords,
    grammar: t.tabGrammar,
    exam: t.tabExam,
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
  const scale = BUTTON_ICON_SCALE;
  const ref = useRef<View>(null);

  return (
    <View ref={ref} collapsable={false}>
      <NeonButton onPress={() => measureAnchor(ref, onPress)} accessibilityLabel={t.screens}>
        <HomeIcon size={24 * scale} color={theme.neon} />
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
  /** Разделы, закрытые для текущего языка, — в списке их нет. */
  hidden?: Screen[];
  /** Счётчик у раздела: у «Слов» — сколько карточек ждут повторения. */
  badges?: Partial<Record<Screen, number>>;
  /** Где стоит домик — под ним и раскрывается список. */
  anchor: Anchor | null;
  onSelect: (screen: Screen) => void;
  onClose: () => void;
}

/**
 * Список разделов — панель, выезжающая слева из-за края экрана на высоте домика,
 * как панелька «About Madame Poly» в настройках выезжает снизу. Нижней панели у
 * нас нет намеренно: она отнимала бы полоску экрана у ленты, а внизу и без того
 * живёт кнопка беседы — главный орган управления.
 */
const SLIDE_MS = 220;
/**
 * На планшете меню крупнее остального интерфейса — посередине между ним и
 * кнопкой шапки, из-под которой оно выпадает: мелкий список под большим
 * домиком выглядел чужим.
 */
const MENU_SCALE = IS_TABLET ? (1 + BUTTON_SCALE / UI_SCALE) / 2 : 1;

export function ScreenMenu({ current, hidden = [], badges = {}, anchor, onSelect, onClose }: MenuProps) {
  const { theme } = useTheme();
  const base = useStyles(createStyles);
  const styles = useMemo(() => scaleStyles(base, 1, MENU_SCALE), [base]);
  const labels = screenLabels();
  const { width: screenWidth } = useWindowDimensions();

  /** 0 — панель за левым краем, 1 — на месте. */
  const shown = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    Animated.timing(shown, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [shown]);

  /** Сначала панель уезжает обратно за край, потом меню закрывается. */
  const close = (then?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(shown, {
      toValue: 0,
      duration: SLIDE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      then?.();
      onClose();
    });
  };

  return (
    <View style={styles.overlay}>
      {/* Нажатие мимо списка закрывает его — так ведут себя все меню. */}
      <Animated.View style={[styles.backdrop, styles.shade, { opacity: shown }]}>
        <Pressable style={styles.fill} onPress={() => close()} />
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          anchor ? { top: anchor.y + 21 * BUTTON_SCALE + 7 } : null,
          { transform: [{ translateX: shown.interpolate({ inputRange: [0, 1], outputRange: [-screenWidth, 0] }) }] },
        ]}
      >
        <GlassPanel style={styles.glass}>
        {(Object.keys(SCREEN_ICONS) as Screen[])
          .filter((screen) => !hidden.includes(screen))
          .map((screen) => {
          const Icon = SCREEN_ICONS[screen];
          const active = screen === current;
          return (
            <Pressable
              key={screen}
              onPress={() => close(() => onSelect(screen))}
              style={[styles.row, active && styles.rowActive]}
            >
              <Icon size={20 * MENU_SCALE} color={active ? theme.neon : theme.textMuted} />
              <Text style={[styles.label, active && styles.labelActive]}>{labels[screen]}</Text>
              {badges[screen] ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badges[screen]}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
        </GlassPanel>
      </Animated.View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 },
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    shade: { backgroundColor: 'rgba(0,0,0,0.18)' },
    fill: { flex: 1 },
    /**
     * Под домиком и вплотную к левому краю: выезжает из-за него. Сама карточка
     * — только место и тень; стекло рисует GlassPanel внутри.
     */
    card: {
      position: 'absolute',
      top: 96,
      left: 0,
      minWidth: 212,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    /** Стекло: скругление только справа — слева панель уходит за край экрана. */
    glass: {
      padding: 6,
      paddingLeft: 12,
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      overflow: 'hidden',
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
    badge: {
      marginLeft: 'auto',
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.correctionText,
    },
    badgeText: { color: theme.surface, fontSize: 11, fontWeight: '700' },
    label: { color: theme.textMuted, fontSize: 15, fontWeight: '600' },
    labelActive: { color: theme.neon, fontWeight: '700' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    titleText: { color: theme.neon, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  });
