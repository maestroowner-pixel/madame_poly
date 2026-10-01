import type { PurchasesPackage } from 'react-native-purchases';

import { MAX_PRODUCT_MARK, type Tier } from '../config';
import { locale, t } from '../i18n';
import { accountTier } from './accountTier';
import { currentUser, watchUser } from './firebase';
import { proxy } from './proxy';

/**
 * В браузере платят картой через Lemon Squeezy. Страницу оплаты создаёт
 * сервер и вкладывает в неё uid, вебхук Lemon ложится на тот же аккаунт —
 * поэтому подписка с сайта действует и в приложениях, а купленная в магазине
 * действует здесь: тариф аккаунта всегда считает сервер (`/tier`).
 */
export const PURCHASES_READY = true;

export function startPurchases(): void {}

/** Lemon возвращает сюда с этой меткой — вебхук может прийти на пару секунд позже. */
const RETURN_MARK = 'lemon=success';

export async function loadTier(): Promise<Tier> {
  const returned = typeof location !== 'undefined' && location.search.includes(RETURN_MARK);
  let { tier } = await accountTier();
  for (let attempt = 0; returned && tier === 'free' && attempt < 10; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    tier = (await accountTier()).tier;
  }
  if (returned) history.replaceState(null, '', location.pathname);
  return tier;
}

/** Тариф меняется вместе с аккаунтом: вошли — у uid может быть подписка. */
export function watchTier(onChange: (tier: Tier) => void): () => void {
  let alive = true;
  const stop = watchUser(() => {
    void loadTier().then((tier) => alive && onChange(tier));
  });
  return () => {
    alive = false;
    stop();
  };
}

interface Plan {
  tier: Exclude<Tier, 'free'>;
  amount: number;
  currency: string;
  interval: string | null;
}

/** Пейвол написан под пакеты react-native-purchases — план Lemon переодеваем в их форму. */
function dress(plan: Plan): PurchasesPackage {
  const identifier = `poly_${plan.tier}`;
  let priceString: string;
  try {
    priceString = new Intl.NumberFormat(locale, { style: 'currency', currency: plan.currency }).format(plan.amount / 100);
  } catch {
    priceString = `${(plan.amount / 100).toFixed(2)} ${plan.currency}`;
  }
  return {
    identifier,
    product: {
      identifier,
      priceString,
      subscriptionPeriod: plan.interval === 'month' ? 'P1M' : plan.interval === 'year' ? 'P1Y' : null,
    },
  } as unknown as PurchasesPackage;
}

export async function loadPackages(): Promise<PurchasesPackage[]> {
  const response = await proxy('/plans', { body: '{}', contentType: 'application/json' });
  const { plans } = (await response.json()) as { plans: Plan[] };
  return plans.map(dress);
}

/** Сменить карту, тариф, отменить — портал Lemon. Подписка из магазина управляется в магазине. */
export async function manageSubscription(): Promise<void> {
  const { portal } = await accountTier();
  if (portal) window.open(portal, '_blank', 'noopener');
}

export function packageTier(item: PurchasesPackage): Exclude<Tier, 'free'> {
  return item.product.identifier.toLowerCase().includes(MAX_PRODUCT_MARK) ? 'max' : 'pro';
}

/**
 * Покупка только с аккаунтом: подписка на анонимном uid пропала бы вместе с
 * данными браузера. Дальше — страница оплаты Lemon; обратно Lemon вернёт с
 * меткой, и loadTier дождётся вебхука. Обещание не разрешается: страница уходит.
 */
export async function buy(item: PurchasesPackage): Promise<boolean> {
  const user = currentUser();
  if (!user || user.isAnonymous) throw new Error(t.paywallSignIn);

  const response = await proxy('/checkout', {
    body: JSON.stringify({ tier: packageTier(item) }),
    contentType: 'application/json',
  });
  const { url } = (await response.json()) as { url: string };
  location.assign(url);
  return new Promise<boolean>(() => {});
}

/** «Восстановить» на вебе — перечитать тариф аккаунта. */
export async function restore(): Promise<boolean> {
  return (await loadTier()) !== 'free';
}

export async function linkAccount(): Promise<void> {}
