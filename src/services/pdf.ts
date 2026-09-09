import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildHomeworkHtml, type HomeworkDocument } from './homeworkHtml';

/** Печатает документ в PDF и открывает системное окно «Поделиться». */
export async function exportHomeworkPdf(document: HomeworkDocument): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: buildHomeworkHtml(document) });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
