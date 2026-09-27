import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { ArchiveIcon, MoonIcon, SunIcon } from './icons';
import { NeonButton } from './NeonButton';
import { t } from '../i18n';
import { BUTTON_ICON_SCALE, CONTENT_MAX_WIDTH, useTablet } from '../layout';
import { useStyles, useTheme, type Theme } from '../theme';

interface Props {
  /** Домик со списком разделов — его ставит App, одинаковый на всех экранах. */
  menu: ReactNode;
  /** Портрет собеседницы — он же показывает, слушает ли приложение. */
  portrait: ReactNode;
  canArchive: boolean;
  onArchive: () => void;
  /** Сколько бесед в архиве — число на кнопке. */
  archiveCount: number;
  onOpenArchive: () => void;
}

/**
 * Шапка беседы: слева домик со списком разделов, портрет по центру, справа —
 * архив и смена темы. Боковые группы равной ширины, иначе портрет уезжает
 * вправо.
 *
 * Кнопка архива: нажатие убирает законченную беседу в архив, долгое нажатие
 * открывает архив. Пока убирать нечего, кнопка погашена, и простое нажатие
 * тоже открывает архив — если в нём что-то есть.
 */
export function TalkHeader({
  menu,
  portrait,
  canArchive,
  onArchive,
  archiveCount,
  onOpenArchive,
}: Props) {
  const { theme, scheme, toggle } = useTheme();
  const styles = useStyles(createStyles);
  const tablet = useTablet();
  /** Значок растёт вместе с кнопкой шапки, а не только с интерфейсом. */
  const scale = BUTTON_ICON_SCALE;

  return (
    <View style={[styles.header, tablet && styles.headerTablet]}>
      <View style={styles.side}>{menu}</View>

      {portrait}

      <View style={[styles.side, styles.right]}>
        <NeonButton
          onPress={canArchive ? onArchive : onOpenArchive}
          onLongPress={archiveCount > 0 ? onOpenArchive : undefined}
          disabled={!canArchive && archiveCount === 0}
          dim={!canArchive}
          badge={archiveCount}
          accessibilityLabel={canArchive ? t.toArchive : t.archive}
        >
          <ArchiveIcon size={22 * scale} color={theme.neon} />
        </NeonButton>
        <NeonButton onPress={toggle} accessibilityLabel={t.themeToggle}>
          {scheme === 'dark' ? (
            <MoonIcon size={26 * scale} color={theme.neon} cutout={theme.surfaceAlt} />
          ) : (
            <SunIcon size={26 * scale} color={theme.neon} />
          )}
        </NeonButton>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    /** Портрет на планшете шире колонки ленты — шапке нужна вся ширина. */
    headerTablet: { maxWidth: undefined },
    side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    right: { justifyContent: 'flex-end' },
  });
