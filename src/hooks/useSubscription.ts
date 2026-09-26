import { useCallback, useEffect, useState } from 'react';

import { FREE_TALKS_PER_DAY, UNLIMITED_TALKS, type Tier } from '../config';
import { allowance, setTier as setMeterTier } from '../services/meter';
import { loadTier, startPurchases, watchTier } from '../services/purchases';
import { countTalk, loadUsage } from '../storage';

/** Что именно не даёт начать беседу. */
export type Block = 'talks' | 'budget' | null;

export interface Subscription {
  /** Тариф; null, пока состояние подписки ещё не известно. */
  tier: Tier | null;
  /** Есть ли подписка, любая — Pro или Max; null, пока не известно. */
  pro: boolean | null;
  /** Бесед начато сегодня. */
  talks: number;
  /** Сколько бесплатных бесед осталось на сегодня. */
  left: number;
  /** Доля месячного объёма API, уже потраченная, 0…1. */
  used: number;
  /** Почему нельзя начать беседу прямо сейчас; null — можно. */
  block: Block;
  /** Можно ли начать ещё одну беседу прямо сейчас. */
  canTalk: boolean;
  /** Отмечает начатую беседу. Вызывать только когда canTalk. */
  useTalk: () => Promise<void>;
  /** Перечитать подписку и счётчики — после покупки, восстановления, беседы. */
  refresh: () => Promise<void>;
}

/**
 * Подписка, дневной лимит бесед и месячный объём API. Дневной лимит держится
 * на устройстве: переустановка или перевод часов его обнулят. Месячный объём
 * здесь — копия для экрана; настоящий считает прокси по uid и сам отказывает,
 * когда он исчерпан.
 */
export function useSubscription(): Subscription {
  const [tier, setTier] = useState<Tier | null>(null);
  const [talks, setTalks] = useState(0);
  const [used, setUsed] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const readSpend = useCallback(async () => {
    const state = await allowance();
    setUsed(state.share);
    setExhausted(state.exhausted);
  }, []);

  useEffect(() => {
    startPurchases();

    let alive = true;
    void loadTier().then((value) => alive && setTier(value));
    void loadUsage().then((usage) => alive && setTalks(usage.talks));

    // Подписка меняется и вне приложения: продлилась, отменилась, вернули деньги.
    const stop = watchTier(setTier);
    return () => {
      alive = false;
      stop();
    };
  }, []);

  // Объём тарифа задаётся счётчику, как только подписка известна, и
  // перечитывается: доля от нового объёма другая.
  useEffect(() => {
    if (tier === null) return;
    setMeterTier(tier);
    void readSpend();
  }, [tier, readSpend]);

  const useTalk = useCallback(async () => {
    const usage = await countTalk();
    setTalks(usage.talks);
  }, []);

  const refresh = useCallback(async () => {
    setTier(await loadTier());
    setTalks((await loadUsage()).talks);
    await readSpend();
  }, [readSpend]);

  const pro = tier === null ? null : tier !== 'free';
  const left = Math.max(0, FREE_TALKS_PER_DAY - talks);

  // Пока подписка не известна, беседу не запрещаем: проверка занимает
  // мгновение, а платящий человек не должен упереться в стену на запуске.
  const block: Block = UNLIMITED_TALKS
    ? null
    : exhausted
      ? 'budget'
      : pro === false && left === 0
        ? 'talks'
        : null;

  return {
    tier,
    pro,
    talks,
    left,
    used,
    block,
    canTalk: block === null,
    useTalk,
    refresh,
  };
}
