import { initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onRequest, type Request } from 'firebase-functions/https';
import { logger } from 'firebase-functions';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { defineSecret, defineString } from 'firebase-functions/params';
import type { Response } from 'express';

/**
 * Прокси между приложением и Anthropic/OpenAI. Ключи живут только здесь, в
 * Secret Manager, — в сборке их нет. Каждый запрос несёт Firebase ID-токен
 * (анонимный вход, если человек без аккаунта), по нему ведётся месячный
 * расход и проверяется подписка. Счётчик на телефоне остаётся для экрана,
 * но решает сервер: переустановка или перевод часов его не обнулят.
 */

initializeApp();

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
/** Секретный ключ RevenueCat (v1). «none» — магазины ещё не настроены. */
const REVENUECAT_SECRET_KEY = defineSecret('REVENUECAT_SECRET_KEY');
/**
 * Lemon Squeezy — оплата картой в веб-версии. Ключ API создаёт страницу оплаты
 * и читает цены, секрет подписи проверяет вебхуки. Два варианта (Pro, Max) —
 * в `functions/.env`; магазин сервер узнаёт у Lemon по варианту.
 */
const LEMON_API_KEY = defineSecret('LEMON_API_KEY');
const LEMON_SIGNING_SECRET = defineSecret('LEMON_SIGNING_SECRET');
const LEMON_PRO_VARIANT = defineString('LEMON_PRO_VARIANT', { default: '' });
const LEMON_MAX_VARIANT = defineString('LEMON_MAX_VARIANT', { default: '' });
/** Куда Lemon возвращает после оплаты; метка в адресе — подождать вебхук. */
const WEB_APP_URL = 'https://app.madamepoly.kuka-lab.com';

/** Что разрешено просить. Прокси не должен стать бесплатным входом в любые модели. */
const CLAUDE_MODEL = 'claude-sonnet-5';
/**
 * Потолок ответа — самый большой, что просит приложение: лист слов (16384).
 * Урок грамматики и лист идут с рассуждением и длинным JSON; 4096 хватало
 * только реплике беседы. Перерасход держит месячный объём, а не этот предел.
 */
const CLAUDE_MAX_TOKENS = 16384;
/**
 * Голос собеседницы без подписки и на Pro — nova на tts-1, один на все четыре
 * языка. Другие голоса tts-1 пробовали — звучат хуже.
 */
const TTS_VOICE = 'nova';
/**
 * Max — gpt-4o-mini-tts с голосом на выбор; список тот же, что `MAX_VOICES`
 * приложения (shimmer на испанском звучит по-мужски — его нет). Прочие
 * значения не пускаем, берём первый.
 */
const MAX_TTS_MODEL = 'gpt-4o-mini-tts';
const MAX_VOICES = ['nova', 'coral', 'sage', 'marin'];
/** С этой подачей делались пробы, которые понравились. */
const MAX_TTS_INSTRUCTIONS =
  'You are Poly, a warm, friendly language tutor chatting with a learner. Speak naturally and clearly, at a relaxed conversational pace, with a smile in your voice.';
const TTS_MAX_CHARS = 4096;
/** Предел Whisper — 25 МБ на файл. */
const AUDIO_MAX_BYTES = 25 * 1024 * 1024;

/** Цены — те же, что в `src/config.ts`; меняются вместе. */
const CLAUDE_PRICE = { input: 2 / 1e6, output: 10 / 1e6, cacheWrite: 2.5 / 1e6, cacheRead: 0.2 / 1e6 };
const WHISPER_PRICE_PER_MINUTE = 0.006;
const TTS_PRICE_PER_CHAR = 15 / 1e6;
/**
 * gpt-4o-mini-tts: $12 за миллион токенов звука, ~22.7 токена на секунду
 * (замерено) — около $0.017 за минуту. Длительность — из размера mp3: он
 * отдаётся с постоянным битрейтом 128 кбит/с.
 */
const MAX_TTS_PRICE_PER_SECOND = 22.7 * (12 / 1e6);
const MAX_TTS_MP3_BITRATE = 128_000;

type Tier = 'free' | 'pro' | 'max';
/** Объёмы — те же, что в `src/config.ts`. */
const MONTHLY_BUDGET_USD: Record<Tier, number> = { free: 1.5, pro: 3, max: 5 };
const PRO_ENTITLEMENT = 'madame_poly_pro';
const MAX_ENTITLEMENT = 'madame_poly_max';

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly type: string,
    message: string,
  ) {
    super(message);
  }
}

/** Ошибку отдаём в форме Anthropic API: так её понимает и SDK, и наши fetch. */
function sendError(res: Response, error: HttpError): void {
  res.status(error.status).json({ type: 'error', error: { type: error.type, message: error.message } });
}

async function verifyToken(req: Request): Promise<DecodedIdToken> {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'authentication_error', 'Missing token');
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    throw new HttpError(401, 'authentication_error', 'Invalid token');
  }
}

// --- Подписка ---

/** Ответ RevenueCat кэшируем на пять минут: он нужен на каждом ходе беседы. */
const tierCache = new Map<string, { tier: Tier; until: number }>();

/** Подписка из App Store и Google Play — через RevenueCat. */
async function storeTierOf(uid: string): Promise<Tier> {
  const key = REVENUECAT_SECRET_KEY.value().trim();
  // Магазины не настроены — в приложении тогда тоже старшая подписка.
  if (!key || key === 'none') return 'max';

  const cached = tierCache.get(uid);
  if (cached && cached.until > Date.now()) return cached.tier;

  let tier: Tier = 'free';
  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (response.ok) {
      const body = (await response.json()) as {
        subscriber?: { entitlements?: Record<string, { expires_date: string | null }> };
      };
      const entitlements = body.subscriber?.entitlements ?? {};
      const live = (name: string) => {
        const entitlement = entitlements[name];
        return entitlement !== undefined && (entitlement.expires_date === null || Date.parse(entitlement.expires_date) > Date.now());
      };
      tier = live(MAX_ENTITLEMENT) ? 'max' : live(PRO_ENTITLEMENT) ? 'pro' : 'free';
    } else {
      logger.warn('RevenueCat', response.status);
    }
  } catch (e) {
    // RevenueCat недоступен — не рвём беседу платящему, но и не кэшируем ответ.
    logger.warn('RevenueCat unreachable', e);
    return cached?.tier ?? 'free';
  }
  tierCache.set(uid, { tier, until: Date.now() + 5 * 60_000 });
  return tier;
}

const RANK: Record<Tier, number> = { free: 0, pro: 1, max: 2 };

/**
 * Тариф в подарок — Firestore `comp/{uid}` с полем tier: свои аккаунты,
 * тестировщики. По uid, а не по почте: почту приложение не подтверждает, и
 * подарок по адресу забрал бы тот, кто первым на него зарегистрируется.
 */
async function compOf(uid: string): Promise<Tier> {
  try {
    const tier = (await getFirestore().collection('comp').doc(uid).get()).data()?.tier;
    return tier === 'max' || tier === 'pro' ? tier : 'free';
  } catch (e) {
    logger.warn('comp read failed', e);
    return 'free';
  }
}

/** Тариф аккаунта — старший из магазинов, Lemon Squeezy и подарка: подписка одна на все устройства. */
async function tierOf(uid: string): Promise<Tier> {
  const [store, lemon, comp] = await Promise.all([storeTierOf(uid), lemonOf(uid), compOf(uid)]);
  return [store, lemon.tier, comp].reduce((best, tier) => (RANK[tier] > RANK[best] ? tier : best), 'free' as Tier);
}

// --- Lemon Squeezy ---

/**
 * Подписка Lemon лежит в Firestore `lemon/{uid}`: её пишет вебхук, читает
 * tierOf. В RevenueCat Lemon не умеет, поэтому учёт здесь свой.
 */
interface LemonRecord {
  subscriptionId: string;
  variantId: string;
  status: string;
  /** Конец оплаченного периода у отменённой подписки, мс; null — продлевается. */
  endsAt: number | null;
  /** Страница Lemon, где меняют карту, тариф и отменяют. */
  portal: string | null;
  updatedAt: number;
}

const lemonDoc = (uid: string) => getFirestore().collection('lemon').doc(uid);

/**
 * cancelled у Lemon — «больше не продлевать», но оплаченный период ещё идёт;
 * past_due — платёж не прошёл и Lemon пробует снова, доступ не отнимаем.
 */
function lemonTier(record: LemonRecord | undefined): Tier {
  if (!record) return 'free';
  const live =
    ['active', 'on_trial', 'past_due'].includes(record.status) ||
    (record.status === 'cancelled' && record.endsAt !== null && record.endsAt > Date.now());
  if (!live) return 'free';
  if (record.variantId === LEMON_MAX_VARIANT.value()) return 'max';
  if (record.variantId === LEMON_PRO_VARIANT.value()) return 'pro';
  return 'free';
}

async function lemonOf(uid: string): Promise<{ tier: Tier; portal: string | null }> {
  try {
    const record = (await lemonDoc(uid).get()).data() as LemonRecord | undefined;
    const tier = lemonTier(record);
    return { tier, portal: tier === 'free' ? null : (record?.portal ?? null) };
  } catch (e) {
    logger.warn('lemon read failed', e);
    return { tier: 'free', portal: null };
  }
}

async function lemonApi(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`https://api.lemonsqueezy.com/v1${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${LEMON_API_KEY.value()}`,
    },
  });
  if (!response.ok) {
    logger.error('Lemon', path, response.status, await response.text());
    throw new HttpError(502, 'api_error', `Lemon ${response.status}`);
  }
  return response.json();
}

const lemonReady = () => Boolean(LEMON_PRO_VARIANT.value() && LEMON_MAX_VARIANT.value());

/** Номер магазина — у продукта варианта; не меняется, спрашиваем один раз. */
let storeId: string | null = null;

async function lemonStore(): Promise<string> {
  if (!storeId) {
    const { data } = (await lemonApi(`/variants/${LEMON_PRO_VARIANT.value()}/product`)) as {
      data: { attributes: { store_id: number } };
    };
    storeId = String(data.attributes.store_id);
  }
  return storeId;
}

interface Plan {
  tier: Exclude<Tier, 'free'>;
  /** Цена в центах и валюта магазина — строку соберёт приложение под язык человека. */
  amount: number;
  currency: string;
  interval: string | null;
}

/** Цены меняются редко — держим час, чтобы пейвол не ждал Lemon каждый раз. */
let plansCache: { plans: Plan[]; until: number } | null = null;

async function plans(res: Response): Promise<void> {
  if (!lemonReady()) {
    res.json({ plans: [] });
    return;
  }
  if (!plansCache || plansCache.until < Date.now()) {
    const store = (await lemonApi(`/stores/${await lemonStore()}`)) as {
      data: { attributes: { currency: string } };
    };
    const variant = async (id: string, tier: Plan['tier']): Promise<Plan> => {
      const { data } = (await lemonApi(`/variants/${id}`)) as {
        data: { attributes: { price: number; interval: string | null } };
      };
      return { tier, amount: data.attributes.price, currency: store.data.attributes.currency, interval: data.attributes.interval };
    };
    plansCache = {
      plans: await Promise.all([variant(LEMON_PRO_VARIANT.value(), 'pro'), variant(LEMON_MAX_VARIANT.value(), 'max')]),
      until: Date.now() + 60 * 60_000,
    };
  }
  res.json({ plans: plansCache.plans });
}

/**
 * Страница оплаты — только для аккаунта с почтой: подписка на анонимном uid
 * пропала бы вместе с данными браузера. uid едет в custom_data и вернётся
 * в каждом вебхуке — по нему подписка и ложится на аккаунт.
 */
async function checkout(req: Request, res: Response, token: DecodedIdToken): Promise<void> {
  if (!lemonReady()) throw new HttpError(503, 'api_error', 'Web payments are not configured');
  if (token.firebase.sign_in_provider === 'anonymous' || !token.email) {
    throw new HttpError(403, 'permission_error', 'Sign in to subscribe');
  }
  const { tier } = (req.body ?? {}) as { tier?: unknown };
  const variant = tier === 'max' ? LEMON_MAX_VARIANT.value() : tier === 'pro' ? LEMON_PRO_VARIANT.value() : '';
  if (!variant) throw new HttpError(400, 'invalid_request_error', 'Bad tier');

  const created = (await lemonApi('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: { email: token.email, custom: { uid: token.uid } },
          product_options: { redirect_url: `${WEB_APP_URL}/?lemon=success` },
        },
        relationships: {
          store: { data: { type: 'stores', id: await lemonStore() } },
          variant: { data: { type: 'variants', id: variant } },
        },
      },
    }),
  })) as { data: { attributes: { url: string } } };
  res.json({ url: created.data.attributes.url });
}

/**
 * Вебхук Lemon: подписка создана, продлена, сменила тариф, отменена, истекла.
 * Подлинность — по HMAC тела секретом подписи. Отвечаем 200 и на события,
 * которые не разбираем, иначе Lemon будет повторять их.
 */
async function lemonWebhook(req: Request, res: Response): Promise<void> {
  const signature = Buffer.from(req.get('x-signature') ?? '', 'utf8');
  const digest = Buffer.from(
    createHmac('sha256', LEMON_SIGNING_SECRET.value()).update(req.rawBody).digest('hex'),
    'utf8',
  );
  if (signature.length !== digest.length || !timingSafeEqual(signature, digest)) {
    throw new HttpError(401, 'authentication_error', 'Bad signature');
  }

  const event = req.body as {
    meta?: { event_name?: string; custom_data?: { uid?: string } };
    data?: {
      id?: string;
      type?: string;
      attributes?: {
        variant_id?: number;
        status?: string;
        ends_at?: string | null;
        urls?: { customer_portal?: string };
      };
    };
  };
  if (event.data?.type !== 'subscriptions' || !event.data.id || !event.data.attributes) {
    res.json({ ok: true });
    return;
  }

  const subscriptionId = String(event.data.id);
  let uid = event.meta?.custom_data?.uid;
  if (!uid) {
    // Старые события могут прийти без custom_data — ищем аккаунт по подписке.
    const found = await getFirestore().collection('lemon').where('subscriptionId', '==', subscriptionId).limit(1).get();
    uid = found.docs[0]?.id;
  }
  if (!uid) {
    logger.warn('Lemon webhook without uid', event.meta?.event_name, subscriptionId);
    res.json({ ok: true });
    return;
  }

  const { attributes } = event.data;
  const record: LemonRecord = {
    subscriptionId,
    variantId: String(attributes.variant_id ?? ''),
    status: attributes.status ?? 'expired',
    endsAt: attributes.ends_at ? Date.parse(attributes.ends_at) : null,
    portal: attributes.urls?.customer_portal ?? null,
    updatedAt: Date.now(),
  };

  const ref = lemonDoc(uid);
  await getFirestore().runTransaction(async (tx) => {
    const current = (await tx.get(ref)).data() as LemonRecord | undefined;
    // Купили вторую подписку — запоздалое «истекла» по первой не должно её затереть.
    if (current && current.subscriptionId !== subscriptionId && lemonTier(current) !== 'free' && lemonTier(record) === 'free') return;
    tx.set(ref, record);
  });
  logger.info('Lemon', event.meta?.event_name, uid, record.status);
  res.json({ ok: true });
}

// --- Расход ---

const month = () => new Date().toISOString().slice(0, 7);
const spendDoc = (uid: string) => getFirestore().collection('spend').doc(uid);

/** Проверяет объём и отдаёт тариф: озвучке он нужен, чтобы выбрать модель. */
async function assertBudget(uid: string): Promise<Tier> {
  const [snapshot, tier] = await Promise.all([spendDoc(uid).get(), tierOf(uid)]);
  const data = snapshot.data() as { month?: string; usd?: number } | undefined;
  const usd = data?.month === month() ? (data.usd ?? 0) : 0;
  if (usd >= MONTHLY_BUDGET_USD[tier]) throw new HttpError(402, 'budget_exceeded', 'Monthly budget exhausted');
  return tier;
}

/** Запись расхода. Сбой не должен отнять уже полученный ответ. */
async function charge(uid: string, usd: number): Promise<void> {
  if (!(usd > 0)) return;
  const ref = spendDoc(uid);
  const current = month();
  try {
    await getFirestore().runTransaction(async (tx) => {
      const data = (await tx.get(ref)).data() as { month?: string } | undefined;
      if (data?.month === current) tx.update(ref, { usd: FieldValue.increment(usd), updatedAt: Date.now() });
      else tx.set(ref, { month: current, usd, updatedAt: Date.now() });
    });
  } catch (e) {
    logger.error('charge failed', uid, usd, e);
  }
}

// --- Маршруты ---

interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

async function claude(req: Request, res: Response, uid: string): Promise<void> {
  const body = req.body as { model?: unknown; max_tokens?: unknown; stream?: unknown };
  if (!body || typeof body !== 'object') throw new HttpError(400, 'invalid_request_error', 'Bad body');
  if (body.model !== CLAUDE_MODEL) throw new HttpError(400, 'invalid_request_error', 'Model not allowed');
  if (typeof body.max_tokens !== 'number' || body.max_tokens > CLAUDE_MAX_TOKENS) {
    throw new HttpError(400, 'invalid_request_error', 'max_tokens not allowed');
  }
  if (body.stream) throw new HttpError(400, 'invalid_request_error', 'Streaming not supported');

  const headers: Record<string, string> = {
    'x-api-key': ANTHROPIC_API_KEY.value(),
    'content-type': 'application/json',
    'anthropic-version': req.get('anthropic-version') ?? '2023-06-01',
  };
  const beta = req.get('anthropic-beta');
  if (beta) headers['anthropic-beta'] = beta;

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await upstream.text();

  if (upstream.ok) {
    try {
      const usage = (JSON.parse(text) as { usage?: ClaudeUsage }).usage;
      if (usage) {
        await charge(
          uid,
          usage.input_tokens * CLAUDE_PRICE.input +
            usage.output_tokens * CLAUDE_PRICE.output +
            (usage.cache_creation_input_tokens ?? 0) * CLAUDE_PRICE.cacheWrite +
            (usage.cache_read_input_tokens ?? 0) * CLAUDE_PRICE.cacheRead,
        );
      }
    } catch (e) {
      logger.error('usage parse failed', e);
    }
  }

  res.status(upstream.status).type('application/json').send(text);
}

async function transcribe(req: Request, res: Response, uid: string): Promise<void> {
  const audio = req.rawBody;
  if (!audio || audio.length === 0) throw new HttpError(400, 'invalid_request_error', 'Empty audio');
  if (audio.length > AUDIO_MAX_BYTES) throw new HttpError(413, 'invalid_request_error', 'Audio too large');
  const language = String(req.query.language ?? '');
  if (!/^[a-z]{2}$/.test(language)) throw new HttpError(400, 'invalid_request_error', 'Bad language');

  const type = req.get('content-type') ?? 'audio/m4a';
  // Браузеры пишут webm (Chrome, Firefox) или mp4 (Safari); Whisper судит по расширению.
  const extension = type.includes('mpeg')
    ? 'mp3'
    : type.includes('wav')
      ? 'wav'
      : type.includes('webm')
        ? 'webm'
        : type.includes('ogg')
          ? 'ogg'
          : type.includes('mp4')
            ? 'mp4'
            : 'm4a';
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type }), `speech.${extension}`);
  form.append('model', 'whisper-1');
  form.append('language', language);
  // verbose_json отдаёт длительность — по ней и считаем, а не по размеру файла.
  form.append('response_format', 'verbose_json');

  const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY.value()}` },
    body: form,
  });
  if (!upstream.ok) {
    logger.error('Whisper', upstream.status, await upstream.text());
    throw new HttpError(502, 'api_error', `Whisper ${upstream.status}`);
  }

  const { text, duration } = (await upstream.json()) as { text: string; duration?: number };
  await charge(uid, ((duration ?? 0) / 60) * WHISPER_PRICE_PER_MINUTE);
  res.json({ text });
}

/**
 * Озвучка. Max — gpt-4o-mini-tts с присланным голосом и «разговорной»
 * подачей; остальным — tts-1 с nova, присланный голос не слушаем.
 */
async function speak(req: Request, res: Response, uid: string, tier: Tier): Promise<void> {
  const { text, speed, voice } = (req.body ?? {}) as { text?: unknown; speed?: unknown; voice?: unknown };
  if (typeof text !== 'string' || !text.trim()) throw new HttpError(400, 'invalid_request_error', 'Empty text');
  if (text.length > TTS_MAX_CHARS) throw new HttpError(400, 'invalid_request_error', 'Text too long');
  const pace = typeof speed === 'number' ? Math.min(4, Math.max(0.25, speed)) : 1;
  const max = tier === 'max';

  const request = max
    ? {
        model: MAX_TTS_MODEL,
        voice: typeof voice === 'string' && MAX_VOICES.includes(voice) ? voice : MAX_VOICES[0],
        instructions: MAX_TTS_INSTRUCTIONS,
      }
    : { model: 'tts-1', voice: TTS_VOICE };

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY.value()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, input: text, response_format: 'mp3', speed: pace }),
  });
  if (!upstream.ok) {
    logger.error('TTS', upstream.status, await upstream.text());
    throw new HttpError(502, 'api_error', `TTS ${upstream.status}`);
  }

  const audio = Buffer.from(await upstream.arrayBuffer());
  // Ускоренная речь короче, но токены, вероятно, считаются по обычной — берём большее.
  const seconds = ((audio.length * 8) / MAX_TTS_MP3_BITRATE) * Math.max(1, pace);
  await charge(uid, max ? seconds * MAX_TTS_PRICE_PER_SECOND : text.length * TTS_PRICE_PER_CHAR);
  res.type('audio/mpeg').send(audio);
}

export const api = onRequest(
  {
    region: 'europe-west1',
    // Веб-версия ходит сюда из браузера: Firebase Hosting, сайт и локальная
    // разработка. Приложениям заголовок не нужен — они Origin не шлют.
    cors: [
      /^https:\/\/madame-poly\.(web\.app|firebaseapp\.com)$/,
      /^https:\/\/([a-z0-9-]+\.)*kuka-lab\.com$/,
      /^http:\/\/localhost(:\d+)?$/,
    ],
    secrets: [ANTHROPIC_API_KEY, OPENAI_API_KEY, REVENUECAT_SECRET_KEY, LEMON_API_KEY, LEMON_SIGNING_SECRET],
    // Ход беседы с разбором ошибок иногда идёт дольше минуты.
    timeoutSeconds: 180,
    memory: '512MiB',
    maxInstances: 20,
    concurrency: 40,
  },
  async (req, res) => {
    try {
      if (req.method !== 'POST') throw new HttpError(405, 'invalid_request_error', 'POST only');
      // Вебхук Lemon приходит без Firebase-токена — его подлинность в подписи.
      if (req.path === '/lemon') {
        await lemonWebhook(req, res);
        return;
      }
      const token = await verifyToken(req);
      const { uid } = token;
      // Подписка и оплата — до проверки объёма: исчерпанный объём не мешает
      // узнать свой тариф или купить старший.
      if (req.path === '/tier') {
        const [tier, lemon] = await Promise.all([tierOf(uid), lemonOf(uid)]);
        res.json({ tier, portal: lemon.portal });
        return;
      }
      if (req.path === '/plans') {
        await plans(res);
        return;
      }
      if (req.path === '/checkout') {
        await checkout(req, res, token);
        return;
      }
      const tier = await assertBudget(uid);

      if (req.path === '/claude/v1/messages') await claude(req, res, uid);
      else if (req.path === '/transcribe') await transcribe(req, res, uid);
      else if (req.path === '/speak') await speak(req, res, uid, tier);
      else throw new HttpError(404, 'not_found_error', 'Unknown route');
    } catch (e) {
      if (e instanceof HttpError) sendError(res, e);
      else {
        logger.error('proxy failed', e);
        sendError(res, new HttpError(502, 'api_error', 'Upstream unavailable'));
      }
    }
  },
);
