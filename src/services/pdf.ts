import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildHomeworkHtml, type HomeworkDocument } from './homeworkHtml';
import { buildNotebookHtml } from './notebookHtml';
import type { NotebookEntry } from '../storage';

/** Печатает документ в PDF и открывает системное окно «Поделиться». */
export async function exportHomeworkPdf(document: HomeworkDocument): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildHomeworkHtml(document) });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}

/** Печатает всю тетрадь: упражнения по темам и ответы в конце. */
export async function exportNotebookPdf(entries: NotebookEntry[]): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildNotebookHtml(entries) });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
