import { useCallback, useEffect, useState } from 'react';

import {
  FREE_MONTHLY_BUDGET_USD,
  FREE_TALKS_PER_DAY,
  UNLIMITED_TALKS,
  PRO_MONTHLY_BUDGET_USD,
} from '../config';
import { allowance, setBudget } from '../services/meter';
import { isPro, startPurchases, watchPro } from '../services/purchases';
import { countTalk, loadUsage } from '../storage';

/** Что именно не даёт начать беседу. */
export type Block = 'talks' | 'budget' | null;

export interface Subscription {
  /** null, пока состояние подписки ещё не известно. */
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
  const [pro, setPro] = useState<boolean | null>(null);
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
    void isPro().then((value) => alive && setPro(value));
    void loadUsage().then((usage) => alive && setTalks(usage.talks));

    // Подписка меняется и вне приложения: продлилась, отменилась, вернули деньги.
    const stop = watchPro(setPro);
    return () => {
      alive = false;
      stop();
    };
  }, []);

  // Объём тарифа задаётся счётчику, как только подписка известна, и
  // перечитывается: доля от нового объёма другая.
  useEffect(() => {
    if (pro === null) return;
    setBudget(pro ? PRO_MONTHLY_BUDGET_USD : FREE_MONTHLY_BUDGET_USD);
    void readSpend();
  }, [pro, readSpend]);

  const useTalk = useCallback(async () => {
    const usage = await countTalk();
    setTalks(usage.talks);
  }, []);

  const refresh = useCallback(async () => {
    setPro(await isPro());
    setTalks((await loadUsage()).talks);
    await readSpend();
  }, [readSpend]);

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
