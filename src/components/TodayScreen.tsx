import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, ChevronIcon } from './icons';
import { ScreenTitle } from './ScreenMenu';
import type { Tab as WordsTab } from './VocabularyScreen';
import {
  DAILY_DRILLS,
  DAILY_TALK_MINUTES,
  EMPTY_DAY,
  dayKey,
  lastDays,
  streak,
  type ActivityLog,
  type DayActivity,
} from '../activity';
import { VOCABULARY_LANGUAGES } from '../config';
import { locale, t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { dueCards } from '../review';
import { loadActivity, loadPlacement, loadReviewCards, loadWeakSpots } from '../storage';
import { useStyles, useTheme, type Theme } from '../theme';
import { DRILL_TOPICS, findTopic } from '../topics';
import type { LanguageCode, PlacementResult, WeakSpot } from '../types';

interface Props {
  menu: ReactNode;
  language: LanguageCode;
  /** Начать беседу — переход на её вкладку. */
  onTalk: () => void;
  /** В «Слова»: повторение или пропуски тренажёра. */
  onWords: (topic: string | null, tab: WordsTab) => void;
  /** Открыть тест уровня. */
  onPlacement: () => void;
}

/** Слабое место считается свежим две недели: старые ошибки, возможно, уже ушли. */
const FRESH_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Тренажёр на сегодня: по свежим ошибкам из бесед, самый частый; ошибок нет —
 * «тренажёр дня» по кругу, чтобы каждый день было что-то одно.
 */
function pickDrill(
  language: LanguageCode,
  spots: Record<string, WeakSpot>,
  now: number,
): { id: string; mistakes: number } | null {
  const fresh = Object.values(spots)
    .map((spot) => ({ id: spot.drillId, mistakes: spot.mistakes.filter((item) => now - item.at < FRESH_MS).length }))
    .filter((spot) => spot.mistakes > 0 && findTopic(language, spot.id))
    .sort((a, b) => b.mistakes - a.mistakes);
  if (fresh.length > 0) return fresh[0];

  const drills = DRILL_TOPICS[language] ?? [];
  if (drills.length === 0) return null;
  const day = Math.floor(now / (24 * 60 * 60 * 1000));
  return { id: drills[day % drills.length].id, mistakes: 0 };
}

/** Подпись дня недели одной буквой — как в календаре телефона. */
function weekday(date: Date): string {
  try {
    return date.toLocaleDateString(locale, { weekday: 'narrow' });
  } catch {
    return String(date.getDate());
  }
}

/**
 * «Сегодня»: план дня одним экраном — беседа, повторение, тренажёр — и неделя
 * под ним. Вместо меню из восьми разделов: открыл и сразу знаешь, что делать.
 * Задачи отмечаются сами, по учёту занятий (activity.ts).
 */
export function TodayScreen({ menu, language, onTalk, onWords, onPlacement }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  const [log, setLog] = useState<ActivityLog>({});
  const [due, setDue] = useState(0);
  /** Карточек в очереди всего — пустая очередь не значит «всё повторено». */
  const [queued, setQueued] = useState(0);
  const [spots, setSpots] = useState<Record<string, WeakSpot>>({});
  /** Итог теста уровня; undefined — ещё читаем, null — теста не было. */
  const [placement, setPlacement] = useState<PlacementResult | null | undefined>(undefined);

  useEffect(() => {
    void loadActivity(language).then(setLog);
    void loadReviewCards(language).then((cards) => {
      setDue(dueCards(cards).length);
      setQueued(cards.length);
    });
    void loadWeakSpots(language).then(setSpots);
    void loadPlacement(language).then(setPlacement);
  }, [language]);

  const now = Date.now();
  const today: DayActivity = log[dayKey()] ?? EMPTY_DAY;
  const words = VOCABULARY_LANGUAGES.includes(language);
  const drill = words ? pickDrill(language, spots, now) : null;
  const drillTopic = drill ? findTopic(language, drill.id) : null;

  const talkMinutes = Math.floor(today.talkMs / 60000);
  const talkDone = talkMinutes >= DAILY_TALK_MINUTES;
  // Зелёная галочка — только за сделанное сегодня. Нечего повторять — задача
  // не мешает плану, но и не отмечается; карточек нет вовсе — зовём их завести.
  const cardsDone = due === 0 && today.cards > 0;
  const cardsIdle = due === 0 && today.cards === 0 && queued > 0;
  const cardsEmpty = queued === 0 && today.cards === 0;
  const drillDone = today.drills >= DAILY_DRILLS;
  const allDone = talkDone && (!words || cardsDone || cardsIdle) && (!drillTopic || drillDone);

  const days = lastDays(7);
  const week = days.map((day) => log[dayKey(day)] ?? EMPTY_DAY);
  const total = week.reduce(
    (sum, day) => ({ talkMs: sum.talkMs + day.talkMs, cards: sum.cards + day.cards, drills: sum.drills + day.drills }),
    EMPTY_DAY,
  );
  const series = streak(log);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="today" />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.streak}>{series > 0 ? t.todayStreak(series) : t.todayStreakStart}</Text>

        {/* Уровня по тесту ещё нет — первым делом предлагаем его узнать. */}
        {placement === null && (
          <Task title={t.placementCardTitle} detail={t.placementCardHint} done={false} onPress={onPlacement} />
        )}
        {placement && (
          <Pressable onPress={onPlacement} style={styles.placementLine}>
            <Text style={styles.placementText}>
              {t.placementResultLine(placement.level)} · <Text style={styles.placementAgain}>{t.placementAgain}</Text>
            </Text>
          </Pressable>
        )}

        <Task
          title={t.todayTalk}
          detail={t.todayTalkProgress(Math.min(talkMinutes, DAILY_TALK_MINUTES), DAILY_TALK_MINUTES)}
          progress={talkMinutes / DAILY_TALK_MINUTES}
          done={talkDone}
          onPress={onTalk}
        />

        {words && (
          <Task
            title={t.todayCards}
            detail={
              cardsDone ? t.todayCardsDone : cardsIdle ? t.todayCardsIdle : cardsEmpty ? t.todayCardsEmpty : t.todayCardsDue(due)
            }
            done={cardsDone}
            idle={cardsIdle}
            onPress={() => onWords(null, cardsEmpty ? 'list' : 'review')}
          />
        )}

        {drill && drillTopic && (
          <Task
            title={drillTopic.label}
            caption={drill.mistakes > 0 ? t.todayDrillWhy(drill.mistakes) : t.todayDrillOfDay}
            detail={t.todayDrillProgress(Math.min(today.drills, DAILY_DRILLS), DAILY_DRILLS)}
            progress={today.drills / DAILY_DRILLS}
            done={drillDone}
            onPress={() => onWords(drill.id, 'gaps')}
          />
        )}

        {allDone && <Text style={styles.allDone}>{t.todayAllDone}</Text>}

        <Text style={styles.section}>{t.todayWeek}</Text>
        <View style={styles.week}>
          {days.map((day, i) => {
            const activity = week[i];
            // Три точки — три цели дня: беседа, повторение, тренажёр.
            const goals = [
              activity.talkMs >= DAILY_TALK_MINUTES * 60000,
              activity.cards > 0,
              activity.drills >= DAILY_DRILLS,
            ];
            const isToday = i === days.length - 1;
            return (
              <View key={dayKey(day)} style={styles.day}>
                <Text style={[styles.dayLabel, isToday && styles.dayToday]}>{weekday(day)}</Text>
                <View style={styles.dots}>
                  {goals.map((met, g) => (
                    <View key={g} style={[styles.dot, met && { backgroundColor: theme.neon, borderColor: theme.neon }]} />
                  ))}
                </View>
                <Text style={[styles.dayNumber, isToday && styles.dayToday]}>{day.getDate()}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.totals}>
          {t.todayWeekTotals(Math.round(total.talkMs / 60000), total.cards, total.drills)}
        </Text>
      </ScrollView>
    </View>
  );
}

/** Задача дня: название, сколько сделано, полоска и галочка, когда готово. */
function Task({
  title,
  caption,
  detail,
  progress,
  done,
  idle,
  onPress,
}: {
  title: string;
  caption?: string;
  detail: string;
  progress?: number;
  done: boolean;
  /** Делать сегодня нечего — серая отметка вместо зелёной. */
  idle?: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={[styles.task, done && styles.taskDone]}>
      <View style={[styles.check, done && styles.checkDone]}>
        {done && <CheckIcon size={16} color={theme.accentText} />}
        {idle && !done && <CheckIcon size={16} color={theme.border} />}
      </View>
      <View style={styles.taskText}>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
        {progress !== undefined && !done && (
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.round(Math.min(1, progress) * 100)}%` }]} />
          </View>
        )}
      </View>
      <ChevronIcon size={18} color={theme.neon} direction="right" />
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
    body: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
    placementLine: { marginTop: -4, marginBottom: 4 },
    placementText: { color: theme.textMuted, fontSize: 13 },
    placementAgain: { color: theme.neon, fontWeight: '600' },
    streak: { color: theme.neon, fontSize: 16, fontWeight: '700', marginTop: 4, marginBottom: 4 },
    task: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    taskDone: { backgroundColor: theme.correctionBg, borderColor: theme.correctionBorder },
    check: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkDone: { backgroundColor: theme.correctionText, borderColor: theme.correctionText },
    taskText: { flex: 1, gap: 2 },
    caption: { color: theme.correctionText, fontSize: 12, fontWeight: '700' },
    taskTitle: { color: theme.text, fontSize: 16, fontWeight: '600' },
    detail: { color: theme.textMuted, fontSize: 13 },
    bar: { height: 4, borderRadius: 2, backgroundColor: theme.surfaceAlt, marginTop: 6, overflow: 'hidden' },
    barFill: { height: 4, borderRadius: 2, backgroundColor: theme.neon },
    allDone: { color: theme.correctionText, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 4 },
    section: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 16,
    },
    week: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    day: { alignItems: 'center', gap: 6, flex: 1 },
    dayLabel: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
    dayNumber: { color: theme.textMuted, fontSize: 12 },
    dayToday: { color: theme.neon, fontWeight: '700' },
    dots: { gap: 4 },
    dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: theme.border },
    totals: { color: theme.textMuted, fontSize: 13, textAlign: 'center' },
  });
