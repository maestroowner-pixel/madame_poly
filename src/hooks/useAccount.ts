import { useCallback, useEffect, useRef, useState } from 'react';

import { watchUser } from '../services/firebase';
import { synchronise } from '../services/sync';

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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    return watchUser((user) => {
      setEmail(user?.email ?? null);
      // Вход — первый повод свести данные: на этом устройстве их может не быть.
      if (user) void run();
      else setSyncedAt(null);
    });
  }, [run]);

  return { email, busy, syncedAt, error, sync: () => void run() };
}
