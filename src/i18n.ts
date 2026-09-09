import { getLocales } from 'expo-localization';

/**
 * Языки интерфейса. Всё остальное получает английский: держать перевод,
 * которым никто не пользуется, дороже, чем понятный английский.
 */
export type UiLocale = 'en' | 'uk' | 'es' | 'ru';

const SUPPORTED = ['uk', 'es', 'ru'] as const;

/**
 * Берём язык устройства через expo-localization. Intl для этого не годится:
 * он возвращает не язык системы, а тот, на который согласилось приложение, —
 * а в бандле объявлен только английский, и на украинском телефоне выходил бы
 * английский интерфейс.
 */
function detect(): UiLocale {
  const code = getLocales()[0]?.languageCode?.toLowerCase() ?? 'en';
  return (SUPPORTED as readonly string[]).includes(code) ? (code as UiLocale) : 'en';
}

export const locale: UiLocale = detect();

/** Как называть язык интерфейса в промпте: на нём пишутся разборы ошибок. */
export const EXPLANATION_LANGUAGE_NAME: Record<UiLocale, string> = {
  en: 'English',
  uk: 'Ukrainian',
  es: 'Spanish',
  ru: 'Russian',
};

const en = {
  // Шапка и панель
  british: 'British',
  american: 'American',
  cockney: 'Cockney',
  notebookTitle: 'Exercise book',
  notebookEmpty: 'Nothing here yet. Exercises land in the book once you build a task from a conversation.',
  totalExercises: (n: number) => `${n} exercises`,
  notebookHint: 'Tap a lesson to open it, hold to pick several.',
  selectedCount: (n: number) => `${n} selected`,
  lesson: 'Lesson',
  correctAnswer: 'Answer',
  archive: 'Archive',
  toArchive: 'Archive it',
  free: 'Free',
  topic: 'Topic',
  profile: 'Profile',
  task: 'Task',
  notSet: 'Not set',
  empty: 'Empty',
  exercisesCount: (n: number) => `${n} exercises`,

  // Кнопка беседы
  start: 'Start talking',
  stop: 'Stop',
  done: 'Done',
  answer: 'Answer',
  auto: 'AUTO',
  longPressToFinish: 'Long press to end the conversation',
  longPressToManual: 'Long press to leave auto mode',
  transcribing: 'Transcribing…',
  thinking: 'Thinking…',
  answering: 'Answering…',

  // Состояние микрофона
  notListening: 'Not listening',
  listening: 'Listening',
  recognising: 'Recognising speech',
  thinkingShort: 'Thinking',
  speakingMicOff: 'Answering — microphone off',

  // Лента
  tapToPlay: '▸ tap to listen',
  drilled: 'in task',
  emptyChat:
    'Press the button and speak — your partner answers aloud and mistakes appear under your lines. The AUTO button on the left: lit means the app catches the pause, off means you mark the end yourself.',

  // Заставка
  tagline: 'Speaking practice in four languages',
  launching: 'Starting…',

  // Профиль
  profileTitle: 'Profile',
  done2: 'Done',
  noName: 'No name',
  name: 'Name',
  namePlaceholder: 'What should I call you',
  nameHint: 'The name goes into the prompt — your partner will use it now and then.',
  uploadPhoto: 'Upload photo',
  takePhoto: 'Take photo',
  removePhoto: 'Remove',
  noCamera: 'No access to the camera',
  noLibrary: 'No access to the photo library',
  textSize: 'Text size',
  fontNormal: 'Normal',
  fontLarge: 'Large',
  fontHuge: 'Very large',
  groupMale: 'Men',
  groupFemale: 'Women',
  groupChild: 'Children',

  // Темы
  topicTitle: 'Conversation topic',
  close: 'Close',
  freeTopic: 'Free topic',
  freeTopicHint: 'Anything you like — you lead',
  sectionRoleplay: 'Role play',
  sectionTalk: 'Conversation',

  // Архив
  archiveTitle: 'Conversation archive',
  archiveEmpty:
    'Nothing here yet. A finished conversation lands here with the «Archive it» button — together with its mistakes.',
  delete: 'Delete',
  back: '‹ Archive',
  withTask: 'with task',
  lines: (n: number) => `${n} ${n === 1 ? 'line' : 'lines'}`,
  mistakes: (n: number) => `${n} ${n === 1 ? 'mistake' : 'mistakes'}`,

  // Задание
  homeworkTitle: 'Homework',
  pdf: 'PDF',
  preparing: 'Preparing…',
  showAnswer: 'Show answer',
  hideAnswer: 'Hide answer',
  kindFill: 'Fill the gap',
  kindFix: 'Find the mistake',
  kindTranslate: 'Translate',
  homeworkOffer: (n: number) =>
    `The conversation collected ${n} mistakes. I will build exercises from them — same rules, new sentences.`,
  homeworkNone: 'No mistakes in this conversation — nothing to build a task from.',
  generate: 'Build the task',
  fromConversation: 'From the conversation',

  // Ошибки
  noMicrophone: 'No access to the microphone',
  nothingToDrill: 'No mistakes in this conversation — nothing to build a task from',
  recordingLost: 'The recording was not saved',
  levelsNotReady: 'Levels are still loading',
  noOpenAiKey: 'EXPO_PUBLIC_OPENAI_API_KEY is not set',
  noAnthropicKey: 'EXPO_PUBLIC_ANTHROPIC_API_KEY is not set',
  badTurn: 'Claude returned an answer that did not match the schema',
  badHomework: 'Claude returned a task that did not match the schema',

  // PDF
  pdfDialog: 'Conversation',
  pdfTasks: 'Tasks',
  pdfAnswers: 'Answers',
  pdfYou: 'You',
  pdfPartner: 'Partner',
  pdfFrom: 'From the conversation',
};

export type Strings = typeof en;

const uk: Strings = {
  british: 'Британська',
  american: 'Американська',
  cockney: 'Кокні',
  notebookTitle: 'Зошит вправ',
  notebookEmpty: 'Поки порожньо. Вправи потрапляють у зошит, коли ви складаєте завдання за розмовою.',
  totalExercises: (n) => `${n} вправ`,
  notebookHint: 'Торкніться заняття, щоб відкрити; утримуйте, щоб вибрати кілька.',
  selectedCount: (n) => `Вибрано: ${n}`,
  lesson: 'Заняття',
  correctAnswer: 'Відповідь',
  archive: 'Архів',
  toArchive: 'В архів',
  free: 'Вільна',
  topic: 'Тема',
  profile: 'Профіль',
  task: 'Завдання',
  notSet: 'Не заповнено',
  empty: 'Порожньо',
  exercisesCount: (n) => `${n} вправ`,

  start: 'Почати розмову',
  stop: 'Зупинити',
  done: 'Готово',
  answer: 'Відповісти',
  auto: 'АВТО',
  longPressToFinish: 'Довге натискання — завершити розмову',
  longPressToManual: 'Довге натискання — вийти з авторежиму',
  transcribing: 'Розпізнаю…',
  thinking: 'Думаю…',
  answering: 'Відповідає…',

  notListening: 'Не слухає',
  listening: 'Слухає',
  recognising: 'Розпізнає мовлення',
  thinkingShort: 'Думає',
  speakingMicOff: 'Відповідає — мікрофон вимкнено',

  tapToPlay: '▸ торкніться, щоб прослухати',
  drilled: 'у завданні',
  emptyChat:
    'Натисніть кнопку і говоріть — співрозмовниця відповість голосом, помилки з’являться під вашими репліками. Кнопка «АВТО» ліворуч: світиться — паузу ловить застосунок, згасла — кінець фрази позначаєте ви.',

  tagline: 'Розмовна практика чотирма мовами',
  launching: 'Запуск…',

  profileTitle: 'Профіль',
  done2: 'Готово',
  noName: 'Без імені',
  name: 'Ім’я',
  namePlaceholder: 'Як до вас звертатися',
  nameHint: 'Ім’я потрапляє у промпт — співрозмовниця час від часу вас так називатиме.',
  uploadPhoto: 'Завантажити фото',
  takePhoto: 'Зняти камерою',
  removePhoto: 'Прибрати',
  noCamera: 'Немає доступу до камери',
  noLibrary: 'Немає доступу до галереї',
  textSize: 'Розмір тексту',
  fontNormal: 'Звичайний',
  fontLarge: 'Великий',
  fontHuge: 'Дуже великий',
  groupMale: 'Чоловічі',
  groupFemale: 'Жіночі',
  groupChild: 'Дитячі',

  topicTitle: 'Тема розмови',
  close: 'Закрити',
  freeTopic: 'Вільна тема',
  freeTopicHint: 'Про що завгодно — ведете ви',
  sectionRoleplay: 'Рольові ситуації',
  sectionTalk: 'Розмова',

  archiveTitle: 'Архів розмов',
  archiveEmpty:
    'Поки порожньо. Завершена розмова потрапляє сюди кнопкою «В архів» — разом із розбором помилок.',
  delete: 'Видалити',
  back: '‹ Архів',
  withTask: 'із завданням',
  lines: (n) => `${n} реплік`,
  mistakes: (n) => `${n} помилок`,

  homeworkTitle: 'Домашнє завдання',
  pdf: 'PDF',
  preparing: 'Готую…',
  showAnswer: 'Показати відповідь',
  hideAnswer: 'Сховати відповідь',
  kindFill: 'Вставте слово',
  kindFix: 'Знайдіть помилку',
  kindTranslate: 'Перекладіть',
  homeworkOffer: (n) =>
    `У розмові назбиралося помилок: ${n}. Складу за ними вправи — ті самі правила, але нові речення.`,
  homeworkNone: 'У цій розмові помилок не знайшлося — складати завдання нема з чого.',
  generate: 'Скласти завдання',
  fromConversation: 'З розмови',

  noMicrophone: 'Немає доступу до мікрофона',
  nothingToDrill: 'У цій розмові не було помилок — складати завдання нема з чого',
  recordingLost: 'Запис не зберігся',
  levelsNotReady: 'Рівні ще завантажуються',
  noOpenAiKey: 'Не задано EXPO_PUBLIC_OPENAI_API_KEY',
  noAnthropicKey: 'Не задано EXPO_PUBLIC_ANTHROPIC_API_KEY',
  badTurn: 'Claude повернув відповідь, яка не розібралася за схемою',
  badHomework: 'Claude повернув завдання, яке не розібралося за схемою',

  pdfDialog: 'Розмова',
  pdfTasks: 'Завдання',
  pdfAnswers: 'Відповіді',
  pdfYou: 'Ви',
  pdfPartner: 'Співрозмовниця',
  pdfFrom: 'З розмови',
};

const es: Strings = {
  british: 'Británico',
  american: 'Americano',
  cockney: 'Cockney',
  notebookTitle: 'Cuaderno de ejercicios',
  notebookEmpty: 'Todavía está vacío. Los ejercicios llegan aquí cuando preparas una tarea a partir de una conversación.',
  totalExercises: (n) => `${n} ejercicios`,
  notebookHint: 'Toca una clase para abrirla; mantén pulsado para elegir varias.',
  selectedCount: (n) => `Seleccionadas: ${n}`,
  lesson: 'Clase',
  correctAnswer: 'Respuesta',
  archive: 'Archivo',
  toArchive: 'Archivar',
  free: 'Libre',
  topic: 'Tema',
  profile: 'Perfil',
  task: 'Tarea',
  notSet: 'Sin rellenar',
  empty: 'Vacío',
  exercisesCount: (n) => `${n} ejercicios`,

  start: 'Empezar a hablar',
  stop: 'Parar',
  done: 'Listo',
  answer: 'Responder',
  auto: 'AUTO',
  longPressToFinish: 'Mantén pulsado para terminar la conversación',
  longPressToManual: 'Mantén pulsado para salir del modo automático',
  transcribing: 'Transcribiendo…',
  thinking: 'Pensando…',
  answering: 'Respondiendo…',

  notListening: 'No escucha',
  listening: 'Escuchando',
  recognising: 'Reconociendo el habla',
  thinkingShort: 'Pensando',
  speakingMicOff: 'Responde — micrófono apagado',

  tapToPlay: '▸ toca para escuchar',
  drilled: 'en la tarea',
  emptyChat:
    'Pulsa el botón y habla: tu interlocutora responde en voz alta y los errores aparecen debajo de tus frases. El botón «AUTO» de la izquierda: encendido, la app detecta la pausa; apagado, marcas tú el final.',

  tagline: 'Práctica oral en cuatro idiomas',
  launching: 'Iniciando…',

  profileTitle: 'Perfil',
  done2: 'Listo',
  noName: 'Sin nombre',
  name: 'Nombre',
  namePlaceholder: 'Cómo quieres que te llame',
  nameHint: 'El nombre va al prompt: tu interlocutora lo usará de vez en cuando.',
  uploadPhoto: 'Subir foto',
  takePhoto: 'Hacer foto',
  removePhoto: 'Quitar',
  noCamera: 'Sin acceso a la cámara',
  noLibrary: 'Sin acceso a la galería',
  textSize: 'Tamaño del texto',
  fontNormal: 'Normal',
  fontLarge: 'Grande',
  fontHuge: 'Muy grande',
  groupMale: 'Hombres',
  groupFemale: 'Mujeres',
  groupChild: 'Niños',

  topicTitle: 'Tema de conversación',
  close: 'Cerrar',
  freeTopic: 'Tema libre',
  freeTopicHint: 'De lo que quieras: tú llevas la conversación',
  sectionRoleplay: 'Situaciones de rol',
  sectionTalk: 'Conversación',

  archiveTitle: 'Archivo de conversaciones',
  archiveEmpty:
    'Todavía está vacío. Una conversación terminada llega aquí con el botón «Archivar», junto con sus errores.',
  delete: 'Eliminar',
  back: '‹ Archivo',
  withTask: 'con tarea',
  lines: (n) => `${n} ${n === 1 ? 'frase' : 'frases'}`,
  mistakes: (n) => `${n} ${n === 1 ? 'error' : 'errores'}`,

  homeworkTitle: 'Tarea',
  pdf: 'PDF',
  preparing: 'Preparando…',
  showAnswer: 'Ver respuesta',
  hideAnswer: 'Ocultar respuesta',
  kindFill: 'Completa el hueco',
  kindFix: 'Encuentra el error',
  kindTranslate: 'Traduce',
  homeworkOffer: (n) =>
    `La conversación acumuló ${n} errores. Prepararé ejercicios con ellos: las mismas reglas, frases nuevas.`,
  homeworkNone: 'No hubo errores en esta conversación: no hay con qué preparar la tarea.',
  generate: 'Preparar la tarea',
  fromConversation: 'De la conversación',

  noMicrophone: 'Sin acceso al micrófono',
  nothingToDrill: 'No hubo errores en esta conversación: no hay con qué preparar la tarea',
  recordingLost: 'La grabación no se guardó',
  levelsNotReady: 'Los niveles aún se están cargando',
  noOpenAiKey: 'Falta EXPO_PUBLIC_OPENAI_API_KEY',
  noAnthropicKey: 'Falta EXPO_PUBLIC_ANTHROPIC_API_KEY',
  badTurn: 'Claude devolvió una respuesta que no encaja con el esquema',
  badHomework: 'Claude devolvió una tarea que no encaja con el esquema',

  pdfDialog: 'Conversación',
  pdfTasks: 'Ejercicios',
  pdfAnswers: 'Respuestas',
  pdfYou: 'Tú',
  pdfPartner: 'Interlocutora',
  pdfFrom: 'De la conversación',
};

const ru: Strings = {
  british: 'Британский',
  american: 'Американский',
  cockney: 'Кокни',
  notebookTitle: 'Тетрадь упражнений',
  notebookEmpty: 'Пока пусто. Упражнения попадают в тетрадь, когда вы составляете задание по беседе.',
  totalExercises: (n) => `${n} упражнений`,
  notebookHint: 'Нажмите на занятие, чтобы открыть; удерживайте, чтобы выбрать несколько.',
  selectedCount: (n) => `Выбрано: ${n}`,
  lesson: 'Занятие',
  correctAnswer: 'Ответ',
  archive: 'Архив',
  toArchive: 'В архив',
  free: 'Свободная',
  topic: 'Тема',
  profile: 'Профиль',
  task: 'Задание',
  notSet: 'Не заполнено',
  empty: 'Пусто',
  exercisesCount: (n) => `${n} упражнений`,

  start: 'Начать беседу',
  stop: 'Остановить',
  done: 'Готово',
  answer: 'Ответить',
  auto: 'АВТО',
  longPressToFinish: 'Долгое нажатие — закончить беседу',
  longPressToManual: 'Долгое нажатие — выйти из авторежима',
  transcribing: 'Распознаю…',
  thinking: 'Думаю…',
  answering: 'Отвечает…',

  notListening: 'Не слушает',
  listening: 'Слушает',
  recognising: 'Распознаёт речь',
  thinkingShort: 'Думает',
  speakingMicOff: 'Отвечает — микрофон выключен',

  tapToPlay: '▸ нажми, чтобы прослушать',
  drilled: 'в задании',
  emptyChat:
    'Нажми на кнопку и говори — партнёр ответит голосом, ошибки появятся под твоими репликами. Кнопка «АВТО» слева: подсвечена — паузу ловит приложение, погашена — конец фразы отмечаешь сам.',

  tagline: 'Разговорная практика на четырёх языках',
  launching: 'Запуск…',

  profileTitle: 'Профиль',
  done2: 'Готово',
  noName: 'Без имени',
  name: 'Имя',
  namePlaceholder: 'Как к вам обращаться',
  nameHint: 'Имя уходит в промпт — партнёр будет иногда обращаться к вам по нему.',
  uploadPhoto: 'Загрузить фото',
  takePhoto: 'Снять камерой',
  removePhoto: 'Убрать',
  noCamera: 'Нет доступа к камере',
  noLibrary: 'Нет доступа к галерее',
  textSize: 'Размер текста',
  fontNormal: 'Обычный',
  fontLarge: 'Крупный',
  fontHuge: 'Очень крупный',
  groupMale: 'Мужские',
  groupFemale: 'Женские',
  groupChild: 'Детские',

  topicTitle: 'Тема разговора',
  close: 'Закрыть',
  freeTopic: 'Свободная тема',
  freeTopicHint: 'О чём угодно — веди сам',
  sectionRoleplay: 'Ролевые ситуации',
  sectionTalk: 'Разговор',

  archiveTitle: 'Архив бесед',
  archiveEmpty:
    'Пока пусто. Законченная беседа попадает сюда по кнопке «В архив» — вместе с разбором ошибок.',
  delete: 'Удалить',
  back: '‹ Архив',
  withTask: 'с заданием',
  lines: (n) => `${n} реплик`,
  mistakes: (n) => `${n} ошибок`,

  homeworkTitle: 'Домашнее задание',
  pdf: 'PDF',
  preparing: 'Готовлю…',
  showAnswer: 'Показать ответ',
  hideAnswer: 'Скрыть ответ',
  kindFill: 'Вставь слово',
  kindFix: 'Найди ошибку',
  kindTranslate: 'Переведи',
  homeworkOffer: (n) =>
    `В беседе набралось ошибок: ${n}. Составлю по ним упражнения — те же правила, но новые предложения.`,
  homeworkNone: 'В этой беседе ошибок не нашлось — составлять задание не из чего.',
  generate: 'Составить задание',
  fromConversation: 'Из беседы',

  noMicrophone: 'Нет доступа к микрофону',
  nothingToDrill: 'В этой беседе не было ошибок — задание составлять не из чего',
  recordingLost: 'Запись не сохранилась',
  levelsNotReady: 'Уровни ещё не загружены',
  noOpenAiKey: 'Не задан EXPO_PUBLIC_OPENAI_API_KEY',
  noAnthropicKey: 'Не задан EXPO_PUBLIC_ANTHROPIC_API_KEY',
  badTurn: 'Claude вернул ответ, который не разобрался по схеме',
  badHomework: 'Claude вернул задание, которое не разобралось по схеме',

  pdfDialog: 'Диалог',
  pdfTasks: 'Задания',
  pdfAnswers: 'Ответы',
  pdfYou: 'Вы',
  pdfPartner: 'Собеседник',
  pdfFrom: 'Из беседы',
};

/** Строки интерфейса на языке системы. Выбираются один раз при запуске. */
export const t: Strings = { en, uk, es, ru }[locale];
