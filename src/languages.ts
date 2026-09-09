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
};

export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];
