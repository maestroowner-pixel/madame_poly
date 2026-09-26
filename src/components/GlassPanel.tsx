import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { useTheme } from '../theme';

type GlassModule = typeof import('expo-glass-effect');

/**
 * «Жидкое стекло» iOS 26+ через expo-glass-effect. Модуль нативный: в сборке
 * без него GlassView падает уже при загрузке файла, поэтому подключаем его,
 * только если нативная часть есть, — старые сборки получают матовую панель.
 */
const glass: GlassModule | null =
  Platform.OS === 'ios' && requireOptionalNativeModule('ExpoGlassEffect')
    ? (require('expo-glass-effect') as GlassModule)
    : null;

/** Настоящее стекло доступно: iOS 26+, модуль в сборке, API на месте. */
export const LIQUID_GLASS = Boolean(glass?.isLiquidGlassAvailable() && glass.isGlassEffectAPIAvailable());

/** Шестнадцатеричный цвет темы с прозрачностью — для матовой подложки. */
function translucent(hex: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  return `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

/**
 * Стеклянная панель. На iOS 26+ — системное стекло с лёгким оттенком темы:
 * размывает и преломляет то, что под ним. Где стекла нет (Android, iOS
 * старше), — матовая имитация: полупрозрачная поверхность со светлой кромкой.
 */
export function GlassPanel({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const { theme, scheme } = useTheme();

  if (glass && LIQUID_GLASS) {
    return (
      <glass.GlassView
        glassEffectStyle="regular"
        colorScheme={scheme}
        tintColor={translucent(theme.surface, 0.25)}
        style={style}
      >
        {children}
      </glass.GlassView>
    );
  }

  return (
    <View
      style={[
        style,
        {
          backgroundColor: translucent(theme.surface, scheme === 'dark' ? 0.78 : 0.72),
          borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.7)',
        },
        styles.frosted,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frosted: { borderWidth: StyleSheet.hairlineWidth * 2 },
});
