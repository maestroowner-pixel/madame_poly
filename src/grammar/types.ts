import type { Level } from '../types';

/**
 * Программа грамматики делится на три ступени, как учебники: A1–A2, B1–B2,
 * C1–C2. Внутри ступени — модули, в модулях — юниты. Юнит — одна тема, по
 * которой составляется урок: правило и упражнения.
 */
export type Band = 'A' | 'B' | 'C';

export interface GrammarUnit {
  /** Ключ хранения урока: ступень и название, `b:past-perfect`. */
  id: string;
  /** Название на изучаемом языке, как в оглавлении учебника. */
  title: string;
  /** Что именно входит в тему — подсказка модели, на экран не выводится. */
  focus?: string;
}

export interface GrammarModule {
  title: string;
  units: GrammarUnit[];
}

export type Syllabus = Record<Band, GrammarModule[]>;

export function bandOf(level: Level): Band {
  return level[0] as Band;
}

/** Ключ из названия: без диакритики, знаков и регистра. */
function slug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Модуль из коротких записей `[название, что входит]`. Ключ юнита — из
 * названия: переименовали тему — сохранённый по ней урок составится заново.
 */
export function module(band: Band, title: string, units: (string | [string, string])[]): GrammarModule {
  return {
    title,
    units: units.map((unit) => {
      const [name, focus] = typeof unit === 'string' ? [unit, undefined] : unit;
      return { id: `${band.toLowerCase()}:${slug(name)}`, title: name, focus };
    }),
  };
}
