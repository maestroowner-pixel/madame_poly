import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Палитра снята с иконки приложения: светлая тема берёт её холодную половину —
 * голубой верхний угол и белую монограмму, тёмная — индиго нижнего.
 * Все пары текст/фон проверены на контраст, минимум WCAG AA.
 */
export const lightTheme = {
  /** Очень светлый голубой — разбелённый край иконки. */
  bg: '#EFF6FD',
  /** Карточки и пузыри партнёра. */
  surface: '#FFFFFF',
  /** Невыбранные квадраты панели. */
  surfaceAlt: '#DCEBFA',
  border: '#C6DCF2',

  /** Тёмный индиго корпуса иконки — им пишем по светлому. */
  text: '#122456',
  textMuted: '#4A5B7D',

  /** Тёмно-голубой из холодного края иконки — активный язык и пузырь юзера. */
  accent: '#17769F',
  accentText: '#FFFFFF',
  /** Кнопка беседы берёт цвет пузыря, кант — светлее её на пару тонов. */
  ctaBg: '#17769F',
  ctaBorder: '#7CC6E4',
  ctaText: '#FFFFFF',
  /** Приглушённый голубой: яркий #63D0FA на светлом фоне нечитаем. */
  highlight: '#0A6E9E',

  danger: '#D0284C',
  dangerBg: '#FCE4E9',
  dangerText: '#A3122F',

  correctionBg: '#E8F6EE',
  correctionBorder: '#A6D8BC',
  correctionText: '#1F6B45',
};

export type Theme = typeof lightTheme;

/** Тёмная тема — те же роли, цвета из тёмной половины иконки. */
export const darkTheme: Theme = {
  bg: '#0B1046',
  surface: '#191E70',
  surfaceAlt: '#242A8C',
  border: '#2E3599',

  text: '#ECF9FB',
  textMuted: '#8B9AD8',

  accent: '#5B4BE0',
  accentText: '#FFFFFF',
  /** В тёмной теме кнопка беседы берёт цвет пузыря собеседника — с ним же
      сиреневым кантом, чтобы не сливаться с лентой сообщений. */
  ctaBg: '#5B4BE0',
  ctaBorder: '#A78BFA',
  ctaText: '#ECF9FB',
  highlight: '#63D0FA',

  danger: '#E83C65',
  dangerBg: '#2C1147',
  dangerText: '#FF8FA3',

  correctionBg: '#131A5B',
  correctionBorder: '#3D8F63',
  correctionText: '#B6EC65',
};

export type Scheme = 'light' | 'dark';

/** Масштаб шрифта: обычный, крупный, очень крупный. */
export const FONT_SCALES = [1, 1.15, 1.3] as const;
export type FontScale = (typeof FONT_SCALES)[number];

const STORAGE_KEY = 'polyglotta:scheme';
const FONT_KEY = 'polyglotta:fontScale';

interface ThemeValue {
  theme: Theme;
  scheme: Scheme;
  toggle: () => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

const ThemeContext = createContext<ThemeValue>({
  theme: lightTheme,
  scheme: 'light',
  toggle: () => {},
  fontScale: 1,
  setFontScale: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<Scheme>('light');
  const [fontScale, setFontScaleState] = useState<FontScale>(1);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setScheme(stored);
    });
    void AsyncStorage.getItem(FONT_KEY).then((stored) => {
      const value = Number(stored);
      if (FONT_SCALES.includes(value as FontScale)) setFontScaleState(value as FontScale);
    });
  }, []);

  const setFontScale = useCallback((next: FontScale) => {
    setFontScaleState(next);
    void AsyncStorage.setItem(FONT_KEY, String(next));
  }, []);

  const toggle = useCallback(() => {
    setScheme((current) => {
      const next: Scheme = current === 'light' ? 'dark' : 'light';
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({
      theme: scheme === 'dark' ? darkTheme : lightTheme,
      scheme,
      toggle,
      fontScale,
      setFontScale,
    }),
    [scheme, toggle, fontScale, setFontScale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

type StyleMap = Record<string, Record<string, unknown>>;

/** Проходит по готовым стилям и растягивает всё, что связано с размером текста. */
function scaleFonts<T extends StyleMap>(styles: T, scale: number): T {
  if (scale === 1) return styles;

  const scaled: StyleMap = {};
  for (const [key, rule] of Object.entries(styles)) {
    const next: Record<string, unknown> = { ...rule };
    for (const field of ['fontSize', 'lineHeight'] as const) {
      if (typeof next[field] === 'number') {
        next[field] = Math.round((next[field] as number) * scale);
      }
    }
    scaled[key] = next;
  }
  return scaled as T;
}

/**
 * Стили компонента: собираются фабрикой от темы и сразу масштабируются под
 * выбранный размер шрифта. Иначе размер пришлось бы умножать в каждом правиле.
 */
export function useStyles<T extends StyleMap>(create: (theme: Theme) => T): T {
  const { theme, fontScale } = useTheme();
  return useMemo(() => scaleFonts(create(theme), fontScale), [create, theme, fontScale]);
}
