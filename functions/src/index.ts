import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onRequest, type Request } from 'firebase-functions/https';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
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

/** Что разрешено просить. Прокси не должен стать бесплатным входом в любые модели. */
const CLAUDE_MODEL = 'claude-sonnet-5';
const CLAUDE_MAX_TOKENS = 4096;
/**
 * Голос собеседницы. Один на все четыре языка: у неё одно лицо во всех ролях,
 * значит и голос должен быть один. Голоса OpenAI не привязаны к языку.
 */
const TTS_VOICE = 'nova';
const TTS_MAX_CHARS = 4096;
/** Предел Whisper — 25 МБ на файл. */
const AUDIO_MAX_BYTES = 25 * 1024 * 1024;

/** Цены — те же, что в `src/config.ts`; меняются вместе. */
const CLAUDE_PRICE = { input: 2 / 1e6, output: 10 / 1e6, cacheWrite: 2.5 / 1e6, cacheRead: 0.2 / 1e6 };
const WHISPER_PRICE_PER_MINUTE = 0.006;
const TTS_PRICE_PER_CHAR = 15 / 1e6;

/** Объёмы — те же, что в `src/config.ts`. */
const PRO_MONTHLY_BUDGET_USD = 5;
const FREE_MONTHLY_BUDGET_USD = 1;
const PRO_ENTITLEMENT = 'pro';

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

async function verify(req: Request): Promise<string> {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'authentication_error', 'Missing token');
  try {
    return (await getAuth().verifyIdToken(token)).uid;
  } catch {
    throw new HttpError(401, 'authentication_error', 'Invalid token');
  }
}

// --- Подписка ---

/** Ответ RevenueCat кэшируем на пять минут: он нужен на каждом ходе беседы. */
const proCache = new Map<string, { pro: boolean; until: number }>();

async function isPro(uid: string): Promise<boolean> {
  const key = REVENUECAT_SECRET_KEY.value().trim();
  // Магазины не настроены — в приложении тогда тоже «подписка есть».
  if (!key || key === 'none') return true;

  const cached = proCache.get(uid);
  if (cached && cached.until > Date.now()) return cached.pro;

  let pro = false;
  try {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (response.ok) {
      const body = (await response.json()) as {
        subscriber?: { entitlements?: Record<string, { expires_date: string | null }> };
      };
      const entitlement = body.subscriber?.entitlements?.[PRO_ENTITLEMENT];
      pro = entitlement !== undefined && (entitlement.expires_date === null || Date.parse(entitlement.expires_date) > Date.now());
    } else {
      logger.warn('RevenueCat', response.status);
    }
  } catch (e) {
    // RevenueCat недоступен — не рвём беседу платящему, но и не кэшируем ответ.
    logger.warn('RevenueCat unreachable', e);
    return cached?.pro ?? false;
  }
  proCache.set(uid, { pro, until: Date.now() + 5 * 60_000 });
  return pro;
}

// --- Расход ---

const month = () => new Date().toISOString().slice(0, 7);
const spendDoc = (uid: string) => getFirestore().collection('spend').doc(uid);

async function assertBudget(uid: string): Promise<void> {
  const [snapshot, pro] = await Promise.all([spendDoc(uid).get(), isPro(uid)]);
  const data = snapshot.data() as { month?: string; usd?: number } | undefined;
  const usd = data?.month === month() ? (data.usd ?? 0) : 0;
  const budget = pro ? PRO_MONTHLY_BUDGET_USD : FREE_MONTHLY_BUDGET_USD;
  if (usd >= budget) throw new HttpError(402, 'budget_exceeded', 'Monthly budget exhausted');
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
  const extension = type.includes('mpeg') ? 'mp3' : type.includes('wav') ? 'wav' : 'm4a';
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

async function speak(req: Request, res: Response, uid: string): Promise<void> {
  const { text, speed } = (req.body ?? {}) as { text?: unknown; speed?: unknown };
  if (typeof text !== 'string' || !text.trim()) throw new HttpError(400, 'invalid_request_error', 'Empty text');
  if (text.length > TTS_MAX_CHARS) throw new HttpError(400, 'invalid_request_error', 'Text too long');
  const pace = typeof speed === 'number' ? Math.min(4, Math.max(0.25, speed)) : 1;

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY.value()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: TTS_VOICE, input: text, response_format: 'mp3', speed: pace }),
  });
  if (!upstream.ok) {
    logger.error('TTS', upstream.status, await upstream.text());
    throw new HttpError(502, 'api_error', `TTS ${upstream.status}`);
  }

  const audio = Buffer.from(await upstream.arrayBuffer());
  await charge(uid, text.length * TTS_PRICE_PER_CHAR);
  res.type('audio/mpeg').send(audio);
}

export const api = onRequest(
  {
    region: 'europe-west1',
    secrets: [ANTHROPIC_API_KEY, OPENAI_API_KEY, REVENUECAT_SECRET_KEY],
    // Ход беседы с разбором ошибок иногда идёт дольше минуты.
    timeoutSeconds: 180,
    memory: '512MiB',
    maxInstances: 20,
    concurrency: 40,
  },
  async (req, res) => {
    try {
      if (req.method !== 'POST') throw new HttpError(405, 'invalid_request_error', 'POST only');
      const uid = await verify(req);
      await assertBudget(uid);

      if (req.path === '/claude/v1/messages') await claude(req, res, uid);
      else if (req.path === '/transcribe') await transcribe(req, res, uid);
      else if (req.path === '/speak') await speak(req, res, uid);
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
