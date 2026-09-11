import { useCallback, useEffect, useState } from 'react';

import { FREE_TALKS_PER_DAY } from '../config';
import { isPro, startPurchases, watchPro } from '../services/purchases';
import { countTalk, loadUsage } from '../storage';

export interface Subscription {
  /** null, пока состояние подписки ещё не известно. */
  pro: boolean | null;
  /** Бесед начато сегодня. */
  talks: number;
  /** Сколько бесплатных бесед осталось на сегодня. */
  left: number;
  /** Можно ли начать ещё одну беседу прямо сейчас. */
  canTalk: boolean;
  /** Отмечает начатую беседу. Вызывать только когда canTalk. */
  useTalk: () => Promise<void>;
  /** Перечитать подписку — после покупки или восстановления. */
  refresh: () => Promise<void>;
}

/**
 * Подписка и дневной лимит бесед. Лимит держится на устройстве: переустановка
 * или перевод часов его обнулят. Честная проверка возможна только на сервере,
 * а его у приложения пока нет — ключи API лежат прямо в сборке. Когда появится
 * прокси-бэкенд, считать беседы нужно будет там же, где тратятся токены.
 */
export function useSubscription(): Subscription {
  const [pro, setPro] = useState<boolean | null>(null);
  const [talks, setTalks] = useState(0);

  useEffect(() => {
    startPurchases();

    let alive = true;
    void isPro().then((value) => alive && setPro(value));
    void loadUsage().then((usage) => alive && setTalks(usage.talks));

    // Подписка меняется и вне приложения: продлилась, отменилась, вернули деньги.
    const stop = watchPro(setPro);
    return () => {
      alive = false;
      stop();
    };
  }, []);

  const useTalk = useCallback(async () => {
    const usage = await countTalk();
    setTalks(usage.talks);
  }, []);

  const refresh = useCallback(async () => {
    setPro(await isPro());
    setTalks((await loadUsage()).talks);
  }, []);

  const left = Math.max(0, FREE_TALKS_PER_DAY - talks);

  return {
    pro,
    talks,
    left,
    // Пока подписка не известна, беседу не запрещаем: проверка занимает
    // мгновение, а платящий человек не должен упереться в стену на запуске.
    canTalk: pro !== false || left > 0,
    useTalk,
    refresh,
  };
}
