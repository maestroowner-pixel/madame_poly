import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { ArchiveIcon, MoonIcon, SunIcon } from './icons';
import { NeonButton } from './NeonButton';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { useStyles, useTheme, type Theme } from '../theme';

interface Props {
  /** Домик со списком разделов — его ставит App, одинаковый на всех экранах. */
  menu: ReactNode;
  /** Портрет собеседницы — он же показывает, слушает ли приложение. */
  portrait: ReactNode;
  canArchive: boolean;
  onArchive: () => void;
}

/**
 * Шапка беседы: слева домик со списком разделов, портрет по центру, справа —
 * убрать разговор в архив и сменить тему. Боковые группы равной ширины, иначе
 * портрет уезжает вправо.
 */
export function TalkHeader({ menu, portrait, canArchive, onArchive }: Props) {
  const { theme, scheme, toggle } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.header}>
      <View style={styles.side}>{menu}</View>

      {portrait}

      <View style={[styles.side, styles.right]}>
        <NeonButton onPress={onArchive} disabled={!canArchive} accessibilityLabel={t.toArchive}>
          <ArchiveIcon size={22} color={theme.neon} />
        </NeonButton>
        <NeonButton onPress={toggle} accessibilityLabel={t.themeToggle}>
          {scheme === 'dark' ? (
            <MoonIcon size={26} color={theme.neon} cutout={theme.surfaceAlt} />
          ) : (
            <SunIcon size={26} color={theme.neon} />
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
    side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    right: { justifyContent: 'flex-end' },
  });
