import { Linking, Platform } from 'react-native';
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
import { accountTier, higherTier } from './accountTier';

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

/**
 * Какая подписка: из магазина или с сайта (Lemon Squeezy) — старшая из двух.
 * Подписку с сайта знает только сервер, поэтому спрашиваем и его.
 */
export async function loadTier(): Promise<Tier> {
  const [store, account] = await Promise.all([storeTier(), accountTier()]);
  return higherTier(store, account.tier);
}

async function storeTier(): Promise<Tier> {
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

  // Магазин сообщает только своё — подписку с сайта досчитываем по серверу.
  const listener = (info: CustomerInfo) => {
    void accountTier().then((account) => onChange(higherTier(tierOf(info), account.tier)));
  };
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

/**
 * Управление подпиской — в магазине, не у нас: сменить тариф, отменить,
 * посмотреть дату продления. На iPhone RevenueCat открывает системный лист
 * подписок Apple, на Android — страницу подписок Google Play. Если SDK не смог,
 * открываем ту же страницу ссылкой.
 */
export async function manageSubscription(): Promise<void> {
  try {
    if (PURCHASES_READY) {
      await Purchases.showManageSubscriptions();
      return;
    }
  } catch {
    // ниже — ссылка
  }
  const url =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions?package=com.kukalab.polyglotta';
  await Linking.openURL(url).catch(() => {});
}

/** Какой тариф даёт пакет: у Max в идентификаторе продукта есть «max». */
export function packageTier(item: PurchasesPackage): Exclude<Tier, 'free'> {
  return item.product.identifier.toLowerCase().includes(MAX_PRODUCT_MARK) ? 'max' : 'pro';
}

/** Возвращает true, если после покупки подписка активна. */
export async function buy(item: PurchasesPackage): Promise<boolean> {
  if (!PURCHASES_READY) return true;

  try {
    const { customerInfo } = await Purchases.purchasePackage(item);
    if (tierOf(customerInfo) !== 'free') return true;
  } catch (e: unknown) {
    // «Уже куплено»: магазин помнит подписку, а RevenueCat — ещё нет (покупка
    // прошла, но ответ не дошёл, или была на другом идентификаторе). Это не
    // ошибка — сводим покупки с магазином ниже. Остальное — наверх.
    if (!alreadyPurchased(e)) throw e;
  }
  return (await settledTier()) !== 'free';
}

function alreadyPurchased(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    String(e.code) === Purchases.PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR
  );
}

/**
 * Тариф после покупки, когда первый ответ его не показал. Песочница Apple
 * подтверждает покупку с задержкой, поэтому спрашиваем магазин ещё пару раз:
 * сводим покупки (sync) и перечитываем без кэша.
 */
async function settledTier(): Promise<Tier> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { customerInfo } = await Purchases.syncPurchasesForResult();
      if (tierOf(customerInfo) !== 'free') return tierOf(customerInfo);
      await Purchases.invalidateCustomerInfoCache();
      const fresh = tierOf(await Purchases.getCustomerInfo());
      if (fresh !== 'free') return fresh;
    } catch {
      // сеть или магазин — пробуем ещё
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return 'free';
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
  // Firebase отдаёт сохранённого пользователя сразу при запуске — бывает,
  // раньше, чем подписка успела запустить SDK. Без configure logIn падает, а
  // ошибка здесь молчит: покупка оставалась на анонимном $RCAnonymousID, и
  // сервер, который ищет подписку по uid, её не видел.
  startPurchases();

  try {
    if (userId) await Purchases.logIn(userId);
    // Анонимного выводить некуда: SDK на это пишет ошибку в консоль, а при
    // запуске, пока Firebase ещё не вошёл, сюда приходит именно null.
    else if (!(await Purchases.isAnonymous())) await Purchases.logOut();
  } catch {
    // Связка — удобство, а не условие работы: молча остаёмся как были.
  }
}
