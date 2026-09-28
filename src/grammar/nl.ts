import { module, type Syllabus } from './types';

/**
 * Нидерландский. Ступень B — по оглавлению «Intermediate Dutch: A Grammar and
 * Workbook» (J. A. Oosterhoff, Routledge), присланному пользователем. Ступени
 * A и C — черновик Claude по памяти о курсах NT2 и Staatsexamen NT2; заменить,
 * когда будут источники (для A — «Basic Dutch» той же серии).
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
  // Ступень B — по оглавлению «Intermediate Dutch: A Grammar and Workbook»
  // (J. A. Oosterhoff, Routledge, 2-е изд.): 24 юнита в том же порядке,
  // названия по-нидерландски, сгруппированы в модули.
  B: [
    module('B', 'Zinnen verbinden', [
      ['Voegwoorden', 'nevenschikkend (en, maar, of, want, dus) en onderschikkend (omdat, als, toen, hoewel); woordvolgorde in de bijzin'],
      ['Voegwoordelijke bijwoorden', 'daarom, toch, bovendien, dus, daarna: inversie in de hoofdzin'],
    ]),
    module('B', 'Woordsoorten', [
      ['Zelfstandige naamwoorden', 'de en het, meervoud op -en en -s, verkleinwoorden, samenstellingen'],
      ['Bijvoeglijke naamwoorden', 'de buigings-e, stofnamen (houten), trappen van vergelijking, het bijvoeglijk naamwoord als zelfstandig naamwoord'],
      ['Bezittelijke voornaamwoorden', "mijn / m'n, die van mij, Jans boek, het boek van Jan"],
      ['Onbepaalde voornaamwoorden', 'iemand, niemand, iets, niets, alles, iedereen, sommige, enkele, elk, ieder'],
      ['Zich, zelf en elkaar', 'wederkerende werkwoorden, zelf voor nadruk, elkaar'],
      ['Aanwijzende voornaamwoorden', "deze, die, dit, dat; zo'n, zulke; dat als verwijzing naar een zin"],
      ['De ontkenning', 'niet en geen, nooit, nergens, niemand; de plaats van niet in de zin'],
    ]),
    module('B', 'Er en voornaamwoordelijke bijwoorden', [
      ['Het bijwoord er', 'er als plaats, bij een hoeveelheid (ik heb er twee), bij een onbepaald onderwerp (er staat een man) en in het passief'],
      ['Voornaamwoordelijke bijwoorden', 'erop, ermee, daarover, waarmee: voorzetsel + er / daar / waar in plaats van voorzetsel + het'],
    ]),
    module('B', 'Werkwoorden', [
      ['Werkwoorden van handeling en resultaat', 'zetten / staan, leggen / liggen, hangen / hangen, stoppen / zitten'],
      ['Duratieve constructies', 'aan het + infinitief; zitten, staan, liggen, lopen te + infinitief'],
      ['Het tegenwoordig deelwoord', 'lachend, zingend: bijwoordelijk en als bijvoeglijk naamwoord'],
      ['Over de toekomst praten', 'presens met tijdsbepaling, gaan + infinitief, zullen; voornemen en voorspelling'],
      ['Scheidbare en onscheidbare werkwoorden', 'opbellen / ik bel op; voorkomen en voorkómen: klemtoon en betekenis'],
    ]),
    module('B', 'De samengestelde zin', [
      ['Betrekkelijke bijzinnen', 'die, dat, wie, wat, waar + voorzetsel; het antecedent'],
      ['De indirecte rede', 'Hij zei dat… Ze vroeg of…; verschuiving van tijd en voornaamwoorden'],
      ['Voorwaardelijke zinnen', 'als / wanneer + presens; zou + infinitief; had … gehad: irreële voorwaarde'],
      ['Het passief', 'worden en zijn, door, het onpersoonlijk passief: er wordt gedanst'],
      ['Infinitiefconstructies', 'te + infinitief, om … te, zonder … te, in plaats van … te; infinitief zonder te'],
    ]),
    module('B', 'Overzicht', [
      ['Werkwoordstijden', 'alle tijden op een rij; perfectum of imperfectum, plusquamperfectum'],
      ['Voorzetsels', 'plaats en tijd, vaste voorzetsels bij werkwoorden en bijvoeglijke naamwoorden'],
      ['Woordvolgorde', 'hoofdzin en bijzin, inversie, tijd-wijze-plaats, de werkwoordelijke eindgroep'],
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
