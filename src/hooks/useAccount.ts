import { useCallback, useEffect, useRef, useState } from 'react';

import { watchUser } from '../services/firebase';
import { linkAccount } from '../services/purchases';
import { synchronise } from '../services/sync';
import { errorText } from '../errors';

interface Account {
  /** Почта вошедшего; null — вход не выполнен. */
  email: string | null;
  busy: boolean;
  syncedAt: number | null;
  error: string | null;
  /** Свести с облаком вручную. */
  sync: () => void;
}

/**
 * Аккаунт и синхронизация. Сводим с облаком при входе и по требованию; после
 * успешной сводки зовём `onPulled`, чтобы экран перечитал состояние — беседа
 * могла прийти с другого устройства.
 */
export function useAccount(onPulled: () => Promise<void>): Account {
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pulledRef = useRef(onPulled);
  pulledRef.current = onPulled;
  const busyRef = useRef(false);

  const run = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const changed = await synchronise();
      if (changed) await pulledRef.current();
      setSyncedAt(Date.now());
    } catch (e: unknown) {
      setError(errorText(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    return watchUser((user) => {
      // Анонимный вход — служебный, для прокси: для человека это «без аккаунта».
      const account = user && !user.isAnonymous ? user : null;
      setEmail(account?.email ?? null);
      // Подписка ходит за человеком, как и всё остальное: куплена на телефоне —
      // действует и на планшете. RevenueCat знает человека по тому же uid, что
      // и сервер, — анонимному тоже: по нему прокси проверяет подписку.
      void linkAccount(user?.uid ?? null);
      // Вход — первый повод свести данные: на этом устройстве их может не быть.
      if (account) void run();
      else setSyncedAt(null);
    });
  }, [run]);

  return { email, busy, syncedAt, error, sync: () => void run() };
}
