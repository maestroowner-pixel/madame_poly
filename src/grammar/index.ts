import type { LanguageCode, Level } from '../types';
import { GERMAN } from './de';
import { ENGLISH } from './en';
import { SPANISH } from './es';
import { FRENCH } from './fr';
import { ITALIAN } from './it';
import { PORTUGUESE } from './pt';
import { BRAZILIAN } from './br';
import { UKRAINIAN } from './uk';
import { bandOf, type GrammarModule, type GrammarUnit, type Syllabus } from './types';

export { bandOf, type Band, type GrammarModule, type GrammarUnit } from './types';

/**
 * Программа языка — по ступеням A/B/C или, если язык учат одним сквозным
 * курсом (украинский как иностранный), одним списком модулей на все уровни.
 */
const SYLLABI: Record<LanguageCode, Syllabus | GrammarModule[]> = {
  en: ENGLISH,
  de: GERMAN,
  fr: FRENCH,
  es: SPANISH,
  it: ITALIAN,
  pt: PORTUGUESE,
  br: BRAZILIAN,
  uk: UKRAINIAN,
};

/** Один курс без ступеней — экран показывает его целиком при любом уровне. */
export function isSingleCourse(language: LanguageCode): boolean {
  return Array.isArray(SYLLABI[language]);
}

/** Модули ступени, к которой относится уровень: A2 → программа A1–A2. */
export function syllabus(language: LanguageCode, level: Level): GrammarModule[] {
  const program = SYLLABI[language];
  return Array.isArray(program) ? program : program[bandOf(level)];
}

function allModules(language: LanguageCode): GrammarModule[] {
  const program = SYLLABI[language];
  return Array.isArray(program) ? program : Object.values(program).flat();
}

/** Юнит и его модуль по ключу — ключ сам говорит, в какой он ступени. */
export function findUnit(
  language: LanguageCode,
  id: string,
): { unit: GrammarUnit; module: GrammarModule } | null {
  for (const module of allModules(language)) {
    const unit = module.units.find((item) => item.id === id);
    if (unit) return { unit, module };
  }
  return null;
}

/** Названия юнитов ступени списком — для промптов, где тему надо назвать по программе. */
export function unitTitles(language: LanguageCode, level: Level): string[] {
  return syllabus(language, level).flatMap((module) => module.units.map((unit) => unit.title));
}
