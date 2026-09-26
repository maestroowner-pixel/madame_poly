import { module, type Syllabus } from './types';

/**
 * Немецкий, по программам пользователя:
 * - A1–A2 — программа Wortkraft A2 по перечню грамматики Goethe-Zertifikat A2
 *   «Fit in Deutsch 2» (стр. 104–109);
 * - B1–B2 — «Grammatik aktiv B2/C1» (Cornelsen): разделы A–G, короткие главы
 *   под живую речь и экзамен;
 * - C1–C2 — «Übungsgrammatik für die Oberstufe» (Hueber, B2–C2): §§ 1–12,
 *   трансформация текстов и синтаксис.
 */
export const GERMAN: Syllabus = {
  A: [
    module('A', 'Nomen: Genus und Numerus', [
      'der, die, das',
      'Genus an der Endung',
      'Plural: -e, -er',
      'Plural: -(e)n, -s, ohne Endung',
      'Nullartikel',
      'Komposita',
      'Eigennamen: Genitiv und von',
    ]),
    module('A', 'Artikelwörter', [
      'Bestimmter Artikel',
      'Unbestimmter Artikel',
      'Negativartikel kein',
      'Demonstrativ: dieser',
      'Welch-? Was für ein?',
      'Possessiv: mein, dein, sein, ihr, Ihr',
      'unser, euer, alle',
    ]),
    module('A', 'Kasus', [
      'Nominativ',
      'Akkusativ',
      'Dativ',
      'Verben mit Dativ',
      'Dativ und Akkusativ zusammen',
      'es gibt · глаголы с Akkusativ',
      'Deklination: Übersicht',
    ]),
    module('A', 'Pronomen', [
      'Personalpronomen: Nominativ',
      'Personalpronomen: Akkusativ',
      'Personalpronomen: Dativ',
      'Reflexivpronomen',
      'Reziprokpronomen: uns, sich',
      'Indefinitpronomen',
      'Fragepronomen',
    ]),
    module('A', 'Präsens', [
      'Regelmäßige Endungen',
      'sein und haben',
      'Besonderheiten des Stammes',
      'Vokalwechsel e → i / ie',
      'Vokalwechsel a → ä, au → äu',
      'Trennbare Verben',
      'Untrennbare Verben · Präsens für Zukunft',
    ]),
    module('A', 'Modalverben', [
      'können',
      'müssen und dürfen',
      'wollen und möchten',
      'sollen',
      'Satzklammer mit Modalverb',
      'Modalverben im Präteritum',
    ]),
    module('A', 'Perfekt', [
      'Perfekt mit haben',
      'Partizip II: regelmäßig',
      'Partizip II: unregelmäßig',
      'Perfekt mit sein',
      'Partizip trennbarer Verben',
      'Partizip ohne ge-',
      'Über Vergangenes berichten',
    ]),
    module('A', 'Präteritum, Konjunktiv II, Imperativ', [
      'war und hatte',
      'kam, sagte',
      'Perfekt oder Präteritum?',
      'möchte · hätte gern',
      'könnte — höfliche Bitte',
      'Imperativ: du-, ihr-Form',
    ]),
    module('A', 'Adjektiv', [
      'Prädikativ',
      'Adverbial',
      'Attributiv nach dem Artikel',
      'Attributiv nach ein, kein, mein',
      'Komparativ mit als',
      'Superlativ: am …-sten',
      'gern – lieber · gut – besser · viel – mehr',
    ]),
    module('A', 'Präpositionen', [
      'Zeit: an, in, um, von … bis',
      'Zeit: nach, vor, seit, bis',
      'Ort + Dativ: aus, bei, von, zu, nach',
      'Wechselpräpositionen: wo? wohin?',
      'Modal: mit, ohne, für, aus',
      'Verschmelzungen: im, am, zum, zur, ins',
      'Orte und Wege',
    ]),
    module('A', 'Satzbau', [
      'Verb an zweiter Stelle',
      'Satzklammer',
      'Verbergänzungen',
      'Wortstellung: te-ka-mo-lo',
      'Negation mit nicht',
      'nicht oder kein?',
      'Fragesatz',
    ]),
    module('A', 'Satzverbindungen', [
      'und, oder, aber',
      'denn',
      'deshalb, dann',
      'dass',
      'weil',
      'wenn · indirekte Frage',
    ]),
    module('A', 'Wortbildung und Rechtschreibung', [
      '-er und -in',
      '-ung',
      'un- und -los',
      'Großschreibung',
      'ß, ss und Umlaute',
    ]),
  ],
  B: [
    // «Grammatik aktiv B2/C1», Teil A: Verben.
    module('B', 'Verben', [
      ['Perfekt, Präteritum, Plusquamperfekt', 'die Vergangenheitstempora im Gebrauch'],
      ['Futur I und Futur II', 'Zukunft und Vermutung: Er wird krank sein. Er wird es vergessen haben.'],
      ['Vorgangspassiv', 'werden + Partizip II in allen Zeiten'],
      ['Zustandspassiv', 'sein + Partizip II: Die Tür ist geschlossen.'],
      ['Unpersönliches Passiv', 'Hier wird getanzt. Es wurde lange diskutiert.'],
      ['Passiversatzformen in der Argumentation', 'Das lässt sich machen; sein + zu; -bar, -lich'],
      ['Subjektiver Gebrauch der Modalverben', 'Er will / soll / muss es gewusst haben.'],
    ]),
    // Teil B: Konjunktiv.
    module('B', 'Konjunktiv und indirekte Rede', [
      ['Konjunktiv II in hypothetischen Diskussionen', 'Wenn …, würde …; hätte, wäre, könnte'],
      ['Konjunktiv I und indirekte Rede', 'Texte referieren: Er sagt, er habe keine Zeit.'],
    ]),
    // Teil C: Nomen, Artikel und Pronomen.
    module('B', 'Nomen, Artikel und Pronomen', [
      ['N-Deklination', 'der Kollege, des Kollegen; der Name, des Namens'],
      ['Der Genitiv und abstrakte Begriffe', 'wegen des Wetters; die Bedeutung der Freiheit'],
      ['es, selbst, einander', 'es als Platzhalter; selbst / selber; miteinander, voneinander'],
    ]),
    // Teil D: Adjektive und Adverbien.
    module('B', 'Adjektive und Adverbien', [
      ['Partizip I und II als Attribut', 'der lachende Junge, das gelesene Buch'],
      ['Erweiterte Attribute', 'die seit Jahren steigenden Preise'],
    ]),
    // Teil E: Präpositionen.
    module('B', 'Präpositionen', [
      ['Präpositionen: Ort, Zeit, Grund, Art und Weise', 'wegen, trotz, während, innerhalb, aufgrund'],
      ['Feste Verbindungen', 'Verben, Adjektive und Nomen mit Präpositionen: sich interessieren für, stolz auf, Angst vor'],
    ]),
    // Teil F: Satzverbindungen.
    module('B', 'Satzverbindungen', [
      ['Kausal- und Konzessivsätze', 'weil, da, zumal; obwohl, obgleich, trotzdem'],
      ['Final- und Konsekutivsätze', 'damit, um … zu; sodass, so … dass'],
      ['Zweiteilige Konnektoren', 'je … desto, nicht nur … sondern auch, entweder … oder, weder … noch, zwar … aber'],
      ['Infinitivkonstruktionen', 'um … zu, ohne … zu, (an)statt … zu'],
    ]),
    // Teil G: Stil und Text.
    module('B', 'Stil und Text', [
      ['Nominalstil und Verbalstil', 'Vorbereitung auf Aufsatz und Lesen'],
      ['Funktionsverbgefüge', 'zur Verfügung stellen, in Frage kommen, eine Entscheidung treffen'],
      ['Modalpartikeln', 'doch, ja, mal, eben, halt, wohl'],
    ]),
  ],
  C: [
    // «Übungsgrammatik für die Oberstufe», §§ 1–12.
    module('C', '§ 1 Das Substantiv', [
      ['Kasus und Deklination', 'N-Deklination, Genitiv'],
      ['Pluralbildung und Sonderformen', 'die Museen, die Kaufleute, die Ratschläge'],
    ]),
    module('C', '§ 2 Artikel und Pronomen', [
      ['Bestimmter, unbestimmter und Nullartikel', 'Gebrauch der Artikel'],
      ['Pronomen als Stellvertreter', 'dessen, deren, derjenige, derselbe'],
    ]),
    module('C', '§ 3 Das Adjektiv', [
      ['Adjektivdeklination und Komparation', 'nach Artikelwörtern und ohne Artikel; Steigerung'],
      ['Substantivierte Adjektive', 'das Neue, der Bekannte, etwas Wichtiges'],
    ]),
    module('C', '§ 4 Präpositionen', [
      ['Präpositionen mit Genitiv, Dativ und Akkusativ', 'Rektion der Präpositionen'],
      ['Präpositionale Ausdrücke im Wissenschaftsstil', 'im Hinblick auf, in Bezug auf, zwecks, mittels'],
    ]),
    module('C', '§ 5 Die Tempora des Indikativs', [
      ['Präteritum und Perfekt im Gebrauch', 'schriftliche und mündliche Vergangenheit'],
      ['Futur I und II als Vermutung', 'Sie wird wohl schon angekommen sein.'],
    ]),
    module('C', '§ 6 Konjunktiv II', [
      ['Irreale Bedingungen, Wünsche und Vergleiche', 'Gegenwart und Vergangenheit: als ob, wenn … doch'],
    ]),
    module('C', '§ 7 Konjunktiv I und indirekte Rede', [
      ['Formen des Konjunktiv I', 'er sei, er habe, er komme; Ersatzformen'],
      ['Indirekte Rede in der Presse', 'Regeln des Zitierens'],
    ]),
    module('C', '§ 8 Modalverben', [
      ['Objektiver Gebrauch der Modalverben', 'Notwendigkeit, Fähigkeit, Erlaubnis'],
      ['Subjektiver Gebrauch der Modalverben', 'Vermutung, Gerücht, fremde Behauptung'],
    ]),
    module('C', '§ 9 Modalverbähnliche Verben', [
      ['Infinitiv ohne zu', 'bleiben, lassen, sehen, hören'],
      ['haben / sein + zu + Infinitiv', 'Der Antrag ist bis Montag einzureichen.'],
    ]),
    module('C', '§ 10 Nominalisierung – Verbalisierung', [
      ['Nominalstil und Verbalstil', 'Amts- und Wissenschaftssprache'],
      ['Verbale Ausdrücke nominalisieren', 'Umformung von Verbal- in Nominalstrukturen und zurück'],
    ]),
    module('C', '§ 11 Passiv und Passiversatzformen', [
      ['Vorgangs- und Zustandspassiv in allen Zeiten', 'wurde gebaut, ist gebaut worden, war gebaut'],
      ['sich lassen, sein + zu, -bar und -lich', 'Das lässt sich lösen. Das ist lösbar.'],
    ]),
    module('C', '§ 12 Der Satz', [
      ['Konzessiv-, Konsekutiv- und Restriktivsätze', 'wenn auch, als dass, soweit, insofern'],
      ['Das erweiterte Attribut', 'die von der Regierung beschlossene Reform'],
      ['Funktionsverbgefüge', 'zur Sprache bringen, in Kraft treten'],
    ]),
  ],
};
