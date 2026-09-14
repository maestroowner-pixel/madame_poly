import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildHomeworkHtml, type HomeworkDocument } from './homeworkHtml';
import { buildNotebookHtml } from './notebookHtml';
import { buildVocabularyHtml } from './vocabularyHtml';
import type { NotebookEntry } from '../storage';
import type { Vocabulary } from '../types';

/** Готовые PDF складываются в кэш — их всегда можно напечатать заново. */
const PDF_DIR = new Directory(Paths.cache, 'pdf');

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Имя файла, под которым задание уходит в «Поделиться»: день, месяц и сколько
 * упражнений внутри. Печать даёт случайное имя вроде `Print.pdf`, а по нему в
 * папке загрузок ничего не найти.
 */
function fileName(count: number, prefix = 'Copybook Poly'): string {
  const now = new Date();
  return `${prefix}_${pad(now.getDate())}${pad(now.getMonth() + 1)}_${count}.pdf`;
}

/** Печатает html и отдаёт файл с говорящим именем. */
async function printNamed(html: string, count: number, prefix?: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html });

  if (!PDF_DIR.exists) PDF_DIR.create({ intermediates: true });
  const target = new File(PDF_DIR, fileName(count, prefix));
  await new File(uri).move(target, { overwrite: true });
  return target.uri;
}

async function share(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}

/** Печатает документ в PDF и открывает системное окно «Поделиться». */
export async function exportHomeworkPdf(document: HomeworkDocument): Promise<void> {
  const count = document.homework.exercises.length;
  await share(await printNamed(buildHomeworkHtml(document), count));
}

/** Печатает всю тетрадь: упражнения по темам и ответы в конце. */
export async function exportNotebookPdf(entries: NotebookEntry[]): Promise<void> {
  const count = entries.reduce((sum, entry) => sum + entry.homework.exercises.length, 0);
  await share(await printNamed(buildNotebookHtml(entries), count));
}

/** Печатает список слов: имя файла — тема и число записей. */
export async function exportVocabularyPdf(vocabulary: Vocabulary, subtitle: string): Promise<void> {
  const count = vocabulary.sections.reduce((sum, section) => sum + section.entries.length, 0);
  const prefix = `Words Poly ${vocabulary.title}`.replace(/[\/:*?"<>|]+/g, ' ');
  await share(await printNamed(buildVocabularyHtml(vocabulary, subtitle), count, prefix));
}
