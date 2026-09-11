import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { CloseIcon } from './icons';
import { ZoomModal } from './ZoomModal';
import type { Anchor } from '../anchor';
import { formatDate } from '../format';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { login, logout, register, resetPassword, syncAvailable } from '../services/firebase';
import { useStyles, useTheme, type Theme } from '../theme';

interface Props {
  visible: boolean;
  anchor: Anchor | null;
  /** Почта вошедшего; null — вход не выполнен. */
  email: string | null;
  busy: boolean;
  syncedAt: number | null;
  onSync: () => void;
  onClose: () => void;
}

/**
 * Вход по почте. Аккаунт не обязателен: без него приложение работает как
 * прежде, всё лежит на устройстве. Он нужен только чтобы те же беседы,
 * задания и уровни оказались на другом телефоне.
 */
export function AccountScreen({
  visible,
  anchor,
  email,
  busy,
  syncedAt,
  onSync,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  /** Клавиатуру отмеряем сами: во весь экран Android окно не сжимает. */
  const keyboard = useKeyboardInset();

  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = syncAvailable();

  const attempt = async (action: () => Promise<void>) => {
    if (working) return;
    setWorking(true);
    setError(null);
    setNote(null);
    try {
      await action();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setWorking(false);
    }
  };

  const withCredentials = (action: (mail: string, password: string) => Promise<void>) => () => {
    if (!mail.trim() || !password) {
      setError(t.accountNeedBoth);
      return;
    }
    void attempt(async () => {
      await action(mail, password);
      setPassword('');
    });
  };

  return (
    <ZoomModal visible={visible} anchor={anchor} onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.accountTitle}</Text>
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

          {/* Без этих двух вещей касание по полю не открывало клавиатуру:
              список перехватывал тап, а поле пряталось под ней. */}
          <View style={[styles.flex, { paddingBottom: keyboard }]}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.intro}>{t.accountIntro}</Text>

            {error && <Text style={styles.error}>{error}</Text>}
            {note && <Text style={styles.note}>{note}</Text>}

            {!available ? (
              <View style={styles.card}>
                <Text style={styles.mail}>{t.accountOffline}</Text>
                <Text style={styles.state}>{t.accountOfflineHint}</Text>
              </View>
            ) : email ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.mail}>{email}</Text>
                  <Text style={styles.state}>
                    {busy
                      ? t.accountSyncing
                      : syncedAt
                        ? t.accountSynced(formatDate(syncedAt))
                        : t.accountOff}
                  </Text>
                </View>

                <Pressable onPress={onSync} disabled={busy} style={styles.cta}>
                  {busy ? (
                    <ActivityIndicator color={theme.ctaText} size="small" />
                  ) : (
                    <Text style={styles.ctaLabel}>{t.accountSyncNow}</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => void attempt(logout)}
                  style={styles.secondary}
                >
                  <Text style={styles.secondaryLabel}>{t.accountLogout}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  value={mail}
                  onChangeText={setMail}
                  placeholder={t.accountEmail}
                  placeholderTextColor={theme.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t.accountPassword}
                  placeholderTextColor={theme.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  textContentType="password"
                />

                <Pressable
                  onPress={withCredentials(login)}
                  disabled={working}
                  style={styles.cta}
                >
                  {working ? (
                    <ActivityIndicator color={theme.ctaText} size="small" />
                  ) : (
                    <Text style={styles.ctaLabel}>{t.accountLogin}</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={withCredentials(register)}
                  disabled={working}
                  style={styles.secondary}
                >
                  <Text style={styles.secondaryLabel}>{t.accountRegister}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (!mail.trim()) {
                      setError(t.accountNeedBoth);
                      return;
                    }
                    void attempt(async () => {
                      await resetPassword(mail);
                      setNote(t.accountSent);
                    });
                  }}
                  disabled={working}
                  style={styles.link}
                >
                  <Text style={styles.linkLabel}>{t.accountForgot}</Text>
                </Pressable>
              </>
            )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </ZoomModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    flex: { flex: 1 },
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
    intro: { color: theme.textMuted, fontSize: 13, lineHeight: 19 },
    error: { color: theme.dangerText, fontSize: 12, lineHeight: 17 },
    note: { color: theme.correctionText, fontSize: 12, lineHeight: 17 },

    card: {
      gap: 4,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mail: { color: theme.text, fontSize: 15, fontWeight: '700' },
    state: { color: theme.textMuted, fontSize: 12 },

    input: {
      color: theme.text,
      fontSize: 15,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },

    cta: {
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      backgroundColor: theme.ctaBg,
      borderColor: theme.ctaBorder,
    },
    ctaLabel: { color: theme.ctaText, fontSize: 15, fontWeight: '700' },
    secondary: {
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    secondaryLabel: { color: theme.neon, fontSize: 14, fontWeight: '600' },
    link: { alignItems: 'center', paddingVertical: 6 },
    linkLabel: { color: theme.textMuted, fontSize: 13 },
  });
