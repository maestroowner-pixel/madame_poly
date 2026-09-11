import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenTitle } from './ScreenMenu';
import { TopicPicker } from './TopicPicker';
import { measureAnchor, type Anchor } from '../anchor';
import {
  CONTACT_EMAIL,
  COPYRIGHT,
  PRIVACY_URL,
  SITE_LABEL,
  SITE_URL,
  TERMS_URL,
} from '../config';
import { t } from '../i18n';
import { LANGUAGES, LANGUAGE_CODES } from '../languages';
import { CONTENT_MAX_WIDTH } from '../layout';
import { useStyles, type Theme } from '../theme';
import { findTopic } from '../topics';
import { LEVELS, type EnglishVariant, type LanguageCode, type Level } from '../types';

interface Props {
  /** Домик со списком разделов. */
  menu: ReactNode;
  language: LanguageCode;
  level: Level;
  /** Во время беседы менять язык нельзя — плитки гаснут. */
  disabled: boolean;
  onSelectLanguage: (language: LanguageCode) => void;
  onSelectLevel: (level: Level) => void;
  topicId: string | null;
  onSelectTopic: (id: string | null) => void;
  archiveCount: number;
  onOpenArchive: (anchor: Anchor | null) => void;
  profileName: string;
  onOpenProfile: (anchor: Anchor | null) => void;
  englishVariant: EnglishVariant;
  onSelectVariant: (variant: EnglishVariant) => void;
  /** Почта вошедшего; null — вход не выполнен. */
  accountEmail: string | null;
  onOpenAccount: (anchor: Anchor | null) => void;
}

/**
 * Раздел настроек: язык, уровень, тема, профиль, аккаунт и архив. Прежде это
 * была панель, распахивавшаяся поверх ленты, — теперь обычная вкладка, и
 * открытые из неё экраны лежат ровно на один слой выше, а не на два.
 */
export function SettingsScreen({
  menu,
  language,
  level,
  disabled,
  onSelectLanguage,
  onSelectLevel,
  topicId,
  onSelectTopic,
  archiveCount,
  onOpenArchive,
  profileName,
  onOpenProfile,
  englishVariant,
  onSelectVariant,
  accountEmail,
  onOpenAccount,
}: Props) {
  const styles = useStyles(createStyles);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<Anchor | null>(null);
  const topicRef = useRef<View>(null);
  const profileRef = useRef<View>(null);
  const archiveRef = useRef<View>(null);
  const accountRef = useRef<View>(null);

  const topic = findTopic(language, topicId);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="settings" title={t.settingsTitle} />
      </View>

      <ScrollView contentContainerStyle={styles.panel}>
      <View style={styles.row}>
        {LANGUAGE_CODES.map((code) => {
          const active = code === language;
          return (
            <Pressable
              key={code}
              disabled={disabled}
              onPress={() => onSelectLanguage(code)}
              style={[styles.tile, active && styles.tileActive, disabled && styles.dimmed]}
            >
              <Text style={styles.flag}>{LANGUAGES[code].flag}</Text>
              <Text style={[styles.tileLabel, active && styles.activeLabel]} numberOfLines={1}>
                {LANGUAGES[code].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={disabled}
        ref={topicRef}
        onPress={() =>
          measureAnchor(topicRef, (point) => {
            setPickerAnchor(point);
            setPickerOpen(true);
          })
        }
        style={[styles.topicButton, disabled && styles.dimmed]}
      >
        <Text style={styles.topicCaption}>{t.topic}</Text>
        <Text style={styles.topicValue} numberOfLines={1}>
          {topic ? topic.label : t.free}
        </Text>
        <Text style={styles.topicChevron}>›</Text>
      </Pressable>

      {/* Вариант английского: словарь и обороты, не произношение. */}
      {language === 'en' && (
        <View style={styles.row}>
          {(
            [
              ['british', t.british],
              ['american', t.american],
              ['cockney', t.cockney],
            ] as [EnglishVariant, string][]
          ).map(([value, title]) => {
            const active = value === englishVariant;
            return (
              <Pressable
                key={value}
                disabled={disabled}
                onPress={() => onSelectVariant(value)}
                style={[styles.variant, active && styles.tileActive, disabled && styles.dimmed]}
              >
                <Text
                  style={[styles.variantLabel, active && styles.activeLabel]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        ref={profileRef}
        onPress={() => measureAnchor(profileRef, onOpenProfile)}
        style={styles.topicButton}
      >
        <Text style={styles.topicCaption}>{t.profile}</Text>
        <Text style={styles.topicValue} numberOfLines={1}>
          {profileName || t.notSet}
        </Text>
        <Text style={styles.topicChevron}>›</Text>
      </Pressable>



      <Pressable
        ref={accountRef}
        onPress={() => measureAnchor(accountRef, onOpenAccount)}
        style={styles.topicButton}
      >
        <Text style={styles.topicCaption}>{t.account}</Text>
        <Text style={styles.topicValue} numberOfLines={1}>
          {accountEmail ?? t.accountOff}
        </Text>
        <Text style={styles.topicChevron}>›</Text>
      </Pressable>

      <Pressable
        ref={archiveRef}
        onPress={() => measureAnchor(archiveRef, onOpenArchive)}
        style={styles.topicButton}
      >
        <Text style={styles.topicCaption}>{t.archive}</Text>
        <Text style={styles.topicValue} numberOfLines={1}>
          {archiveCount === 0 ? t.empty : `${archiveCount}`}
        </Text>
        <Text style={styles.topicChevron}>›</Text>
      </Pressable>

      <View style={styles.row}>
        {LEVELS.map((value) => {
          const active = value === level;
          return (
            <Pressable
              key={value}
              disabled={disabled}
              onPress={() => onSelectLevel(value)}
              style={[styles.square, active && styles.tileActive, disabled && styles.dimmed]}
            >
              <Text style={[styles.squareLabel, active && styles.activeLabel]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <FooterLink label={t.privacy} url={PRIVACY_URL} />
          <Text style={styles.footerDot}>·</Text>
          <FooterLink label={t.terms} url={TERMS_URL} />
        </View>

        {/* Адрес сайта показан целиком: по подписи не видно, куда он ведёт. */}
        <Text style={styles.footerLine}>{t.about}</Text>
        <FooterLink label={SITE_LABEL} url={SITE_URL} />

        <Text style={[styles.footerLine, styles.footerCopy]}>{COPYRIGHT}</Text>
        <FooterLink label={t.writeUs} url={`mailto:${CONTACT_EMAIL}`} />
      </View>
      </ScrollView>
      <TopicPicker
        visible={pickerOpen}
        anchor={pickerAnchor}
        language={language}
        topicId={topicId}
        onSelect={onSelectTopic}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

/**
 * Ссылка подвала. openURL может отказать — почтового клиента на устройстве
 * может не быть вовсе, — и необработанный отказ уронил бы экран настроек.
 */
function FooterLink({ label, url }: { label: string; url: string }) {
  const styles = useStyles(createStyles);

  return (
    <Pressable onPress={() => void Linking.openURL(url).catch(() => {})} hitSlop={8}>
      <Text style={styles.footerLink}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
    },
    title: { color: theme.text, fontSize: 18, fontWeight: '700' },
    panel: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 32,
      // Тянем содержимое на всю высоту, иначе подвалу не от чего оттолкнуться вниз.
      flexGrow: 1,
    },
    row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },

    // marginTop: auto прижимает подвал к низу, когда настройки не заполнили
    // экран, и оставляет его под ними, когда список длиннее экрана.
    footer: { alignItems: 'center', gap: 6, paddingTop: 22, marginTop: 'auto' },
    footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    footerLink: { color: theme.neon, fontSize: 12 },
    footerDot: { color: theme.textMuted, fontSize: 12 },
    footerLine: { color: theme.textMuted, fontSize: 11 },
    footerCopy: { marginTop: 8 },
    tile: {
      width: 78,
      height: 78,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: theme.surfaceAlt,
    },
    tileActive: { backgroundColor: theme.accent },
    flag: { fontSize: 26 },
    tileLabel: { color: theme.textMuted, fontSize: 11, fontWeight: '600' },
    activeLabel: { color: theme.accentText },
    dimmed: { opacity: 0.45 },
    topicButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.surfaceAlt,
    },
    topicCaption: { color: theme.textMuted, fontSize: 13 },
    topicValue: { color: theme.text, fontSize: 14, fontWeight: '600', flex: 1 },
    topicChevron: { color: theme.textMuted, fontSize: 18, lineHeight: 20 },
    variant: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    variantLabel: { color: theme.textMuted, fontSize: 11, fontWeight: '700' },
    square: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    squareLabel: { color: theme.textMuted, fontSize: 14, fontWeight: '700' },
  });
