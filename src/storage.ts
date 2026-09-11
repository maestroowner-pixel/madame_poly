import AsyncStorage from '@react-native-async-storage/async-storage';

import { SPEECH_RATES, type SpeechMode } from './config';
import { LANGUAGE_CODES } from './languages';
import { touch } from './services/sync';
import type {
  ArchivedSession,
  Homework,
  LanguageCode,
  Level,
  Listening,
  ListeningStats,
  WritingReview,
  WritingTask,
  Message,
  EnglishVariant,
  Profile,
  TurnMode,
} from './types';

const KEY_LEVELS = 'polyglotta:levels';
const KEY_LANGUAGE = 'polyglotta:language';
const keyHistory = (language: LanguageCode) => `polyglotta:history:${language}`;
const keyTopic = (language: LanguageCode) => `polyglotta:topic:${language}`;
const KEY_ARCHIVE = 'polyglotta:archive';
const KEY_PROFILE = 'polyglotta:profile';
const KEY_MODE = 'polyglotta:turnMode';
const KEY_RATE = 'polyglotta:speechRate';
const KEY_WPM = 'polyglotta:userWpm';
const KEY_VARIANT = 'polyglotta:englishVariant';
const keyArchived = (id: string) => `polyglotta:archive:${id}`;
const keyHomework = (id: string) => `polyglotta:homework:${id}`;
const keyListening = (language: LanguageCode) => `polyglotta:listening:${language}`;
const keyListeningStats = (language: LanguageCode) => `polyglotta:listeningStats:${language}`;
const keyWriting = (language: LanguageCode) => `polyglotta:writing:${language}`;
const KEY_LESSONS = 'polyglotta:lessons';

/**
 * Любая запись отмечается временем — по нему синхронизация решает, чьи данные
 * свежее. Через эти две функции проходят все изменения, поэтому новый ключ
 * попадает в облако сам, без правок в синхронизации.
 */
async function write(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
  await touch(key);
}

async function drop(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
  await touch(key);
}

const DEFAULT_LEVEL: Level = 'B1';

export type LevelMap = Record<LanguageCode, Level>;

function defaultLevels(): LevelMap {
  return Object.fromEntries(LANGUAGE_CODES.map((c) => [c, DEFAULT_LEVEL])) as LevelMap;
}

/** Уровень хранится отдельно по каждому языку и подставляется в system prompt. */
export async function loadLevels(): Promise<LevelMap> {
  const raw = await AsyncStorage.getItem(KEY_LEVELS);
  if (!raw) return defaultLevels();
  try {
    return { ...defaultLevels(), ...(JSON.parse(raw) as Partial<LevelMap>) };
  } catch {
    return defaultLevels();
  }
}

export async function saveLevels(levels: LevelMap): Promise<void> {
  await write(KEY_LEVELS, JSON.stringify(levels));
}

export async function loadLanguage(): Promise<LanguageCode> {
  const raw = await AsyncStorage.getItem(KEY_LANGUAGE);
  return LANGUAGE_CODES.includes(raw as LanguageCode) ? (raw as LanguageCode) : 'en';
}

export async function saveLanguage(language: LanguageCode): Promise<void> {
  await write(KEY_LANGUAGE, language);
}

/** История диалога своя для каждого языка. */
export async function loadHistory(language: LanguageCode): Promise<Message[]> {
  const raw = await AsyncStorage.getItem(keyHistory(language));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

export async function saveHistory(language: LanguageCode, messages: Message[]): Promise<void> {
  await write(keyHistory(language), JSON.stringify(messages));
}

/** Тема разговора своя для каждого языка; null — свободный разговор. */
export async function loadTopic(language: LanguageCode): Promise<string | null> {
  return AsyncStorage.getItem(keyTopic(language));
}

export async function saveTopic(language: LanguageCode, topic: string | null): Promise<void> {
  if (topic) await write(keyTopic(language), topic);
  else await drop(keyTopic(language));
}

export async function clearHistory(language: LanguageCode): Promise<void> {
  await drop(keyHistory(language));
}

/** Режим окончания реплики — общий для всех языков. */
export async function loadTurnMode(): Promise<TurnMode> {
  const raw = await AsyncStorage.getItem(KEY_MODE);
  return raw === 'manual' ? 'manual' : 'auto';
}

export async function saveTurnMode(mode: TurnMode): Promise<void> {
  await write(KEY_MODE, mode);
}

/** Темп речи собеседницы. Незнакомое значение приводим к обычному. */
export async function loadSpeechRate(): Promise<SpeechMode> {
  const raw = await AsyncStorage.getItem(KEY_RATE);
  if (raw === 'auto') return 'auto';
  const value = Number(raw);
  return (SPEECH_RATES as readonly number[]).includes(value) ? (value as SpeechMode) : 1;
}

export async function saveSpeechRate(rate: SpeechMode): Promise<void> {
  await write(KEY_RATE, String(rate));
}

/** Замеренный темп речи человека, слов в минуту; null — ещё не мерили. */
export async function loadUserWpm(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(KEY_WPM);
  const value = Number(raw);
  return raw !== null && Number.isFinite(value) && value > 0 ? value : null;
}

export async function saveUserWpm(wpm: number): Promise<void> {
  await write(KEY_WPM, String(Math.round(wpm)));
}

/** Вариант английского — общий для всех бесед на нём. */
export async function loadEnglishVariant(): Promise<EnglishVariant> {
  const raw = await AsyncStorage.getItem(KEY_VARIANT);
  return raw === 'american' || raw === 'cockney' ? raw : 'british';
}

export async function saveEnglishVariant(variant: EnglishVariant): Promise<void> {
  await write(KEY_VARIANT, variant);
}

export const EMPTY_PROFILE: Profile = { name: '', avatarId: null, photoUri: null };

export async function loadProfile(): Promise<Profile> {
  const raw = await AsyncStorage.getItem(KEY_PROFILE);
  if (!raw) return EMPTY_PROFILE;
  try {
    return { ...EMPTY_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) };
  } catch {
    return EMPTY_PROFILE;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await write(KEY_PROFILE, JSON.stringify(profile));
}

/** Список бесед, новые сверху. Реплики хранятся отдельно и грузятся по запросу. */
export async function loadArchive(): Promise<ArchivedSession[]> {
  const raw = await AsyncStorage.getItem(KEY_ARCHIVE);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ArchivedSession[];
  } catch {
    return [];
  }
}

/**
 * Задание живёт под тем же ключом, что и беседа: у текущей это код языка, у
 * законченной — её идентификатор, поэтому при уходе в архив достаточно
 * перенести одну запись.
 */
export const EMPTY_LISTENING_STATS: ListeningStats = {
  attempts: 0,
  abandoned: 0,
  right: 0,
  total: 0,
};

export async function loadListeningStats(language: LanguageCode): Promise<ListeningStats> {
  const raw = await AsyncStorage.getItem(keyListeningStats(language));
  if (!raw) return EMPTY_LISTENING_STATS;
  try {
    return { ...EMPTY_LISTENING_STATS, ...(JSON.parse(raw) as ListeningStats) };
  } catch {
    return EMPTY_LISTENING_STATS;
  }
}

export async function saveListeningStats(
  language: LanguageCode,
  stats: ListeningStats,
): Promise<void> {
  await write(keyListeningStats(language), JSON.stringify(stats));
}

/** Черновик письма живёт целиком: задание, набранный текст и разбор. */
export interface WritingState {
  task: WritingTask | null;
  text: string;
  review: WritingReview | null;
}

export const EMPTY_WRITING: WritingState = { task: null, text: '', review: null };

export async function loadWriting(language: LanguageCode): Promise<WritingState> {
  const raw = await AsyncStorage.getItem(keyWriting(language));
  if (!raw) return EMPTY_WRITING;
  try {
    return { ...EMPTY_WRITING, ...(JSON.parse(raw) as WritingState) };
  } catch {
    return EMPTY_WRITING;
  }
}

export async function saveWriting(language: LanguageCode, state: WritingState): Promise<void> {
  await write(keyWriting(language), JSON.stringify(state));
}

/** Последний диктант по языку: пережить перезапуск он должен, история — нет. */
export async function loadListening(language: LanguageCode): Promise<Listening | null> {
  const raw = await AsyncStorage.getItem(keyListening(language));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Listening;
  } catch {
    return null;
  }
}

export async function saveListening(
  language: LanguageCode,
  listening: Listening | null,
): Promise<void> {
  if (listening) await write(keyListening(language), JSON.stringify(listening));
  else await drop(keyListening(language));
}

export async function loadHomework(id: string): Promise<Homework | null> {
  const raw = await AsyncStorage.getItem(keyHomework(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Homework;
  } catch {
    return null;
  }
}

export async function saveHomework(id: string, homework: Homework | null): Promise<void> {
  if (homework) await write(keyHomework(id), JSON.stringify(homework));
  else await drop(keyHomework(id));
}

export async function loadArchivedMessages(id: string): Promise<Message[]> {
  const raw = await AsyncStorage.getItem(keyArchived(id));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

/** Складывает текущую беседу в архив и возвращает обновлённый список. */
export async function archiveSession(
  session: ArchivedSession,
  messages: Message[],
): Promise<ArchivedSession[]> {
  const archive = [session, ...(await loadArchive())];
  await AsyncStorage.multiSet([
    [keyArchived(session.id), JSON.stringify(messages)],
    [KEY_ARCHIVE, JSON.stringify(archive)],
  ]);
  return archive;
}

/** Одна порция упражнений с тем, из какой беседы она выросла. */
export interface NotebookEntry {
  id: string;
  language: LanguageCode;
  level: Level;
  topicId: string | null;
  createdAt: number;
  homework: Homework;
}

/**
 * Все упражнения, что были составлены: из законченных бесед и из текущих по
 * каждому языку. Собирается на лету, а не хранится отдельно, — иначе список
 * пришлось бы чинить после каждого удаления беседы.
 */
/**
 * Занятие, не привязанное к беседе, — например разбор написанного. Хранится
 * списком описаний, сами упражнения лежат под общим ключом задания: так тетрадь
 * собирает их тем же способом, что и остальные.
 */
export interface Lesson {
  id: string;
  language: LanguageCode;
  level: Level;
  topicId: string | null;
  createdAt: number;
}

async function loadLessons(): Promise<Lesson[]> {
  const raw = await AsyncStorage.getItem(KEY_LESSONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Lesson[];
  } catch {
    return [];
  }
}

/** Кладёт занятие в тетрадь: описание в список, упражнения — под его номер. */
export async function saveLesson(lesson: Lesson, homework: Homework): Promise<void> {
  const lessons = await loadLessons();
  await saveHomework(lesson.id, homework);
  await write(KEY_LESSONS, JSON.stringify([lesson, ...lessons]));
}

export async function loadNotebook(): Promise<NotebookEntry[]> {
  const entries: NotebookEntry[] = [];

  for (const session of await loadArchive()) {
    if (!session.hasHomework) continue;
    const homework = await loadHomework(session.id);
    if (homework) {
      entries.push({
        id: session.id,
        language: session.language,
        level: session.level,
        topicId: session.topicId,
        createdAt: homework.createdAt,
        homework,
      });
    }
  }

  for (const language of LANGUAGE_CODES) {
    const homework = await loadHomework(language);
    if (!homework) continue;
    const levels = await loadLevels();
    entries.push({
      id: `current-${language}`,
      language,
      level: levels[language],
      topicId: await loadTopic(language),
      createdAt: homework.createdAt,
      homework,
    });
  }

  for (const lesson of await loadLessons()) {
    const homework = await loadHomework(lesson.id);
    if (homework) entries.push({ ...lesson, homework });
  }

  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteArchived(id: string): Promise<ArchivedSession[]> {
  const archive = (await loadArchive()).filter((session) => session.id !== id);
  await AsyncStorage.multiRemove([keyArchived(id), keyHomework(id)]);
  await write(KEY_ARCHIVE, JSON.stringify(archive));
  return archive;
}
