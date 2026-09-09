import AsyncStorage from '@react-native-async-storage/async-storage';

import { LANGUAGE_CODES } from './languages';
import type {
  ArchivedSession,
  Homework,
  LanguageCode,
  Level,
  Message,
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
const keyArchived = (id: string) => `polyglotta:archive:${id}`;
const keyHomework = (id: string) => `polyglotta:homework:${id}`;

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
  await AsyncStorage.setItem(KEY_LEVELS, JSON.stringify(levels));
}

export async function loadLanguage(): Promise<LanguageCode> {
  const raw = await AsyncStorage.getItem(KEY_LANGUAGE);
  return LANGUAGE_CODES.includes(raw as LanguageCode) ? (raw as LanguageCode) : 'en';
}

export async function saveLanguage(language: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(KEY_LANGUAGE, language);
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
  await AsyncStorage.setItem(keyHistory(language), JSON.stringify(messages));
}

/** Тема разговора своя для каждого языка; null — свободный разговор. */
export async function loadTopic(language: LanguageCode): Promise<string | null> {
  return AsyncStorage.getItem(keyTopic(language));
}

export async function saveTopic(language: LanguageCode, topic: string | null): Promise<void> {
  if (topic) await AsyncStorage.setItem(keyTopic(language), topic);
  else await AsyncStorage.removeItem(keyTopic(language));
}

export async function clearHistory(language: LanguageCode): Promise<void> {
  await AsyncStorage.removeItem(keyHistory(language));
}

/** Режим окончания реплики — общий для всех языков. */
export async function loadTurnMode(): Promise<TurnMode> {
  const raw = await AsyncStorage.getItem(KEY_MODE);
  return raw === 'manual' ? 'manual' : 'auto';
}

export async function saveTurnMode(mode: TurnMode): Promise<void> {
  await AsyncStorage.setItem(KEY_MODE, mode);
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
  await AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
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
  if (homework) await AsyncStorage.setItem(keyHomework(id), JSON.stringify(homework));
  else await AsyncStorage.removeItem(keyHomework(id));
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

export async function deleteArchived(id: string): Promise<ArchivedSession[]> {
  const archive = (await loadArchive()).filter((session) => session.id !== id);
  await AsyncStorage.multiRemove([keyArchived(id), keyHomework(id)]);
  await AsyncStorage.setItem(KEY_ARCHIVE, JSON.stringify(archive));
  return archive;
}
