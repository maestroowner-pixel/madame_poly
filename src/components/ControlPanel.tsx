import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { LANGUAGES, LANGUAGE_CODES } from '../languages';
import { t } from '../i18n';
import { useStyles, useTheme, type Theme } from '../theme';
import { findTopic } from '../topics';
import { LEVELS, type EnglishVariant, type LanguageCode, type Level } from '../types';
import { TopicPicker } from './TopicPicker';

interface Props {
  language: LanguageCode;
  level: Level;
  expanded: boolean;
  /** Во время беседы менять язык нельзя — кнопки гаснут. */
  disabled: boolean;
  onToggle: () => void;
  onSelectLanguage: (language: LanguageCode) => void;
  onSelectLevel: (level: Level) => void;
  topicId: string | null;
  onSelectTopic: (id: string | null) => void;
  archiveCount: number;
  onOpenArchive: () => void;
  profileName: string;
  onOpenProfile: () => void;
  /** Сколько упражнений уже составлено; null — задания ещё нет. */
  homeworkCount: number | null;
  onOpenHomework: () => void;
  englishVariant: EnglishVariant;
  onSelectVariant: (variant: EnglishVariant) => void;
  /** Правый край шапки — там же, где сводка, живут действия над беседой. */
  trailing?: ReactNode;
  /** Центр шапки: портрет собеседницы стоит вровень со строкой языка. */
  center?: ReactNode;
}

/**
 * Язык и уровень одной панелью. Свёрнутая показывает текущий выбор строкой,
 * чтобы после автоскрытия было видно, на каком языке идёт беседа.
 */
export function ControlPanel({
  language,
  level,
  expanded,
  disabled,
  onToggle,
  onSelectLanguage,
  onSelectLevel,
  topicId,
  onSelectTopic,
  archiveCount,
  onOpenArchive,
  profileName,
  onOpenProfile,
  homeworkCount,
  onOpenHomework,
  englishVariant,
  onSelectVariant,
  trailing,
  center,
}: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const [pickerOpen, setPickerOpen] = useState(false);
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  // Высоту панели меряем по факту: она зависит от шрифта и плотности экрана.
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      // Высота — не трансформация, нативный драйвер её не анимирует.
      useNativeDriver: false,
    }).start();
  }, [expanded, progress]);

  const meta = LANGUAGES[language];
  const topic = findTopic(language, topicId);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Pressable onPress={onToggle} style={styles.summary} hitSlop={8}>
          <Text style={styles.summaryText}>
            {meta.flag} {meta.label} · {level}
          </Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </Pressable>
        {center && <View style={styles.center}>{center}</View>}
        {trailing}
      </View>

      <Animated.View
        style={[
          styles.panelClip,
          {
            height: contentHeight
              ? progress.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] })
              : undefined,
            opacity: progress,
          },
        ]}
      >
        <View style={styles.panel} onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>
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
            onPress={() => setPickerOpen(true)}
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

          <Pressable onPress={onOpenProfile} style={styles.topicButton}>
            <Text style={styles.topicCaption}>{t.profile}</Text>
            <Text style={styles.topicValue} numberOfLines={1}>
              {profileName || t.notSet}
            </Text>
            <Text style={styles.topicChevron}>›</Text>
          </Pressable>

          <Pressable onPress={onOpenHomework} style={styles.topicButton}>
            <Text style={styles.topicCaption}>{t.task}</Text>
            <Text style={styles.topicValue} numberOfLines={1}>
              {homeworkCount === null ? t.notSet : t.exercisesCount(homeworkCount)}
            </Text>
            <Text style={styles.topicChevron}>›</Text>
          </Pressable>

          <Pressable onPress={onOpenArchive} style={styles.topicButton}>
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
        </View>
      </Animated.View>

      <TopicPicker
        visible={pickerOpen}
        language={language}
        topicId={topicId}
        onSelect={onSelectTopic}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { paddingHorizontal: 16, paddingBottom: 10 },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingVertical: 8,
      gap: 8,
    },
    /** Портрет тянет шапку вниз, но его верх остаётся вровень со строкой языка. */
    center: { flex: 1, alignItems: 'center' },
    summary: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    summaryText: { color: theme.text, fontSize: 17, fontWeight: '600' },
    chevron: { color: theme.textMuted, fontSize: 11 },

    /** Обрезает панель при сворачивании, чтобы содержимое не вылезало. */
    panelClip: { overflow: 'hidden' },
    panel: {
      gap: 10,
      padding: 12,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    row: { flexDirection: 'row', justifyContent: 'center', gap: 10 },

    tile: {
      width: 78,
      height: 78,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: theme.surfaceAlt,
    },
    /** Подпись всегда в одну строку: «Американский» длиннее трети панели. */
    variantLabel: { color: theme.textMuted, fontSize: 11, fontWeight: '700' },
    variant: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    square: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
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

    tileActive: { backgroundColor: theme.accent },
    dimmed: { opacity: 0.45 },

    flag: { fontSize: 26 },
    tileLabel: { color: theme.textMuted, fontSize: 11, fontWeight: '600' },
    squareLabel: { color: theme.textMuted, fontSize: 14, fontWeight: '700' },
    activeLabel: { color: theme.accentText },
  });
