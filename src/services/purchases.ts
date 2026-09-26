import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  MAX_ENTITLEMENT,
  MAX_PRODUCT_MARK,
  PRO_ENTITLEMENT,
  REVENUECAT_ANDROID_KEY,
  REVENUECAT_IOS_KEY,
  type Tier,
} from '../config';

const API_KEY = Platform.select({
  ios: REVENUECAT_IOS_KEY,
  android: REVENUECAT_ANDROID_KEY,
  default: '',
});

/**
 * Без ключа платежей нет вовсе. На вебе и в сборке без ключей приложение должно
 * работать целиком, иначе разработку пришлось бы вести с оглядкой на магазин,
 * поэтому покупка и восстановление в этом случае молча отвечают «подписка
 * есть». А тариф — бесплатный: иначе сборка без ключей не знала бы дневного
 * лимита. Снять лимиты для проверки — `UNLIMITED_TALKS`.
 */
export const PURCHASES_READY = Boolean(API_KEY) && Platform.OS !== 'web';

let started = false;

/** Повторный configure SDK не любит, поэтому заходим сюда только раз. */
export function startPurchases(): void {
  if (!PURCHASES_READY || started) return;
  started = true;

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: API_KEY });
}

function tierOf(info: CustomerInfo): Tier {
  const { active } = info.entitlements;
  if (active[MAX_ENTITLEMENT]) return 'max';
  if (active[PRO_ENTITLEMENT]) return 'pro';
  return 'free';
}

/** Какая подписка. Без ключей — никакой: магазина нет, купить нечего. */
export async function loadTier(): Promise<Tier> {
  if (!PURCHASES_READY) return 'free';

  try {
    return tierOf(await Purchases.getCustomerInfo());
  } catch {
    /**
     * Сеть могла отвалиться, а RevenueCat кэширует последний известный ответ и
     * отдаёт его сам. Если не отдал даже кэш — считаем, что подписки нет: иначе
     * достаточно было бы выключить интернет, чтобы снять лимит.
     */
    return 'free';
  }
}

/** Подписка меняется и вне приложения — продлилась, отменилась, вернули деньги. */
export function watchTier(onChange: (tier: Tier) => void): () => void {
  if (!PURCHASES_READY) return () => {};

  const listener = (info: CustomerInfo) => onChange(tierOf(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

/** Что предложить к покупке. Пусто — предложений нет или они не настроены. */
export async function loadPackages(): Promise<PurchasesPackage[]> {
  if (!PURCHASES_READY) return [];

  const offerings = await Purchases.getOfferings();
  const current = offerings.current?.availablePackages ?? [];

  // Правильно — оба тарифа в текущем наборе. Но если Pro и Max разложены по
  // разным наборам (так однажды и было: текущим стоял набор с одним Max),
  // собираем пакеты из всех наборов, чтобы на экране были оба тарифа.
  const tiers = new Set(current.map(packageTier));
  if (tiers.has('pro') && tiers.has('max')) return current;

  const seen = new Set<string>();
  return [current, ...Object.values(offerings.all).map((offering) => offering.availablePackages)]
    .flat()
    .filter((item) => {
      if (seen.has(item.product.identifier)) return false;
      seen.add(item.product.identifier);
      return true;
    });
}

/** Какой тариф даёт пакет: у Max в идентификаторе продукта есть «max». */
export function packageTier(item: PurchasesPackage): Exclude<Tier, 'free'> {
  return item.product.identifier.toLowerCase().includes(MAX_PRODUCT_MARK) ? 'max' : 'pro';
}

/** Возвращает true, если после покупки подписка активна. */
export async function buy(item: PurchasesPackage): Promise<boolean> {
  if (!PURCHASES_READY) return true;

  const { customerInfo } = await Purchases.purchasePackage(item);
  return tierOf(customerInfo) !== 'free';
}

/** Восстановление покупок — Apple требует эту кнопку на экране подписки. */
export async function restore(): Promise<boolean> {
  if (!PURCHASES_READY) return true;

  return tierOf(await Purchases.restorePurchases()) !== 'free';
}

/**
 * Привязка покупок к аккаунту: подписка должна переезжать вместе с человеком,
 * как и всё остальное. Без входа RevenueCat держит её на анонимном
 * идентификаторе устройства.
 */
export async function linkAccount(userId: string | null): Promise<void> {
  if (!PURCHASES_READY) return;

  try {
    if (userId) await Purchases.logIn(userId);
    // Анонимного выводить некуда: SDK на это пишет ошибку в консоль, а при
    // запуске, пока Firebase ещё не вошёл, сюда приходит именно null.
    else if (!(await Purchases.isAnonymous())) await Purchases.logOut();
  } catch {
    // Связка — удобство, а не условие работы: молча остаёмся как были.
  }
}
