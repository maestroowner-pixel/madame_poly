/**
 * Разметка домашнего задания для печати. Держится отдельно от expo-print
 * намеренно: без нативных импортов её можно собрать и проверить в обычном Node.
 */
import type { Exercise, Homework, Message } from '../types';
import { t } from '../i18n';

const KIND_LABELS: Record<Exercise['kind'], string> = {
  fill: t.kindFill,
  fix: t.kindFix,
  translate: t.kindTranslate,
};

/** В HTML попадает текст модели и пользователя — экранируем всё, что вставляем. */
function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDialog(messages: Message[]): string {
  return messages
    .map((message) => {
      const who = message.role === 'user' ? t.pdfYou : t.pdfPartner;
      const corrections = (message.corrections ?? [])
        .map(
          (correction) =>
            `<div class="fix"><s>${escape(correction.original)}</s> → ` +
            `<b>${escape(correction.corrected)}</b><br>` +
            `<span class="note">${escape(correction.explanation)}</span></div>`,
        )
        .join('');

      return (
        `<div class="turn ${message.role}">` +
        `<div class="who">${who}</div>` +
        `<div class="said">${escape(message.text)}</div>` +
        corrections +
        `</div>`
      );
    })
    .join('');
}

function renderTasks(exercises: Exercise[]): string {
  return exercises
    .map((exercise, index) => {
      const source = exercise.sourceOriginal
        ? `<div class="from">${t.pdfFrom}: <s>${escape(exercise.sourceOriginal)}</s> → ` +
          `${escape(exercise.sourceCorrected ?? '')}</div>`
        : '';

      return (
        `<div class="task">` +
        `<div class="tasktop"><b>${index + 1}. ${KIND_LABELS[exercise.kind]}</b>` +
        `<span class="rule">${escape(exercise.rule)}</span></div>` +
        `<div class="prompt">${escape(exercise.task)}</div>` +
        `<div class="hint">${escape(exercise.hint)}</div>` +
        source +
        `<div class="blank"></div>` +
        `</div>`
      );
    })
    .join('');
}

function renderAnswers(exercises: Exercise[]): string {
  return exercises
    .map(
      (exercise, index) =>
        `<div class="answer"><b>${index + 1}.</b> ${escape(exercise.answer)}</div>`,
    )
    .join('');
}

export interface HomeworkDocument {
  title: string;
  subtitle: string;
  messages: Message[];
  homework: Homework;
}

/**
 * Разметка документа: заголовок, диалог с разбором, задания и — отдельным
 * разделом с новой страницы — ответы. Ответы вынесены намеренно: иначе взгляд
 * цепляет их раньше, чем успеваешь подумать над упражнением.
 *
 * Вынесена отдельно от печати, чтобы её можно было собрать и проверить без
 * нативных модулей.
 */
export function buildHomeworkHtml({
  title,
  subtitle,
  messages,
  homework,
}: HomeworkDocument): string {
  return `
<html>
<head><meta charset="utf-8"><style>
  @page { margin: 18mm 16mm; }
  body { font-family: -apple-system, Helvetica, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.45; }
  h1 { font-size: 19pt; margin: 0 0 2pt; }
  h2 { font-size: 13pt; margin: 22pt 0 8pt; padding-bottom: 3pt; border-bottom: 1px solid #ccc; }
  .subtitle { color: #666; font-size: 10pt; margin-bottom: 4pt; }
  .turn { margin: 0 0 10pt; }
  .who { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .5px; color: #888; }
  .said { margin: 1pt 0; }
  .user .said { font-weight: 600; }
  .fix { margin: 3pt 0 0 10pt; padding-left: 8pt; border-left: 2px solid #b9d7c2; font-size: 10pt; }
  .note, .hint, .from, .rule { color: #666; font-size: 9.5pt; }
  .task { margin: 0 0 14pt; page-break-inside: avoid; }
  .tasktop { display: flex; justify-content: space-between; gap: 10pt; }
  .prompt { margin: 3pt 0; font-size: 12pt; }
  .blank { margin-top: 6pt; border-bottom: 1px solid #bbb; height: 14pt; }
  .answers { page-break-before: always; }
  .answer { margin-bottom: 5pt; }
</style></head>
<body>
  <h1>${escape(title)}</h1>
  <div class="subtitle">${escape(subtitle)}</div>

  <h2>${escape(t.pdfDialog)}</h2>
  ${renderDialog(messages)}

  <h2>${escape(t.pdfTasks)}</h2>
  ${renderTasks(homework.exercises)}

  <div class="answers">
    <h2>${escape(t.pdfAnswers)}</h2>
    ${renderAnswers(homework.exercises)}
  </div>
</body>
</html>`;
}
