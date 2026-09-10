import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ZoomModal } from './ZoomModal';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { AVATARS, AVATAR_GROUPS } from '../avatars';
import { SPEECH_RATES, type SpeechMode } from '../config';
import { CONTENT_MAX_WIDTH } from '../layout';
import { FONT_SCALES, useStyles, useTheme, type Theme, type FontScale } from '../theme';
import type { Profile } from '../types';
import { UserAvatar } from './Avatar';
import type { Anchor } from '../anchor';
import { t } from '../i18n';

interface Props {
  visible: boolean;
  /** Темп речи собеседницы: живёт рядом с размером шрифта — обе про удобство. */
  speechRate: SpeechMode;
  onSelectRate: (rate: SpeechMode) => void;
  /** Значок, из которого экран вырос. */
  anchor: Anchor | null;
  profile: Profile;
  onSave: (profile: Profile) => void;
  onClose: () => void;
}

export function ProfileScreen({
  visible,
  anchor,
  speechRate,
  onSelectRate,
  profile,
  onSave,
  onClose,
}: Props) {
  const { theme, fontScale, setFontScale } = useTheme();
  const styles = useStyles(createStyles);

  const [name, setName] = useState(profile.name);
  const [avatarId, setAvatarId] = useState<string | null>(profile.avatarId);
  const [photoUri, setPhotoUri] = useState<string | null>(profile.photoUri);
  const [pickError, setPickError] = useState<string | null>(null);

  // Открыли заново — показываем сохранённое, а не брошенную правку.
  useEffect(() => {
    if (visible) {
      setName(profile.name);
      setAvatarId(profile.avatarId);
      setPhotoUri(profile.photoUri);
      setPickError(null);
    }
  }, [visible, profile]);

  const save = () => {
    onSave({ name: name.trim(), avatarId, photoUri });
    onClose();
  };

  /**
   * Фото из галереи лежит во временной папке — копируем к себе, иначе система
   * когда-нибудь его вычистит и аватарка пропадёт.
   */
  const keepPhoto = (uri: string): string => {
    const folder = new Directory(Paths.document, 'avatar');
    if (!folder.exists) folder.create({ intermediates: true });

    const copy = new File(folder, `avatar-${Date.now()}.jpg`);
    new File(uri).copy(copy);
    return copy.uri;
  };

  const pick = async (source: 'library' | 'camera') => {
    setPickError(null);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPickError(
          source === 'camera' ? t.noCamera : t.noLibrary,
        );
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        // Квадрат: аватарка круглая, обрезать лучше самому, чем по центру наугад.
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled) return;

      setPhotoUri(keepPhoto(result.assets[0].uri));
      setAvatarId(null);
    } catch (e: unknown) {
      setPickError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ZoomModal visible={visible} anchor={anchor} onRequestClose={onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.profileTitle}</Text>
            <Pressable onPress={save} hitSlop={12}>
              <Text style={styles.action}>{t.done2}</Text>
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
              <View style={styles.preview}>
                <UserAvatar avatarId={avatarId} photoUri={photoUri} name={name} size={84} />
                <Text style={styles.previewName}>{name.trim() || t.noName}</Text>

                <View style={styles.photoRow}>
                  <Pressable onPress={() => void pick('library')} style={styles.photoButton}>
                    <Text style={styles.photoButtonText}>{t.uploadPhoto}</Text>
                  </Pressable>
                  <Pressable onPress={() => void pick('camera')} style={styles.photoButton}>
                    <Text style={styles.photoButtonText}>{t.takePhoto}</Text>
                  </Pressable>
                  {photoUri && (
                    <Pressable onPress={() => setPhotoUri(null)} style={styles.photoButton}>
                      <Text style={styles.photoRemove}>{t.removePhoto}</Text>
                    </Pressable>
                  )}
                </View>

                {pickError && <Text style={styles.pickError}>{pickError}</Text>}
              </View>

              <Text style={styles.label}>{t.name}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t.namePlaceholder}
                placeholderTextColor={theme.textMuted}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={save}
              />
              <Text style={styles.hint}>
                {t.nameHint}
              </Text>

              <Text style={styles.label}>{t.speechRate}</Text>
              <View style={styles.fontRow}>
                {([...SPEECH_RATES, 'auto'] as SpeechMode[]).map((rate, index) => {
                  const active = rate === speechRate;
                  return (
                    <Pressable
                      key={String(rate)}
                      onPress={() => onSelectRate(rate)}
                      style={[styles.fontButton, active && styles.fontButtonActive]}
                    >
                      <Text
                        style={[styles.fontSample, active && styles.fontSampleActive]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {[t.rateSlow, t.rateNormal, t.rateFast, t.rateMatch][index]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.hint}>{t.rateMatchHint}</Text>

              <Text style={styles.label}>{t.textSize}</Text>
              <View style={styles.fontRow}>
                {FONT_SCALES.map((scale, index) => {
                  const active = scale === fontScale;
                  return (
                    <Pressable
                      key={scale}
                      onPress={() => setFontScale(scale as FontScale)}
                      style={[styles.fontButton, active && styles.fontButtonActive]}
                    >
                      <Text
                        style={[
                          styles.fontSample,
                          { fontSize: 13 + index * 4 },
                          active && styles.fontSampleActive,
                        ]}
                      >
                        {[t.fontNormal, t.fontLarge, t.fontHuge][index]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {AVATAR_GROUPS.map(({ group, title }) => (
                <View key={group} style={styles.group}>
                  <Text style={styles.groupTitle}>{title}</Text>
                  <View style={styles.grid}>
                    {AVATARS.filter((avatar) => avatar.group === group).map((avatar) => {
                      const active = avatar.id === avatarId && !photoUri;
                      return (
                        <Pressable
                          key={avatar.id}
                          onPress={() => {
                            setAvatarId(active ? null : avatar.id);
                            setPhotoUri(null);
                          }}
                          style={[styles.card, active && styles.cardActive]}
                        >
                          <Image source={avatar.photo} style={styles.cardImage} />
                          {active && (
                            <View style={styles.check}>
                              <Text style={styles.checkGlyph}>✓</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </KeyboardAvoidingView>
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    title: { color: theme.text, fontSize: 18, fontWeight: '700' },
    action: { color: theme.accent, fontSize: 15, fontWeight: '600' },

    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 8,
    },
    preview: { alignItems: 'center', gap: 8, paddingVertical: 12 },
    photoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
    photoButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    photoButtonText: { color: theme.accent, fontSize: 13, fontWeight: '600' },
    photoRemove: { color: theme.danger, fontSize: 13, fontWeight: '600' },
    pickError: { color: theme.dangerText, fontSize: 12 },
    previewName: { color: theme.text, fontSize: 17, fontWeight: '600' },

    label: { color: theme.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    input: {
      color: theme.text,
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    hint: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },

    fontRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fontButton: {
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 999,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    fontButtonActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    /** Размер образца задан на месте: кнопка должна показывать, что выбираешь. */
    fontSample: { color: theme.textMuted, fontWeight: '600' },
    fontSampleActive: { color: theme.accentText },

    group: { gap: 8, marginTop: 12 },
    groupTitle: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    grid: { flexDirection: 'row', gap: 10 },
    /** Четыре карточки в ряд на всю ширину: на планшете они просто крупнее. */
    card: {
      flex: 1,
      aspectRatio: 3 / 4,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    cardActive: { borderColor: theme.accent, borderWidth: 3 },
    cardImage: { width: '100%', height: '100%' },
    check: {
      position: 'absolute',
      right: 6,
      bottom: 6,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.accent,
    },
    checkGlyph: { color: theme.accentText, fontSize: 13, fontWeight: '700' },
  });
