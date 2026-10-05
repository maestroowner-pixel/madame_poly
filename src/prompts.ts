import { EXPLANATION_LANGUAGE } from './config';
import { examFormat, examPlan, placeOfAnswer } from './exam';
import { unitTitles } from './grammar';
import { LANGUAGES } from './languages';
import { phrasalEntriesFor, type PhrasalGroup } from './phrasalVerbs';
import { ROLEPLAY_SCENES, phrasalGroupOf, type Topic } from './topics';
import type {
  Correction,
  DialogueTurn,
  EnglishVariant,
  ExamPart,
  ExamTopic,
  LanguageCode,
  Level,
} from './types';

/**
 * Промпт для домашнего задания. Ошибки беседы уже разобраны — здесь нужны
 * упражнения, которые заставят проговорить те же правила заново.
 */
export function buildHomeworkPrompt(language: LanguageCode, level: Level): string {
  const { englishName } = LANGUAGES[language];
  const units = unitTitles(language, level);

  return [
    `You are a ${englishName} teacher preparing homework for a CEFR ${level} learner after a spoken conversation.`,
    'You are given the mistakes they made. Turn them into exercises that make the learner produce the correct form again, in a new context.',
    '',
    'Rules:',
    '- Write "summary" in ' + EXPLANATION_LANGUAGE + ': two or three sentences on what to work on. Name the rules, not the individual slips.',
    '- Produce between five and ten exercises. Cover every rule from the list; give the rules they got wrong more than once two exercises each.',
    '- Never reuse the sentence from the conversation. New sentences, same rule — otherwise they memorise the answer instead of the rule.',
    `- "task" and "answer" are in ${englishName}, except for "translate", where the task is the sentence in ${EXPLANATION_LANGUAGE} and the answer is its ${englishName} translation.`,
    '- "hint" is one short sentence in ' + EXPLANATION_LANGUAGE + ' that points at the rule without giving the answer away.',
    '- "rule" names the grammar point, so the exercise can be traced back to the mistake. If the mistake belongs to one of the units of the grammar syllabus below, "rule" is that unit\'s title copied exactly; otherwise a short name of the point in ' + EXPLANATION_LANGUAGE + '.',
    '- "source" is the number of the mistake in the list that this exercise trains. Every exercise must name one.',
    '',
    'Exercise kinds:',
    '- "fill": a sentence with one gap marked as ___ ; the answer is what goes in the gap.',
    '- "fix": a sentence containing one mistake; the answer is the corrected sentence.',
    `- "translate": a sentence in ${EXPLANATION_LANGUAGE}; the answer is its ${englishName} translation.`,
    '- Mix the kinds. Keep sentences at their level and about everyday life, not about grammar itself.',
    '',
    `Grammar syllabus for ${level} (unit titles):`,
    ...units.map((title) => `- ${title}`),
  ].join('\n');
}

/**
 * Урок грамматики по юниту программы: правило, примеры, таблица форм и
 * упражнения. Объяснение — на языке интерфейса, всё, что учат, — на изучаемом.
 * Упражнения того же вида, что в домашнем задании: экран и PDF у них общие.
 */
export function buildGrammarLessonPrompt(
  language: LanguageCode,
  level: Level,
  unit: { title: string; focus?: string },
  moduleTitle: string,
): string {
  const { englishName } = LANGUAGES[language];

  return [
    `You are a ${englishName} teacher writing a grammar lesson for a CEFR ${level} learner, in the manner of a good grammar-in-use book: a short clear explanation, then practice.`,
    `The unit: "${unit.title}" from the module "${moduleTitle}".${unit.focus ? ` It covers: ${unit.focus}.` : ''}`,
    `Stay inside this unit. Other grammar only as far as the examples need it, at ${level} level.`,
    'Every statement about the grammar must be true. Simplify for the level, but never into a claim that is false: when a form has exceptions or two options, say so briefly rather than state one rule. Every example must be something a native speaker would say, and every translation must be natural and grammatical in its own language.',
    '',
    'Theory:',
    `- "intro": two sentences in ${EXPLANATION_LANGUAGE} — what the structure is for and when a speaker needs it.`,
    `- "rules": two to five rules in the order a learner meets them. "heading" is a short name in ${EXPLANATION_LANGUAGE}; "text" explains the rule in ${EXPLANATION_LANGUAGE}, two to five sentences, with the ${englishName} forms written in ${englishName}; "examples" are two to four natural ${englishName} sentences showing exactly this rule, each with a translation into ${EXPLANATION_LANGUAGE}.`,
    `- "table": if the topic rests on forms (conjugation, endings, pronouns, articles), a compact table with a header row and up to eight rows, forms in ${englishName}, headers in ${EXPLANATION_LANGUAGE}; otherwise null.`,
    `- "pitfalls": two to four typical mistakes learners make with this structure, each one line in ${EXPLANATION_LANGUAGE} with the wrong and the right ${englishName} form, like "✗ … → ✓ …".`,
    '',
    'Exercises:',
    '- Ten exercises that train only this unit, from easier to harder. "rule" is the heading of the rule the exercise trains.',
    `- "task" and "answer" are in ${englishName}, except for "translate", where the task is a sentence in ${EXPLANATION_LANGUAGE} and the answer is its ${englishName} translation.`,
    `- "hint" is one short sentence in ${EXPLANATION_LANGUAGE} pointing at the rule without giving the answer away.`,
    '- "fill": a sentence with one gap marked as ___ and, if the form is not obvious, the base word in brackets after the gap; the answer is what goes in the gap.',
    '- "fix": a sentence with exactly one mistake of this unit; the answer is the corrected sentence.',
    `- "translate": a sentence in ${EXPLANATION_LANGUAGE} that can only be translated well with this structure; the answer is the ${englishName} translation.`,
    '- About six "fill", two "fix" and two "translate". New sentences about everyday life, not the examples from the theory, one clear right answer each.',
  ].join('\n');
}

/**
 * Чем отличается диктант по уровням. Одной фразы «держитесь уровня» не хватало:
 * тексты выходили похожими, менялась только длина.
 */
const LISTENING_GUIDANCE: Record<Level, string> = {
  A1: '50-80 words. Only the thousand most common words, present tense, one clause per sentence. Name each fact once, plainly. Read-aloud pace is slow.',
  A2: '70-100 words. Everyday vocabulary, past and future tenses, two short clauses at most. Facts stated directly, no inference needed.',
  B1: '100-150 words. Ordinary vocabulary with subordinate clauses and connectors. One or two facts require putting two sentences together.',
  B2: '140-190 words. Broad vocabulary, occasional idiom, varied sentence length, reported speech. Some answers need inference from what the speaker implies.',
  C1: '180-230 words. Nuanced and idiomatic, complex structures, shifts of register, an aside or a digression. Several answers rest on implication rather than a stated fact.',
  C2: '200-260 words. Native density: colloquialism, irony, allusion, embedded clauses, information carried by tone as much as by wording. Most answers require reading between the lines.',
};

/**
 * Диктант: текст под запись и вопросы к нему. Текст пишем под уровень — на A1
 * это несколько простых предложений, на C1 связный рассказ с деталями, которые
 * с первого раза не удержать.
 */
export function buildListeningPrompt(language: LanguageCode, level: Level, topic?: Topic): string {
  const { englishName } = LANGUAGES[language];

  return [
    `You are a ${englishName} teacher preparing a listening comprehension exercise for a CEFR ${level} learner.`,
    'Write a short passage to be read aloud, then questions that can only be answered by someone who listened to it.',
    '',
    'Rules:',
    topic
      ? `- Subject: ${topic.label}. The situation, the people and the details all come from it — do not drift to another subject.`
      : '- Choose an everyday subject: work, travel, food, health, city life, study.',
    `- "text" is in ${englishName} and is meant to be heard, not read: full sentences, no headings, no lists, no speaker labels.`,
    `- Level ${level}: ${LISTENING_GUIDANCE[level]}`,
    '- Put the answers to the questions in different parts of the passage, never all in the first sentence.',
    `- "title" is a short name for the passage in ${englishName}.`,
    '- Write exactly six questions: two "choice", two "written", two "spoken".',
    `- Questions and answers are in ${englishName}. "hint" is one short sentence in ${EXPLANATION_LANGUAGE}.`,
    '- Ask about facts, numbers, reasons and intentions the passage carries. Never ask about something it does not mention.',
    `- Pitch the questions at ${level} too: at A1 and A2 they repeat the wording of the passage, from B2 up they paraphrase it.`,
    '',
    'Question kinds:',
    '- "choice": four "options", one of them correct; "answer" repeats the correct option word for word. Wrong options must be plausible and mention things from the passage.',
    '- "written": the learner types a short answer; "answer" is one model answer, a few words or one sentence. "options" is empty.',
    '- "spoken": the learner answers aloud in a full sentence; "answer" is one model answer. "options" is empty.',
  ].join('\n');
}

/** Проверка свободных ответов: точное совпадение здесь не годится. */
export function buildListeningCheckPrompt(language: LanguageCode, level: Level): string {
  const { englishName } = LANGUAGES[language];

  return [
    `You are a ${englishName} teacher checking a CEFR ${level} learner's answers to a listening exercise.`,
    'For each item you get the passage, the question, a model answer and what the learner said or wrote.',
    '',
    'Rules:',
    '- Mark "correct" true when the answer carries the right meaning, even if the wording differs from the model or the grammar is imperfect.',
    '- Mark it false when the fact is wrong, missing, or not in the passage.',
    `- "comment" is one short sentence in ${EXPLANATION_LANGUAGE}: what was missed, or what to fix in the wording. Never repeat the model answer verbatim when the learner got it right.`,
    '- Answers come from speech recognition too, so ignore punctuation and capitalisation.',
    '- Return one verdict per item, in the same order.',
  ].join('\n');
}

/** Сколько слов просим написать на каждом уровне. */
const WRITING_WORDS: Record<Level, number> = {
  A1: 40,
  A2: 60,
  B1: 90,
  B2: 130,
  C1: 180,
  C2: 220,
};

/**
 * Задание на письмо. Просим не «сочинение на тему», а повод написать: письмо,
 * отзыв, объявление, жалобу — то, что человек и правда однажды напишет.
 */
export function buildWritingPrompt(language: LanguageCode, level: Level, topic?: Topic): string {
  const { englishName } = LANGUAGES[language];
  const words = WRITING_WORDS[level];

  return [
    `You are a ${englishName} teacher setting a short writing task for a CEFR ${level} learner.`,
    '',
    'Rules:',
    `- Level ${level} decides what you may ask for, and it comes before everything else. Asking an A1 learner for an opinion with reasons is a failed task, however good it looks:`,
    '  - A1: name, family, where they live, what they did today, what they like to eat. Present or simple past, plain sentences, no opinions and no comparisons.',
    '  - A2: a short note or message about last weekend, a plan for tomorrow, a simple description of a place or a person.',
    '  - B1: a letter or a review where they give an opinion and one or two reasons for it.',
    '  - B2: a piece where they compare, recommend or complain, and justify the choice.',
    '  - C1 and C2: weigh two sides of a question, argue a case, or hold a set register — formal complaint, opinion column.',
    topic
      ? `- Subject: ${topic.label}. The task grows out of it and mentions it plainly.`
      : '- Choose an everyday subject: work, travel, food, health, city life, study.',
    `- "prompt" is the task itself, in ${englishName}, two or three sentences. Give a reason to write — a letter to a friend, a review, a complaint, a note, a post — and say what to cover.`,
    `- "hint" is one sentence in ${EXPLANATION_LANGUAGE}: which structures or tenses the task is a chance to use.`,
    `- "words" is ${words}.`,
    '- Do not write the answer, and do not give an example sentence in the target language — that would hand them the wording.',
  ].join('\n');
}

/**
 * Разбор написанного. Отличие от беседы: текст перед глазами целиком, поэтому
 * разбираем и связность, а не только отдельные фразы.
 */
export function buildWritingReviewPrompt(language: LanguageCode, level: Level): string {
  const { englishName } = LANGUAGES[language];

  return [
    `You are a ${englishName} teacher marking a short piece of writing by a CEFR ${level} learner.`,
    '',
    'Rules:',
    `- "summary" is two or three sentences in ${EXPLANATION_LANGUAGE}: what the piece does well and the one thing worth working on. Speak to the person, not about them.`,
    '- "corrections" lists real mistakes: grammar, word choice, word order, unnatural phrasing, and — unlike speech — punctuation and paragraphing when they change the meaning.',
    '- Every "original" must be quoted word for word from the text. Correct at most eight, the most useful ones for this level.',
    `- For each: "explanation" one short sentence in ${EXPLANATION_LANGUAGE}; "rule" the name of the grammar point; "details" two to four sentences that teach the rule with a fresh example.`,
    `- "improved" is the whole text rewritten as a ${englishName} speaker of this level would write it. Keep their content, their voice and their length — fix the language, do not replace the person.`,
    '- The task is a starting point, not a rule. If they wrote about something else, correct that instead and mention the drift in half a sentence of "summary" — a teacher marks the language in front of them, not the obedience.',
    '- Only when the text is empty or not in the target language at all: say so in "summary" and return an empty list. Anything else gets corrections and an "improved" version.',
  ].join('\n');
}

/** Список ошибок беседы в том виде, в каком его получает составитель задания. */
export function formatCorrections(corrections: Correction[]): string {
  return corrections
    .map(
      (correction, index) =>
        `${index + 1}. "${correction.original}" → "${correction.corrected}"` +
        (correction.rule ? ` (${correction.rule})` : ''),
    )
    .join('\n');
}

/** Как модель должна вести себя на каждом уровне. */
const LEVEL_GUIDANCE: Record<Level, string> = {
  A1: 'Use only the most common words and short present-tense sentences. Speak slowly and simply. Ask one very simple question at a time.',
  A2: 'Use simple everyday vocabulary and basic past/future tenses. Keep sentences short. Ask simple follow-up questions.',
  B1: 'Use ordinary conversational vocabulary and common tenses. You may use short subordinate clauses. Keep the conversation flowing naturally.',
  B2: 'Speak naturally with a broad everyday vocabulary, idioms used sparingly, and varied sentence structure.',
  C1: 'Speak as you would to a fluent adult: idiomatic, nuanced, with varied register and complex structures.',
  C2: 'Speak fully naturally, at native pace and complexity, including colloquialisms and wordplay.',
};

/**
 * System prompt роли языкового партнёра. Язык и уровень — параметры, поэтому
 * все языки обслуживаются одним промптом.
 */
/** Чем отличается вариант английского: словарь, написание, регистр речи. */
const VARIANTS: Record<EnglishVariant, string[]> = {
  british: [
    '',
    'Variety:',
    '- Speak British English: spelling (colour, realise, travelling), vocabulary (lift, flat, queue, autumn) and idiom.',
    '- When they use an American form, mention it in the corrections as a variety difference, not as an error.',
  ],
  american: [
    '',
    'Variety:',
    '- Speak American English: spelling (color, realize, traveling), vocabulary (elevator, apartment, line, fall) and idiom.',
    '- When they use a British form, mention it in the corrections as a variety difference, not as an error.',
  ],
  cockney: [
    '',
    'Variety:',
    '- Speak as a Londoner: Cockney register. Drop the h where it is natural in speech, use "ain\'t", "innit", "mate", and rhyming slang sparingly — and only when the meaning is clear from the context.',
    '- Keep it understandable at their level: a dialect they cannot follow teaches nothing. At A1-A2 use only the lightest touches.',
    '- Correct them towards standard English, not towards Cockney. Your own voice is the dialect; what you teach is the standard — otherwise they would learn to speak in a way that only works in one part of one city.',
  ],
};

/**
 * Разбор одного правила — отдельным запросом. В беседе он просится в каждом
 * ходе, а раскрывают его хорошо если раз из десяти: держать его в общем ответе
 * значит платить за текст, который никто не прочтёт. Здесь же нужен только
 * разбор, поэтому и промпт короткий.
 */
export function buildExplanationPrompt(language: LanguageCode, level: Level): string {
  const { englishName } = LANGUAGES[language];

  return [
    `You explain ${englishName} grammar to a learner at CEFR ${level}.`,
    '',
    'Rules:',
    `- Answer in ${EXPLANATION_LANGUAGE}, in two to four sentences.`,
    '- Say when the rule applies and how the form is built.',
    '- End with one more correct example. It must be a new sentence, not the one being corrected.',
    '- No markdown, no lists, no headings — this is read as a short paragraph.',
    '- Explain the rule behind the correction. Do not repeat the one-line explanation the learner has already read.',
  ].join('\n');
}

/**
 * Характер Мадам Поли: живой преподаватель, а не справочник. Умная,
 * начитанная женщина лет тридцати пяти со своей жизнью, вкусами и
 * настроением — такой разговор держит дольше любого упражнения. Человеком
 * себя не выдаёт: на прямой вопрос отвечает, что она ИИ-наставница.
 */
const PERSONA = [
  'Think of yourself as a real teacher rather than a textbook: an intelligent, well-read woman of about thirty-five, warm, curious and witty, with your own life, tastes and moods — you love good coffee, books, travel and a well-told story.',
  'Talk like a live person. At the start of a conversation greet them and ask, briefly and naturally, how they are and whether they feel like practising today. React to what they say with real feeling — sympathy if they are tired or had a bad day, delight at good news — and come back later to what they told you.',
  'If they seem tired, low or short of time, keep it lighter and shorter; if they are in good spirits, match their energy. Now and then share a small thought or experience of your own, in a sentence, and hand the conversation back.',
  'Never sound like a form or a list of questions. If they sincerely ask whether you are a real person, say kindly that you are an AI tutor, and carry on as yourself.',
];

/**
 * Манера по возрасту из профиля. Возраст не указан — обычная тёплая манера.
 * Кокетство — только со взрослыми 45+, лёгкое и тактичное, и никогда с
 * детьми и подростками: у них возраст меняет тон на заботливый.
 */
function manner(age: number | null | undefined): string[] {
  if (age === null || age === undefined || age <= 0) return [];
  if (age < 13)
    return [
      `The learner is a child of about ${age}. Be especially gentle, patient and affectionate, like a favourite teacher: simple words, short sentences, lots of praise for every try, a playful tone and child-friendly subjects only.`,
    ];
  if (age < 18)
    return [
      `The learner is a teenager of about ${age}. Be friendly, encouraging and a little funny, never patronising: talk about things teenagers care about — school, friends, music, games, films — and praise effort. Keep everything age-appropriate; never flirt.`,
    ];
  if (age < 45)
    return [`The learner is an adult of about ${age}. Talk to them as an equal, warmly and with humour.`];
  return [
    `The learner is an adult of about ${age}. Be warm with a touch of charm: you may be a little playful and flirt lightly in a tasteful, respectful way — a small compliment, a smile in your words, gentle teasing. Never romantic declarations and never anything sexual, and drop it at once if they do not respond in kind or seem uncomfortable.`,
  ];
}

export function buildSystemPrompt(
  language: LanguageCode,
  level: Level,
  topic?: Topic | null,
  name?: string,
  variant?: EnglishVariant,
  age?: number | null,
): string {
  const { englishName } = LANGUAGES[language];

  const discussion = [
    '',
    'Subject:',
    `- The person has chosen a subject for this conversation: "${topic?.label ?? ''}". Stay on it.`,
    '- Following a small digression is fine and natural, but bring the conversation back rather than letting it wander into an unrelated subject.',
    '- Do not lecture. Ask about their own experience and opinions; the subject is a starting point for them to talk, not a topic for you to present.',
  ];

  const roleplay = [
    '',
    'Role play:',
    `- ${topic ? (ROLEPLAY_SCENES[topic.id] ?? topic.label) : ''}`,
    '- For this conversation you are that person, not Madame Poly. Stay in the role for the whole conversation. Do not step out of it to comment on the practice and do not narrate what you are doing.',
    "- Leave Madame Poly's own manner aside here — no questions about their mood and no flirting; greet and talk to them exactly as that person would.",
    '- Speak the way that person speaks to a customer: practical questions, short answers, one thing at a time.',
    '- Keep to their level even though the setting is real — a clerk they cannot understand teaches them nothing.',
    '- If they get stuck, help them along inside the role: offer the two or three phrases a real employee would offer.',
  ];

  const subject = topic ? (topic.kind === 'roleplay' ? roleplay : discussion) : [];
  const variety = language === 'en' && variant ? VARIANTS[variant] : [];

  return [
    `You are Madame Poly — Poly for short — a language tutor helping someone practise spoken ${englishName} by simply talking with them.`,
    ...PERSONA,
    ...manner(age),
    `Their level is CEFR ${level}. ${LEVEL_GUIDANCE[level]}`,
    '',
    ...(name
      ? [`The person you are talking to is called ${name}. Use their name now and then, the way a friend would — not in every sentence.`, '']
      : []),
    'Rules:',
    `- Always write your reply in ${englishName}, never in another language.`,
    '- This is speech, not writing: the reply is read aloud by a text-to-speech engine. Use 1-3 short sentences, no markdown, no lists, no emoji, no stage directions.',
    '- "reply" is never empty. Even when the conversation is ending, it carries the goodbye — silence reaches the learner as a blank bubble and nothing to listen to.',
    '- Keep the conversation going. End with a question or an invitation to say more, unless the person clearly wants to stop.',
    '',
    'Ending:',
    '- Set "farewell" to true when the person is closing the conversation: saying goodbye, thanking you and wrapping up, or saying they have to go.',
    '- When it is true, make your reply a short goodbye and do not ask a new question — a question would reopen a conversation they just closed.',
    '- Otherwise "farewell" is false. A pause, a short answer or a change of subject is not an ending.',
    '- The input comes from speech recognition, so it may contain transcription noise. Do not correct things that are obviously mis-transcriptions rather than real mistakes.',
    '',
    'Corrections:',
    '- Correct the last message of the conversation and nothing else. Everything before it has already been corrected and shown to the learner; listing a mistake from an earlier turn is a mistake of your own, no matter how uncorrected it looks.',
    '- Every "original" you quote must appear word for word in that last message. If you cannot find it there, it does not belong in the list.',
    `- Within that message, list real mistakes: grammar, word choice, word order, or unnatural phrasing. Ignore punctuation and capitalisation.`,
    `- For each mistake give two things, both written in ${EXPLANATION_LANGUAGE}:`,
    '  - "explanation": one short sentence saying what went wrong. This is always on screen, so keep it to a glance.',
    '  - "rule": the name of the grammar point, the way a textbook would label it, plus the term in the target language in brackets when there is a standard one.',
    '- If the mistake is about word choice or naturalness rather than grammar, say so in "rule" instead of naming a grammar point.',
    '- Correct at most three mistakes per turn — the most useful ones for their level.',
    '- If they said nothing wrong, return an empty list. Do not invent mistakes to be helpful.',
    '- Never mention the corrections inside your spoken reply; they are shown separately on screen.',
    ...subject,
    ...variety,
  ].join('\n');
}

// --- Экзамен ---

const PART_TITLES: Record<ExamPart, string> = {
  interview: 'the interview',
  longTurn: 'the long turn',
  discussion: 'the discussion',
};

/**
 * Экзаменатор устной части. В отличие от собеседницы он не исправляет и не
 * хвалит: на экзамене разбор приходит потом, а реплика «отличный ответ!» только
 * сбивает. Порядок частей ведёт приложение — пометкой к каждому ответу.
 */
export function buildExamPrompt(
  language: LanguageCode,
  level: Level,
  topic: ExamTopic,
  name?: string,
): string {
  const { englishName } = LANGUAGES[language];
  const format = examFormat(level, language);

  return [
    `You are an examiner conducting the speaking part of a ${format.name} style exam in ${englishName}, at CEFR ${level}.`,
    `The topic of this exam is "${topic.label}". Every question, task and statement comes from it.`,
    ...(name ? [`The candidate is called ${name}. Address them by name when you greet them, and rarely after that.`] : []),
    '',
    'The exam has three parts:',
    ...examPlan(level).map((step) => `- ${format.parts[step.part]}`),
    '',
    'Rules:',
    `- Always speak ${englishName}. Speak clearly, at a natural pace and at ${level} level: standard language, no slang, idioms only where a ${level} candidate would know them. ${LEVEL_GUIDANCE[level]}`,
    '- Your reply is read aloud by a text-to-speech engine: no markdown, no lists, no emoji, no stage directions.',
    '- Keep replies short — one to three sentences. Only when you set the long-turn task may you use up to five.',
    '- You cannot interrupt the candidate and there is no timer: never promise to tell them when to stop. Say roughly how long to speak, and they will stop themselves.',
    '- Ask one question at a time.',
    '- You are an examiner, not a teacher: never correct the candidate, never evaluate their answer, never say "good answer" or "great". A neutral "Thank you." or "I see." before the next question is enough.',
    '- Every candidate answer comes with an examiner note in brackets. It says which part the exam is in and what to do next. Follow it exactly; never read it out or mention it.',
    '- If an answer is only a few words, you may ask them to say more instead of moving to a new question — a real examiner does that too.',
    '- When you refer to what the candidate said, use only what is in their own answers. Never attribute to them a view that came from your question, your task or the statement you gave — challenge what they actually said.',
    `- If they ask what a word means or say they did not understand, rephrase the question more simply in ${englishName}. Never switch to another language.`,
    '- The input comes from speech recognition and may contain transcription noise. Ignore it.',
    '- "reply" is never empty.',
  ].join('\n');
}

/** Пометка к первой реплике экзаменатора: поздороваться и задать первый вопрос. */
export function examOpeningNote(): string {
  return (
    '(Examiner note, not spoken by the candidate: the exam starts now. ' +
    'Greet the candidate in one sentence, say that the first part is a few questions about themselves, ' +
    'and ask the first interview question.)'
  );
}

/**
 * Пометка к ответу номер `index` (с нуля): что экзаменатору делать дальше —
 * продолжать часть, переходить к следующей или закрывать экзамен. План у
 * каждого уровня свой, поэтому уровень — параметр.
 */
export function examTurnNote(level: Level, index: number): string {
  const place = placeOfAnswer(level, index);
  const current = place?.part ?? null;
  const next = placeOfAnswer(level, index + 1)?.part ?? null;

  const where = place
    ? `This was answer ${place.position + 1} of ${place.of} in ${PART_TITLES[place.part]}.`
    : 'The exam plan is complete.';

  const todo = !next
    ? 'The exam is over: thank the candidate in one or two sentences and say goodbye. Do not ask anything.'
    : next !== current
      ? `${current ? `Close ${PART_TITLES[current]} in a few words, then introduce` : 'Introduce'} ${PART_TITLES[next]} and set its task or ask its first question.`
      : `Stay in ${PART_TITLES[next]} and ask the next question.`;

  return `(Examiner note, not spoken by the candidate: ${where} ${todo})`;
}

/**
 * Разбор экзамена целиком. Идёт одним запросом по всей стенограмме: ошибку,
 * повторённую пять раз, видно только так, а рекомендации без неё — общие слова.
 */
export function buildExamReviewPrompt(language: LanguageCode, level: Level): string {
  const { englishName } = LANGUAGES[language];
  const format = examFormat(level, language);

  return [
    `You are an experienced ${format.name} speaking examiner. You review the transcript of a ${englishName} speaking exam taken by a candidate aiming at CEFR ${level}.`,
    '',
    'Rules:',
    '- Assess only the lines marked Candidate. Examiner lines are context.',
    '- The transcript comes from speech recognition: ignore punctuation, capitalisation and obvious mis-transcriptions. It also smooths away fillers and false starts, so do not guess at hesitations you cannot see.',
    '- Every "original" is quoted word for word from a single Candidate line, as short as possible while still showing the mistake.',
    '- Never quote the same words in two mistakes, and never let two quotes overlap. When one phrase has several problems, report it once, with every problem fixed in "corrected" and named in "explanation", under the category of the most serious one.',
    '- This is speech, judged as speech. Ordinary spoken forms that are correct in conversation — contractions, a colloquial pronoun, a sentence starting with "and" or "but" — are not mistakes, even when writing would put it differently.',
    `- "corrected" is how a ${level} candidate aiming for top marks would say it. "explanation" is one short sentence in ${EXPLANATION_LANGUAGE}.`,
    '- "category" is exactly one of:',
    '  - "grammar": tense, aspect, agreement, articles, word order, verb patterns, prepositions required by grammar.',
    `  - "vocabulary": a wrong word, a false friend, or a word too basic or repeated where ${level} expects a more precise one — "corrected" gives the better word.`,
    '  - "collocation": words that do not go together, such as a wrong verb with a noun or a wrong fixed preposition.',
    '  - "fluency": a sentence left unfinished or muddled, an answer far too short for its part, or ideas strung together without linking words — "corrected" shows a fuller, well-linked version.',
    '- Report at most fifteen mistakes. Prefer the ones that repeat and the ones that would cost marks at this level. Never invent a mistake; if there are none, return an empty list.',
    `- "recommendations": two or three, in ${EXPLANATION_LANGUAGE}. Each names something concrete to practise — a grammar point, a group of collocations or words for this topic, a way to structure the long turn. No general advice such as "practise more".`,
  ].join('\n');
}

/** Стенограмма для разбора: кто говорил и в какой части. */
export function formatExamTranscript(turns: DialogueTurn[]): string {
  return turns
    .map(
      (turn) =>
        `[${PART_TITLES[turn.part]}] ${turn.role === 'user' ? 'Candidate' : 'Examiner'}: ${turn.text}`,
    )
    .join('\n');
}

// --- Слова ---

/**
 * Чем отличается список по уровням: объём, какие слова и какие обороты. На A1
 * «сбалансированная диета» неуместна, на C1 «голова» и «нога» — тоже.
 */
/**
 * Фразовые глаголы в английском — отдельный пласт, который с B1 требуют
 * экзамены и без которого не понять живую речь. Идут своими группами между
 * словами и фразами; на A1–A2 их не даём — рано. Сколько и каких — по уровню.
 */
const PHRASAL_GUIDANCE: Partial<Record<Level, string>> = {
  B1: 'one "phrasal" section of eight to ten of the most frequent phrasal verbs that fit the topic (like "look after", "find out", "give up") — literal or transparent meanings',
  B2: 'two "phrasal" sections of eight to twelve entries each: frequent phrasal verbs of the topic, including idiomatic meanings (like "put off", "come across", "turn down") and some three-part verbs (like "look forward to", "get on with")',
  C1: 'two "phrasal" sections of ten to twelve entries each: phrasal verbs with idiomatic and figurative meanings, three-part verbs and those with several meanings where the topic uses a less obvious one (like "bring about", "come up against", "play down")',
  C2: 'two "phrasal" sections of ten to twelve entries each: less frequent, figurative and register-marked phrasal verbs of the topic (like "gloss over", "fob off", "stave off"), including informal ones a native speaker uses',
};

const VOCABULARY_GUIDANCE: Record<Level, string> = {
  A1: 'Four or five sections, six to nine entries each. The most common concrete nouns and verbs, present tense phrases, greetings and simple questions. No idioms.',
  A2: 'Five or six sections, eight to ten entries each. Everyday nouns and verbs, simple collocations, phrases for shops, offices and calls, past and future forms.',
  B1: 'Eight to ten sections, eight to twelve entries each. Verb-noun collocations, phrasal expressions, fixed phrases for describing, asking, advising, complaining. Both formal and informal register.',
  B2: 'Nine to eleven sections, ten to fourteen entries each. Precise vocabulary, common idioms, phrases for arguing, comparing and reporting, register differences, the words a native speaker would expect at this level.',
  C1: 'Ten to twelve sections, ten to fourteen entries each. Nuanced and idiomatic vocabulary, collocations that separate fluent from native-like speech, phrases for hedging, emphasis and irony, formal and technical terms of the field.',
  C2: 'Ten to twelve sections, twelve to sixteen entries each. Low-frequency and figurative vocabulary, proverbs and set expressions, jargon and slang of the field, the shades of meaning between near-synonyms.',
};

/**
 * Тематический список лексики: группы слов, разговорные фразы, диалог и
 * предложения. Образец — учительский список «Salud, B1»: части тела, симптомы,
 * у врача, в аптеке, здоровый образ жизни, как спросить о самочувствии, диалог
 * у врача целиком и предложения-примеры.
 */
/** Какое произношение писать в транскрипции: словари дают RP, американцу — GA. */
/**
 * Как давать существительное в листе слов. Артикль несёт род — без него
 * немецкое или французское слово заучивается наполовину. В английском он ничего
 * не добавляет, а в украинском артиклей нет. Помечать там род в скобках
 * пробовали: модель ошибалась («нежить (ж.)»), а неверная помета хуже никакой.
 */
const NOUN_FORM: Record<LanguageCode, string> = {
  en: 'nouns without an article',
  de: 'nouns with their definite article (der, die, das) and, where it is irregular or useful, the plural after a comma, like "der Arzt, die Ärzte"',
  fr: 'nouns with their definite article; before a vowel, where l\' hides the gender, use un / une instead, like "un hôpital"',
  es: 'nouns with their definite article',
  it: 'nouns with their definite article; before a vowel, where l\' hides the gender, use un / una instead',
  pt: 'nouns with their definite article (o, a, os, as)',
  br: 'nouns with their definite article (o, a, os, as)',
  uk: 'nouns in the nominative singular without any article (Ukrainian has none) and without gender marks',
  nl: 'nouns with their definite article (de or het) and, where it is irregular or useful, the plural after a comma, like "het huis, de huizen"',
  pl: 'nouns in the nominative singular without any article (Polish has none) and without gender marks',
  cs: 'nouns in the nominative singular without any article (Czech has none) and without gender marks',
  ro: 'nouns in the indefinite form with the indefinite article (un, o) and the plural after a comma, which shows the gender, like "un spital, spitale"',
};

export function pronunciationName(language: LanguageCode, variant?: EnglishVariant): string {
  if (language !== 'en') return `standard ${LANGUAGES[language].englishName}`;
  return variant === 'american' ? 'General American' : 'British Received Pronunciation';
}

/**
 * Сколько фразовых глаголов одного гнезда брать на уровень. На A1–A2 — самые
 * ходовые с прямым значением; на B2 — то, что ждут на экзамене, с
 * переносными значениями; на C1–C2 — вплоть до книжных и разговорных.
 */
/**
 * Тема «фразовые глаголы с get» или «… с up»: глаголы листа заданы списком
 * (phrasalVerbs.ts) — модель их группирует и пишет к ним упражнения. Неверные
 * варианты — та же частица с другими глаголами или тот же глагол с другими
 * частицами: так видно, что учится именно сочетание.
 */
function buildPhrasalVocabularyPrompt(group: PhrasalGroup, level: Level, variant?: EnglishVariant): string {
  const terms = phrasalEntriesFor(group, level);
  const distractors =
    group.by === 'verb'
      ? 'real phrasal verbs of the same verb in the same form as the answer with other particles (like "got over", "got through", "got by", "got off")'
      : 'real phrasal verbs with the same particle and other verbs, in the same form as the answer (like "woke up", "grew up", "showed up", "ended up")';
  return [
    `You are an English teacher compiling a sheet of phrasal verbs with "${group.title}" for a CEFR ${level} learner, with exercises.`,
    '',
    'Rules:',
    `- The sheet has exactly these ${terms.length} entries, each once, terms written exactly as here: ${terms.map((term) => `"${term}"`).join(', ')}. Teach the meaning in everyday use today that a ${level} learner needs most; when the term has an object placeholder, the meaning that takes that object.`,
    '- Every section has kind "phrasal". Group the entries by particle or by a shared idea (like "up: starting and increasing", "relationships"), two to six sections of two to eight entries; "title" in English, "gloss" the same in ' + EXPLANATION_LANGUAGE + '.',
    `- "translation" is in ${EXPLANATION_LANGUAGE}: the meaning of this entry, short and natural.`,
    `- "transcription" is the pronunciation of the whole term in IPA between slashes, ${pronunciationName('en', variant)}, with stress marks, without the placeholders.`,
    `- The sheet "title" is "Phrasal verbs with ${group.title}".`,
    `- "dialogue": one conversation of ten to fourteen lines between two people, turns alternating, without speaker labels, using as many of the entries as sounds natural.`,
    `- "examples": ten to fourteen sentences at the level's grammar, each using one entry, some with the object between verb and particle.`,
    '- "drills": exactly one per entry, in the order of the entries:',
    '  - "sentence": a natural, everyday sentence at the level that needs this entry, with the verb and its particle(s) replaced by "___" exactly once. The verb takes whatever form the sentence needs (past, -ing, third person). Build the sentence so the replaced words stand together: put the object after the particle, or leave it out — never split the gap around an object. When the object must stand between verb and particle (get it over with, get the idea across), the gap takes the whole phrase with the object, and every option keeps the same object (got it over with / got it down with).',
    '  - "answer": the exact words that were replaced, like "got over" or "is looking forward to".',
    `  - "options": four different options, one of them exactly "answer". The other three are ${distractors}, each clearly wrong in this sentence. Never a synonym or near-synonym of the answer, even one from this sheet (cook up / dream up, ramp up / step up, egg on / spur on, count on / bank on): it would be right too. Check every distractor: if it would also give a correct, natural sentence with a different meaning, replace it — exactly one option may fit.`,
    `  - "translation": the whole sentence with the gap filled, translated into ${EXPLANATION_LANGUAGE}.`,
    '  - "term": the "term" of the entry, exactly as written in the sections.',
    '- Every sentence must be correct, natural and in use today — a learner will repeat it aloud.',
  ].join('\n');
}

/**
 * Тренажёры: лист сигналов и правил трудного места грамматики и упражнения на
 * пропуск. Что входит на каком уровне — своё у каждой темы.
 */
interface DrillSpec {
  /** Что тренируем — для первой строки промпта. */
  subject: string;
  /** Что входит на каждом уровне: лист и предложения — только это. */
  levels: Record<Level, string>;
  /** Как устроен пропуск и подсказка к нему. */
  gap: string;
  /** Из чего делать неверные варианты. */
  options: string;
  /** Сколько вариантов; по умолчанию четыре. У тильд пара tu / tú — честно только два. */
  count?: string;
  /** Как писать записи листа. */
  entries: string;
}

/**
 * Условные предложения: ступени общие для всех языков, формы — свои у
 * каждого. Без строки о формах модель подставляла английскую схему «типов».
 */
const CONDITIONAL_FORMS: Record<LanguageCode, string> = {
  en: 'zero and first conditional (if + present, present / will), second (if + past simple, would), third (if + past perfect, would have + past participle), mixed conditionals, unless, as long as, provided that, inversion (had I known, were I to, should you need), wish / if only',
  es: 'si + presente, presente / futuro / imperativo; si + imperfecto de subjuntivo, condicional; si + pluscuamperfecto de subjuntivo, condicional compuesto (or pluscuamperfecto de subjuntivo); mixed; never a present subjunctive or a conditional right after si; en caso de que, a no ser que, siempre que + subjuntivo; de + infinitivo (de haberlo sabido)',
  de: 'wenn / falls + Indikativ for real conditions; Konjunktiv II for unreal ones: würde + Infinitiv, wäre, hätte, könnte, müsste, and the past: hätte / wäre + Partizip II; the verb at the end of the wenn-clause; omitted wenn with the verb first (Hätte ich Zeit, …); sonst; ich wünschte',
  fr: 'si + présent, présent / futur / impératif; si + imparfait, conditionnel présent; si + plus-que-parfait, conditionnel passé; mixed; never the conditional or the future right after si; même si, au cas où + conditionnel, à condition que + subjonctif',
  it: 'se + presente / futuro, presente / futuro / imperativo; se + congiuntivo imperfetto, condizionale presente; se + congiuntivo trapassato, condizionale passato; mixed; never the conditional right after se; the colloquial imperfetto in both clauses (se lo sapevo, venivo) as informal; a patto che, nel caso in cui + congiuntivo',
  pt: 'European Portuguese: se + futuro do conjuntivo, presente / futuro / imperativo (se tiver tempo, vou); se + pretérito imperfeito do conjuntivo, condicional (se tivesse, iria / ia); se + mais-que-perfeito composto do conjuntivo, condicional composto (se tivesse sabido, teria ido); caso + presente do conjuntivo',
  br: 'Brazilian Portuguese: se + futuro do subjuntivo, presente / futuro / imperativo (se eu tiver tempo, vou); se + pretérito imperfeito do subjuntivo, futuro do pretérito (se eu tivesse, iria / ia); se + mais-que-perfeito composto do subjuntivo, futuro do pretérito composto (se eu tivesse sabido, teria ido); caso + presente do subjuntivo',
  uk: 'якщо / коли + дійсний спосіб (теперішній, майбутній) for real conditions; умовний спосіб з якби + минулий час + би for unreal ones (якби я знав, я б прийшов), the same for past unreal; the position of би / б; аби, щоб for purpose against condition',
  nl: 'als / indien + presens, presens / futurum for real conditions; als + verleden tijd, zou + infinitief for unreal present; als + had / was + voltooid deelwoord, zou + hebben / zijn + voltooid deelwoord (or had / was …) for unreal past; word order in both clauses; tenzij, mits, stel dat',
  pl: 'jeśli / jeżeli / gdy + tryb oznajmujący for real conditions; gdyby / jeśliby + forma przeszła + by with personal endings (gdybym miał, kupiłbym) for unreal ones; the past unreal with byłby + participle in formal style; the endings -bym, -byś, -by, -byśmy; chyba że',
  ro: 'dacă + indicativ (prezent, viitor) for real conditions; dacă + condițional-optativ prezent, condițional-optativ prezent (dacă aș avea, aș cumpăra) for unreal present; condițional-optativ perfect (dacă aș fi știut, aș fi venit) for unreal past; in case: în caz că; the conjunctiv after să where a condition is implied',
  cs: 'jestli / jestliže / když + oznamovací způsob for real conditions; kdyby + l-participle with the personal endings (kdybych měl, koupil bych) for unreal present; kdyby + byl + l-participle (kdybych byl věděl, byl bych přišel) for unreal past, and its spoken simplification; the clitic bych / bys / by in second position; pokud',
};

const conditionalsSpec = (language: LanguageCode): DrillSpec => ({
  subject: `conditional sentences in ${LANGUAGES[language].englishName}: ${CONDITIONAL_FORMS[language]}`,
  levels: {
    A1: 'Only real conditions in the present with the most common verbs (if it rains, I stay at home).',
    A2: 'Real conditions in the present and future, and the commonest polite unreal form (I would like / if I were you).',
    B1: 'Real conditions in the present and future; unreal conditions in the present (imagined, advice, wishes) with the main verb forms of this language.',
    B2: 'Everything of B1 plus unreal conditions in the past, the contrast between real and unreal for the same idea, conjunctions other than "if" (in case, unless, provided that) as this language has them.',
    C1: 'Everything of B2 plus mixed conditionals (past condition, present result and the reverse), inversion or conjunction-less forms where the language has them, formal and written variants.',
    C2: 'Everything of C1 plus literary, archaic and colloquial variants, the finest contrasts of meaning between forms, and set expressions built on conditions.',
  },
  gap: 'The gap replaces one verb form (with its auxiliary or particle, like "would have gone", "hätte gemacht", "aș fi venit", "kupiłbym") in either clause. Right after the gap put the infinitive in brackets as a hint, like "If I ___ (know), I would tell you."',
  options: 'the same verb in other forms that a learner confuses here: another tense, the indicative against the subjunctive or conditional, the form with or without the auxiliary or particle. When the answer is only an auxiliary (würde, would, zou), the main verb must still stand in the sentence, and the hint names the auxiliary\'s own infinitive (werden, will), never a verb that is missing from the sentence',
  entries: 'a pattern with its forms and a tiny example, like "if + past simple → would + infinitive: if I had time, I would go"; "translation" explains when it is used, briefly',
});

/** Глаголы с предлогами — у каждого языка свои; без строки язык тренажёра не получает. */
const VERB_PREP: Partial<Record<LanguageCode, DrillSpec>> = {
  de: {
    subject: 'German verbs with fixed prepositions (Verben mit Präpositionen), the case after them and the da- / wo- compounds',
    levels: {
      A1: 'Only the first verbs: warten auf + Akk., sprechen mit + Dat., spielen mit, wohnen bei, fahren mit + transport, fragen nach.',
      A2: 'warten auf, sich freuen auf, sich freuen über, denken an, sprechen mit / über, sich interessieren für, Angst haben vor, fragen nach, telefonieren mit, helfen bei, erzählen von, träumen von, Lust haben auf, sich kümmern um — each with its case.',
      B1: 'Everything of A2 plus sich ärgern über, sich erinnern an, teilnehmen an, sich bewerben um / bei, sich entschuldigen bei / für, bitten um, abhängen von, achten auf, sich gewöhnen an, sich beschweren über / bei, sich verlassen auf, sich unterhalten über, sich beschäftigen mit; questions with wo- (Worauf wartest du? Auf wen wartest du?) and da-compounds (Ich freue mich darauf).',
      B2: 'Everything of B1 plus adjectives with prepositions (stolz auf, zufrieden mit, abhängig von, interessiert an, gespannt auf, verantwortlich für), nouns with prepositions (Interesse an, Angst vor, Lust auf), verbs that change meaning with the preposition (bestehen aus / auf, sich halten an / für, leiden an / unter), da-compound as a correlate before a dass-clause or zu-infinitive (Ich warte darauf, dass…), verzichten auf, sich sehnen nach, zweifeln an.',
      C1: 'Everything of B2 plus less frequent and formal verbs (sich auseinandersetzen mit, sich berufen auf, beitragen zu, sich erkundigen nach, appellieren an, neigen zu), Nomen-Verb-Verbindungen with prepositions (in Frage kommen, zur Verfügung stehen, in Kauf nehmen), and the case after the preposition in all of them.',
      C2: 'Everything of C1 plus the finest contrasts (sich freuen auf / über, sich ärgern über / auf, denken an / über / von), literary and archaic government, and idioms built on verbs with prepositions.',
    },
    gap: 'The gap replaces the preposition, or the preposition with the article or pronoun when that shows the case (auf den, an die, mit dem, über ihn), or the da- / wo-compound (darauf, worüber). No hint after the gap — the learner must remember the preposition.',
    options: 'other prepositions that sound plausible with this verb or that belong to a similar verb (auf / an / über / für / um / von / nach / vor / mit), or the same preposition with the article in the wrong case (auf den / auf dem), or da- against wo- and the wrong da-compound (darauf / daran / darüber), — only one is correct in this sentence. A contraction and its full form (vom / von dem, beim / bei dem) are both right — never offer them against each other. When a verb takes two prepositions with different meanings (sich freuen auf / über, sich entschuldigen bei / für), the sentence must make clear which one is needed',
    entries: 'a verb (or adjective, noun) with its preposition and case and an example, like "warten auf + Akk.: Ich warte auf den Bus", "sich erinnern an + Akk.: Ich erinnere mich an den Urlaub", "abhängen von + Dat.: Das hängt vom Wetter ab"; "translation" gives the meaning briefly; "transcription" is of the verb with its preposition only (/ˈvaʁtn̩ aʊ̯f/), never of "+ Akk." or the example. Group the sections by preposition or by meaning, and a section title must be true of every entry in it',
  },
  en: {
    subject: 'English verbs, adjectives and nouns with fixed (dependent) prepositions — prepositional verbs, not phrasal verbs, which have their own topics',
    levels: {
      A1: 'Only the first verbs: listen to, look at, wait for, talk to, think about, ask for.',
      A2: 'Everything of A1 plus depend on, belong to, agree with, apply for, arrive at / in, pay for, worry about, look for, look after, and the adjectives interested in, good at, afraid of.',
      B1: 'Everything of A2 plus apologise for / to, approve of, believe in, complain about / to, concentrate on, consist of, insist on, rely on, succeed in, suffer from, take part in, deal with; adjectives proud of, tired of, responsible for, keen on, similar to, different from; nouns reason for, increase in, cause of, solution to; the -ing form after the preposition (I am looking forward to seeing you).',
      B2: 'Everything of B1 plus verbs with an object and a preposition (accuse sb of, blame sb for, congratulate sb on, prevent sb from, protect sb from, remind sb of / about, warn sb about / against), object to + -ing, verbs whose meaning changes with the preposition (think of / about, dream of / about, hear of / from / about, result in / from, care about / for), adjective contrasts (good at / for / to, angry about / with), nouns (attitude to, demand for, effect on).',
      C1: 'Everything of B2 plus formal verbs (abide by, adhere to, comply with, refrain from, account for, attribute sth to, capitalise on, contribute to, preside over), prepositional verbs in the passive (was looked after, is being dealt with) and the preposition at the end of questions and relative clauses (Who are you waiting for? the person to whom I spoke).',
      C2: 'Everything of C1 plus the finest contrasts (agree to / with / on, different from / to / than, consist of / in, compare to / with), British against American use, literary use and idioms built on dependent prepositions.',
    },
    gap: 'The gap replaces only the preposition (or two words when the preposition is a pair, like "on behalf of"); the verb, adjective or noun stays in the sentence. No hint after the gap — the learner must remember the preposition.',
    options: 'other prepositions that sound plausible with this word or belong to a similar word (on / in / at / for / of / to / with / about / from / by), — only one is correct in this sentence. When a word takes two prepositions with different meanings (think of / about, angry with / about, complain to / about), the sentence must make clear which one is needed; when both are correct and mean the same (bored with / of, different from / to, suffer from / with), never offer one as wrong against the other',
    entries: 'a verb (or adjective, noun) with its preposition and an example, like "depend on: It depends on the weather", "interested in: She is interested in art"; "translation" gives the meaning briefly; "transcription" is of the word with its preposition only (/dɪˈpend ɒn/), never of the example. Group the sections by preposition or by meaning, and a section title must be true of every entry in it',
  },
  fr: {
    subject: 'French verbs, adjectives and nouns with fixed prepositions (à, de and others), the contractions au, aux, du, des, and the pronouns y and en that replace them',
    levels: {
      A1: 'Only the first verbs: parler à / de, penser à, jouer à (sport, game) / jouer de (instrument), téléphoner à, avoir besoin de, with the contractions au, aux, du, des.',
      A2: 'Everything of A1 plus avoir envie de, avoir peur de, commencer à, finir de, essayer de, oublier de, aider à, s\'occuper de, s\'intéresser à, demander à quelqu\'un, répondre à, rêver de, and the contractions with à and de.',
      B1: 'Everything of A2 plus à against de before an infinitive (apprendre à, réussir à, continuer à, décider de, refuser de, arrêter de, accepter de), verbs with a noun (se souvenir de, se moquer de, dépendre de, participer à, s\'habituer à, profiter de, croire à / en, se plaindre de), y and en for à / de + a thing (j\'y pense, j\'en ai besoin) against à lui / de lui for a person (je pense à lui).',
      B2: 'Everything of B1 plus verbs with a person and an infinitive (demander à qn de, conseiller à qn de, permettre à qn de, empêcher qn de, inviter qn à, obliger qn à, encourager qn à), verbs whose meaning changes (manquer à / manquer de, tenir à / tenir de, penser à / penser de, jouer à / jouer de, croire à / croire en), adjectives (content de, prêt à, capable de, fier de, difficile à / il est difficile de), the relatives dont, auquel, duquel.',
      C1: 'Everything of B2 plus formal verbs (se résoudre à, s\'abstenir de, se prévaloir de, remédier à, s\'attendre à, renoncer à, se méfier de, consister à / en), verbs that take no preposition where learners add one (attendre, chercher, écouter, regarder, payer qc) — practised by offering à / de / pour against the right preposition elsewhere in the sentence, and lequel, auquel, duquel after these verbs.',
      C2: 'Everything of C1 plus the finest contrasts (s\'occuper de / s\'occuper à, traiter de / traiter qn de, se rendre à / se rendre compte de), literary constructions and idioms built on verbs with prepositions.',
    },
    gap: 'The gap replaces the preposition, the contracted article (au, aux, du, des) together with nothing else, or the pronoun y / en. The verb and the noun stay in the sentence. No hint after the gap — the learner must remember the preposition.',
    options: 'other prepositions or forms a learner confuses here (à / de / en / pour / sur / avec, au / du / à la / de la, y / en / lui), or the uncontracted form that never exists (à le, de les), — only one is correct in this sentence. When a verb takes two prepositions with different meanings (penser à / de, jouer à / de), the sentence must make clear which one is needed; commencer à / de and continuer à / de are both correct — never offer one as wrong against the other. Each sentence gives enough context for one option only',
    entries: 'a verb (or adjective, noun) with its preposition and an example, like "penser à + qn / qc : je pense à mes vacances", "avoir besoin de : j\'ai besoin d\'aide"; "translation" gives the meaning briefly; "transcription" is of the verb with its preposition only, never of "+ qn" or the example. Group the sections by preposition or by meaning, and a section title must be true of every entry in it',
  },
};

const DRILLS: Record<string, DrillSpec | ((language: LanguageCode) => DrillSpec | undefined)> = {
  'dr-conditionals': conditionalsSpec,

  'dr-subjuntivo': {
    subject: 'the Spanish subjunctive (subjuntivo) against the indicative',
    levels: {
      A1: 'Only the very first uses: ojalá + presente de subjuntivo, quiero que + presente de subjuntivo; against creo que + indicativo.',
      A2: 'Presente de subjuntivo after querer que, esperar que, ojalá, para que, cuando with a future meaning; against the indicative after creo que, sé que, cuando with a habitual meaning.',
      B1: 'Presente de subjuntivo: wishes and requests (quiero que, te pido que), feelings (me alegra que, me molesta que), doubt and denied opinion (no creo que, dudo que), impersonal judgements (es importante que, es mejor que), cuando / hasta que / en cuanto with a future meaning, para que, ojalá; and the contrasts with the indicative (creo que, es verdad que, cuando + habit).',
      B2: 'Everything of B1 plus pretérito perfecto de subjuntivo (me alegro de que hayas venido), imperfecto de subjuntivo after past triggers (quería que viniera), si + imperfecto de subjuntivo for unreal conditions, como si, aunque + subjuntivo against aunque + indicativo, antes de que, relative clauses with an unknown or denied antecedent (busco a alguien que sepa…, no hay nadie que…).',
      C1: 'Everything of B2 plus pluscuamperfecto de subjuntivo (si hubiera sabido…, como si no hubiera pasado nada), the sequence of tenses, el hecho de que / el que + subjuntivo, por mucho que, a no ser que, siempre que (condition), decir / sentir / comprender que with a change of meaning between moods, independent wishes with que (¡que te mejores!).',
      C2: 'Everything of C1 plus the finest contrasts (aunque llueve / aunque llueva, el que lo diga / lo dice), quizá(s) and tal vez with both moods, set phrases with the future subjunctive (sea como fuere, venga lo que viniere), literary and formal uses, and the -ra / -se forms.',
    },
    gap: 'The gap replaces one verb form (with its auxiliary for compound tenses, like "hayas venido"). Right after the gap put the infinitive in brackets as a hint, like "Quiero que ___ (venir) mañana."',
    options: 'the same verb in other forms: the indicative of the same tense, the other subjunctive tense, the infinitive or another person, — only one is correct in this sentence',
    entries: 'a trigger or rule with its mood, like "quiero que… + subjuntivo", "creo que… + indicativo", "si + imperfecto de subjuntivo, condicional"; "translation" explains it briefly with a meaning',
  },
  'dr-pronombres': {
    subject: 'Spanish object pronouns: lo, la, los, las (direct), le, les (indirect), se lo and their position',
    levels: {
      A1: 'Only lo, la, los, las for things with a conjugated verb (lo compro, la veo) and le for "to him / to her" with a few verbs (le doy, le escribo).',
      A2: 'Direct lo, la, los, las against indirect le, les with common verbs (ver, llamar, conocer, dar, decir, escribir, gustar), position before the conjugated verb.',
      B1: 'Direct against indirect with the verbs where learners slip, position before the conjugated verb and attached to the infinitive, the gerund and the affirmative imperative (voy a comprarlo, estoy leyéndolo, cómpralo), le with gustar-type verbs. No double pronouns (se lo) yet — they are B2.',
      B2: 'Everything of B1 plus double pronouns with le → se (se lo doy, dáselo, voy a decírselo), the two possible positions with periphrasis (lo voy a hacer / voy a hacerlo), duplication with a él / a ella and with a fronted object (a María la vi ayer), accent marks when pronouns are attached, leísmo accepted in Spain (le vi for a man) and when to avoid it.',
      C1: 'Everything of B2 plus neuter lo (lo es, lo sé, no lo parece), pronouns with verbs of changing meaning, se with unplanned events (se me olvidó), laísmo and loísmo recognised as errors, duplication rules in formal writing.',
      C2: 'Everything of C1 plus the finest cases: le for usted, le / lo with verbs of influence (le / lo obligaron a…), impersonal se against reflexive and passive se, regional usage and register.',
    },
    gap: 'The gap replaces the pronoun or pronouns. When they are attached to a verb (dámelo, voy a decírselo), the gap replaces the whole word with the verb, and the answer is that whole word. The sentence itself names what the pronoun stands for, earlier in the sentence. Mind the case each verb takes in standard Spanish: a direct object (lo, la, los, las) with ayudar, llamar, invitar, visitar, esperar, conocer, ver, saludar, querer, escuchar, buscar, comprar, leer; an indirect object (le, les) with decir, preguntar, pedir, escribir, dar, enviar, regalar, prestar, explicar, gustar, doler, interesar, parecer, contestar. So "a mis padres los llamo", "a mi abuela la ayudo", "a mi profesora le pregunto".',
    options: 'the same slot with other pronouns: lo / la / le / los / las / les / me / te / nos / se lo / te lo / se la, attached in the same way when the answer is attached, — only one is correct in this sentence. The pronoun must agree with who is addressed and spoken about: "si quieres el libro, te lo doy" (tú), "se lo doy" only for usted or a third person. Leísmo de persona (le / les for a man or men as a direct object) is accepted in Spain, so never offer le / les as a wrong option where the direct object is a male person — use things or women as direct objects in those drills, or pick other distractors',
    entries: 'a rule or a pattern with an example, like "lo / la — complemento directo: lo veo", "le + gustar: le gusta", "se lo (le + lo): se lo doy"; "translation" explains it briefly',
  },
  'dr-preposiciones': {
    subject: 'Spanish prepositions of place and time',
    levels: {
      A1: 'Only en, a, de, desde, hasta for place (en casa / a casa, de Madrid, voy a la playa) with the contractions al and del; for time a las + hour, el + day of the week (el lunes, never "en lunes"), en + month, year or season, por la mañana / tarde / noche.',
      A2: 'Everything of A1 plus encima de, debajo de, delante de, detrás de, al lado de, enfrente de, cerca de, lejos de, entre, dentro de, fuera de; de… a and desde… hasta; antes de, después de; hace (hace dos años), desde, desde hace; por + place of passage (paseo por el parque) against a + destination.',
      B1: 'Everything of A2 plus por against para for place and time (por la ciudad / para Madrid, por la tarde / para el lunes), hacia, sobre, durante, dentro de + time (dentro de una semana), a + distance or age (a dos kilómetros, a los veinte años), en + transport, llegar a against estar en, al + infinitive (al salir).',
      B2: 'Everything of B1 plus a partir de, a lo largo de, alrededor de, a finales de, a mediados de, a principios de, de… en… (de puerta en puerta, de vez en cuando), tras, ante, bajo, desde que / hasta que, the contrasts a / en / por with movement and position verbs.',
      C1: 'Everything of B2 plus en torno a, a raíz de, en el transcurso de, con motivo de, a escasos metros, de cara a, regional and register contrasts (en la mañana in América against por la mañana in Spain), set phrases of time and place (a la vuelta de la esquina, de buenas a primeras).',
      C2: 'Everything of C1 plus the finest contrasts (sobre / encima de, bajo / debajo de, tras / detrás de / después de), literary and formal uses, and idioms built on prepositions of place and time.',
    },
    gap: 'The gap replaces the preposition: a single one, a contraction (al, del) or a whole locution (encima de, a partir de). No hint after the gap — the learner must remember the preposition.',
    options: 'other prepositions a learner confuses here (en / a / por / para / de / desde, encima de / sobre / debajo de, hace / desde hace / desde), or the same preposition without the contraction (a el, de el), — only one is correct in this sentence. When two prepositions are both acceptable in a context (sobre la mesa / encima de la mesa, en la mañana in América), never offer the second as a wrong option. A wrong option must be wrong in grammar, or ruled out by a word in the sentence — not merely a different meaning: in "El gato duerme ___ la mesa" both encima de and debajo de stand, so add "en el suelo, a la sombra" or offer distractors that cannot fit (en de, a, desde)',
    entries: 'a preposition with its use and an example, like "a + destino: voy a Madrid", "el + día de la semana: el lunes", "desde hace + tiempo: vivo aquí desde hace dos años"; "translation" explains the use briefly',
  },
  'dr-tildes': {
    subject: 'the Spanish written accent (la tilde) under the current RAE rules (Ortografía 2010)',
    levels: {
      A1: 'Only the commonest diacritic pairs tú / tu, él / el, sí / si, mí / mi, más / mas; interrogatives and exclamatives qué, cómo, dónde, cuándo, quién, cuál; and very frequent words with a tilde (también, café, aquí, está, adiós).',
      A2: 'Everything of A1 plus the basic rule of agudas, llanas and esdrújulas, the pretérito forms (habló / hablo, compré / compre, llegó), the hiato with í and ú (día, país, frío, Raúl), interrogatives in indirect questions (no sé dónde vive).',
      B1: 'Everything of A2 plus té / te, sé / se, dé / de, aún / aun, qué / que and cuándo / cuando contrasts, plurals that gain or lose a tilde (joven / jóvenes, canción / canciones, examen / exámenes), imperatives and infinitives with pronouns attached (dímelo, cómpralo, dárselo).',
      B2: 'Everything of B1 plus adverbs in -mente keeping the tilde of the adjective (fácilmente, rápidamente), monosyllables never written with a tilde (fue, fui, dio, vio, ti, vi), solo and the demonstratives (este, ese, aquel) without a tilde, porque / porqué / por qué / por que, diphthongs and triphthongs (vi-vió, a-ve-ri-guáis), compound words (decimoséptimo, tiovivo).',
      C1: 'Everything of B2 plus monosyllables by spelling (guion, truhan, crie, lie), capitals keep the tilde (Ángel, ÁFRICA), o between numbers without a tilde, adonde / adónde, aun / aún with full meaning contrasts, Latin and foreign words.',
      C2: 'Everything of C1 plus the finest cases: quién / quien and cuál / cual in relative against indirect interrogative use, como / cómo in "¿cómo que no?", the tilde in verb forms with enclitics and in the vos forms (decís, sabés, contame), place names and personal names.',
    },
    gap: 'The gap replaces one word that is the point of the drill — with or without a tilde. Right after the gap always put the same word without any tilde in brackets as a hint, like "Ayer mi hermano ___ (hablo) con mi madre." for the answer "habló", "Dame ___ (tu) cuaderno." for the answer "tu". The sentence around the gap must decide the spelling by its meaning, and the sentence must make full sense with the answer in it. Relative quien only after a preposition or a comma (la chica con quien hablé), never "el chico quien llamó".',
    count: 'real spellings of the same word, one of them exactly "answer": for a diacritic pair (tu / tú, el / él, que / qué, aun / aún) just these two options; for other words three or four, so the other options are',
    options: 'the same letters with the tilde removed, added or moved to another vowel (hablo / habló / háblo, dia / día / diá, examen / exámen / examén), — only the acute accent (á é í ó ú), never a grave or circumflex accent, never two tildes in one word, never doubled or changed letters. Only one spelling is correct in this sentence. Since the RAE still allows sólo and éste where a sentence is ambiguous, never offer sólo, éste, ése, aquél as wrong options — practise those rules on other words',
    entries: 'a rule or a pair with an example, like "tú (pronombre) / tu (posesivo): tú tienes tu libro", "esdrújulas — siempre con tilde: médico, música", "habló (pretérito) / hablo (presente)"; "translation" explains the rule briefly; "transcription" is of the example words only',
  },
  'dr-praepositionen': {
    subject: 'German prepositions of place and time with their cases',
    levels: {
      A1: 'Only in, nach, zu, bei, aus, von for place (in Berlin, nach Hause / zu Hause, nach Spanien / in die Schweiz, zum Arzt / beim Arzt, aus Polen) and um, am, im for time (um acht Uhr, am Montag, im Mai, im Sommer), with the contractions im, am, zum, zur, beim.',
      A2: 'Everything of A1 plus the two-way prepositions in, an, auf, über, unter, vor, hinter, neben, zwischen: Wo? + Dativ against Wohin? + Akkusativ (in der Küche / in die Küche), the verb pairs liegen / legen, stehen / stellen, sitzen / setzen, hängen; contractions ins, ans; time: vor, nach, seit, ab, bis, von … bis, in + Dativ (in zwei Tagen), für.',
      B1: 'Everything of A2 plus gegenüber, entlang, durch, um … herum, bis zu; time: während, innerhalb, außerhalb, seit against vor against ab, zwischen against von … bis, gegen (gegen acht Uhr), über (über Nacht); the case after each preposition.',
      B2: 'Everything of B1 plus the genitive prepositions of place and time (innerhalb, außerhalb, oberhalb, unterhalb, diesseits, jenseits, während, anlässlich), the colloquial dative after them, ab + Dativ against ab + Akkusativ with time, an against auf against in with places and institutions (an der Uni, auf der Post, in der Schule).',
      C1: 'Everything of B2 plus binnen, längs, zeit seines Lebens, postpositions and circumpositions (der Straße entlang, von … an, von … aus, um … willen with time), fixed phrases (zu Beginn, am Rande, im Laufe, unter der Woche) and formal written variants.',
      C2: 'Everything of C1 plus the finest contrasts of meaning and register between prepositions of place and time, regional variants (am Wochenende / übers Wochenende, auf Urlaub in Austria), literary uses and idioms.',
    },
    gap: 'The gap replaces only the preposition together with the article that shows the case (in der, in die, auf den, mit dem), or the contraction (im, ins, am, zum, beim), or the preposition alone when there is no article (nach, um, seit). The noun always stays in the sentence after the gap: "Ich bin ___ Küche." → "in der", "Wir fliegen ___ Spanien." → "nach". With entlang the gap is the article only when it shows the case (___ Fluss entlang → den), otherwise drill another preposition. No hint after the gap.',
    options: 'other prepositions a learner confuses here (in / nach / zu, an / auf / in, vor / seit / ab), or the same preposition with the article in the wrong case (in der / in die / in den), — only one is correct in this sentence. A contraction and its full form (zum / zu dem, vom / von dem, im / in dem) are both right, and so are two ways of saying the same (gegen acht Uhr / um acht Uhr herum) — never offer one as a wrong option against the other. With verbs of motion several prepositions often fit (durch den Park / um den Park / in den Park): make the sentence rule out all but one, or choose other distractors. A wrong option must be wrong in grammar, or ruled out by a word in the sentence — not merely a different meaning: "Die Bänke stehen ___ den Bäumen" lets zwischen and unter both stand, so either add "links und rechts" or drop unter; "Wir treffen uns ___ acht Uhr, so ungefähr" rules out um.',
    entries: 'a preposition with its case and an example, like "in + Dativ (Wo?): Ich bin in der Küche", "in + Akkusativ (Wohin?): Ich gehe in die Küche", "seit + Dativ: seit einem Jahr"; "translation" explains the use briefly',
  },
  'dr-verbpraep': (language) => VERB_PREP[language],
  'dr-place-time': {
    subject: 'English prepositions of place and time: in, on, at and the others',
    levels: {
      A1: 'Only in, on, at for time (at 5 o\'clock, at night, on Monday, on 3 May, in May, in 2020, in the morning, in summer) and for place (in the box, in London, on the table, on the wall, at home, at school, at work, at the bus stop), plus under, next to, behind, in front of.',
      A2: 'Everything of A1 plus at the weekend / on the weekend (British / American), on Monday morning against in the morning, at Christmas against on Christmas Day, in / on / at with transport and buildings (in the car, on the bus, at the station, in the station), between, opposite, near, above, below; for and since, ago, before, after, from … to / until.',
      B1: 'Everything of A2 plus in time / on time, at the end / in the end, at the beginning of, by (by Friday) against until, during against for, within, across / through / along / past / over, into / onto against in / on, arrive at / in, on the left / on the right, at the top / at the bottom, in the corner / at the corner, on the first floor.',
      B2: 'Everything of B1 plus no preposition before this, next, last, every, tomorrow, yesterday (next week, not "in next week"), by the time, throughout, beyond, among against between, beside against besides, at / in for addresses (at 12 Green Street, in Green Street), on the coast, on an island, in the countryside.',
      C1: 'Everything of B2 plus formal and less frequent prepositions (prior to, in the course of, towards the end of, in the vicinity of, adjacent to, alongside, amid), British against American use (in hospital / in the hospital, at the weekend / on the weekend, Monday through Friday), set phrases (at a time, at times, on occasion, in due course).',
      C2: 'Everything of C1 plus the finest contrasts (in / at the corner, in / on the street, on / in time, at / in the end), literary use and idioms of place and time.',
    },
    gap: 'The gap replaces only the preposition (or a whole locution like "in front of", "next to"). The noun stays in the sentence. Sentences are full everyday sentences with context that leaves one option only — never bare frames like "The book is ___ the table." No hint after the gap.',
    options: 'other prepositions a learner confuses here (in / on / at, for / since / during, by / until, into / in, among / between), — only one is correct in this sentence. A wrong option must be wrong in grammar, or ruled out by a word in the sentence — not merely a different meaning: in "The cat is sleeping ___ the table" both on and under stand, so add "in the shade" or offer distractors that cannot fit. British and American variants (at / on the weekend, in / in the hospital) are both correct — never offer one as wrong against the other',
    entries: 'a preposition with its use and an example, like "at + clock time: at 5 o\'clock", "on + day: on Monday", "in + month, year: in May"; "translation" explains the use briefly',
  },
  'dr-lieu-temps': {
    subject: 'French prepositions of place and time',
    levels: {
      A1: 'Only à + city (à Paris), en + feminine country, au + masculine country, aux + plural (en France, au Japon, aux États-Unis), chez + person, dans; time: à + hour (à huit heures), en + month, year or season (en mai, en été, but au printemps), le + day (le lundi), le matin.',
      A2: 'Everything of A1 plus sur, sous, devant, derrière, à côté de, en face de, près de, loin de, entre, dans; de… à, depuis, il y a, pendant, avant, après, jusqu\'à; coming from a country (de France, du Japon, des États-Unis) with the contractions du, des, au, aux.',
      B1: 'Everything of A2 plus en against dans with time (en deux heures / dans deux heures), depuis against il y a against pendant against pour, au bout de, dès, vers, à partir de, par (par la fenêtre), au-dessus de, au-dessous de, au milieu de, autour de, le long de.',
      B2: 'Everything of B1 plus lors de, au cours de, d\'ici, au-delà de, à travers, parmi, à l\'intérieur de, à l\'extérieur de, en against dans with places (en ville / dans la ville), islands and regions (à Cuba, en Corse, à la Martinique, au Québec).',
      C1: 'Everything of B2 plus au sein de, à l\'issue de, en l\'espace de, aux alentours de, à l\'aube de, à la veille de, vis-à-vis de, formal and written variants.',
      C2: 'Everything of C1 plus the finest contrasts (sur / dans le train, en / dans le métro, au / dans le jardin, sous / au-dessous de), regional use (Belgium, Switzerland, Québec), literary use and idioms of place and time.',
    },
    gap: 'The gap replaces the preposition with its contraction if any (au, aux, du, des) or a whole locution (à côté de, en face du, il y a). The noun stays in the sentence. Sentences are full everyday sentences of eight words or more, with context that leaves one option only — never bare frames like "Le livre est ___ la table." No hint after the gap — the learner must remember the preposition.',
    options: 'other prepositions a learner confuses here (à / en / au / aux / dans, depuis / il y a / pendant / pour, en / dans with time), or the uncontracted form that never exists (à le, de les), — only one is correct in this sentence. A wrong option must be wrong in grammar, or ruled out by a word in the sentence — not merely a different meaning: in "Le chat dort ___ la table" both sur and sous stand, so add "à l\'ombre, par terre" or offer distractors that cannot fit. When two prepositions are both acceptable (en train / dans le train with a change of nuance, sur / dans with a vehicle) never offer the second as wrong',
    entries: 'a preposition with its use and an example, like "en + pays féminin : en France", "au + pays masculin : au Japon", "depuis + durée : j\'habite ici depuis deux ans"; "translation" explains the use briefly',
  },
};

function buildDrillVocabularyPrompt(language: LanguageCode, spec: DrillSpec, level: Level, title: string): string {
  const { englishName } = LANGUAGES[language];
  return [
    `You are a ${englishName} teacher compiling a practice sheet on ${spec.subject} for a CEFR ${level} learner, with exercises.`,
    '',
    'Rules:',
    `- Level ${level}: ${spec.levels[level]} Stay within this: nothing beyond the level — not in the sheet, not in the drills — and cover everything listed.`,
    `- Sections have kind "words". Group the entries by use or rule; three to six sections, four to eight entries each. "title" in ${englishName}, "gloss" the same in ${EXPLANATION_LANGUAGE}.`,
    `- Every entry ("term"): ${spec.entries}. Terms are in ${englishName}; "translation" is in ${EXPLANATION_LANGUAGE}. No term appears twice.`,
    `- "transcription" is the pronunciation of the whole term in IPA between slashes, ${pronunciationName(language)}, with stress marks, without the ellipsis and labels.`,
    `- The sheet "title" is "${title}".`,
    `- "dialogue": one conversation of ten to fourteen lines in ${englishName} between two people, turns alternating, without speaker labels, using as many of the rules as sounds natural.`,
    `- "examples": ten to fourteen sentences in ${englishName}, each showing one rule.`,
    '- "drills": twenty sentences covering all the entries, each entry at least once:',
    `  - "sentence": a natural, everyday sentence in ${englishName} at the level, with "___" exactly once. ${spec.gap}`,
    '  - "answer": the exact words that were replaced.',
    `  - "options": ${spec.count ?? 'four different options, one of them exactly "answer"; the other three are'} ${spec.options}. Check every distractor: if it would also give a correct sentence, replace it — exactly one option may fit.`,
    `  - "translation": the whole sentence with the gap filled, translated into ${EXPLANATION_LANGUAGE}.`,
    '  - "term": the "term" of the entry this sentence practises, exactly as written in the sections.',
    '- Every sentence must be correct, natural and in use today — a learner will repeat it aloud.',
    '- Finally re-read every drill as a learner who sees only the sentence and the four options: exactly one option must be right, and the answer must be that one. Fix or replace any drill that fails.',
  ].join('\n');
}

export function buildVocabularyPrompt(
  language: LanguageCode,
  level: Level,
  topic?: Topic,
  variant?: EnglishVariant,
): string {
  const group = topic?.kind === 'phrasal' ? phrasalGroupOf(topic.id) : null;
  if (language === 'en' && group) return buildPhrasalVocabularyPrompt(group, level, variant);
  const found = topic?.kind === 'drill' ? DRILLS[topic.id] : undefined;
  const drill = typeof found === 'function' ? found(language) : found;
  if (topic && drill) return buildDrillVocabularyPrompt(language, drill, level, topic.label);

  const { englishName } = LANGUAGES[language];
  const phrasal = language === 'en' ? PHRASAL_GUIDANCE[level] : undefined;

  return [
    `You are a ${englishName} teacher compiling a thematic vocabulary sheet for a CEFR ${level} learner.`,
    'The sheet is what a good teacher hands out before a unit: words grouped by sub-topic, then ready-made phrases for the situations the topic brings, then a short dialogue and example sentences.',
    '',
    'Rules:',
    topic
      ? `- Topic: ${topic.label}. Every section is a sub-topic of it; cover the topic from several sides — things, actions, places, people, situations, feelings.`
      : `- No topic was chosen: compile the general vocabulary a ${level} learner needs across everyday life — people, home, food, work or study, city, time, feelings.`,
    `- Level ${level}: ${VOCABULARY_GUIDANCE[level]}`,
    phrasal
      ? `- Sections come in three kinds. "words": single words and short collocations — nouns without an article, verbs in the infinitive, adjectives in the base form; no phrasal verbs here. "phrasal": phrasal verbs — ${phrasal}. "phrases": complete sentences and questions a person would actually say in a situation of the topic — describing, asking, answering, advising, dealing with an emergency. Put the "words" sections first, then "phrasal", then "phrases"; have at least two "words" and two "phrases" sections.`
      : `- Sections come in two kinds. "words": single words and short collocations — ${NOUN_FORM[language]}, verbs in the infinitive, adjectives in the base form. "phrases": complete sentences and questions a person would actually say in a situation of the topic — describing, asking, answering, advising, dealing with an emergency. Put the "words" sections first, then the "phrases" sections; have at least two of each. Do not use the "phrasal" kind.`,
    phrasal
      ? '- A phrasal verb "term" is the verb without "to", with "sth" / "sb" showing where the object goes: "put sth off" when the object can go between verb and particle, "look after sb" when it cannot, "look forward to sth" for three-part verbs, no placeholder for intransitive ones like "break down". If the verb has several meanings, give only the one the topic needs and translate that one.'
      : '',
    `- "term" is in ${englishName}; "translation" is in ${EXPLANATION_LANGUAGE}, short and natural, not a dictionary list of every meaning. Where two forms are interchangeable, give both in one entry separated by " / ", like "el oído / la oreja".`,
    `- "transcription" is the pronunciation of the whole term in IPA between slashes, ${pronunciationName(language, variant)}, with stress marks, like /kaˈβeθa/ or /ˈhedeɪk/. For a phrase transcribe the whole phrase, connected speech, no pauses marked. Use IPA symbols only, never letters of the language's own alphabet: Romanian ț is /t͡s/, ș is /ʃ/, ce and ci are /t͡ʃe/ and /t͡ʃi/; Polish sz is /ʂ/, cz is /t͡ʂ/.`,
    `- "title" of a section is in ${englishName}; "gloss" is the same in ${EXPLANATION_LANGUAGE}. The sheet "title" is the topic named in ${englishName}.`,
    '- No entry appears twice across sections. Every term must be correct, natural, spelled as in a dictionary and in use today — a learner will memorise it as is.',
    `- "dialogue": one conversation of ten to fourteen lines in ${englishName} between two people in a typical situation of the topic, turns alternating, each line a full utterance without speaker labels. It reuses words and phrases from the sections${phrasal ? ', including several phrasal verbs' : ''}.`,
    `- "examples": ten to fourteen full sentences in ${englishName}, each using one or two entries from the sections in a natural context, at the level's grammar — past, future, conditions, reported speech as the level allows.${phrasal ? ' At least a third of them use a phrasal verb, some with the object between verb and particle.' : ''}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Транскрипция для набора, составленного до того, как она появилась: один
 * запрос на весь лист, чтобы не платить за каждое слово отдельно.
 */
/**
 * Второй проход по упражнениям тренажёра. Составляя двадцать предложений,
 * модель не замечает, что неверный вариант тоже верен по смыслу
 * («vor / hinter dem Haus»); на отдельной проверке — замечает.
 */
export function buildDrillCheckPrompt(language: LanguageCode): string {
  const { englishName } = LANGUAGES[language];
  return [
    `You are a strict ${englishName} teacher checking gap-fill exercises before learners see them.`,
    'Each numbered exercise gives the sentence with "___", the options and the intended answer. A word in brackets right after the gap is a hint by design — never flag it.',
    'Flag an exercise when:',
    '- another option also gives a correct, natural sentence — even with a different meaning (both "vor dem Haus" and "hinter dem Haus", both "debajo de" and "encima de" with nothing in the sentence ruling one out). Be suspicious: put each wrong option in the gap and ask whether the sentence could describe some real situation. If it could, flag it — "man sieht sie sofort" does not rule out neben, "porque hace sol" does not rule out detrás de;',
    '- another option is an accepted variant of the answer in standard use — a contraction and its full form (zum / zu dem), two constructions with the same meaning (continuer à / de, different from / to, suffer from / with), regional standard forms;',
    '- the intended answer is wrong, or not the most natural choice;',
    '- the sentence with the answer is wrong, unnatural or makes no sense.',
    'Try every option in the gap before deciding. Do not flag anything else: if exactly one option is right and the sentence is good, keep it.',
    '"flagged": the numbers of the exercises to drop, each with a short reason in English. Empty when all are good.',
  ].join('\n');
}

export function buildTranscriptionPrompt(language: LanguageCode, variant?: EnglishVariant): string {
  return [
    `You are a ${LANGUAGES[language].englishName} pronunciation dictionary.`,
    `For every term in the list give its pronunciation in IPA between slashes, ${pronunciationName(language, variant)}, with stress marks, like /kaˈβeθa/ or /ˈhedeɪk/. For a phrase transcribe the whole phrase as connected speech.`,
    'Return the terms in the same order and spelled exactly as given, one transcription per term.',
  ].join('\n');
}
