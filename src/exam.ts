import { locale, type UiLocale } from './i18n';
import type { ExamPart, ExamTopic, LanguageCode, Level } from './types';

/**
 * Всё, чем экзамен на одном языке и уровне отличается от другого, — здесь:
 * названия тем, на какой экзамен похож формат, как в нём звучит каждая часть и
 * сколько ответов она занимает. Логика частей, промпты и экраны от языка и
 * уровня не зависят — новый язык, уровень или тема добавляются в этом файле.
 */

/** Уровни, для которых описан формат экзамена. */
export type ExamLevel = 'B1' | 'B2';

export const EXAM_LEVELS: ExamLevel[] = ['B1', 'B2'];

/**
 * Украинский как иностранный учат одним сквозным курсом, без ступеней (см.
 * src/grammar/uk.ts), и экзамен у него один — без переключателя B1/B2. Уровень
 * для сложности вопросов и строгости разбора берётся из настроек беседы и на
 * экране не показывается.
 */
export function examHasLevels(language: LanguageCode): boolean {
  // Celpe-Bras тоже один: уровень (Intermediário … Avançado Superior) он
  // ставит по результату, отдельных экзаменов B1 и B2 у него нет.
  return language !== 'uk' && language !== 'br';
}

/**
 * С какого уровня экзамена начать, пока человек не выбрал сам: ближайший к его
 * уровню в беседе. На A2 честнее начинать с B1, на C1 — с B2.
 */
export function defaultExamLevel(level: Level): ExamLevel {
  return level === 'A1' || level === 'A2' || level === 'B1' ? 'B1' : 'B2';
}

/** Уровень сессии из истории — на случай, если сохранён какой-то другой. */
function asExamLevel(level: Level): ExamLevel {
  return level === 'B1' ? 'B1' : 'B2';
}

/**
 * Типовые темы устной части. Одни на оба уровня: на B1 о работе и экологии тоже
 * спрашивают — меняются глубина вопросов и форма монолога, а не сами темы.
 * Порядок — как в списке на экране.
 */
export const EXAM_TOPIC_IDS = [
  'work',
  'environment',
  'technology',
  'education',
  'health',
  'travel',
  'culture',
] as const;

type ExamTopicId = (typeof EXAM_TOPIC_IDS)[number];

/** Названия на изучаемом языке — экзаменатор получает тему в них. */
const LABELS: Record<LanguageCode, Record<ExamTopicId, string>> = {
  en: {
    work: 'Work and careers',
    environment: 'The environment',
    technology: 'Technology',
    education: 'Education',
    health: 'Health and lifestyle',
    travel: 'Travel and tourism',
    culture: 'Culture and the arts',
  },
  de: {
    work: 'Arbeit und Beruf',
    environment: 'Umwelt',
    technology: 'Technik und Digitalisierung',
    education: 'Bildung',
    health: 'Gesundheit und Lebensstil',
    travel: 'Reisen und Tourismus',
    culture: 'Kultur und Kunst',
  },
  fr: {
    work: 'Le travail et la carrière',
    environment: "L'environnement",
    technology: 'Les nouvelles technologies',
    education: "L'éducation",
    health: 'La santé et le mode de vie',
    travel: 'Les voyages et le tourisme',
    culture: 'La culture et les arts',
  },
  es: {
    work: 'El trabajo y la carrera profesional',
    environment: 'El medio ambiente',
    technology: 'La tecnología',
    education: 'La educación',
    health: 'La salud y el estilo de vida',
    travel: 'Los viajes y el turismo',
    culture: 'La cultura y las artes',
  },
  it: {
    work: 'Il lavoro e la carriera',
    environment: "L'ambiente",
    technology: 'La tecnologia',
    education: "L'istruzione",
    health: 'La salute e lo stile di vita',
    travel: 'I viaggi e il turismo',
    culture: 'La cultura e le arti',
  },
  pt: {
    work: 'O trabalho e a carreira',
    environment: 'O ambiente',
    technology: 'A tecnologia',
    education: 'A educação',
    health: 'A saúde e o estilo de vida',
    travel: 'As viagens e o turismo',
    culture: 'A cultura e as artes',
  },
  uk: {
    work: 'Робота та кар’єра',
    environment: 'Довкілля',
    technology: 'Технології',
    education: 'Освіта',
    health: 'Здоров’я та спосіб життя',
    travel: 'Подорожі та туризм',
    culture: 'Культура та мистецтво',
  },
  br: {
    work: 'O trabalho e a carreira',
    environment: 'O meio ambiente',
    technology: 'A tecnologia',
    education: 'A educação',
    health: 'A saúde e o estilo de vida',
    travel: 'As viagens e o turismo',
    culture: 'A cultura e as artes',
  },
  nl: {
    work: 'Werk en carrière',
    environment: 'Het milieu',
    technology: 'Technologie',
    education: 'Onderwijs',
    health: 'Gezondheid en leefstijl',
    travel: 'Reizen en toerisme',
    culture: 'Cultuur en kunst',
  },
  pl: {
    work: 'Praca i kariera',
    environment: 'Środowisko',
    technology: 'Technologia',
    education: 'Edukacja',
    health: 'Zdrowie i styl życia',
    travel: 'Podróże i turystyka',
    culture: 'Kultura i sztuka',
  },
  ro: {
    work: 'Munca și cariera',
    environment: 'Mediul înconjurător',
    technology: 'Tehnologia',
    education: 'Educația',
    health: 'Sănătatea și stilul de viață',
    travel: 'Călătoriile și turismul',
    culture: 'Cultura și arta',
  },
};

/** Названия на языке интерфейса — под названием темы в списке. */
const GLOSSES: Record<ExamTopicId, Record<UiLocale, string>> = {
  work: { en: 'Work and careers', uk: 'Робота та кар’єра', es: 'Trabajo y carrera', ru: 'Работа и карьера', de: 'Arbeit und Beruf', fr: 'Le travail et la carrière' , pt: 'O trabalho e a carreira' , zh: '工作与职业', ja: '仕事とキャリア', ko: '일과 직업' , nl: 'Werk en carrière', pl: 'Praca i kariera', ro: 'Munca și cariera' },
  environment: { en: 'The environment', uk: 'Довкілля', es: 'Medio ambiente', ru: 'Экология', de: 'Umwelt', fr: 'L\'environnement' , pt: 'O meio ambiente' , zh: '环境', ja: '環境', ko: '환경' , nl: 'Het milieu', pl: 'Środowisko', ro: 'Mediul înconjurător' },
  technology: { en: 'Technology', uk: 'Технології', es: 'Tecnología', ru: 'Технологии', de: 'Technik und Digitalisierung', fr: 'Les nouvelles technologies' , pt: 'A tecnologia' , zh: '科技', ja: 'テクノロジー', ko: '기술' , nl: 'Technologie', pl: 'Technologia', ro: 'Tehnologia' },
  education: { en: 'Education', uk: 'Освіта', es: 'Educación', ru: 'Образование', de: 'Bildung', fr: 'L\'éducation' , pt: 'A educação' , zh: '教育', ja: '教育', ko: '교육' , nl: 'Onderwijs', pl: 'Edukacja', ro: 'Educația' },
  health: { en: 'Health and lifestyle', uk: 'Здоров’я та спосіб життя', es: 'Salud y estilo de vida', ru: 'Здоровье и образ жизни', de: 'Gesundheit und Lebensstil', fr: 'La santé et le mode de vie' , pt: 'A saúde e o estilo de vida' , zh: '健康与生活方式', ja: '健康とライフスタイル', ko: '건강과 생활 방식' , nl: 'Gezondheid en leefstijl', pl: 'Zdrowie i styl życia', ro: 'Sănătatea și stilul de viață' },
  travel: { en: 'Travel and tourism', uk: 'Подорожі та туризм', es: 'Viajes y turismo', ru: 'Путешествия и туризм', de: 'Reisen und Tourismus', fr: 'Les voyages et le tourisme' , pt: 'As viagens e o turismo' , zh: '旅行与旅游', ja: '旅行と観光', ko: '여행과 관광' , nl: 'Reizen en toerisme', pl: 'Podróże i turystyka', ro: 'Călătoriile și turismul' },
  culture: { en: 'Culture and the arts', uk: 'Культура та мистецтво', es: 'Cultura y artes', ru: 'Культура и искусство', de: 'Kultur und Kunst', fr: 'La culture et les arts' , pt: 'A cultura e as artes' , zh: '文化与艺术', ja: '文化と芸術', ko: '문화와 예술' , nl: 'Cultuur en kunst', pl: 'Kultura i sztuka', ro: 'Cultura și arta' },
};

export function examTopics(language: LanguageCode): ExamTopic[] {
  return EXAM_TOPIC_IDS.map((id) => ({ id, label: LABELS[language][id] }));
}

export function findExamTopic(language: LanguageCode, id: string): ExamTopic | null {
  return examTopics(language).find((topic) => topic.id === id) ?? null;
}

export function examTopicGloss(id: string): string {
  return GLOSSES[id as ExamTopicId]?.[locale] ?? '';
}

/** Формат устной части: на какой экзамен похож и что происходит в каждой части. */
export interface ExamFormat {
  /** Название экзамена — показывается человеку и называется экзаменатору. */
  name: string;
  /** Что делает экзаменатор в каждой части. Уходит в промпт, поэтому по-английски. */
  parts: Record<ExamPart, string>;
}

/**
 * Три части у всех экзаменов одни и те же по сути — вопросы о себе, монолог,
 * разговор, — а различаются формой монолога и разговора. Их и описываем.
 * Картинок в голосовом приложении нет, поэтому задания с фотографиями заменены
 * словесным описанием сцены. Где в настоящем экзамене части идут в другом
 * порядке, это сказано прямо в описании.
 */
const EXAM_FORMATS: Record<ExamLevel, Record<LanguageCode, ExamFormat>> = {
  B1: {
    en: {
      name: 'Cambridge B1 Preliminary',
      parts: {
        interview:
          "Part 1 (Interview): simple questions about the candidate's everyday life connected to the topic — where they live, what they do, what they like. A sentence or two per answer is enough.",
        longTurn:
          'Part 2 (Long turn): in the real exam the candidate describes a photograph for about a minute. There are no pictures here, so describe an everyday scene related to the topic in two or three simple sentences, then ask the candidate to imagine it and talk about it on their own for about a minute: who is there, what the people are doing, and whether they would like to be there. After that, ask one short, simple question about what they said.',
        discussion:
          'Parts 3 and 4 (Discussion): describe a simple everyday situation with a few options — a present, a day out, an activity — and ask which they think is best and why. Then ask about their own habits, likes and experience connected to it.',
      },
    },
    de: {
      name: 'Goethe-Zertifikat B1',
      parts: {
        interview:
          "Warm-up before the scored parts: a few simple questions about the candidate's own life connected to the topic.",
        longTurn:
          'Teil 2 (Ein Thema präsentieren): give the candidate a simple question on the topic and ask for a short presentation in the order of the real exam — introduce the topic, their own experience, the situation in their home country, advantages and disadvantages with their opinion, and a closing sentence. After the presentation, ask one simple question about it, as in Teil 3.',
        discussion:
          'Teil 1 (Gemeinsam etwas planen), which comes first in the real exam and closes it here: suggest planning something together that is connected to the topic — an outing, a party, a visit — and agree on when, where, what to take and who does what. Make suggestions, accept some and politely turn others down.',
      },
    },
    fr: {
      name: 'DELF B1',
      parts: {
        interview:
          'Entretien dirigé: questions about the candidate — their life, studies or work and interests — connected to the topic.',
        longTurn:
          "Expression d'un point de vue, which comes last in the real exam: give a short, simple statement on the topic in one or two sentences, in the spirit of the real exam's document déclencheur, and ask the candidate to say what it is about and give their opinion with a couple of examples. After that, ask one question about their view.",
        discussion:
          'Exercice en interaction: a short role play in an everyday situation connected to the topic. You play the other person — a neighbour, a colleague, a shop assistant — and the candidate has to sort out a small problem, ask for something or persuade you. Stay in the role and raise one small difficulty.',
      },
    },
    es: {
      name: 'DELE B1',
      parts: {
        interview:
          'Short introduction: a few simple questions about the candidate and their everyday life connected to the topic.',
        longTurn:
          'Tarea 1 (presentación de un tema): give the candidate a simple question on the topic with three or four points to cover — their own experience, what they like and dislike, how it is in their country — and ask them to speak on their own for two or three minutes. Afterwards, as in Tarea 2, ask one question about the presentation.',
        discussion:
          'Tarea 4 (situación simulada): a short role play in an everyday situation connected to the topic. You are the other person — a travel agent, a colleague, a friend — and the candidate has to explain what they need and agree on a solution with you.',
      },
    },
    it: {
      name: 'CILS UNO-B1',
      parts: {
        interview:
          "Conversazione faccia a faccia: simple questions about the candidate's everyday life connected to the topic — family, work or studies, free time, habits.",
        longTurn:
          'Produzione orale (monologo): give the candidate a simple everyday situation or question on the topic and ask them to describe or tell a story about it on their own for about a minute and a half — what happened, where, who was there, how they felt. Afterwards ask one simple question about it.',
        discussion:
          'Closing conversation: talk about the topic a little more — their likes, experience and plans — with simple follow-up questions and a small everyday choice to make and justify.',
      },
    },
    pt: {
      name: 'CAPLE DEPLE (B1)',
      parts: {
        interview:
          "Interação oral, first part: simple questions about the candidate's own life connected to the topic — where they live, what they do, what they like.",
        longTurn:
          'Produção oral: in the real exam the task starts from a picture or a short text. There are none here, so describe an everyday situation related to the topic in two or three simple sentences and ask the candidate to talk about it on their own for about a minute and a half — what they see in it, their own experience, what they would do. Afterwards ask one simple question about it.',
        discussion:
          'Interação oral, second part: a short everyday exchange on the topic — agree on a plan, choose between options, solve a small problem — with the candidate giving reasons for their choice.',
      },
    },
    uk: {
      name: 'Українська як іноземна',
      parts: {
        interview:
          "Introductory conversation: simple questions about the candidate's everyday life connected to the topic — family, work or studies, free time.",
        longTurn:
          'Monologue: give the candidate a simple question on the topic and ask them to speak on their own for about a minute and a half — their own experience, what they like and dislike, how it is where they live. Afterwards ask one simple question about it.',
        discussion:
          'Dialogue in a situation: a short everyday role play connected to the topic — you are a neighbour, a colleague or a shop assistant, and the candidate has to ask for something, agree on a plan or sort out a small problem.',
      },
    },
    br: {
      name: 'Celpe-Bras',
      parts: {
        interview:
          "Entrevista, first part of the real exam's face-to-face interview: questions about the candidate's life, studies or work and interests connected to the topic.",
        longTurn:
          "Elemento provocador: in the real exam the candidate comments on an image or a short text. There are none here, so describe a situation or give a short statement related to the topic in two or three sentences, and ask the candidate to comment on it on their own for about two minutes — what it shows, what they think, how it is in their own country. Afterwards ask one question about it.",
        discussion:
          'Conversation on the elemento provocador: discuss the topic further with follow-up questions, ask for their opinion and reasons, and take a different view now and then.',
      },
    },
    nl: {
      name: 'Staatsexamen NT2 (programma I)',
      parts: {
        interview:
          'Short introduction: simple questions about the candidate\'s everyday life connected to the topic — work or studies, family, free time.',
        longTurn:
          'Monologue: in the real Staatsexamen the candidate answers recorded situations and gives an opinion with reasons. Give a simple question on the topic and ask the candidate to talk about it on their own for about a minute — their own experience, what they like and dislike, and why. Afterwards ask one simple question about it.',
        discussion:
          'Situation: a short everyday role play connected to the topic — you are a neighbour, a colleague or someone at a service desk, and the candidate has to ask for something, explain a problem or agree on a plan.',
      },
    },
    pl: {
      name: 'Egzamin certyfikatowy z języka polskiego (B1)',
      parts: {
        interview:
          'Rozmowa wstępna: simple questions about the candidate\'s life, work or studies and interests connected to the topic.',
        longTurn:
          'Monolog: in the real exam the task starts from a short text or a picture. There are none here, so describe an everyday situation related to the topic in two or three simple sentences and ask the candidate to talk about it on their own for about a minute and a half — their own experience and opinion. Afterwards ask one simple question about it.',
        discussion:
          'Dialog w sytuacji: a short everyday role play connected to the topic — you are a shop assistant, an official or a neighbour, and the candidate has to ask for something, complain politely or arrange something.',
      },
    },
    ro: {
      name: 'Certificat de competență lingvistică — limba română (B1)',
      parts: {
        interview:
          'Introductory conversation: simple questions about the candidate\'s everyday life connected to the topic — family, work or studies, free time.',
        longTurn:
          'Monologue: give the candidate a simple question on the topic and ask them to speak on their own for about a minute and a half — their own experience, what they like and dislike, how it is where they live. Afterwards ask one simple question about it.',
        discussion:
          'Dialogue in a situation: a short everyday role play connected to the topic — you are a neighbour, a colleague or a clerk, and the candidate has to ask for something, agree on a plan or sort out a small problem.',
      },
    },
  },
  B2: {
    en: {
      name: 'Cambridge B2 First',
      parts: {
        interview:
          "Part 1 (Interview): short questions about the candidate's own life connected to the topic — their work or studies, habits, likes and plans. Two or three sentences per answer are expected.",
        longTurn:
          'Part 2 (Long turn): in the real exam the candidate compares two photographs. There are no pictures here, so describe two contrasting situations related to the topic in one sentence each, then ask the candidate to compare them and say which they prefer and why, speaking on their own for about a minute. After the long turn, ask one short follow-up question about it.',
        discussion:
          'Parts 3 and 4 (Discussion): ask for their opinion on broader questions about the topic — causes and consequences, advantages and disadvantages, what should change. Now and then challenge their view politely and ask them to justify it.',
      },
    },
    de: {
      name: 'Goethe-Zertifikat B2',
      parts: {
        interview:
          "Warm-up before the scored parts: a few short questions about the candidate's own experience with the topic.",
        longTurn:
          'Teil 1 (Vortrag halten): give the candidate a concrete question on the topic and ask for a short presentation — the situation, their own experience or that of people they know, advantages and disadvantages, and their opinion. After the presentation, ask one question about it, as the examiner does in the real exam.',
        discussion:
          'Teil 2 (Diskussion): put a debatable question about the topic and discuss it. Take a different view now and then so they have to argue, react to your points and move towards a conclusion.',
      },
    },
    fr: {
      name: 'DELF B2',
      parts: {
        interview:
          'Short introduction before the main task: a few questions about the candidate and their own connection to the topic.',
        longTurn:
          "Monologue suivi: give a short statement on the topic in one or two sentences, in the spirit of the real exam's document déclencheur, and ask the candidate to identify the issue it raises and to present and defend a point of view with arguments and examples.",
        discussion:
          "Exercice en interaction: debate the candidate's point of view. Take the opposite side at times and ask them to clarify, nuance and defend their position.",
      },
    },
    es: {
      name: 'DELE B2',
      parts: {
        interview:
          'Short introduction: a few questions about the candidate and their own experience of the topic.',
        longTurn:
          'Tarea 1 (valorar propuestas): describe a problem related to the topic and give three or four proposed solutions in one sentence each. Ask the candidate to evaluate them — advantages, drawbacks, which one they would choose — speaking on their own for a couple of minutes. Afterwards ask one question about their evaluation.',
        discussion:
          'Conversation, as at the end of Tarea 1 and in Tarea 3: ask their opinion on wider questions about the topic, with follow-up questions and a counter-argument now and then.',
      },
    },
    it: {
      name: 'CILS DUE-B2',
      parts: {
        interview:
          "Conversazione faccia a faccia: questions about the candidate's own experience of the topic, expecting fuller answers of several sentences.",
        longTurn:
          'Produzione orale (monologo): give a concrete question on the topic and ask the candidate to present it on their own for about two minutes — describe the situation, give their view with arguments and examples, and compare it with their own country. Afterwards ask one question about their view.',
        discussion:
          'Discussion: broader questions about the topic — causes, consequences, advantages and disadvantages, what should change. Take the opposite view now and then so they have to argue their case.',
      },
    },
    pt: {
      name: 'CAPLE DIPLE (B2)',
      parts: {
        interview:
          "Interação oral, first part: questions about the candidate's own experience of the topic, expecting fuller answers of several sentences.",
        longTurn:
          'Produção oral: give a short statement on the topic in one or two sentences, in place of the text or picture of the real exam, and ask the candidate to comment on it on their own for about two minutes — what issue it raises, their opinion, arguments and examples. Afterwards ask one question about it.',
        discussion:
          'Interação oral, debate: discuss wider questions about the topic, take a different view at times and ask them to clarify and defend their position.',
      },
    },
    uk: {
      name: 'Українська як іноземна',
      parts: {
        interview:
          "Introductory conversation: questions about the candidate's own experience of the topic, expecting fuller answers of several sentences.",
        longTurn:
          'Monologue: give a short statement on the topic in one or two sentences and ask the candidate to comment on it on their own for about two minutes — the issue it raises, their view, arguments and examples. Afterwards ask one question about their view.',
        discussion:
          'Discussion: broader questions about the topic — causes, consequences, what should change. Take a different view now and then so they have to argue their case.',
      },
    },
    br: {
      name: 'Celpe-Bras',
      parts: {
        interview:
          "Entrevista, first part of the real exam's face-to-face interview: questions about the candidate's life, studies or work and interests connected to the topic.",
        longTurn:
          "Elemento provocador: in the real exam the candidate comments on an image or a short text. There are none here, so describe a situation or give a short statement related to the topic in two or three sentences, and ask the candidate to comment on it on their own for about two minutes — what it shows, what they think, how it is in their own country. Afterwards ask one question about it.",
        discussion:
          'Conversation on the elemento provocador: discuss the topic further with follow-up questions, ask for their opinion and reasons, and take a different view now and then.',
      },
    },
    nl: {
      name: 'Staatsexamen NT2 (programma II)',
      parts: {
        interview:
          'Short introduction: a few questions about the candidate\'s own experience with the topic, expecting fuller answers.',
        longTurn:
          'Monologue: in the real Staatsexamen the candidate explains a situation and argues a position. Give a concrete question on the topic and ask for a structured answer of one to two minutes — the situation, advantages and disadvantages and their own position with arguments. Afterwards ask one follow-up question.',
        discussion:
          'Discussion: put a debatable question about the topic and discuss it. Take a different view now and then so the candidate has to react, nuance and defend their position.',
      },
    },
    pl: {
      name: 'Egzamin certyfikatowy z języka polskiego (B2)',
      parts: {
        interview:
          'Rozmowa wstępna: a few questions about the candidate and their own connection to the topic.',
        longTurn:
          'Monolog: give a short statement on the topic in one or two sentences, in the spirit of the short text the real exam starts from, and ask the candidate to present the issue and argue their view with examples for about two minutes.',
        discussion:
          'Dyskusja: debate the candidate\'s view. Take the opposite side at times and ask them to justify, nuance and defend their position.',
      },
    },
    ro: {
      name: 'Certificat de competență lingvistică — limba română (B2)',
      parts: {
        interview:
          'Introductory conversation: a few questions about the candidate\'s own experience with the topic.',
        longTurn:
          'Monologue: give a concrete question on the topic and ask for a structured answer of about two minutes — the situation, advantages and disadvantages and their own opinion with arguments. Afterwards ask one follow-up question.',
        discussion:
          'Discussion: put a debatable question about the topic and discuss it. Take a different view now and then so they have to argue and move towards a conclusion.',
      },
    },
  },
};

export function examFormat(level: Level, language: LanguageCode): ExamFormat {
  return EXAM_FORMATS[asExamLevel(level)][language];
}

type ExamPlan = { part: ExamPart; answers: number }[];

/**
 * Сколько ответов человека уходит на каждую часть. Части считает приложение, а
 * не модель: модель, которой сказали «переходи, когда сочтёшь нужным», то
 * застревала бы на знакомстве, то проскакивала монолог. Счёт по ответам, а не
 * по минутам: паузу на раздумье минута засчитала бы как ответ.
 *
 * На B1 разговор короче: ответы проще, и четвёртый круг спора о том же на этом
 * уровне превращается в повтор уже сказанного.
 */
const EXAM_PLANS: Record<ExamLevel, ExamPlan> = {
  B1: [
    { part: 'interview', answers: 3 },
    // Монолог и один вопрос по нему.
    { part: 'longTurn', answers: 2 },
    { part: 'discussion', answers: 3 },
  ],
  B2: [
    { part: 'interview', answers: 3 },
    { part: 'longTurn', answers: 2 },
    { part: 'discussion', answers: 4 },
  ],
};

export function examPlan(level: Level): ExamPlan {
  return EXAM_PLANS[asExamLevel(level)];
}

/** Сколько ответов ждёт план уровня целиком. */
export function examAnswers(level: Level): number {
  return examPlan(level).reduce((total, step) => total + step.answers, 0);
}

/**
 * Где в плане ответ с этим номером (с нуля): часть и место внутри неё — «вопрос
 * 2 из 3» в пометке экзаменатору. null — план исчерпан.
 */
export function placeOfAnswer(
  level: Level,
  index: number,
): { part: ExamPart; position: number; of: number } | null {
  let left = index;
  for (const step of examPlan(level)) {
    if (left < step.answers) return { part: step.part, position: left, of: step.answers };
    left -= step.answers;
  }
  return null;
}

/** К какой части относится ответ с этим номером (с нуля); null — план исчерпан. */
export function partOfAnswer(level: Level, index: number): ExamPart | null {
  return placeOfAnswer(level, index)?.part ?? null;
}
