import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';

import { CloseIcon } from './icons';
import { ZoomModal } from './ZoomModal';
import type { Anchor } from '../anchor';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { buy, loadPackages, restore } from '../services/purchases';
import { useStyles, useTheme, type Theme } from '../theme';

interface Props {
  visible: boolean;
  anchor: Anchor | null;
  /** Сколько бесплатных бесед осталось сегодня. */
  left: number;
  onClose: () => void;
  /** Подписка появилась — экрану выше пора перечитать состояние. */
  onBought: () => void;
}

/** «1 мес.» из RevenueCat читается хуже, чем «в месяц». */
function periodLabel(item: PurchasesPackage): string | null {
  const period = item.product.subscriptionPeriod;
  if (period === 'P1M') return t.paywallMonth;
  if (period === 'P1Y') return t.paywallYear;
  return null;
}

export function Paywall({ visible, anchor, left, onClose, onBought }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [items, setItems] = useState<PurchasesPackage[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    let alive = true;
    setError(null);
    void loadPackages()
      .then((list) => alive && setItems(list))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [visible]);

  /**
   * Отказ от покупки — это не ошибка, а обычный выход из окна магазина, поэтому
   * показывать по нему красную строку нельзя. Различаем по флагу RevenueCat.
   */
  const run = async (action: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (await action()) {
        onBought();
        onClose();
      } else {
        setError(t.paywallFailed);
      }
    } catch (e: unknown) {
      const cancelled =
        typeof e === 'object' && e !== null && 'userCancelled' in e && Boolean(e.userCancelled);
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ZoomModal visible={visible} anchor={anchor} onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.paywallTitle}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t.close}
              style={styles.iconButton}
            >
              <CloseIcon size={20} color={theme.neon} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.left}>{t.paywallLeft(left)}</Text>
            <Text style={styles.intro}>{t.paywallIntro}</Text>
            <Text style={styles.pitch}>{t.paywallPitch}</Text>

            {error && <Text style={styles.error}>{error}</Text>}

            {items === null ? (
              <ActivityIndicator color={theme.neon} style={styles.wait} />
            ) : items.length === 0 ? (
              <Text style={styles.empty}>{t.paywallNone}</Text>
            ) : (
              items.map((item) => {
                const period = periodLabel(item);
                return (
                  <Pressable
                    key={item.identifier}
                    disabled={busy}
                    onPress={() => void run(() => buy(item))}
                    style={[styles.plan, busy && styles.dimmed]}
                  >
                    <Text style={styles.planPrice}>{item.product.priceString}</Text>
                    {period && <Text style={styles.planPeriod}>{period}</Text>}
                  </Pressable>
                );
              })
            )}

            <Pressable
              disabled={busy}
              onPress={() => void run(restore)}
              style={styles.quiet}
              hitSlop={8}
            >
              <Text style={styles.quietLabel}>{t.paywallRestore}</Text>
            </Pressable>

            <Pressable onPress={onClose} style={styles.quiet} hitSlop={8}>
              <Text style={styles.quietLabel}>{t.paywallLater}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </ZoomModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    title: { color: theme.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
    iconButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 12,
    },
    left: { color: theme.neon, fontSize: 14, fontWeight: '700' },
    intro: { color: theme.textMuted, fontSize: 13, lineHeight: 19 },
    pitch: { color: theme.text, fontSize: 15, lineHeight: 21 },
    error: { color: theme.dangerText, fontSize: 12, lineHeight: 17 },
    wait: { paddingVertical: 24 },
    empty: { color: theme.textMuted, fontSize: 13, lineHeight: 19, paddingVertical: 12 },

    plan: {
      alignItems: 'center',
      gap: 2,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: theme.ctaBg,
      borderWidth: 1,
      borderColor: theme.ctaBorder,
    },
    dimmed: { opacity: 0.5 },
    planPrice: { color: theme.ctaText, fontSize: 20, fontWeight: '700' },
    planPeriod: { color: theme.ctaText, fontSize: 12 },

    quiet: { alignItems: 'center', paddingVertical: 8 },
    quietLabel: { color: theme.neon, fontSize: 13 },
  });
