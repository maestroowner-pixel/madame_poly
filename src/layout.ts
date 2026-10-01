import { Dimensions, Platform, useWindowDimensions } from 'react-native';

/**
 * Потолок ширины контента на телефоне. На планшете лента во весь экран даёт
 * строки в полтора десятка слов — читать такие неудобно, поэтому колонку
 * ограничиваем и центрируем, как в почте и мессенджерах. На планшете она шире
 * вместе со всем интерфейсом — см. UI_SCALE.
 */
export const CONTENT_MAX_WIDTH = 640;

/**
 * Класс устройства — по короткой стороне экрана в точках: она не меняется при
 * повороте и в отличие от окна не зависит от Split View. Телефонные размеры на
 * планшете терялись на пустом экране, поэтому там всё крупнее, и тем крупнее,
 * чем больше экран.
 *
 *   phone     < 600    iPhone
 *   tablet7   600–799  iPad mini (744), Android 7–8" (600)
 *   tablet11  800–999  iPad и iPad Air/Pro 11" (820–834)
 *   tablet13  ≥ 1000   iPad Pro/Air 13" (1024–1032)
 *
 * Числа для 13" подобраны на iPad Pro 13" (кнопки шапки пробовали в 4 раза,
 * портрет в 6 — слишком крупно); 11" и 7" — пропорционально между ними и
 * телефоном.
 */
export type DeviceClass = 'phone' | 'tablet7' | 'tablet11' | 'tablet13';

interface Scales {
  /** Весь интерфейс: размеры, отступы и шрифты из стилей (useStyles), значки. */
  ui: number;
  /** Кнопки шапки — крупнее общего масштаба: на пустом экране они главные. */
  button: number;
  /** Портрет в шапке беседы. */
  portrait: number;
}

const SCALES: Record<DeviceClass, Scales> = {
  phone: { ui: 1, button: 1, portrait: 1 },
  tablet7: { ui: 1.15, button: 1.5, portrait: 1.8 },
  tablet11: { ui: 1.25, button: 1.75, portrait: 2.2 },
  tablet13: { ui: 1.4, button: 2, portrait: 2.5 },
};

function detect(): DeviceClass {
  const { width, height } = Dimensions.get('screen');
  const short = Math.min(width, height);
  if (short >= 1000) return 'tablet13';
  if (short >= 800) return 'tablet11';
  if (short >= 600) return 'tablet7';
  return 'phone';
}

export const DEVICE_CLASS: DeviceClass = detect();
export const IS_TABLET = DEVICE_CLASS !== 'phone';
export const UI_SCALE = SCALES[DEVICE_CLASS].ui;
/**
 * В браузере экран компьютера попадает в «планшет», и кнопки шапки выходили
 * крупными на фоне окна — там они на 30 % меньше. В браузере телефона
 * размер обычный: он и так телефонный. Меню считает свой размер от
 * планшетного масштаба (BASE_BUTTON_SCALE), его это не задевает.
 */
export const BASE_BUTTON_SCALE = SCALES[DEVICE_CLASS].button;
export const BUTTON_SCALE =
  BASE_BUTTON_SCALE * (Platform.OS === 'web' && DEVICE_CLASS !== 'phone' ? 0.7 : 1);
export const PORTRAIT_SCALE = SCALES[DEVICE_CLASS].portrait;

/**
 * Значки масштабируются сами на UI_SCALE (icons.tsx). В кнопке шапки значок
 * должен расти вместе с кнопкой, поэтому ему досыпают разницу.
 */
export const BUTTON_ICON_SCALE = BUTTON_SCALE / UI_SCALE;

export function useTablet(): boolean {
  return IS_TABLET;
}

/** Во сколько раз крупнее кнопки шапки: 1 на телефоне. */
export function useButtonScale(): number {
  return BUTTON_SCALE;
}

export function useLayout() {
  const { width } = useWindowDimensions();
  return {
    /** Планшет или повёрнутый телефон: место есть, но растягивать нечего. */
    isWide: width >= 700,
    width,
  };
}
