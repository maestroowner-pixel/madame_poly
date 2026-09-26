import type { LanguageCode, Level } from '../types';
import { GERMAN } from './de';
import { ENGLISH } from './en';
import { SPANISH } from './es';
import { FRENCH } from './fr';
import { ITALIAN } from './it';
import { PORTUGUESE } from './pt';
import { UKRAINIAN } from './uk';
import { bandOf, type GrammarModule, type GrammarUnit, type Syllabus } from './types';

export { bandOf, type Band, type GrammarModule, type GrammarUnit } from './types';

const SYLLABI: Record<LanguageCode, Syllabus> = {
  en: ENGLISH,
  de: GERMAN,
  fr: FRENCH,
  es: SPANISH,
  it: ITALIAN,
  pt: PORTUGUESE,
  uk: UKRAINIAN,
};

/** Модули ступени, к которой относится уровень: A2 → программа A1–A2. */
export function syllabus(language: LanguageCode, level: Level): GrammarModule[] {
  return SYLLABI[language][bandOf(level)];
}

/** Юнит и его модуль по ключу — ключ сам говорит, в какой он ступени. */
export function findUnit(
  language: LanguageCode,
  id: string,
): { unit: GrammarUnit; module: GrammarModule } | null {
  for (const module of Object.values(SYLLABI[language]).flat()) {
    const unit = module.units.find((item) => item.id === id);
    if (unit) return { unit, module };
  }
  return null;
}

/** Названия юнитов ступени списком — для промптов, где тему надо назвать по программе. */
export function unitTitles(language: LanguageCode, level: Level): string[] {
  return syllabus(language, level).flatMap((module) => module.units.map((unit) => unit.title));
}
