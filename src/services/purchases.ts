import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import {
  PRO_ENTITLEMENT,
  REVENUECAT_ANDROID_KEY,
  REVENUECAT_IOS_KEY,
} from '../config';

const API_KEY = Platform.select({
  ios: REVENUECAT_IOS_KEY,
  android: REVENUECAT_ANDROID_KEY,
  default: '',
});

/**
 * Без ключа платежей нет вовсе. На вебе и в сборке без ключей приложение должно
 * работать целиком, иначе разработку пришлось бы вести с оглядкой на магазин,
 * поэтому все функции ниже в этом случае молча отвечают «подписка есть».
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

function active(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT] !== undefined;
}

/**
 * Есть ли подписка. Без ключей — да: иначе при разработке беседа упиралась бы в
 * лимит на второй попытке.
 */
export async function isPro(): Promise<boolean> {
  if (!PURCHASES_READY) return true;

  try {
    return active(await Purchases.getCustomerInfo());
  } catch {
    /**
     * Сеть могла отвалиться, а RevenueCat кэширует последний известный ответ и
     * отдаёт его сам. Если не отдал даже кэш — считаем, что подписки нет: иначе
     * достаточно было бы выключить интернет, чтобы снять лимит.
     */
    return false;
  }
}

/** Подписка меняется и вне приложения — продлилась, отменилась, вернули деньги. */
export function watchPro(onChange: (pro: boolean) => void): () => void {
  if (!PURCHASES_READY) return () => {};

  const listener = (info: CustomerInfo) => onChange(active(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

/** Что предложить к покупке. Пусто — предложений нет или они не настроены. */
export async function loadPackages(): Promise<PurchasesPackage[]> {
  if (!PURCHASES_READY) return [];

  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
}

/** Возвращает true, если после покупки подписка активна. */
export async function buy(item: PurchasesPackage): Promise<boolean> {
  if (!PURCHASES_READY) return true;

  const { customerInfo } = await Purchases.purchasePackage(item);
  return active(customerInfo);
}

/** Восстановление покупок — Apple требует эту кнопку на экране подписки. */
export async function restore(): Promise<boolean> {
  if (!PURCHASES_READY) return true;

  return active(await Purchases.restorePurchases());
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
    else await Purchases.logOut();
  } catch {
    // Связка — удобство, а не условие работы: молча остаёмся как были.
  }
}
