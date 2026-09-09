import { locale, type UiLocale } from './i18n';
import type { LanguageCode } from './types';

export interface Topic {
  id: string;
  /** Название на изучаемом языке — его же увидит собеседник. */
  label: string;
  /**
   * Ролевая ситуация: партнёр играет сотрудника, а не расспрашивает о
   * впечатлениях. Обычным темам поле не нужно.
   */
  kind?: 'roleplay';
}

/**
 * Описание сцены для ролевых тем — по одному на идентификатор, а не на язык:
 * роль партнёра одна и та же, меняется только язык разговора.
 */
export const ROLEPLAY_SCENES: Record<string, string> = {
  bank: [
    'You are a clerk at a bank counter and the learner is the customer in front of you.',
    'They have come in with something to sort out: opening an account, a card that stopped working, a transfer that did not arrive, a fee they do not understand.',
    'Ask what they need, then handle it as a real clerk would — ask for the details, explain the options, the paperwork and the waiting times.',
  ].join(' '),
  pharmacy: [
    'You are a pharmacist behind the counter and the learner is the customer.',
    'They are describing a complaint or asking for a particular medicine.',
    'Ask what the symptoms are, how long they have lasted, what they have already taken and whether they have a prescription, then offer what you can sell them and explain how to take it.',
  ].join(' '),
  clinic: [
    'You are a doctor at a health centre and the learner is your patient, in with a cold or the flu.',
    'Ask what is wrong, how long it has lasted, about fever, cough, sore throat and headache, what they have already taken and whether they have any allergies.',
    'Then say what you think it is, what to take and for how long, and whether they need a sick note or should come back.',
  ].join(' '),
  repair: [
    'You are an agent at a repair service for household appliances and the learner is calling you.',
    'Something has broken: a fridge, a washing machine, an oven, a dishwasher.',
    'Ask which appliance it is, the make and model, what exactly it does wrong, how old it is and whether it is still under warranty, then offer a visit time and a rough price for the call-out.',
  ].join(' '),
};

/**
 * Шаблоны разговора на случай, когда своей темы нет. По тридцать на язык:
 * двадцать девять общих и одна своя для каждого языка.
 *
 * Тема уходит в system prompt, а первую реплику партнёр придумывает сам под
 * уровень — готовые фразы пришлось бы писать отдельно для A1 и для C1.
 */
export const TOPICS: Record<LanguageCode, Topic[]> = {
  en: [
    { id: 'routine', label: 'Daily routine' },
    { id: 'food', label: 'Food and cooking' },
    { id: 'travel', label: 'Travel and holidays' },
    { id: 'work', label: 'Work and career' },
    { id: 'family', label: 'Family' },
    { id: 'friendship', label: 'Friendship' },
    { id: 'city', label: 'City life' },
    { id: 'sport', label: 'Sport and fitness' },
    { id: 'music', label: 'Music' },
    { id: 'films', label: 'Films and series' },
    { id: 'books', label: 'Books and reading' },
    { id: 'weather', label: 'Weather and seasons' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'health', label: 'Health and doctors' },
    { id: 'tech', label: 'Technology and gadgets' },
    { id: 'money', label: 'Money and prices' },
    { id: 'school', label: 'School and university' },
    { id: 'childhood', label: 'Childhood memories' },
    { id: 'future', label: 'Plans for the future' },
    { id: 'holidays', label: 'Holidays and traditions' },
    { id: 'nature', label: 'Nature and animals' },
    { id: 'transport', label: 'Transport and traffic' },
    { id: 'home', label: 'Home and repairs' },
    { id: 'restaurants', label: 'Restaurants and cafés' },
    { id: 'hobbies', label: 'Hobbies' },
    { id: 'news', label: 'News and current events' },
    { id: 'history', label: 'History' },
    { id: 'art', label: 'Art and museums' },
    { id: 'languages', label: 'Learning languages' },
    { id: 'local-en', label: 'British and American English' },
    { id: 'bank', label: 'At the bank', kind: 'roleplay' },
    { id: 'pharmacy', label: 'At the pharmacy', kind: 'roleplay' },
    { id: 'clinic', label: "At the doctor's with a cold", kind: 'roleplay' },
    { id: 'repair', label: 'Calling an appliance repair service', kind: 'roleplay' },
  ],

  de: [
    { id: 'routine', label: 'Tagesablauf' },
    { id: 'food', label: 'Essen und Kochen' },
    { id: 'travel', label: 'Reisen und Urlaub' },
    { id: 'work', label: 'Arbeit und Beruf' },
    { id: 'family', label: 'Familie' },
    { id: 'friendship', label: 'Freundschaft' },
    { id: 'city', label: 'Leben in der Stadt' },
    { id: 'sport', label: 'Sport und Fitness' },
    { id: 'music', label: 'Musik' },
    { id: 'films', label: 'Filme und Serien' },
    { id: 'books', label: 'Bücher und Lesen' },
    { id: 'weather', label: 'Wetter und Jahreszeiten' },
    { id: 'shopping', label: 'Einkaufen' },
    { id: 'health', label: 'Gesundheit und Ärzte' },
    { id: 'tech', label: 'Technik und Geräte' },
    { id: 'money', label: 'Geld und Preise' },
    { id: 'school', label: 'Schule und Universität' },
    { id: 'childhood', label: 'Kindheitserinnerungen' },
    { id: 'future', label: 'Zukunftspläne' },
    { id: 'holidays', label: 'Feste und Traditionen' },
    { id: 'nature', label: 'Natur und Tiere' },
    { id: 'transport', label: 'Verkehr und Bahn' },
    { id: 'home', label: 'Wohnen und Renovieren' },
    { id: 'restaurants', label: 'Restaurants und Cafés' },
    { id: 'hobbies', label: 'Hobbys' },
    { id: 'news', label: 'Nachrichten und Politik' },
    { id: 'history', label: 'Geschichte' },
    { id: 'art', label: 'Kunst und Museen' },
    { id: 'languages', label: 'Sprachen lernen' },
    { id: 'local-de', label: 'Weihnachtsmärkte und Oktoberfest' },
    { id: 'bank', label: 'Auf der Bank', kind: 'roleplay' },
    { id: 'pharmacy', label: 'In der Apotheke', kind: 'roleplay' },
    { id: 'clinic', label: 'Beim Arzt mit einer Erkältung', kind: 'roleplay' },
    { id: 'repair', label: 'Anruf beim Reparaturdienst', kind: 'roleplay' },
  ],

  fr: [
    { id: 'routine', label: 'La journée type' },
    { id: 'food', label: 'La cuisine et les repas' },
    { id: 'travel', label: 'Les voyages et les vacances' },
    { id: 'work', label: 'Le travail et la carrière' },
    { id: 'family', label: 'La famille' },
    { id: 'friendship', label: "L'amitié" },
    { id: 'city', label: 'La vie en ville' },
    { id: 'sport', label: 'Le sport' },
    { id: 'music', label: 'La musique' },
    { id: 'films', label: 'Les films et les séries' },
    { id: 'books', label: 'Les livres et la lecture' },
    { id: 'weather', label: 'Le temps et les saisons' },
    { id: 'shopping', label: 'Les courses et les achats' },
    { id: 'health', label: 'La santé et les médecins' },
    { id: 'tech', label: 'La technologie' },
    { id: 'money', label: "L'argent et les prix" },
    { id: 'school', label: "L'école et l'université" },
    { id: 'childhood', label: "Les souvenirs d'enfance" },
    { id: 'future', label: "Les projets d'avenir" },
    { id: 'holidays', label: 'Les fêtes et les traditions' },
    { id: 'nature', label: 'La nature et les animaux' },
    { id: 'transport', label: 'Les transports' },
    { id: 'home', label: 'Le logement et les travaux' },
    { id: 'restaurants', label: 'Les restaurants et les cafés' },
    { id: 'hobbies', label: 'Les loisirs' },
    { id: 'news', label: "L'actualité" },
    { id: 'history', label: "L'histoire" },
    { id: 'art', label: "L'art et les musées" },
    { id: 'languages', label: "L'apprentissage des langues" },
    { id: 'local-fr', label: 'Le fromage et le vin' },
    { id: 'bank', label: 'À la banque', kind: 'roleplay' },
    { id: 'pharmacy', label: 'À la pharmacie', kind: 'roleplay' },
    { id: 'clinic', label: 'Chez le médecin avec un rhume', kind: 'roleplay' },
    { id: 'repair', label: 'Appel au service de réparation', kind: 'roleplay' },
  ],

  es: [
    { id: 'routine', label: 'La rutina diaria' },
    { id: 'food', label: 'La comida y la cocina' },
    { id: 'travel', label: 'Los viajes y las vacaciones' },
    { id: 'work', label: 'El trabajo y la carrera' },
    { id: 'family', label: 'La familia' },
    { id: 'friendship', label: 'La amistad' },
    { id: 'city', label: 'La vida en la ciudad' },
    { id: 'sport', label: 'El deporte' },
    { id: 'music', label: 'La música' },
    { id: 'films', label: 'Las películas y las series' },
    { id: 'books', label: 'Los libros y la lectura' },
    { id: 'weather', label: 'El tiempo y las estaciones' },
    { id: 'shopping', label: 'Las compras' },
    { id: 'health', label: 'La salud y los médicos' },
    { id: 'tech', label: 'La tecnología' },
    { id: 'money', label: 'El dinero y los precios' },
    { id: 'school', label: 'La escuela y la universidad' },
    { id: 'childhood', label: 'Los recuerdos de la infancia' },
    { id: 'future', label: 'Los planes de futuro' },
    { id: 'holidays', label: 'Las fiestas y las tradiciones' },
    { id: 'nature', label: 'La naturaleza y los animales' },
    { id: 'transport', label: 'El transporte' },
    { id: 'home', label: 'La vivienda y las reformas' },
    { id: 'restaurants', label: 'Los restaurantes y los bares' },
    { id: 'hobbies', label: 'Las aficiones' },
    { id: 'news', label: 'Las noticias' },
    { id: 'history', label: 'La historia' },
    { id: 'art', label: 'El arte y los museos' },
    { id: 'languages', label: 'Aprender idiomas' },
    { id: 'local-es', label: 'El flamenco y la música latina' },
    { id: 'bank', label: 'En el banco', kind: 'roleplay' },
    { id: 'pharmacy', label: 'En la farmacia', kind: 'roleplay' },
    { id: 'clinic', label: 'En el médico con un resfriado', kind: 'roleplay' },
    { id: 'repair', label: 'Llamada al servicio técnico', kind: 'roleplay' },
  ],
};

/** Находит тему по идентификатору — он хранится отдельно от списка. */
export function findTopic(language: LanguageCode, id: string | null): Topic | null {
  if (!id) return null;
  return TOPICS[language].find((topic) => topic.id === id) ?? null;
}

/**
 * Перевод названий тем на язык интерфейса. Хранится по идентификатору, а не
 * внутри темы: тема «Распорядок дня» одна и та же во всех четырёх языках, и
 * держать перевод четырежды значило бы четырежды его и править.
 */
const GLOSSES: Record<string, Record<UiLocale, string>> = {
  routine: { en: 'Daily routine', uk: 'Розпорядок дня', es: 'La rutina diaria', ru: 'Распорядок дня' },
  food: { en: 'Food and cooking', uk: 'Їжа та готування', es: 'Comida y cocina', ru: 'Еда и готовка' },
  travel: { en: 'Travel and holidays', uk: 'Подорожі та відпустка', es: 'Viajes y vacaciones', ru: 'Путешествия и отпуск' },
  work: { en: 'Work and career', uk: 'Робота та кар’єра', es: 'Trabajo y carrera', ru: 'Работа и карьера' },
  family: { en: 'Family', uk: 'Сім’я', es: 'La familia', ru: 'Семья' },
  friendship: { en: 'Friendship', uk: 'Дружба', es: 'La amistad', ru: 'Дружба' },
  city: { en: 'City life', uk: 'Життя у місті', es: 'La vida en la ciudad', ru: 'Жизнь в городе' },
  sport: { en: 'Sport and fitness', uk: 'Спорт і форма', es: 'Deporte y forma física', ru: 'Спорт и форма' },
  music: { en: 'Music', uk: 'Музика', es: 'La música', ru: 'Музыка' },
  films: { en: 'Films and series', uk: 'Кіно та серіали', es: 'Cine y series', ru: 'Кино и сериалы' },
  books: { en: 'Books and reading', uk: 'Книжки та читання', es: 'Libros y lectura', ru: 'Книги и чтение' },
  weather: { en: 'Weather and seasons', uk: 'Погода та пори року', es: 'El tiempo y las estaciones', ru: 'Погода и времена года' },
  shopping: { en: 'Shopping', uk: 'Покупки', es: 'Las compras', ru: 'Покупки' },
  health: { en: 'Health and doctors', uk: 'Здоров’я та лікарі', es: 'Salud y médicos', ru: 'Здоровье и врачи' },
  tech: { en: 'Technology and gadgets', uk: 'Техніка та гаджети', es: 'Tecnología y aparatos', ru: 'Техника и гаджеты' },
  money: { en: 'Money and prices', uk: 'Гроші та ціни', es: 'Dinero y precios', ru: 'Деньги и цены' },
  school: { en: 'School and university', uk: 'Школа та університет', es: 'Escuela y universidad', ru: 'Школа и университет' },
  childhood: { en: 'Childhood memories', uk: 'Спогади дитинства', es: 'Recuerdos de la infancia', ru: 'Воспоминания о детстве' },
  future: { en: 'Plans for the future', uk: 'Плани на майбутнє', es: 'Planes de futuro', ru: 'Планы на будущее' },
  holidays: { en: 'Holidays and traditions', uk: 'Свята та традиції', es: 'Fiestas y tradiciones', ru: 'Праздники и традиции' },
  nature: { en: 'Nature and animals', uk: 'Природа та тварини', es: 'Naturaleza y animales', ru: 'Природа и животные' },
  transport: { en: 'Transport and traffic', uk: 'Транспорт і затори', es: 'Transporte y tráfico', ru: 'Транспорт и пробки' },
  home: { en: 'Home and repairs', uk: 'Дім і ремонт', es: 'Vivienda y reformas', ru: 'Дом и ремонт' },
  restaurants: { en: 'Restaurants and cafés', uk: 'Ресторани та кафе', es: 'Restaurantes y cafés', ru: 'Рестораны и кафе' },
  hobbies: { en: 'Hobbies', uk: 'Хобі', es: 'Aficiones', ru: 'Хобби' },
  news: { en: 'News and current events', uk: 'Новини та події', es: 'Noticias y actualidad', ru: 'Новости и события' },
  history: { en: 'History', uk: 'Історія', es: 'Historia', ru: 'История' },
  art: { en: 'Art and museums', uk: 'Мистецтво та музеї', es: 'Arte y museos', ru: 'Искусство и музеи' },
  languages: { en: 'Learning languages', uk: 'Вивчення мов', es: 'Aprender idiomas', ru: 'Изучение языков' },

  bank: { en: 'At the bank', uk: 'У банку', es: 'En el banco', ru: 'В банке' },
  pharmacy: { en: 'At the pharmacy', uk: 'В аптеці', es: 'En la farmacia', ru: 'В аптеке' },
  clinic: { en: 'At the doctor’s: a cold', uk: 'У лікаря: застуда', es: 'En el médico: un resfriado', ru: 'У врача: простуда' },
  repair: { en: 'Appliance repair service', uk: 'Ремонт побутової техніки', es: 'Reparación de electrodomésticos', ru: 'Ремонт бытовой техники' },

  'local-en': { en: 'British and American English', uk: 'Британська та американська', es: 'Inglés británico y americano', ru: 'Британский и американский' },
  'local-de': { en: 'Christmas markets and Oktoberfest', uk: 'Різдвяні ярмарки та Октоберфест', es: 'Mercados navideños y Oktoberfest', ru: 'Ярмарки и Октоберфест' },
  'local-fr': { en: 'Cheese and wine', uk: 'Сир і вино', es: 'Queso y vino', ru: 'Сыр и вино' },
  'local-es': { en: 'Flamenco and Latin music', uk: 'Фламенко та латинська музика', es: 'Flamenco y música latina', ru: 'Фламенко и латинская музыка' },
};

/** Название темы на языке интерфейса; пусто, если перевода нет. */
export function topicGloss(id: string): string {
  return GLOSSES[id]?.[locale] ?? '';
}
