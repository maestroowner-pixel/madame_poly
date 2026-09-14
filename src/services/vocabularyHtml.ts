/**
 * Разметка списка слов для печати — той же формы, что учительский лист:
 * заголовок, группы двухколоночными таблицами, диалог и примеры. Без нативных
 * импортов, чтобы собираться и проверяться в обычном Node.
 */
import { t } from '../i18n';
import type { Vocabulary } from '../types';

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildVocabularyHtml(vocabulary: Vocabulary, subtitle: string): string {
  const sections = vocabulary.sections
    .map(
      (section, index) =>
        `<h2>${index + 1}. ${escape(section.gloss)} <span class="orig">(${escape(section.title)})</span></h2>` +
        `<table><tbody>` +
        section.entries
          .map(
            (entry) =>
              `<tr><td class="term">${escape(entry.term)}</td>` +
              `<td class="tr">${escape(entry.translation)}</td></tr>`,
          )
          .join('') +
        `</tbody></table>`,
    )
    .join('');

  const dialogue = vocabulary.dialogue.length
    ? `<h2>${vocabulary.sections.length + 1}. ${t.wordsDialogue}</h2>` +
      vocabulary.dialogue.map((line) => `<div class="line">— ${escape(line)}</div>`).join('')
    : '';

  const examples = vocabulary.examples.length
    ? `<h2>${vocabulary.sections.length + 2}. ${t.wordsExamples}</h2>` +
      vocabulary.examples.map((line) => `<div class="line">${escape(line)}</div>`).join('')
    : '';

  return `
<html>
<head><meta charset="utf-8"><style>
  @page { margin: 18mm 16mm; }
  body { font-family: -apple-system, Helvetica, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.45; }
  h1 { font-size: 19pt; margin: 0 0 2pt; }
  h2 { font-size: 13pt; margin: 20pt 0 6pt; }
  .sub { color: #666; font-size: 10pt; margin-bottom: 8pt; }
  .orig { color: #666; font-weight: normal; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 3pt 6pt 3pt 0; vertical-align: top; border-bottom: 1px solid #eee; }
  .term { width: 48%; font-weight: 600; }
  .tr { color: #333; }
  .line { padding: 2pt 0; }
  tr, .line { page-break-inside: avoid; }
</style></head>
<body>
  <h1>${escape(vocabulary.title)}</h1>
  <div class="sub">${escape(subtitle)}</div>
  ${sections}
  ${dialogue}
  ${examples}
</body>
</html>`;
}
