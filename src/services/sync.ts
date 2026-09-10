import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { currentUser, database } from './firebase';

/**
 * Синхронизация устроена как зеркало ключей хранилища: каждый ключ
 * `polyglotta:*` — отдельный документ в Firestore со значением и временем
 * записи. Так синхронизируется всё сразу, а новые данные подхватываются без
 * правок здесь: приложение по-прежнему пишет в AsyncStorage.
 *
 * Спор решается временем последней записи: у кого свежее, тот и прав. Для
 * личного приложения на своих устройствах этого достаточно — одновременная
 * правка одного и того же с двух телефонов практически невозможна.
 */
const PREFIX = 'polyglotta:';
/** Времена локальных записей — по ним понимаем, что уехало вперёд. */
const KEY_STAMPS = 'sync:stamps';

type Stamps = Record<string, number>;

async function loadStamps(): Promise<Stamps> {
  const raw = await AsyncStorage.getItem(KEY_STAMPS);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Stamps;
  } catch {
    return {};
  }
}

async function saveStamps(stamps: Stamps): Promise<void> {
  await AsyncStorage.setItem(KEY_STAMPS, JSON.stringify(stamps));
}

/** Отмечаем, что ключ изменён локально. Вызывается из storage при каждой записи. */
export async function touch(key: string): Promise<void> {
  const stamps = await loadStamps();
  stamps[key] = Date.now();
  await saveStamps(stamps);
}

/** Точка в Firestore: ключ содержит двоеточия, а они в путях запрещены. */
function docId(key: string): string {
  return key.slice(PREFIX.length).replace(/:/g, '__');
}

function keyFromDoc(id: string): string {
  return PREFIX + id.replace(/__/g, ':');
}

function userRoot(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'state');
}

interface Remote {
  value: string | null;
  updatedAt: number;
}

/**
 * Сводит устройство с облаком: забирает всё, что там свежее, и отдаёт всё, что
 * свежее здесь. Возвращает, изменились ли локальные данные, — экрану нужно
 * перечитать состояние.
 */
export async function synchronise(): Promise<boolean> {
  const db = database();
  const user = currentUser();
  if (!db || !user) return false;

  const stamps = await loadStamps();
  const snapshot = await getDocs(userRoot(db, user.uid));

  const remote = new Map<string, Remote>();
  snapshot.forEach((item) => {
    const data = item.data() as Remote;
    remote.set(keyFromDoc(item.id), {
      value: data.value ?? null,
      updatedAt: data.updatedAt ?? 0,
    });
  });

  let changed = false;
  const pulled: Stamps = { ...stamps };

  for (const [key, entry] of remote) {
    if ((stamps[key] ?? 0) >= entry.updatedAt) continue;
    if (entry.value === null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, entry.value);
    pulled[key] = entry.updatedAt;
    changed = true;
  }

  // Наверх отдаём то, что здесь новее: и изменённое, и то, чего там нет вовсе.
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
  const batch = writeBatch(db);
  let pending = 0;

  for (const key of keys) {
    const mine = pulled[key] ?? 0;
    const theirs = remote.get(key)?.updatedAt ?? 0;
    if (mine <= theirs) continue;

    const value = await AsyncStorage.getItem(key);
    batch.set(doc(userRoot(db, user.uid), docId(key)), { value, updatedAt: mine });
    pending += 1;
  }

  if (pending > 0) await batch.commit();
  await saveStamps(pulled);
  return changed;
}
