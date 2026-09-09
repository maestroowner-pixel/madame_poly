/**
 * Тетрадь для печати: все составленные упражнения, сгруппированные по темам.
 * Верстается под работу стилусом на планшете — под каждым заданием оставлены
 * настоящие линейки, а не одна тонкая черта, и ответы вынесены в конец.
 */
import { t } from '../i18n';
import { LANGUAGES } from '../languages';
import type { NotebookEntry } from '../storage';
import { findTopic } from '../topics';
import type { Exercise, ExerciseKind } from '../types';

const KIND_LABELS: Record<ExerciseKind, string> = {
  fill: t.kindFill,
  fix: t.kindFix,
  translate: t.kindTranslate,
};

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Название темы для заголовка раздела. */
function sectionTitle(entry: NotebookEntry): string {
  const topic = findTopic(entry.language, entry.topicId);
  const language = LANGUAGES[entry.language].label;
  return `${language} · ${topic ? topic.label : t.freeTopic}`;
}

function renderTask(exercise: Exercise, index: number): string {
  const source = exercise.sourceOriginal
    ? `<div class="from">${escape(t.pdfFrom)}: <s>${escape(exercise.sourceOriginal)}</s> → ` +
      `${escape(exercise.sourceCorrected ?? '')}</div>`
    : '';

  return (
    `<div class="task">` +
    `<div class="top"><b>${index}. ${KIND_LABELS[exercise.kind]}</b>` +
    `<span class="rule">${escape(exercise.rule)}</span></div>` +
    `<div class="prompt">${escape(exercise.task)}</div>` +
    `<div class="hint">${escape(exercise.hint)}</div>` +
    source +
    // Две линейки: одной строки на рукописный ответ не хватает.
    `<div class="rule-line"></div><div class="rule-line"></div>` +
    `</div>`
  );
}

export function buildNotebookHtml(entries: NotebookEntry[]): string {
  let number = 0;
  const answers: string[] = [];

  const sections = entries
    .map((entry) => {
      const tasks = entry.homework.exercises
        .map((exercise) => {
          number += 1;
          answers.push(
            `<div class="answer"><b>${number}.</b> ${escape(exercise.answer)}</div>`,
          );
          return renderTask(exercise, number);
        })
        .join('');

      return (
        `<section>` +
        `<h2>${escape(sectionTitle(entry))} <span class="level">${entry.level}</span></h2>` +
        `<p class="summary">${escape(entry.homework.summary)}</p>` +
        tasks +
        `</section>`
      );
    })
    .join('');

  return `
<html>
<head><meta charset="utf-8"><style>
  @page { margin: 16mm 14mm; }
  body { font-family: -apple-system, Helvetica, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.45; }
  h1 { font-size: 20pt; margin: 0 0 14pt; }
  h2 { font-size: 13pt; margin: 20pt 0 6pt; padding-bottom: 3pt; border-bottom: 1px solid #ccc; page-break-after: avoid; }
  .level { float: right; color: #666; font-weight: normal; }
  .summary { color: #444; font-size: 10pt; margin: 0 0 12pt; }
  .task { margin: 0 0 16pt; page-break-inside: avoid; }
  .top { display: flex; justify-content: space-between; gap: 10pt; }
  .rule, .hint, .from { color: #666; font-size: 9.5pt; }
  .prompt { margin: 3pt 0; font-size: 12pt; }
  /* Линейки под рукописный ответ: высота под стилус, а не под шрифт. */
  .rule-line { margin-top: 9pt; border-bottom: 1px solid #bbb; height: 16pt; }
  .answers { page-break-before: always; }
  .answer { margin-bottom: 5pt; }
</style></head>
<body>
  <h1>${escape(t.notebookTitle)}</h1>
  ${sections}
  <div class="answers">
    <h2>${escape(t.pdfAnswers)}</h2>
    ${answers.join('')}
  </div>
</body>
</html>`;
}
