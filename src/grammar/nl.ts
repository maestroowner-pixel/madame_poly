import { module, type Syllabus } from './types';

/**
 * Нидерландский — черновик, составленный Claude по памяти о том, как обычно
 * строятся курсы NT2 (Nederlands als tweede taal) и что проверяет Staatsexamen
 * NT2. С официальными перечнями не сверен: заменить программой по
 * Raamwerk NT2 или учебнику (Nederlands in gang, Taal vitaal), когда они будут.
 */
export const DUTCH: Syllabus = {
  A: [
    module('A', 'Het zelfstandig naamwoord en het lidwoord', [
      ['De en het', 'de-woorden en het-woorden; verkleinwoorden zijn het: het huisje'],
      ['Het meervoud', '-en en -s: boeken, tafels; onregelmatig: kind / kinderen'],
      ['Het onbepaald lidwoord', 'een; geen'],
      ['Het verkleinwoord', '-je, -tje, -pje, -etje: huisje, stoeltje, boompje'],
    ]),
    module('A', 'Het werkwoord: presens', [
      ['Zijn en hebben', 'ik ben, jij bent; ik heb, hij heeft'],
      ['Het presens van regelmatige werkwoorden', 'ik werk, jij werkt, wij werken; werk jij?'],
      ['Spelling in het presens', 'lopen / ik loop; zitten / ik zit; v/f en z/s'],
      ['Modale werkwoorden', 'kunnen, willen, moeten, mogen + infinitief'],
      ['Gaan + infinitief', 'de toekomst: Ik ga morgen koken.'],
      ['Scheidbare werkwoorden', 'opbellen: Ik bel je morgen op.'],
    ]),
    module('A', 'De zin', [
      ['De woordvolgorde in de hoofdzin', 'het werkwoord op plaats twee: Morgen ga ik naar huis.'],
      ['Inversie', 'Vandaag werk ik niet. Waar woon jij?'],
      ['Vraagwoorden', 'wie, wat, waar, wanneer, hoe, waarom, welk(e), hoeveel'],
      ['De ontkenning', 'niet en geen: Ik werk niet. Ik heb geen auto.'],
      ['Er is / er zijn', 'Er is een park. Er zijn geen winkels.'],
    ]),
    module('A', 'Voornaamwoorden en bijvoeglijke naamwoorden', [
      ['Persoonlijke voornaamwoorden', 'ik / me / mij, jij / je, u, hij / hem, zij / haar'],
      ['Bezittelijke voornaamwoorden', 'mijn, jouw, uw, zijn, haar, ons / onze, hun'],
      ['Aanwijzende voornaamwoorden', 'deze, die, dit, dat'],
      ['Het bijvoeglijk naamwoord', 'de mooie stad, een mooi huis: de -e'],
      ['De trappen van vergelijking', 'groter dan, even groot als, de grootste; goed / beter / best'],
    ]),
    module('A', 'Het verleden', [
      ['Het perfectum met hebben en zijn', 'Ik heb gewerkt. Ik ben gegaan.'],
      ['Het voltooid deelwoord', 'ge-…-t / -d: gewerkt, gewoond; ’t kofschip'],
      ['Onregelmatige deelwoorden', 'gegeten, gedronken, geschreven, gebleven'],
      ['Het imperfectum van zijn en hebben', 'ik was, ik had'],
    ]),
    module('A', 'Voorzetsels en tijd', [
      ['Voorzetsels van plaats', 'in, op, bij, naast, onder, tussen, achter'],
      ['Voorzetsels van tijd', 'om vijf uur, op maandag, in mei, over een week'],
      ['De klok en de datum', 'half vier, kwart over drie; de eerste mei'],
    ]),
  ],
  B: [
    module('B', 'Het verleden en de toekomst', [
      ['Het imperfectum van regelmatige werkwoorden', 'ik werkte, ik woonde; ’t kofschip'],
      ['Het imperfectum van sterke werkwoorden', 'ik ging, ik zag, ik schreef'],
      ['Perfectum of imperfectum', 'wanneer welke vorm: verhaal en resultaat'],
      ['Het plusquamperfectum', 'Ik had al gegeten toen hij kwam.'],
      ['Zullen', 'de toekomst en het voorstel: Zal ik je helpen?'],
    ]),
    module('B', 'De bijzin', [
      ['Voegwoorden van de bijzin', 'dat, omdat, als, toen, terwijl, hoewel, zodat'],
      ['De woordvolgorde in de bijzin', 'het werkwoord achteraan: …omdat ik ziek ben.'],
      ['Nevenschikkende voegwoorden', 'en, maar, of, want, dus'],
      ['De indirecte vraag', 'Ik weet niet of hij komt. Weet jij waar ze woont?'],
      ['De betrekkelijke bijzin', 'die, dat, wie, waar + voorzetsel: de man die daar staat'],
    ]),
    module('B', 'Er, zich en om te', [
      ['Het woordje er', 'plaats, hoeveelheid (Ik heb er twee), er + voorzetsel (erover)'],
      ['Wederkerende werkwoorden', 'zich vergissen, zich herinneren, zich schamen'],
      ['Om … te + infinitief', 'Ik ga naar de winkel om brood te kopen.'],
      ['Te + infinitief na werkwoorden', 'proberen, vergeten, beginnen te; zitten te lezen'],
    ]),
    module('B', 'Het passief en de conditionalis', [
      ['Het passief', 'worden en zijn: Het huis wordt gebouwd. Het is gebouwd.'],
      ['De conditionalis', 'zou / zouden + infinitief: Ik zou graag…'],
      ['Irreële voorwaarde', 'Als ik tijd had, zou ik komen.'],
      ['Werkwoorden met een vast voorzetsel', 'wachten op, denken aan, houden van'],
    ]),
  ],
  C: [
    module('C', 'De complexe zin', [
      ['De werkwoordelijke eindgroep', 'Ik heb hem zien komen. …dat ik het had kunnen weten.'],
      ['Participium- en infinitiefconstructies', 'Thuisgekomen belde ik haar. Na gegeten te hebben…'],
      ['Tangconstructies en lange zinnen', 'de zin opbouwen in formeel schrijven'],
    ]),
    module('C', 'Stijl en register', [
      ['Formeel en informeel', 'u en jij; ambtelijke taal en spreektaal'],
      ['Nominalisering', 'het besluit nemen, de verhoging van de huur'],
      ['Uitdrukkingen en vaste combinaties', 'een beslissing nemen, aandacht besteden aan'],
      ['Argumenteren en nuanceren', 'weliswaar, desondanks, enerzijds … anderzijds'],
    ]),
    module('C', 'Belgisch en Nederlands Nederlands', [
      ['Verschillen tussen Nederland en Vlaanderen', 'woordenschat, gij / ge, verkleinwoorden'],
    ]),
  ],
};
