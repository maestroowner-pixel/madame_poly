import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { FIREBASE_CONFIG, FIREBASE_READY } from '../config';

/**
 * Firebase поднимаем лениво и только если ключи заданы: без них приложение
 * должно работать по-прежнему, просто без синхронизации. Инициализировать
 * пустым конфигом нельзя — SDK бросает на первом же обращении.
 */
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function ensure(): { auth: Auth; db: Firestore } | null {
  if (!FIREBASE_READY) return null;
  if (!app) {
    app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
    // Вход должен переживать перезапуск — иначе аккаунт спрашивают каждый раз.
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    db = getFirestore(app);
  }
  return auth && db ? { auth, db } : null;
}

/** Готова ли синхронизация вообще: ключи есть и SDK поднялся. */
export function syncAvailable(): boolean {
  return ensure() !== null;
}

export function currentUser(): User | null {
  return ensure()?.auth.currentUser ?? null;
}

/** Подписка на вход и выход. Возвращает отписку. */
export function watchUser(listener: (user: User | null) => void): () => void {
  const ready = ensure();
  if (!ready) {
    listener(null);
    return () => {};
  }
  return onAuthStateChanged(ready.auth, listener);
}

export async function register(email: string, password: string): Promise<void> {
  const ready = ensure();
  if (!ready) throw new Error('sync-off');
  await createUserWithEmailAndPassword(ready.auth, email.trim(), password);
}

export async function login(email: string, password: string): Promise<void> {
  const ready = ensure();
  if (!ready) throw new Error('sync-off');
  await signInWithEmailAndPassword(ready.auth, email.trim(), password);
}

export async function resetPassword(email: string): Promise<void> {
  const ready = ensure();
  if (!ready) throw new Error('sync-off');
  await sendPasswordResetEmail(ready.auth, email.trim());
}

export async function logout(): Promise<void> {
  const ready = ensure();
  if (!ready) return;
  await signOut(ready.auth);
}

/** Firestore нужен модулю синхронизации; наружу отдаём только вместе с входом. */
export function database(): Firestore | null {
  return ensure()?.db ?? null;
}
