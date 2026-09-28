import type { LanguageCode } from './types';

interface LanguageMeta {
  /** Подпись в переключателе. */
  label: string;
  /** Название языка для system prompt. */
  englishName: string;
  /** Код языка для Whisper (ISO-639-1) — заметно поднимает точность распознавания. */
  whisper: string;
  /** Флаг для UI. */
  flag: string;
}

export const LANGUAGES: Record<LanguageCode, LanguageMeta> = {
  en: { label: 'English', englishName: 'English', whisper: 'en', flag: '🇬🇧' },
  de: { label: 'Deutsch', englishName: 'German', whisper: 'de', flag: '🇩🇪' },
  fr: { label: 'Français', englishName: 'French', whisper: 'fr', flag: '🇫🇷' },
  es: { label: 'Español', englishName: 'Spanish', whisper: 'es', flag: '🇪🇸' },
  it: { label: 'Italiano', englishName: 'Italian', whisper: 'it', flag: '🇮🇹' },
  /**
   * Европейская норма: под неё есть экзамены по шкале CEFR (CAPLE), и она
   * ближе европейской аудитории. Название с «European» уходит во все промпты —
   * модель иначе сбивается на бразильский вариант.
   */
  pt: { label: 'Português', englishName: 'European Portuguese', whisper: 'pt', flag: '🇵🇹' },
  /**
   * Бразильский португальский — отдельный язык, а не вариант: другая норма
   * (você, герундий, проклиза в начале фразы), своя программа и свой экзамен
   * (Celpe-Bras). Whisper у обоих вариантов один — «pt».
   */
  br: { label: 'Brasileiro', englishName: 'Brazilian Portuguese', whisper: 'pt', flag: '🇧🇷' },
  uk: { label: 'Українська', englishName: 'Ukrainian', whisper: 'uk', flag: '🇺🇦' },
  nl: { label: 'Nederlands', englishName: 'Dutch', whisper: 'nl', flag: '🇳🇱' },
  pl: { label: 'Polski', englishName: 'Polish', whisper: 'pl', flag: '🇵🇱' },
  ro: { label: 'Română', englishName: 'Romanian', whisper: 'ro', flag: '🇷🇴' },
};

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];
