import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { WideButton } from './WideButton';
import { DirectionToggle } from './FlipCard';
import { PhrasalGaps } from './PhrasalGaps';
import { PhrasalSpeak } from './PhrasalSpeak';
import { ChevronIcon, EyeIcon, ShareIcon } from './icons';
import { ScreenTitle } from './ScreenMenu';
import { TopicPicker } from './TopicPicker';
import { VocabularyCards } from './VocabularyCards';
import { VocabularyQuiz } from './VocabularyQuiz';
import { VocabularyReview } from './VocabularyReview';
import { measureAnchor, type Anchor } from '../anchor';
import { formatDate } from '../format';
import { locale, t } from '../i18n';
import { errorText } from '../errors';
import { LANGUAGES } from '../languages';
import { CONTENT_MAX_WIDTH } from '../layout';
import { dueCards, newCard } from '../review';
import { generateVocabulary, transcribeVocabulary } from '../services/llm';
import { syncReminders } from '../services/reminders';
import { exportVocabularyPdf } from '../services/pdf';
import { synthesize } from '../services/tts';
import {
  deleteVocabulary,
  loadCardDirection,
  loadEnglishVariant,
  loadKnownWords,
  loadReviewCards,
  loadSpeechRate,
  loadVocabulary,
  loadVocabularyIndex,
  saveCardDirection,
  saveKnownWords,
  saveReviewCards,
  saveVocabulary,
} from '../storage';
import { useStyles, useTheme, type Theme } from '../theme';
import { isSingleCourse } from '../grammar';
import { findTopic, phrasalVerbOf } from '../topics';
import type {
  CardDirection,
  LanguageCode,
  Level,
  ReviewCard,
  Vocabulary,
  VocabularyEntry,
  VocabularyIndexEntry,
} from '../types';

interface Props {
  /** Домик со списком разделов. */
  menu: ReactNode;
  language: LanguageCode;
  level: Level;
  topicId: string | null;
}

/**
 * Вкладки под темой: список, колода карточек, очередь повторения, тест. У темы
 * фразовых глаголов ещё две — пропуски и ответ голосом.
 */
type Tab = 'list' | 'cards' | 'review' | 'quiz' | 'gaps' | 'speak';

/**
 * Слова: тематический список лексики под уровень — как лист, который учитель
 * раздаёт перед новой темой. Слова группами с переводом, готовые фразы, диалог,
 * предложения. Нажатие озвучивает, галочка отмечает выученное, перевод можно
 * спрятать и проверять себя. Список составляется один раз и хранится. Из него
 * же растут карточки и тест; отложенные слова копятся в очереди повторения по
 * языку и возвращаются по расписанию — сначала часто, потом всё реже.
 */
export function VocabularyScreen({ menu, language, level, topicId }: Props) {
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  const player = useAudioPlayer(null);

  const [vocabulary, setVocabulary] = useState<Vocabulary | null>(null);
  const [index, setIndex] = useState<VocabularyIndexEntry[]>([]);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<ReviewCard[]>([]);
  const [direction, setDirection] = useState<CardDirection>('forward');
  const [tab, setTab] = useState<Tab>('list');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  /** Наборы, для которых транскрипцию уже запрашивали, — второй раз за ней не ходим. */
  const transcribed = useRef(new Set<number>());
  const [hideTranslations, setHideTranslations] = useState(false);
  /** Записи, чей перевод показан поверх скрытия, — по нажатию на перевод. */
  const [peeked, setPeeked] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRebuild, setConfirmRebuild] = useState(false);
  /** Тема списка своя: учить слова про аптеку можно и посреди бесед о Риме. */
  const [topic, setTopic] = useState<string | null>(topicId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<Anchor | null>(null);
  const topicRef = useRef<View>(null);
  /** Озвучка слова на время сеанса — второй раз за тем же не ходим. */
  const audio = useRef(new Map<string, string>());
  /** Темп из настроек беседы: слова Poly читает тем же голосом и в том же темпе.
      «Как я» тут не к чему примерять — берём обычный. */
  const rate = useRef(1);

  const fail = (e: unknown) => setError(errorText(e));

  useEffect(() => {
    setError(null);
    setTopic(topicId);
    setTab('list');
    void loadKnownWords(language).then(setKnown);
    void loadReviewCards(language).then(setReview);
    void loadVocabularyIndex().then(setIndex);
  }, [language, topicId]);

  useEffect(() => {
    void loadCardDirection().then(setDirection);
    void loadSpeechRate().then((mode) => {
      rate.current = mode === 'auto' ? 1 : mode;
    });
  }, []);

  // Ушли с темы фразовых глаголов — их вкладок у обычной темы нет.
  useEffect(() => {
    if (!phrasalVerbOf(topic)) setTab((current) => (current === 'gaps' || current === 'speak' ? 'list' : current));
  }, [topic]);

  // Сменили тему или уровень — показываем готовый список под них, если он есть.
  useEffect(() => {
    void loadVocabulary(language, level, topic).then((stored) => {
      setVocabulary(stored);
      setCollapsed(new Set());
      setPeeked(new Set());
    });
  }, [language, level, topic]);

  /** Английский транскрибируем в выбранном варианте — RP или General American. */
  const variantFor = async () => (language === 'en' ? loadEnglishVariant() : undefined);

  // Наборы, составленные до транскрипции, получают её при первом открытии
  // карточек или теста — одним запросом на весь лист.
  useEffect(() => {
    if (!vocabulary || tab === 'list' || transcribing) return;
    const missing = vocabulary.sections.some((section) =>
      section.entries.some((entry) => !entry.transcription),
    );
    if (!missing || transcribed.current.has(vocabulary.createdAt)) return;
    transcribed.current.add(vocabulary.createdAt);
    setTranscribing(true);
    void (async () => {
      try {
        const next = await transcribeVocabulary(vocabulary, await variantFor());
        setVocabulary(next);
        setIndex(await saveVocabulary(next));
        // Карточкам в очереди повторения транскрипция тоже пригодится.
        const notes = new Map(
          next.sections.flatMap((section) =>
            section.entries.map((entry) => [entry.term, entry.transcription] as const),
          ),
        );
        if (review.some((card) => !card.transcription && notes.get(card.term))) {
          storeReview(
            review.map((card) =>
              card.transcription ? card : { ...card, transcription: notes.get(card.term) },
            ),
          );
        }
      } catch (e: unknown) {
        fail(e);
      } finally {
        setTranscribing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabulary, tab]);

  const build = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setConfirmRebuild(false);
    try {
      const chosen = findTopic(language, topic);
      const next = await generateVocabulary({
        language,
        level,
        topic: chosen ?? undefined,
        variant: await variantFor(),
      });
      setVocabulary(next);
      setCollapsed(new Set());
      setPeeked(new Set());
      setIndex(await saveVocabulary(next));
    } catch (e: unknown) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const speak = async (text: string) => {
    if (speaking) return;
    setSpeaking(text);
    try {
      let uri = audio.current.get(text);
      if (!uri) {
        uri = await synthesize(text, rate.current);
        audio.current.set(text, uri);
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      player.replace({ uri });
      player.play();
    } catch (e: unknown) {
      fail(e);
    } finally {
      setSpeaking(null);
    }
  };

  const toggleKnown = (term: string) => {
    const next = new Set(known);
    if (next.has(term)) next.delete(term);
    else next.add(term);
    setKnown(next);
    void saveKnownWords(language, next);
  };

  const changeDirection = (next: CardDirection) => {
    setDirection(next);
    void saveCardDirection(next);
  };

  const storeReview = (cards: ReviewCard[]) => {
    setReview(cards);
    // Очередь опустела или впервые наполнилась — напоминания в системе
    // должны это узнать.
    if ((cards.length === 0) !== (review.length === 0)) {
      void saveReviewCards(language, cards).then(syncReminders).catch(() => undefined);
    } else {
      void saveReviewCards(language, cards);
    }
  };

  /** «Знаю» на карточке: галочка в списке, из очереди повторения — долой. */
  const markKnown = (entry: VocabularyEntry) => {
    if (!known.has(entry.term)) {
      const next = new Set(known).add(entry.term);
      setKnown(next);
      void saveKnownWords(language, next);
    }
    if (review.some((card) => card.term === entry.term)) {
      storeReview(review.filter((card) => card.term !== entry.term));
    }
  };

  /** «Повторить позже»: в очередь, если ещё не там; галочку «знаю» снимаем. */
  const postpone = (entries: VocabularyEntry[]) => {
    const queued = new Set(review.map((card) => card.term));
    const fresh = entries.filter((entry) => !queued.has(entry.term));
    if (fresh.length) storeReview([...review, ...fresh.map((entry) => newCard(entry))]);
    if (entries.some((entry) => known.has(entry.term))) {
      const next = new Set(known);
      entries.forEach((entry) => next.delete(entry.term));
      setKnown(next);
      void saveKnownWords(language, next);
    }
  };

  /** Ответ в повторении: карточка сдвигается по лестнице или, выученная, уходит в «знаю». */
  const answerReview = (card: ReviewCard, next: ReviewCard | null) => {
    storeReview(
      next
        ? review.map((item) => (item.term === card.term ? next : item))
        : review.filter((item) => item.term !== card.term),
    );
    if (!next && !known.has(card.term)) {
      const knownNext = new Set(known).add(card.term);
      setKnown(knownNext);
      void saveKnownWords(language, knownNext);
    }
  };

  const togglePeek = (term: string) => {
    const next = new Set(peeked);
    if (next.has(term)) next.delete(term);
    else next.add(term);
    setPeeked(next);
  };

  const toggleSection = (position: number) => {
    const next = new Set(collapsed);
    if (next.has(position)) next.delete(position);
    else next.add(position);
    setCollapsed(next);
  };

  const exportPdf = async () => {
    if (!vocabulary || exporting) return;
    setExporting(true);
    try {
      const subtitle = `${LANGUAGES[vocabulary.language].label} · ${vocabulary.level} · ${new Date(vocabulary.createdAt).toLocaleDateString(locale)}`;
      await exportVocabularyPdf(vocabulary, subtitle);
    } catch (e: unknown) {
      fail(e);
    } finally {
      setExporting(false);
    }
  };

  const open = async (entry: VocabularyIndexEntry) => {
    // Список другого уровня открываем как есть: уровень беседы он не меняет.
    const stored = await loadVocabulary(entry.language, entry.level, entry.topicId);
    if (!stored) return;
    setTopic(entry.topicId);
    setVocabulary(stored);
    setCollapsed(new Set());
    setPeeked(new Set());
  };

  const remove = async (entry: VocabularyIndexEntry) => {
    setIndex(await deleteVocabulary(entry));
    if (
      vocabulary &&
      vocabulary.level === entry.level &&
      vocabulary.topicId === entry.topicId &&
      vocabulary.language === entry.language
    ) {
      setVocabulary(null);
    }
  };

  const total = vocabulary?.sections.reduce((sum, section) => sum + section.entries.length, 0) ?? 0;
  const knownCount =
    vocabulary?.sections.reduce(
      (sum, section) => sum + section.entries.filter((entry) => known.has(entry.term)).length,
      0,
    ) ?? 0;

  const saved = index.filter((entry) => entry.language === language);
  const due = dueCards(review).length;
  /** Тема фразовых глаголов — у неё свои упражнения на пропуск. */
  const phrasal = language === 'en' && phrasalVerbOf(topic) !== null;
  const drills = vocabulary?.drills ?? [];
  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: 'list', label: t.wordsTabList },
    ...(phrasal
      ? ([
          { key: 'gaps', label: t.wordsTabGaps },
          { key: 'speak', label: t.wordsTabSpeak },
        ] as const)
      : []),
    { key: 'cards', label: t.wordsTabCards },
    { key: 'review', label: t.wordsTabReview, badge: due },
    { key: 'quiz', label: t.wordsTabQuiz },
  ];
  const tabIndex = Math.max(0, tabs.findIndex((item) => item.key === tab));
  /** Стрелки листают по кругу: с последнего раздела — на первый. */
  const shiftTab = (step: number) => setTab(tabs[(tabIndex + step + tabs.length) % tabs.length].key);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        {menu}
        <ScreenTitle screen="words" />
        {/* У сквозного курса (украинский, бразильский) уровня нет — не показываем. */}
        {!isSingleCourse(language) && <Text style={styles.level}>{vocabulary?.level ?? level}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {error && (
          <Pressable onPress={() => setError(null)}>
            <Text style={styles.error}>{error}</Text>
          </Pressable>
        )}

        <View style={styles.topicRow}>
          <View ref={topicRef} collapsable={false} style={styles.topicWrap}>
            <Pressable
              onPress={() =>
                measureAnchor(topicRef, (point) => {
                  setPickerAnchor(point);
                  setPickerOpen(true);
                })
              }
              style={styles.topicButton}
            >
              <Text style={styles.topicCaption}>{t.topic}</Text>
              <Text style={styles.topicValue} numberOfLines={1}>
                {findTopic(language, topic)?.label ?? t.free}
              </Text>
              <Text style={styles.topicChevron}>›</Text>
            </Pressable>
          </View>
          {vocabulary && (
            <Pressable
              onPress={() => void exportPdf()}
              disabled={exporting}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.pdf}
              style={styles.share}
            >
              {exporting ? (
                <ActivityIndicator color={theme.neon} size="small" />
              ) : (
                <ShareIcon size={22} color={theme.neon} />
              )}
            </Pressable>
          )}
        </View>

        {due > 0 && tab !== 'review' && (
          <Pressable onPress={() => setTab('review')} style={styles.reminder}>
            <Text style={styles.reminderText}>{t.wordsReviewDue(due)}</Text>
            <Text style={styles.reminderChevron}>›</Text>
          </Pressable>
        )}

        {/* Четыре названия в ряд на телефоне не помещаются — показываем одно
            целиком, а листаем стрелками; точки под ним говорят, где мы. */}
        <View style={styles.pager}>
          <Pressable onPress={() => shiftTab(-1)} hitSlop={8} style={styles.pagerArrow}>
            <ChevronIcon size={22} color={theme.neon} direction="left" />
          </Pressable>
          <View style={styles.pagerTitle}>
            <View style={styles.pagerTitleRow}>
              <Text style={styles.pagerLabel} numberOfLines={1}>
                {tabs[tabIndex].label}
              </Text>
              {tabs[tabIndex].badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tabs[tabIndex].badge}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.dots}>
              {tabs.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  hitSlop={6}
                  style={[styles.dot, item.key === tab && styles.dotActive, item.badge ? styles.dotDue : null]}
                />
              ))}
            </View>
          </View>
          <Pressable onPress={() => shiftTab(1)} hitSlop={8} style={styles.pagerArrow}>
            <ChevronIcon size={22} color={theme.neon} direction="right" />
          </Pressable>
        </View>

        {tab !== 'list' && tab !== 'gaps' && tab !== 'speak' && (
          <DirectionToggle learning={language} native={locale} value={direction} onChange={changeDirection} />
        )}

        {tab === 'cards' &&
          (vocabulary ? (
            <VocabularyCards
              key={`${vocabulary.language}:${vocabulary.level}:${vocabulary.topicId ?? 'free'}:${vocabulary.createdAt}`}
              vocabulary={vocabulary}
              known={known}
              direction={direction}
              speaking={speaking}
              onSpeak={(text) => void speak(text)}
              onKnow={markKnown}
              onLater={(entry) => postpone([entry])}
            />
          ) : (
            <Text style={styles.intro}>{t.wordsNoSheet}</Text>
          ))}

        {tab === 'review' && (
          <VocabularyReview
            cards={review}
            direction={direction}
            speaking={speaking}
            onSpeak={(text) => void speak(text)}
            onAnswer={answerReview}
          />
        )}

        {tab === 'quiz' &&
          (vocabulary ? (
            <VocabularyQuiz
              key={`${vocabulary.createdAt}:${direction}`}
              vocabulary={vocabulary}
              direction={direction}
              onLater={postpone}
            />
          ) : (
            <Text style={styles.intro}>{t.wordsNoSheet}</Text>
          ))}

        {(tab === 'gaps' || tab === 'speak') && phrasal &&
          (!vocabulary ? (
            <Text style={styles.intro}>{t.wordsNoSheet}</Text>
          ) : drills.length === 0 ? (
            <Text style={styles.intro}>{t.phrasalRebuild}</Text>
          ) : tab === 'gaps' ? (
            <PhrasalGaps
              key={vocabulary.createdAt}
              vocabulary={vocabulary}
              drills={drills}
              speaking={speaking}
              onSpeak={(text) => void speak(text)}
              onLater={postpone}
            />
          ) : (
            <PhrasalSpeak
              key={vocabulary.createdAt}
              vocabulary={vocabulary}
              drills={drills}
              speaking={speaking}
              onSpeak={(text) => void speak(text)}
              onLater={postpone}
            />
          ))}

        {tab === 'list' && !vocabulary ? (
          <>
            <Text style={styles.intro}>{t.wordsIntro}</Text>
            <WideButton onPress={() => void build()} disabled={busy} style={styles.cta}>
              {busy ? (
                <ActivityIndicator color={theme.ctaText} size="small" />
              ) : (
                <Text style={styles.ctaLabel}>{t.wordsBuild}</Text>
              )}
            </WideButton>
          </>
        ) : tab === 'list' && vocabulary ? (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{vocabulary.title}</Text>
              <Text style={styles.progress}>
                {knownCount} / {total}
              </Text>
              <Pressable
                onPress={() => {
                  setHideTranslations((hidden) => !hidden);
                  setPeeked(new Set());
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={hideTranslations ? t.wordsShow : t.wordsHide}
                style={styles.eye}
              >
                <EyeIcon size={22} color={theme.neon} closed={hideTranslations} cutout={theme.surfaceAlt} />
              </Pressable>
            </View>

            {vocabulary.sections.map((section, position) => {
              const closed = collapsed.has(position);
              return (
                <View key={position} style={styles.section}>
                  <Pressable onPress={() => toggleSection(position)} style={styles.sectionHead}>
                    <View style={styles.sectionTitles}>
                      <Text style={styles.sectionTitle}>
                        {position + 1}. {section.title}
                      </Text>
                      {section.gloss !== section.title && (
                        <Text style={styles.sectionGloss}>{section.gloss}</Text>
                      )}
                    </View>
                    <Text style={styles.sectionChevron}>{closed ? '▾' : '▴'}</Text>
                  </Pressable>

                  {!closed &&
                    section.entries.map((entry) => {
                      const isKnown = known.has(entry.term);
                      const shown = !hideTranslations || peeked.has(entry.term);
                      return (
                        <View key={entry.term} style={styles.entry}>
                          <Pressable
                            onPress={() => toggleKnown(entry.term)}
                            hitSlop={8}
                            style={[styles.tick, isKnown && styles.tickOn]}
                          >
                            {isKnown && <Text style={styles.tickMark}>✓</Text>}
                          </Pressable>
                          <View style={styles.entryText}>
                            <Pressable onPress={() => void speak(entry.term)}>
                              <Text
                                style={[
                                  styles.term,
                                  isKnown && styles.termKnown,
                                  speaking === entry.term && styles.termSpeaking,
                                ]}
                              >
                                {entry.term}
                              </Text>
                            </Pressable>
                            <Pressable onPress={() => hideTranslations && togglePeek(entry.term)}>
                              <Text style={[styles.translation, !shown && styles.translationHidden]}>
                                {shown ? entry.translation : '· · ·'}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                </View>
              );
            })}

            {vocabulary.dialogue.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.wordsDialogue}</Text>
                {vocabulary.dialogue.map((line, position) => (
                  <Pressable key={position} onPress={() => void speak(line)}>
                    <Text style={[styles.line, speaking === line && styles.termSpeaking]}>
                      — {line}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {vocabulary.examples.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.wordsExamples}</Text>
                {vocabulary.examples.map((line, position) => (
                  <Pressable key={position} onPress={() => void speak(line)}>
                    <Text style={[styles.line, speaking === line && styles.termSpeaking]}>
                      {line}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <WideButton
              onPress={() => setConfirmRebuild(true)}
              disabled={busy}
              style={styles.secondary}
            >
              {busy ? (
                <ActivityIndicator color={theme.neon} size="small" />
              ) : (
                <Text style={styles.secondaryLabel}>{t.wordsRebuild}</Text>
              )}
            </WideButton>
          </>
        ) : null}

        {tab === 'list' && saved.length > 0 && <Text style={styles.caption}>{t.wordsSaved}</Text>}
        {tab === 'list' && saved.map((entry) => (
          <Pressable
            key={`${entry.level}:${entry.topicId ?? 'free'}`}
            onPress={() => void open(entry)}
            style={styles.row}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {entry.title}
              </Text>
              <Text style={styles.rowMeta}>
                {entry.level} · {t.wordsEntries(entry.count)} · {formatDate(entry.createdAt)}
              </Text>
            </View>
            <Pressable onPress={() => void remove(entry)} hitSlop={10}>
              <Text style={styles.delete}>{t.delete}</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>

      {confirmRebuild && (
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t.wordsRebuildTitle}</Text>
            <Text style={styles.confirmText}>{t.wordsRebuildWarning}</Text>
            <View style={styles.confirmRow}>
              <Pressable onPress={() => setConfirmRebuild(false)} style={styles.confirmGhost}>
                <Text style={styles.confirmGhostLabel}>{t.cancel}</Text>
              </Pressable>
              <Pressable onPress={() => void build()} style={styles.confirmDanger}>
                <Text style={styles.confirmDangerLabel}>{t.wordsRebuild}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <TopicPicker
        visible={pickerOpen}
        anchor={pickerAnchor}
        language={language}
        topicId={topic}
        phrasal
        onSelect={setTopic}
        onClose={() => setPickerOpen(false)}
      />
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
    level: { color: theme.neon, fontSize: 12, fontWeight: '700', marginLeft: 'auto' },

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
    caption: { color: theme.textMuted, fontSize: 12, marginTop: 8 },

    topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    topicWrap: { flex: 1 },
    share: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    reminder: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.correctionBg,
      borderWidth: 1,
      borderColor: theme.correctionBorder,
    },
    reminderText: { color: theme.correctionText, fontSize: 14, fontWeight: '600', flex: 1 },
    reminderChevron: { color: theme.correctionText, fontSize: 18, lineHeight: 20 },
    pager: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pagerArrow: {
      width: 40,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    pagerTitle: { flex: 1, alignItems: 'center', gap: 6 },
    pagerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pagerLabel: { color: theme.neon, fontSize: 16, fontWeight: '700' },
    dots: { flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.border },
    dotActive: { backgroundColor: theme.neon },
    dotDue: { backgroundColor: theme.correctionText },
    badge: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.correctionText,
    },
    badgeText: { color: theme.surface, fontSize: 11, fontWeight: '700' },

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

    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { color: theme.text, fontSize: 18, fontWeight: '700', flex: 1 },
    progress: { color: theme.correctionText, fontSize: 13, fontWeight: '700' },
    eye: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },

    section: {
      gap: 4,
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
    sectionTitles: { flex: 1, gap: 1 },
    sectionTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
    sectionGloss: { color: theme.textMuted, fontSize: 12 },
    sectionChevron: { color: theme.textMuted, fontSize: 14 },

    entry: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    tick: {
      width: 22,
      height: 22,
      marginTop: 1,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tickOn: { backgroundColor: theme.correctionText, borderColor: theme.correctionText },
    tickMark: { color: theme.surface, fontSize: 13, fontWeight: '800', lineHeight: 16 },
    entryText: { flex: 1, gap: 1 },
    term: { color: theme.text, fontSize: 15, fontWeight: '600', lineHeight: 21 },
    termKnown: { color: theme.textMuted },
    termSpeaking: { color: theme.neon },
    translation: { color: theme.textMuted, fontSize: 13, lineHeight: 18 },
    translationHidden: { letterSpacing: 2 },
    line: { color: theme.text, fontSize: 14, lineHeight: 21, paddingVertical: 3 },

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

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { color: theme.text, fontSize: 14, fontWeight: '600' },
    rowMeta: { color: theme.textMuted, fontSize: 12 },
    delete: { color: theme.dangerText, fontSize: 12, fontWeight: '600' },

    confirmBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: 'rgba(4,10,30,0.6)',
    },
    confirmCard: {
      width: '100%',
      maxWidth: 340,
      gap: 10,
      padding: 18,
      borderRadius: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    confirmTitle: { color: theme.text, fontSize: 17, fontWeight: '700' },
    confirmText: { color: theme.textMuted, fontSize: 14, lineHeight: 20 },
    confirmRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    confirmGhost: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    confirmGhostLabel: { color: theme.text, fontSize: 15, fontWeight: '600' },
    confirmDanger: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.danger,
    },
    confirmDangerLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  });
