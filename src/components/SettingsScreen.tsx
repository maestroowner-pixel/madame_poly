import { useEffect, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { ReactNode } from 'react';
import { ActivityIndicator, LayoutAnimation, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronIcon, CrownIcon, MoonIcon, SunIcon } from './icons';
import { NeonButton } from './NeonButton';
import { ScreenTitle } from './ScreenMenu';
import { ReminderRows } from './ReminderRows';
import { TopicPicker } from './TopicPicker';
import { measureAnchor, type Anchor } from '../anchor';
import {
  CONTACT_EMAIL,
  COPYRIGHT,
  MAX_VOICES,
  type MaxVoice,
  type Tier,
  SPEECH_RATES,
  type SpeechMode,
  PRIVACY_URL,
  SITE_LABEL,
  SITE_URL,
  TERMS_URL,
} from '../config';
import { errorText } from '../errors';
import { t } from '../i18n';
import { LANGUAGES, LANGUAGE_CODES } from '../languages';
import { BUTTON_ICON_SCALE, CONTENT_MAX_WIDTH } from '../layout';
import { FONT_SCALES, useStyles, useTheme, type FontScale, type Theme } from '../theme';
import { synthesize } from '../services/tts';
import { loadVoice, saveVoice } from '../storage';
import { isSingleCourse } from '../grammar';
import { findTopic } from '../topics';
import { LEVELS, type EnglishVariant, type LanguageCode, type Level } from '../types';

/** Проба голоса — фраза на изучаемом языке: слушают, как Poly звучит именно на нём. */
const VOICE_SAMPLES: Record<LanguageCode, string> = {
  en: "Hi, I'm Poly! Shall we have a little chat?",
  de: 'Hallo, ich bin Poly! Wollen wir ein bisschen plaudern?',
  fr: 'Bonjour, je suis Poly ! On discute un peu ?',
  es: '¡Hola, soy Poly! ¿Charlamos un rato?',
  it: 'Ciao, sono Poly! Facciamo due chiacchiere?',
  pt: 'Olá, sou a Poly! Vamos conversar um bocadinho?',
  br: 'Oi, eu sou a Poly! Vamos bater um papo?',
  uk: 'Привіт, я Полі! Поговоримо трохи?',
  nl: 'Hoi, ik ben Poly! Zullen we even kletsen?',
  pl: 'Cześć, jestem Poly! Porozmawiamy chwilę?',
  ro: 'Bună, sunt Poly! Stăm puțin de vorbă?',
};

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
  /** Темп речи собеседницы — в настройках, где его и ищут. */
  speechRate: SpeechMode;
  onSelectRate: (rate: SpeechMode) => void;
  /** Почта вошедшего; null — вход не выполнен. */
  accountEmail: string | null;
  onOpenAccount: (anchor: Anchor | null) => void;
  /** Есть ли подписка; null — ещё выясняем. */
  pro: boolean | null;
  /** Тариф: выбор голоса открыт только у Max. */
  tier: Tier | null;
  /** Сколько бесплатных бесед осталось сегодня. */
  talksLeft: number;
  /** Доля месячного объёма, уже потраченная, 0…1. */
  used: number;
  onOpenPaywall: (anchor: Anchor | null) => void;
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
  speechRate,
  onSelectRate,
  accountEmail,
  onOpenAccount,
  pro,
  tier,
  talksLeft,
  used,
  onOpenPaywall,
}: Props) {
  const styles = useStyles(createStyles);
  const { theme, scheme, toggle, fontScale, setFontScale } = useTheme();
  /** Подвал свёрнут в ручку внизу экрана и раскрывается вверх. */
  const [aboutOpen, setAboutOpen] = useState(false);

  const toggleAbout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAboutOpen((open) => !open);
  };

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<Anchor | null>(null);
  const topicRef = useRef<View>(null);
  const profileRef = useRef<View>(null);
  const archiveRef = useRef<View>(null);
  const accountRef = useRef<View>(null);
  const paywallRef = useRef<View>(null);
  const crownRef = useRef<View>(null);

  const topic = findTopic(language, topicId);

  const voiceRef = useRef<View>(null);
  const player = useAudioPlayer(null);
  const [voice, setVoice] = useState<MaxVoice>(MAX_VOICES[0]);
  /** Голос, который сейчас озвучивается для пробы. */
  const [sampling, setSampling] = useState<MaxVoice | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceOpen = tier === 'max';

  useEffect(() => {
    void loadVoice().then(setVoice);
  }, []);

  /**
   * У Max выбор голоса сразу даёт его послушать — на изучаемом языке и в
   * выбранном темпе. У остальных голоса видны, но нажатие ведёт к тарифам.
   */
  const pickVoice = async (next: MaxVoice) => {
    if (!voiceOpen) {
      measureAnchor(voiceRef, onOpenPaywall);
      return;
    }
    setVoice(next);
    setVoiceError(null);
    void saveVoice(next);
    if (sampling) return;
    setSampling(next);
    try {
      const uri = await synthesize(VOICE_SAMPLES[language], speechRate === 'auto' ? 1 : speechRate, next);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      player.replace({ uri });
      player.play();
    } catch (e: unknown) {
      setVoiceError(errorText(e));
    } finally {
      setSampling(null);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="settings" title={t.settingsTitle} />
        {/*
          Справа на строке заголовка: смена темы — та же, что в шапке беседы,
          чтобы не ходить за ней туда, — и корона, постоянный вход в подписку.
        */}
        <View style={styles.headerRight}>
          <NeonButton onPress={toggle} accessibilityLabel={t.themeToggle}>
            {scheme === 'dark' ? (
              <MoonIcon size={26 * BUTTON_ICON_SCALE} color={theme.neon} cutout={theme.surfaceAlt} />
            ) : (
              <SunIcon size={26 * BUTTON_ICON_SCALE} color={theme.neon} />
            )}
          </NeonButton>
          <View ref={crownRef} collapsable={false}>
            <NeonButton
              onPress={() => measureAnchor(crownRef, onOpenPaywall)}
              accessibilityLabel={t.subscription}
            >
              <CrownIcon size={24 * BUTTON_ICON_SCALE} color={theme.neon} />
            </NeonButton>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.panel}>
      <View style={styles.languages}>
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

      {/*
        Уровень — сразу под языком: две вещи, которые задают всё остальное.
        У языков, которые учат одним сквозным курсом (украинский, бразильский
        португальский), уровней нет — ряд не показываем.
      */}
      {!isSingleCourse(language) && (
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
      )}

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

      <Text style={styles.sectionLabel}>{t.voice}{voiceOpen ? '' : ' · Max'}</Text>
      <View ref={voiceRef} style={[styles.row, !voiceOpen && styles.locked]}>
        {MAX_VOICES.map((value) => {
          const active = voiceOpen && value === voice;
          return (
            <Pressable
              key={value}
              onPress={() => void pickVoice(value)}
              style={[styles.variant, active && styles.tileActive]}
            >
              {sampling === value ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text
                  style={[styles.variantLabel, active && styles.activeLabel]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {t.voiceNames[value]}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.sectionHint}>{voiceError ?? (voiceOpen ? t.voiceHint : t.voiceMaxOnly)}</Text>

      <Text style={styles.sectionLabel}>{t.speechRate}</Text>
      <View style={styles.row}>
        {([...SPEECH_RATES, 'auto'] as SpeechMode[]).map((rate, index) => {
          const active = rate === speechRate;
          return (
            <Pressable
              key={String(rate)}
              onPress={() => onSelectRate(rate)}
              style={[styles.variant, active && styles.tileActive]}
            >
              <Text
                style={[styles.variantLabel, active && styles.activeLabel]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {[t.rateSlow, t.rateNormal, t.rateFast, t.rateMatch][index]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.sectionHint}>{t.rateMatchHint}</Text>

      {/* Подпись растёт вместе с размером — сразу видно, что выбираешь. */}
      <Text style={styles.sectionLabel}>{t.textSize}</Text>
      <View style={styles.row}>
        {FONT_SCALES.map((scale, index) => {
          const active = scale === fontScale;
          return (
            <Pressable
              key={scale}
              onPress={() => setFontScale(scale as FontScale)}
              style={[styles.variant, active && styles.tileActive]}
            >
              <Text
                style={[styles.variantLabel, { fontSize: 11 + index * 3 }, active && styles.activeLabel]}
                numberOfLines={1}
              >
                {[t.fontNormal, t.fontLarge, t.fontHuge][index]}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
        ref={paywallRef}
        onPress={() => measureAnchor(paywallRef, onOpenPaywall)}
        style={styles.topicButton}
      >
        <Text style={styles.topicCaption}>{t.subscription}</Text>
        <Text style={styles.topicValue} numberOfLines={1}>
          {pro === null
            ? '…'
            : pro
              ? `${tier === 'max' ? 'Max' : 'Pro'} · ${t.paywallUsed(used)}`
              : t.paywallLeft(talksLeft)}
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

      {/* Напоминания — в самом низу: их ставят один раз. */}
      <ReminderRows />
      </ScrollView>

      {/*
        Подвал — ручка, прижатая к низу экрана: ссылки нужны редко и не должны
        занимать место под настройками. Раскрывается вверх, сжимая список.
      */}
      <View style={styles.drawer}>
        {aboutOpen && (
          <View style={styles.footer}>
            <View style={styles.footerLinks}>
              <FooterLink label={t.privacy} url={PRIVACY_URL} />
              <Text style={styles.footerDot}>·</Text>
              <FooterLink label={t.terms} url={TERMS_URL} />
            </View>

            {/* Адрес сайта показан целиком: по подписи не видно, куда он ведёт. */}
            <FooterLink label={SITE_LABEL} url={SITE_URL} />

            <Text style={[styles.footerLine, styles.footerCopy]}>{COPYRIGHT}</Text>
            <FooterLink label={t.writeUs} url={`mailto:${CONTACT_EMAIL}`} />
          </View>
        )}
        <Pressable
          onPress={toggleAbout}
          style={styles.drawerHandle}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityState={{ expanded: aboutOpen }}
        >
          <Text style={styles.drawerTitle}>{t.about}</Text>
          <ChevronIcon size={14} color={theme.textMuted} direction={aboutOpen ? 'down' : 'up'} />
        </Pressable>
      </View>
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
    headerRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 },
    panel: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    /** Восемь языков — сеткой по четыре в ряд: в одну строку плитки прежнего размера не влезают. */
    languages: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
      alignSelf: 'center',
      width: 78 * 4 + 10 * 3,
    },

    drawer: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    drawerHandle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
    },
    drawerTitle: { color: theme.textMuted, fontSize: 12 },
    footer: { alignItems: 'center', gap: 6, paddingTop: 14 },
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
    sectionLabel: { color: theme.textMuted, fontSize: 13, marginBottom: -4 },
    /** Голоса без Max видны, но приглушены: понятно, что есть, и где взять. */
    locked: { opacity: 0.5 },
    sectionHint: { color: theme.textMuted, fontSize: 12, lineHeight: 17, marginTop: -4 },
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
