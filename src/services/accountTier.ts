import type { Tier } from '../config';
import { proxy } from './proxy';

/**
 * Тариф аккаунта по мнению сервера: старший из магазинов (RevenueCat) и
 * Lemon Squeezy, где платят в веб-версии. Телефону это нужно, чтобы подписка,
 * купленная на сайте, работала и в приложении; вебу — вместо магазина.
 * portal — страница Lemon для управления, если подписка оттуда.
 */
export async function accountTier(): Promise<{ tier: Tier; portal: string | null }> {
  try {
    const response = await proxy('/tier', { body: '{}', contentType: 'application/json' });
    const { tier, portal } = (await response.json()) as { tier?: Tier; portal?: string | null };
    return { tier: tier === 'pro' || tier === 'max' ? tier : 'free', portal: portal ?? null };
  } catch {
    return { tier: 'free', portal: null };
  }
}

const RANK: Record<Tier, number> = { free: 0, pro: 1, max: 2 };

export function higherTier(a: Tier, b: Tier): Tier {
  return RANK[a] >= RANK[b] ? a : b;
}
