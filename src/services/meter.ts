import type Anthropic from '@anthropic-ai/sdk';

import {
  CLAUDE_PRICE,
  PRO_MONTHLY_BUDGET_USD,
  RECORDING_BITRATE,
  TTS_PRICE_PER_CHAR,
  UNLIMITED_TALKS,
  WHISPER_PRICE_PER_MINUTE,
} from '../config';
import { t } from '../i18n';
import { addSpend, loadSpend, type Spend } from '../storage';

/**
 * Счётчик расхода. Каждый запрос к API — Claude, Whisper, озвучка — переводится
 * в доллары по ценам из `config.ts` и складывается в месячный итог; перед
 * запросом проверяется, что итог ещё не упёрся в объём тарифа. Решает не он,
 * а прокси (`functions/`): тот ведёт свой счёт по uid и отказывает кодом 402.
 * Этот — для экрана (доля объёма на пейволе) и чтобы не слать запрос, который
 * сервер заведомо отвергнет.
 */

/** Объём, пока подписка не известна: щедрый, чтобы платящий не упёрся на старте. */
let budgetUsd = PRO_MONTHLY_BUDGET_USD;

/** Подписка выяснилась — задать объём её тарифа. */
export function setBudget(usd: number): void {
  budgetUsd = usd;
}

/** Ошибка объёма отдельным классом: экрану нужно отличать её от сетевых. */
export class BudgetError extends Error {
  constructor() {
    super(t.budgetOver);
    this.name = 'BudgetError';
  }
}

export interface Allowance {
  spend: Spend;
  budgetUsd: number;
  /** Доля объёма, уже потраченная, 0…1. */
  share: number;
  exhausted: boolean;
}

export async function allowance(): Promise<Allowance> {
  const spend = await loadSpend();
  const share = budgetUsd > 0 ? Math.min(1, spend.usd / budgetUsd) : 1;
  return { spend, budgetUsd, share, exhausted: spend.usd >= budgetUsd };
}

/** Бросает BudgetError, если месячный объём исчерпан. Звать перед каждым запросом. */
export async function assertBudget(): Promise<void> {
  if (UNLIMITED_TALKS) return;
  if ((await allowance()).exhausted) throw new BudgetError();
}

/**
 * Записывает расход запроса. Сбой записи не должен ронять ответ, который уже
 * пришёл и оплачен, — глотаем.
 */
export async function charge(usd: number): Promise<void> {
  try {
    await addSpend(usd);
  } catch {
    // Счётчик — сторож, а не бухгалтерия: недосчитанный запрос не повод рвать беседу.
  }
}

/** Стоимость ответа Claude по его же отчёту о токенах. */
export function claudeCost(usage: Anthropic.Usage): number {
  return (
    usage.input_tokens * CLAUDE_PRICE.input +
    usage.output_tokens * CLAUDE_PRICE.output +
    (usage.cache_creation_input_tokens ?? 0) * CLAUDE_PRICE.cacheWrite +
    (usage.cache_read_input_tokens ?? 0) * CLAUDE_PRICE.cacheRead
  );
}

/** Стоимость распознавания записи по её размеру в байтах. */
export function whisperCost(bytes: number): number {
  const minutes = (bytes * 8) / RECORDING_BITRATE / 60;
  return minutes * WHISPER_PRICE_PER_MINUTE;
}

/** Стоимость озвучки текста. */
export function ttsCost(text: string): number {
  return text.length * TTS_PRICE_PER_CHAR;
}
