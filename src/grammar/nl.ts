import { module, type Syllabus } from './types';

/**
 * Нидерландский — по двум книгам J. A. Oosterhoff (Routledge Grammar
 * Workbooks), присланным пользователем: ступень A — «Basic Dutch» (2-е изд.,
 * 2024), B — «Intermediate Dutch». Ступень C — темы для продвинутых из
 * справочника «Dutch Grammar» (B. Berendsen, dutchgrammar.com), которых нет в
 * двух книгах, плюс стиль и регистр.
 */
export const DUTCH: Syllabus = {
  // Ступень A — по оглавлению «Basic Dutch: A Grammar and Workbook»
  // (J. A. Oosterhoff, Routledge, 2-е изд., 2024): 31 юнит в том же порядке,
  // названия по-нидерландски, сгруппированы в модули.
  A: [
    module('A', 'Eerste stappen', [
      ['De spelling', 'open en gesloten lettergrepen; lange en korte klinkers: kaas / kazen, bot / botten; f / v en s / z'],
      ['Persoonlijke voornaamwoorden als onderwerp', 'ik, jij / je, u, hij, zij / ze, het, wij / we, jullie, zij / ze; beklemtoonde en onbeklemtoonde vormen'],
      ['Het presens', 'stam + t: ik werk, jij werkt, werk jij?; spelling van de stam'],
      ['Lidwoorden en zelfstandige naamwoorden', 'de, het en een; geen'],
      ['Persoonlijke voornaamwoorden als voorwerp', 'me / mij, je / jou, u, hem, haar, het, ons, jullie, ze / hen / hun'],
    ]),
    module('A', 'Getallen, meervoud en vragen', [
      ['Getallen en maten', 'hoofdtelwoorden en rangtelwoorden; een kilo, twee liter, een pond'],
      ['Het meervoud', '-en en -s; spellingregels; onregelmatige meervouden'],
      ['Vragen en vraagwoorden', 'ja/nee-vragen; wie, wat, waar, wanneer, hoe, waarom, welk(e), hoeveel'],
      ['Bezittelijke voornaamwoorden', 'mijn, jouw, zijn, haar, ons / onze, hun; die van mij'],
      ['Modale hulpwerkwoorden', 'kunnen, moeten, willen, mogen, zullen; de infinitief achteraan'],
    ]),
    module('A', 'De zin', [
      ['De basiswoordvolgorde', 'het werkwoord op plaats twee, inversie, tijd-wijze-plaats'],
      ['De tijd', 'Hoe laat is het? half vier, kwart over drie; dagen, maanden, de datum'],
      ['De ontkenning I', 'niet en geen'],
      ['Aanwijzende voornaamwoorden', 'deze, die, dit, dat; dat is / dat zijn'],
    ]),
    module('A', 'Bijvoeglijk naamwoord en bijwoord', [
      ['De buiging van het bijvoeglijk naamwoord', 'een mooi huis, het mooie huis, de mooie stad: wanneer -e'],
      ['De trappen van vergelijking', 'groter dan, even groot als, het grootst; goed / beter / best, veel / meer / meest'],
      ['Bijwoorden', 'graag, vaak, al, nog, pas, eens; bijwoorden van tijd en plaats'],
    ]),
    module('A', 'Werkwoorden', [
      ['Scheidbare en onscheidbare werkwoorden', 'opbellen / ik bel op, begrijpen; de plaats van het partikel'],
      ['De gebiedende wijs', 'Kom! Komt u binnen. Laten we gaan.'],
      ['Het perfectum', "hebben of zijn + voltooid deelwoord; ge-…-t / -d, ’t kofschip"],
      ['Het imperfectum', 'zwakke werkwoorden (werkte, woonde) en sterke werkwoorden (ging, zag)'],
      ['Wederkerende werkwoorden', 'zich vergissen, zich wassen; me, je, zich, ons'],
    ]),
    module('A', 'Woorden en woordgroepen', [
      ['Het verkleinwoord', '-je, -tje, -pje, -etje, -kje; verkleinwoorden zijn het-woorden'],
      ['Het bijwoord er', 'er als plaats, bij een hoeveelheid, er is / er zijn'],
      ['Voorzetsels', 'plaats, tijd en beweging; vaste combinaties'],
      ['Infinitiefconstructies', 'te + infinitief, om … te; zonder te na modale werkwoorden'],
    ]),
    module('A', 'De samengestelde zin', [
      ['Woordvolgorde in de bijzin', 'omdat, dat, als, toen: het werkwoord achteraan'],
      ['Betrekkelijke bijzinnen', 'die, dat, waar + voorzetsel'],
      ['De indirecte rede', 'Hij zegt dat… Ze vraagt of…'],
      ['De ontkenning II', 'nooit, nergens, niemand, niets; geen … meer, nog niet'],
      ['Leestekens', 'punt, komma, vraagteken; apostrof, trema en koppelteken'],
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
  // Ступень C — по оглавлению справочника «Dutch Grammar» (B. Berendsen,
  // dutchgrammar.com): темы, которых нет в «Basic» и «Intermediate Dutch», —
  // сложные времена, местоимения и порядок слов для продвинутых.
  C: [
    module('C', 'Werkwoorden voor gevorderden', [
      ['De voltooid toekomende tijd', 'zal hebben + voltooid deelwoord, zal zijn gegaan: Morgen zal ik het hebben gedaan.'],
      ['De voltooid verleden toekomende tijd', 'zou hebben / zijn + deelwoord: spijt en het irreële verleden — Ik zou het hebben gedaan als…'],
      ['De aanvoegende wijs', 'Leve de koning! Men neme…, het zij zo, God zegene je: vaste uitdrukkingen en formele stijl'],
      ['Het werkwoord als zelfstandig naamwoord', 'het lezen, het roken is verboden, aan het koken'],
      ['De vervangende infinitief', 'Ik heb het niet kunnen doen. Hij is komen kijken. — infinitief in plaats van voltooid deelwoord'],
      ['Te na durven, hoeven, hebben en komen', 'Je hoeft niet te komen. Ik heb niets te doen. Hij komt ons te helpen.'],
      ['Aan het in de voltooide tijd', 'Ik ben de hele dag aan het werken geweest.'],
      ['Werkwoorden gevormd uit zelfstandige naamwoorden', 'stofzuigen, zonnebaden, glimlachen: ik stofzuig, ik heb gestofzuigd'],
    ]),
    module('C', 'Scheidbaar of onscheidbaar', [
      ['Voorvoegsels met twee betekenissen', "door-, over-, om-, onder-, voor-: dóórlopen / doorlópen, óverkomen / overkómen; klemtoon en deelwoord"],
      ['Werkwoorden met mis- en vol-', 'misverstaan, mislukken, volhouden, voltooien: scheidbaar of niet'],
    ]),
    module('C', 'Woordvorming', [
      ['Samenstellingen en tussenklanken', 'stadhuis, boekenkast, zonnebril, kinderwagen, schaapskooi: -s-, -e-, -en-, -er- of niets'],
    ]),
    module('C', 'Voornaamwoorden voor gevorderden', [
      ['Het is en het zijn, dit is en dit zijn', 'Het zijn mijn kinderen. Dit zijn de regels.'],
      ['Hen of hun, en voornaamwoorden in de spreektaal', 'hen na een voorzetsel, hun als meewerkend voorwerp; ze, ’m, d’r, Jan z’n fiets'],
      ['Datgene en diegene', 'Diegene die het weet, mag het zeggen. Datgene wat je zoekt…'],
      ["Zo'n, zulke, dergelijk, dusdanig en zodanig", "zo'n huis, zulke huizen, een dergelijk probleem; dusdanig en zodanig in formele stijl"],
      ['Dezelfde en hetzelfde', 'dezelfde man, hetzelfde huis; hetzelfde als'],
      ['Wiens en wier', 'de man wiens auto…, de vrouw wier zoon…: formeel naast van wie'],
      ['Al, alle, allen en allemaal', 'al het geld, alle mensen, wij allemaal, allen in formele stijl'],
      ['Beide, allebei en men', 'beide kinderen, ze komen allebei; men zegt dat…'],
      ['Onbepaalde hoeveelheden', 'een paar, enkele, verscheidene, weinig, veel, te veel, genoeg'],
      ['Uitroepen', 'Wat een mooi huis! Wat is het koud! Hoe durf je!'],
    ]),
    module('C', 'Woordvolgorde voor gevorderden', [
      ['Het middenveld', 'er / hier / daar vooraan, dan tijd, wijze, plaats; het lijdend voorwerp en onbeklemtoonde voornaamwoorden'],
      ['Meewerkend voorwerp en voorzetselvoorwerp', 'Ik geef hem het boek / Ik geef het boek aan hem; de plaats van de voorzetselgroep'],
      ['Koppelwerkwoorden en het naamwoordelijk deel', 'zijn, worden, blijven, lijken, blijken, schijnen'],
      ['Na het eindveld', 'Ik heb lang gewacht op jou. — wat achter de werkwoorden mag staan'],
      ['Verkorte bijzinnen', 'Eenmaal thuis belde hij. Gezien de omstandigheden… Zodra klaar, …'],
      ['Hoe vrij is de Nederlandse zin?', 'wat voorop mag voor nadruk, zinsdelen voor en na de kern, topicalisatie'],
    ]),
    module('C', 'Er voor gevorderden', [
      ['Er of het als onderwerp', 'Er is iemand aan de deur. Het is Jan.'],
      ['Het extra er aan het begin van de zin', 'Er werd gebeld. Er wordt gezegd dat… Er zijn veel mensen die…'],
    ]),
    module('C', 'Stijl en register', [
      ['De werkwoordelijke eindgroep', 'Ik heb hem zien komen. …dat ik het had kunnen weten.'],
      ['Participium- en infinitiefconstructies', 'Thuisgekomen belde ik haar. Na gegeten te hebben…'],
      ['Formeel en informeel', 'u en jij; ambtelijke taal en spreektaal'],
      ['Nominalisering', 'het besluit nemen, de verhoging van de huur'],
      ['Uitdrukkingen en vaste combinaties', 'een beslissing nemen, aandacht besteden aan'],
      ['Argumenteren en nuanceren', 'weliswaar, desondanks, enerzijds … anderzijds'],
      ['Verschillen tussen Nederland en Vlaanderen', 'woordenschat, gij / ge, verkleinwoorden'],
    ]),
  ],
};
