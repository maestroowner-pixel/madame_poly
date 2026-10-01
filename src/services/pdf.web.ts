import { buildHomeworkHtml, type HomeworkDocument } from './homeworkHtml';
import { buildNotebookHtml } from './notebookHtml';
import { buildVocabularyHtml } from './vocabularyHtml';
import type { NotebookEntry } from '../storage';
import type { Vocabulary } from '../types';

/**
 * В браузере PDF делает сам браузер: html уходит в невидимую рамку и печатается,
 * а в окне печати человек выбирает «Сохранить как PDF». Имя файла браузер берёт
 * из заголовка документа — его и ставим тем же, что на телефоне.
 */
const pad = (value: number) => String(value).padStart(2, '0');

function fileName(count: number, prefix = 'Copybook Poly'): string {
  const now = new Date();
  return `${prefix}_${pad(now.getDate())}${pad(now.getMonth() + 1)}_${count}`;
}

function print(html: string, title: string): Promise<void> {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
    document.body.appendChild(frame);

    frame.onload = () => {
      const view = frame.contentWindow!;
      view.document.title = title;
      // Печать идёт под заголовком документа; заголовок страницы подменяем на
      // время окна, иначе Chrome и Safari предлагают имя вкладки.
      const pageTitle = document.title;
      document.title = title;
      view.focus();
      // В Chrome print() ждёт, пока окно закроют; Safari возвращается сразу,
      // поэтому рамку убираем с запасом, а не по afterprint, который он не шлёт.
      view.print();
      document.title = pageTitle;
      setTimeout(() => frame.remove(), 60_000);
      resolve();
    };
    frame.srcdoc = html;
  });
}

export async function exportHomeworkPdf(document: HomeworkDocument): Promise<void> {
  const count = document.homework.exercises.length;
  await print(buildHomeworkHtml(document), fileName(count));
}

export async function exportNotebookPdf(entries: NotebookEntry[]): Promise<void> {
  const count = entries.reduce((sum, entry) => sum + entry.homework.exercises.length, 0);
  await print(buildNotebookHtml(entries), fileName(count));
}

export async function exportVocabularyPdf(vocabulary: Vocabulary, subtitle: string): Promise<void> {
  const count = vocabulary.sections.reduce((sum, section) => sum + section.entries.length, 0);
  const prefix = `Words Poly ${vocabulary.title}`.replace(/[\/:*?"<>|]+/g, ' ');
  await print(buildVocabularyHtml(vocabulary, subtitle), fileName(count, prefix));
}
