import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  EmailAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  linkWithCredential,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
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
    // В браузерной сборке Firebase AsyncStorage-хранилища нет, там своё.
    auth = initializeAuth(app, {
      persistence:
        Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage),
    });
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
  const anonymous = ready.auth.currentUser;
  // Анонимный вход превращаем в аккаунт, а не заводим новый: uid остаётся тем
  // же, а с ним — подписка в RevenueCat и месячный расход на сервере.
  if (anonymous?.isAnonymous) {
    await linkWithCredential(anonymous, EmailAuthProvider.credential(email.trim(), password));
    return;
  }
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

/**
 * Токен для прокси. Кто не заводил аккаунт, входит анонимно — незаметно для
 * себя: серверу нужно знать, чей это расход и чья подписка. getIdToken сам
 * обновляет токен, когда тот истекает (живёт час).
 */
let anonymous: Promise<User> | null = null;

export async function idToken(): Promise<string> {
  const ready = ensure();
  if (!ready) throw new Error('firebase-off');
  await ready.auth.authStateReady();
  let user = ready.auth.currentUser;
  if (!user) {
    // Запросы уходят пачкой — входим один раз на всех, а не по разу на каждый.
    anonymous ??= signInAnonymously(ready.auth)
      .then((credential) => credential.user)
      .finally(() => {
        anonymous = null;
      });
    user = await anonymous;
  }
  return user.getIdToken();
}

/** Firestore нужен модулю синхронизации; наружу отдаём только вместе с входом. */
export function database(): Firestore | null {
  return ensure()?.db ?? null;
}
