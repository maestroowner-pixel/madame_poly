import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LevelSwitch } from './LevelSwitch';
import { WideButton } from './WideButton';
import { ExerciseCard } from './HomeworkScreen';
import { CheckIcon, ChevronIcon } from './icons';
import { ScreenTitle } from './ScreenMenu';
import { errorText } from '../errors';
import { bandOf, findUnit, isSingleCourse, syllabus, type Band, type GrammarUnit } from '../grammar';
import { t } from '../i18n';
import { CONTENT_MAX_WIDTH } from '../layout';
import { generateGrammarLesson, regenerateGrammarExercises } from '../services/llm';
import {
  loadGrammarLesson,
  loadGrammarProgress,
  saveGrammarLesson,
  setGrammarDone,
  type GrammarProgress,
} from '../storage';
import { useStyles, useTheme, type Theme } from '../theme';
import type { GrammarLesson, LanguageCode, Level } from '../types';

interface Props {
  /** Домик со списком разделов. */
  menu: ReactNode;
  language: LanguageCode;
  level: Level;
  /** Сменить уровень — из шапки, по кругу ступеней и с подтверждением. */
  onSelectLevel: (level: Level) => void;
}

/** Номер юнита в ступени — сквозной, как в оглавлении учебника. */
function numbering(modules: ReturnType<typeof syllabus>): Map<string, number> {
  const numbers = new Map<string, number>();
  let next = 1;
  for (const module of modules) for (const unit of module.units) numbers.set(unit.id, next++);
  return numbers;
}

/**
 * Грамматика: программа ступени (A1–A2, B1–B2, C1–C2) модулями и юнитами, как
 * оглавление учебника. По юниту Claude составляет урок — правило с примерами,
 * таблицу форм, типичные ошибки и десять упражнений. Урок хранится; упражнения
 * можно пересоставить, а юнит — отметить пройденным.
 */
/** Ступени по кругу: в грамматике уровни сведены по две. */
const BANDS: readonly Band[] = ['A', 'B', 'C'];

export function GrammarScreen({ menu, language, level, onSelectLevel }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);

  const modules = useMemo(() => syllabus(language, level), [language, level]);
  const numbers = useMemo(() => numbering(modules), [modules]);
  const band = bandOf(level);
  /** Подпись ступени; у сквозного курса ступеней нет. */
  const bandLabel = isSingleCourse(language) ? t.grammarCourse : t.grammarBand(band);

  const [progress, setProgress] = useState<GrammarProgress>({ built: [], done: [] });
  /** Раскрытые модули; по умолчанию — первый, где ещё есть непройденное. */
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [unit, setUnit] = useState<GrammarUnit | null>(null);
  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ответы в карточках схлопываются, когда упражнения меняются.
  const [pass, setPass] = useState(0);

  useEffect(() => {
    setUnit(null);
    setLesson(null);
    setError(null);
    void loadGrammarProgress(language).then((stored) => {
      setProgress(stored);
      const current = modules.findIndex((module) =>
        module.units.some((item) => !stored.done.includes(item.id)),
      );
      setExpanded(new Set([Math.max(0, current)]));
    });
  }, [language, modules]);

  const moduleOf = (item: GrammarUnit) => findUnit(language, item.id)?.module.title ?? '';

  const open = async (item: GrammarUnit) => {
    setError(null);
    setUnit(item);
    setLesson(await loadGrammarLesson(language, item.id));
  };

  const build = async () => {
    if (!unit || busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await generateGrammarLesson({ language, level, unit, moduleTitle: moduleOf(unit) });
      setLesson(next);
      setPass((value) => value + 1);
      setProgress(await saveGrammarLesson(next));
    } catch (e: unknown) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    if (!unit || !lesson || busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await regenerateGrammarExercises(lesson, moduleOf(unit), unit.focus);
      setLesson(next);
      setPass((value) => value + 1);
      setProgress(await saveGrammarLesson(next));
    } catch (e: unknown) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleDone = async (item: GrammarUnit) =>
    setProgress(await setGrammarDone(language, item.id, !progress.done.includes(item.id)));

  const toggleModule = (position: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(position)) next.delete(position);
      else next.add(position);
      return next;
    });

  const total = numbers.size;
  const doneCount = modules.reduce(
    (sum, module) => sum + module.units.filter((item) => progress.done.includes(item.id)).length,
    0,
  );

  if (unit) {
    const done = progress.done.includes(unit.id);
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          {menu}
          <ScreenTitle screen="grammar" />
          {isSingleCourse(language) ? (
            <Text style={styles.level}>{bandLabel}</Text>
          ) : (
            <LevelSwitch value={band} steps={BANDS} label={t.grammarBand} onChange={(next) => onSelectLevel(`${next}1` as Level)} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Pressable onPress={() => setUnit(null)} style={styles.back} hitSlop={8}>
            <ChevronIcon size={18} color={theme.neon} direction="left" />
            <Text style={styles.backLabel}>{t.grammarContents}</Text>
          </Pressable>

          <View style={styles.titleRow}>
            <Text style={styles.number}>{numbers.get(unit.id)}</Text>
            <View style={styles.titleText}>
              <Text style={styles.title}>{unit.title}</Text>
              <Text style={styles.moduleCaption}>{moduleOf(unit)}</Text>
            </View>
          </View>

          {error && (
            <Pressable onPress={() => setError(null)}>
              <Text style={styles.error}>{error}</Text>
            </Pressable>
          )}

          {!lesson ? (
            <>
              <Text style={styles.intro}>{t.grammarBuildHint}</Text>
              <WideButton onPress={() => void build()} disabled={busy} style={styles.cta}>
                {busy ? (
                  <ActivityIndicator color={theme.ctaText} size="small" />
                ) : (
                  <Text style={styles.ctaLabel}>{t.grammarBuild}</Text>
                )}
              </WideButton>
            </>
          ) : (
            <>
              <Text style={styles.lead}>{lesson.intro}</Text>

              {lesson.rules.map((rule, position) => (
                <View key={position} style={styles.rule}>
                  <Text style={styles.ruleHeading}>{rule.heading}</Text>
                  <Text style={styles.ruleText}>{rule.text}</Text>
                  {rule.examples.map((example, index) => (
                    <View key={index} style={styles.example}>
                      <Text style={styles.exampleText}>{example.text}</Text>
                      <Text style={styles.exampleTranslation}>{example.translation}</Text>
                    </View>
                  ))}
                </View>
              ))}

              {lesson.table && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHead]}>
                      {lesson.table.head.map((cell, index) => (
                        <Text key={index} style={[styles.tableCell, styles.tableHeadCell]}>
                          {cell}
                        </Text>
                      ))}
                    </View>
                    {lesson.table.rows.map((row, position) => (
                      <View key={position} style={styles.tableRow}>
                        {row.map((cell, index) => (
                          <Text key={index} style={styles.tableCell}>
                            {cell}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              {lesson.pitfalls.length > 0 && (
                <View style={styles.pitfalls}>
                  <Text style={styles.pitfallsTitle}>{t.grammarPitfalls}</Text>
                  {lesson.pitfalls.map((line, index) => (
                    <Text key={index} style={styles.pitfall}>
                      {line}
                    </Text>
                  ))}
                </View>
              )}

              <Text style={styles.sectionTitle}>{t.grammarExercises}</Text>
              {lesson.exercises.map((exercise, index) => (
                <ExerciseCard key={`${pass}:${index}`} exercise={exercise} index={index} />
              ))}

              <WideButton onPress={() => void refresh()} disabled={busy} style={styles.secondary}>
                {busy ? (
                  <ActivityIndicator color={theme.neon} size="small" />
                ) : (
                  <Text style={styles.secondaryLabel}>{t.grammarMoreExercises}</Text>
                )}
              </WideButton>
              <Pressable
                onPress={() => void toggleDone(unit)}
                style={[styles.doneButton, done && styles.doneButtonOn]}
              >
                {done && <CheckIcon size={16} color={theme.ctaText} />}
                <Text style={[styles.doneLabel, done && styles.doneLabelOn]}>
                  {done ? t.grammarDone : t.grammarMarkDone}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="grammar" />
        {isSingleCourse(language) ? (
          <Text style={styles.level}>{bandLabel}</Text>
        ) : (
          <LevelSwitch value={band} steps={BANDS} label={t.grammarBand} onChange={(next) => onSelectLevel(`${next}1` as Level)} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>{t.grammarIntro}</Text>
        <Text style={styles.progress}>{t.grammarProgress(doneCount, total)}</Text>

        {modules.map((module, position) => {
          const isOpen = expanded.has(position);
          const finished = module.units.filter((item) => progress.done.includes(item.id)).length;
          return (
            <View key={module.title} style={styles.module}>
              <Pressable onPress={() => toggleModule(position)} style={styles.moduleHead}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleCount}>
                  {finished}/{module.units.length}
                </Text>
                <ChevronIcon size={16} color={theme.textMuted} direction={isOpen ? 'up' : 'down'} />
              </Pressable>
              {isOpen &&
                module.units.map((item) => {
                  const done = progress.done.includes(item.id);
                  const built = progress.built.includes(item.id);
                  return (
                    <Pressable key={item.id} onPress={() => void open(item)} style={styles.unit}>
                      <Text style={styles.unitNumber}>{numbers.get(item.id)}</Text>
                      <Text style={[styles.unitTitle, done && styles.unitDone]}>{item.title}</Text>
                      {done ? (
                        <CheckIcon size={16} color={theme.correctionText} />
                      ) : built ? (
                        <View style={styles.builtDot} />
                      ) : null}
                    </Pressable>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>
    </View>
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
    level: { color: theme.neon, fontSize: 18, fontWeight: '700', marginLeft: 'auto' },
    body: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 12,
    },
    error: { color: theme.dangerText, fontSize: 12, lineHeight: 17 },
    intro: { color: theme.textMuted, fontSize: 13, lineHeight: 19 },
    progress: { color: theme.correctionText, fontSize: 13, fontWeight: '700' },

    module: {
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    moduleHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
    moduleTitle: { color: theme.text, fontSize: 15, fontWeight: '700', flex: 1 },
    moduleCount: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
    unit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 9,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    unitNumber: { color: theme.textMuted, fontSize: 12, fontWeight: '700', width: 26 },
    unitTitle: { color: theme.text, fontSize: 14, lineHeight: 19, flex: 1 },
    unitDone: { color: theme.textMuted },
    builtDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.neon },

    back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    backLabel: { color: theme.neon, fontSize: 14, fontWeight: '600' },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    number: { color: theme.neon, fontSize: 18, fontWeight: '700', minWidth: 26 },
    titleText: { flex: 1, gap: 2 },
    title: { color: theme.text, fontSize: 18, fontWeight: '700' },
    moduleCaption: { color: theme.textMuted, fontSize: 12 },

    lead: { color: theme.text, fontSize: 15, lineHeight: 22 },
    rule: {
      gap: 6,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    ruleHeading: { color: theme.neon, fontSize: 15, fontWeight: '700' },
    ruleText: { color: theme.text, fontSize: 14, lineHeight: 21 },
    example: {
      gap: 1,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: theme.border,
    },
    exampleText: { color: theme.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
    exampleTranslation: { color: theme.textMuted, fontSize: 13, lineHeight: 18 },

    table: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    tableHead: { backgroundColor: theme.surfaceAlt, borderTopWidth: 0 },
    tableCell: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 18,
      minWidth: 96,
      maxWidth: 180,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    tableHeadCell: { color: theme.textMuted, fontWeight: '700' },

    pitfalls: {
      gap: 6,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.correctionBg,
      borderWidth: 1,
      borderColor: theme.correctionBorder,
    },
    pitfallsTitle: { color: theme.correctionText, fontSize: 14, fontWeight: '700' },
    pitfall: { color: theme.text, fontSize: 14, lineHeight: 20 },

    sectionTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginTop: 4 },

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
    doneButton: {
      height: 46,
      borderRadius: 14,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    doneButtonOn: { backgroundColor: theme.ctaBg, borderColor: theme.ctaBorder },
    doneLabel: { color: theme.text, fontSize: 14, fontWeight: '600' },
    doneLabelOn: { color: theme.ctaText },
  });
