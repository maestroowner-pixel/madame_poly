# Подписки: что завести в магазинах и RevenueCat

Код готов: приложение различает тарифы по правам RevenueCat (`madame_poly_pro`, `madame_poly_max`),
пейвол узнаёт Max по «max» в идентификаторе продукта, сервер проверяет
подписку в RevenueCat по Firebase uid (приложение вызывает `Purchases.logIn`
с тем же uid, анонимным тоже).

## Продукты — одинаково в App Store Connect и Google Play

| Идентификатор | Тариф | Цена | Период |
|---|---|---|---|
| `Poly_Pro` | Pro | 7 € (или ближайшая точка 6,99 €) | 1 месяц |
| `Poly_Max` | Max | 10 € (или 9,99 €) | 1 месяц |

В идентификаторе Max обязательно слово «max» (регистр не важен) — по нему
пейвол отличает тариф. В RevenueCat и App Store Connect уже заведены
`Poly_Pro` и `Poly_Max` (2026-09-26).

### App Store Connect

1. Соглашение Paid Apps подписано, банк и налоги заполнены (без этого
   покупки не работают даже в TestFlight).
2. Подписки → группа подписок **Madame Poly**.
3. В группе две автоподписки. Уровни внутри группы: **Max — уровень 1**
   (выше), **Pro — уровень 2**: тогда переход Pro → Max считается апгрейдом.
4. Для каждой: цена, названия и описания (ниже), скриншот пейвола для ревью.
5. В описании приложения — ссылка на условия (EULA):
   https://madamepoly.kuka-lab.com/#terms и политику:
   https://madamepoly.kuka-lab.com/#privacy.

### Google Play Console

Заведено (2026-09-26): подписки `poly_pro` (Madame Poly Pro) и `poly_max`
(Madam Poly Max), у каждой по одному основному плану. В RevenueCat
Android-продукт называется `poly_pro:<id плана>` и `poly_max:<id плана>`.

Google Cloud (проект `madame-poly`), сделано 2026-09-26: включены Android
Publisher API, Play Developer Reporting API и Pub/Sub; сервисный аккаунт
`revenuecat@madame-poly.iam.gserviceaccount.com` с ролями Pub/Sub Editor и
Monitoring Viewer; ключ JSON выпущен и загружается в RevenueCat (после
загрузки файл удалить).

В Play Console → Пользователи и разрешения → Пригласить этого сервисного
пользователя с правами: «Просмотр данных приложения», «Просмотр финансовых
данных», «Управление заказами и подписками». Доступ появляется не сразу —
до суток.


1. Приложение загружено хотя бы во внутреннее тестирование (иначе раздел
   подписок недоступен); платёжный профиль продавца заведён.
2. Монетизация → Подписки → два продукта с теми же идентификаторами, у
   каждого базовый план `monthly`, автопродление, цена.

## RevenueCat

1. Проект **Madame Poly**, два приложения: iOS `com.kukalab.polyglotta` и
   Android (тот же пакет).
2. iOS: ключ App Store Connect API (In-App Purchase key) — для проверки
   покупок. Android: сервисный аккаунт Google Cloud с доступом к Play Console.
3. Products → импортировать оба продукта из обоих магазинов.
4. Entitlements (заведены 2026-09-26): **`madame_poly_pro`** — `Poly_Pro` и
   `poly_pro:poly-pro`; **`madame_poly_max`** — `Poly_Max` и `poly_max:poly-max`.
   Эти идентификаторы прописаны в `src/config.ts` и `functions/src/index.ts` —
   переименовать право в RevenueCat нельзя, поэтому при новом праве меняется код.
   Прикреплять Max ещё и к Pro не нужно: приложение и сервер сначала проверяют Max.
5. Offerings → **default** → два пакета с **собственными** идентификаторами
   (Custom): `pro` → `Poly_Pro`, `max` → `Poly_Max`, каждый с продуктами обоих
   магазинов; `$rc_monthly` на оба нельзя — он в наборе один. Сделать `default`
   текущим (Make current). Приложение берёт пакеты из текущего набора; если в
   нём не оба тарифа, собирает их из всех наборов — но лучше один набор.
6. Ключи:
   - публичные SDK-ключи → `.env`: `EXPO_PUBLIC_REVENUECAT_IOS_KEY`,
     `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`;
   - секретный ключ API **v1** (`sk_…`) → секрет сервера:
     `firebase functions:secrets:set REVENUECAT_SECRET_KEY`, затем
     `firebase deploy --only functions`. Пока там `none`, сервер считает всех
     подписчиками Max.

## Тексты подписок (название ≤ 30, описание ≤ 45 знаков)

| Язык | Pro — название | Pro — описание | Max — название | Max — описание |
|---|---|---|---|---|
| en | Madame Poly Pro | No daily limit, ~20–30 talks a month | Madame Poly Max | ~35–45 talks a month and voice choice |
| uk | Madame Poly Pro | Без денного ліміту, ~20–30 розмов | Madame Poly Max | ~35–45 розмов і вибір голосу |
| es | Madame Poly Pro | Sin límite diario, ~20–30 charlas | Madame Poly Max | ~35–45 charlas y elección de voz |
| ru | Madame Poly Pro | Без дневного лимита, ~20–30 бесед | Madame Poly Max | ~35–45 бесед и выбор голоса |
| de | Madame Poly Pro | Kein Tageslimit, ~20–30 Gespräche | Madame Poly Max | ~35–45 Gespräche und Stimmenwahl |
| fr | Madame Poly Pro | Sans limite par jour, ~20–30 échanges | Madame Poly Max | ~35–45 échanges et choix de la voix |
| pt | Madame Poly Pro | Sem limite diário, ~20–30 conversas | Madame Poly Max | ~35–45 conversas e escolha de voz |
| zh-Hans | Madame Poly Pro | 无每日限制，每月约 20–30 次对话 | Madame Poly Max | 每月约 35–45 次对话，可选声音 |
| ja | Madame Poly Pro | 1 日の制限なし、月約 20〜30 回の会話 | Madame Poly Max | 月約 35〜45 回の会話と声の選択 |
| ko | Madame Poly Pro | 하루 제한 없음, 월 약 20–30회 대화 | Madame Poly Max | 월 약 35–45회 대화와 목소리 선택 |

## Проверка перед релизом

- Песочница Apple (Sandbox-аккаунт) и лицензированный тестер в Google Play:
  купить Pro → пейвол показывает «Ваш тариф» на Pro; купить Max → голоса
  открываются; восстановить покупки на втором устройстве.
- Сервер: после покупки запрос озвучки у Max идёт через gpt-4o-mini-tts,
  объём — 5 $; у Pro — 3 $.
