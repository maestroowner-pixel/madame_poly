# Карточка приложения в App Store и Google Play — версия 1.3

По файлу на язык интерфейса. В каждом поля App Store, поля Google Play и
общее описание: оно написано без названий магазинов и устройств («телефоны и
планшеты», «настройки аккаунта в магазине»), поэтому одинаково годится для
обоих (Apple отклоняет описание, где упомянут Google Play).

Лимиты проверяет `python3 store/listing/check.py`.

| Поле | App Store | Google Play |
|---|---|---|
| Название | Name, 30 | Title, 30 |
| Подзаголовок | Subtitle, 30 | — |
| Промотекст | Promotional text, 170 (меняется без ревью) | — |
| Ключевые слова | Keywords, 100, через запятую без пробелов | — |
| Краткое описание | — | Short description, 80 |
| Описание | Description, 4000 | Full description, 4000 |
| Что нового | What's New, 4000 | Release notes, 500 |

## Язык файла → локаль в магазине

| Файл | App Store | Google Play |
|---|---|---|
| en | English (U.S.), English (U.K.) | en-US, en-GB |
| uk | Ukrainian | uk |
| ru | Russian | ru-RU |
| es | Spanish (Spain), Spanish (Mexico) | es-ES, es-419 |
| de | German | de-DE |
| fr | French | fr-FR |
| pt | Portuguese (Brazil) | pt-BR |
| zh | Chinese (Simplified) | zh-CN |
| ja | Japanese | ja-JP |
| ko | Korean | ko-KR |

Португальский файл написан по-бразильски, как и интерфейс; для Portuguese
(Portugal) / pt-PT его можно взять как есть.

## Общее для всех языков

- Support URL / сайт: https://madamepoly.kuka-lab.com
- Marketing URL: https://madamepoly.kuka-lab.com
- Privacy Policy URL: https://madamepoly.kuka-lab.com/#privacy
- Условия (EULA): https://madamepoly.kuka-lab.com/#terms
- Категория: Education (Образование); вторая в App Store — Reference.
- Copyright: 2026 Kuka Lab, Mykhaylo Osypov
- Возраст: App Store 4+; Google Play — анкета IARC: без насилия, без
  общения между пользователями, без рекламы, покупки внутри приложения есть.
- Контакт: kukalab@icloud.com
