import { module, type Syllabus } from './types';

/**
 * Чешский — составлен Claude по памяти о курсах чешского как иностранного и
 * об экзаменах A2 для постоянного пребывания и CCE (ÚJOP UK); порядок — как
 * в польском: падежи вводятся по одному, вид глагола — с прошедшего времени.
 *
 * Ступень A сверена 2026-10-09 с официальным «Referenční popis češtiny pro
 * účely zkoušky z českého jazyka pro trvalý pobyt v ČR — úrovně A1, A2»
 * (Cvejnová a kol., 2014), глава 7 «Gramatika» (J. Kubíčková): падежи и их
 * функции, типы склонения, прилагательные, местоимения, числительные,
 * глагол, наречия, порядок слов, сложное предложение. Недостававшее
 * добавлено, прежние названия не тронуты — от них зависят ключи уроков.
 * Мн. число (N, A, G), степени сравнения и глаголы движения с приставками
 * описание даёт уже на A2; здесь их основы добавлены на A, а полные юниты
 * остались на B. Ступени B и C не сверены: описание уровня B2 (MŠMT)
 * сейчас недоступно, у CCE перечня грамматики нет.
 */
export const CZECH: Syllabus = {
  A: [
    module('A', 'Podstatné jméno a rod', [
      ['Rod podstatných jmen', 'mužský životný, mužský neživotný, ženský, střední: pán, hrad, žena, město'],
      ['Přídavné jméno ve shodě', 'nový dům, nová kniha, nové auto; tvrdá a měkká: moderní'],
      ['Ukazovací zájmena', 'ten, ta, to; tenhle, tahle, tohle'],
      ['Přivlastňovací zájmena', 'můj, tvůj, jeho, její, náš, váš, jejich; svůj'],
      ['Přivlastňovací přídavná jména', 'otcovo auto, bratrovy děti, maminčina kabelka'],
      ['Komparativ a superlativ', 'lepší než, nejlepší; větší, menší, horší, delší, vyšší'],
      ['Národnosti, ženské tvary a příjmení', 'Rus, Evropan, Němec; sousedka, kolegyně, přítelkyně; Novák — Nováková; čeština, rychlost'],
    ]),
    module('A', 'Sloveso: přítomný čas', [
      ['Být a mít', 'jsem, jsi, je; mám, máš, má'],
      ['Slovesné třídy', '-á (dělat: dělám), -í (mluvit: mluvím), -e (psát: píšu), -uje (pracovat: pracuju)'],
      ['Zápor', 'ne- ke slovesu: nemám, nejsem, nevím; dvojí zápor: nikdo nic neví'],
      ['Modální slovesa', 'chtít, moct, muset, smět: Musím jít. Můžu se zeptat?'],
      ['Zvratná slovesa', 'se, si: jmenuju se, dám si kávu'],
      ['Slovesa pohybu', 'jít / chodit, jet / jezdit: jdu do práce, jezdím autobusem; letět / létat, nést / nosit, běžet / běhat'],
      ['Chtěl bych', 'zdvořilý kondicionál: Chtěl bych pivo. Počkal bys na mě? Mohl byste mi pomoct?'],
    ]),
    module('A', 'Pády I', [
      ['Akuzativ', 'Vidím Petra, mám sestru, chci kávu; mužský životný -a'],
      ['Lokál', 'v Praze, na poště, o víkendu; kde?'],
      ['Genitiv', 'do Prahy, z práce, bez cukru, u doktora; kilo jablek'],
      ['Instrumentál', 's kamarádem, autobusem, před domem; jsem učitelem'],
      ['Dativ', 'Dám to mamince. Je mi zima. Líbí se mi to.'],
      ['Vokativ', 'pane Nováku! Petře! paní Nováková!'],
      ['Osobní zájmena v pádech', 'mě, tě, ho, ji, nás; mi, ti, mu, jí; se mnou, k tobě, bez něj'],
      ['Množné číslo: první tvary', 'N, A, G pl.: dva lidé, ty knihy, pět korun, bez peněz; mnoho žen čekalo'],
      ['Předložky s genitivem a dativem', 'u, vedle, kolem, kromě, podle, během, od — do; k, naproti, proti'],
    ]),
    module('A', 'Minulý a budoucí čas', [
      ['Minulý čas', 'dělal jsem, byla jsi, šli jsme; bez jsem ve 3. osobě'],
      ['Budoucí čas', 'budu dělat; nedokonavá slovesa'],
      ['Vid slovesa', 'dělat / udělat, psát / napsat; dokonavé v přítomném tvaru = budoucnost'],
      ['Rozkazovací způsob', 'pojď, podívej se, zavolejte mi; nekuřte'],
      ['Shoda v minulém čase', 'muži čekali, ženy čekaly, auta jezdila; Jan a Věra šli; několik lidí stálo'],
    ]),
    module('A', 'Věta a čísla', [
      ['Otázky', 'kdo, co, kde, kam, kdy, jak, proč, kolik, jaký, který'],
      ['Číslovky', 'jeden, dva, tři, čtyři + nominativ; pět a víc + genitiv: pět korun'],
      ['Čas a datum', 'v pět hodin, ve čtvrt na tři; prvního května'],
      ['Slovosled a příklonky', 'Dal jsem mu to. — jsem, se, si, mu na druhém místě'],
      ['Řadové, násobné a neurčité číslovky', 'první, druhý, v prvním patře; jednou, dvakrát; několik, kolik, mnoho'],
      ['Příslovce', 'rychle, moderně, vysoko, česky; dobře — lépe, víc — méně'],
      ['Neurčitá a záporná zájmena', 'někdo, něco, nějaký, některý, každý; nikdo, nic, žádný: Nikdo nic neví.'],
      ['Věty bez podmětu', 'Prší. Je teplo. Je mi dobře. Bolelo mě v krku. V Praze se mi líbilo.'],
      ['Spojky a první souvětí', 'a, ale, nebo, a proto, dokonce; že, jestli, když, až, protože; kdo, co, který'],
    ]),
    module('A', 'Komunikace v běžných situacích', [
      ['Představit se a pozdravit', 'Jmenuju se…, Jsem z…, Těší mě; dobrý den, ahoj; tykání a vykání'],
      ['Zeptat se na cestu a informace', 'Kde je…? Kolik to stojí? Máte…? V kolik hodin…?'],
      ['Poděkovat a omluvit se', 'Děkuju, Promiňte, To nic, Není zač'],
      ['Nakupování a úřady', 'Chtěl bych…, Potřebuju formulář, Kde se platí?'],
    ]),
  ],
  B: [
    module('B', 'Pády v plurálu', [
      ['Nominativ a akuzativ plurálu', 'páni, hrady, ženy, města; vidím pány'],
      ['Ostatní pády plurálu', 'o domech, s kamarády, bez peněz, k lidem'],
      ['Nepravidelné plurály', 'lidé, děti, oči, uši, ruce'],
    ]),
    module('B', 'Slovesa', [
      ['Podmiňovací způsob', 'dělal bych, šli bychom; Kdybych měl čas, přišel bych.'],
      ['Předpony a vid', 'psát – napsat – přepsat – přepisovat'],
      ['Trpný rod', 'Dům byl postaven. Tady se nekouří.'],
      ['Slovesa pohybu s předponami', 'přijít, odejít, vyjít, dojet, přejet'],
    ]),
    module('B', 'Souvětí', [
      ['Vztažné věty', 'který, která, které; co; jehož'],
      ['Vedlejší věty', 'že, aby, protože, když, jestli, i když, než'],
      ['Nepřímá řeč', 'Řekl, že přijde. Ptala se, jestli…'],
      ['Stupňování', 'větší, nejlepší; rychleji, nejvíc'],
    ]),
    module('B', 'Komunikace: B1', [
      ['Vyjádřit názor', 'myslím si, že; podle mě; souhlasím / nesouhlasím'],
      ['Navrhnout a odmítnout', 'Co kdybychom…? Bohužel nemůžu, protože…'],
      ['Vyprávět', 'nejdřív, potom, nakonec; vid v příběhu'],
      ['Úřední texty', 'životopis, žádost, formulář, formální e-mail'],
    ]),
  ],
  C: [
    module('C', 'Pokročilé tvary', [
      ['Přechodníky', 'dělaje, udělav — v knižním stylu'],
      ['Příčestí a přídavná jména slovesná', 'pracující, udělaný, zmíněný'],
      ['Podmiňovací způsob minulý', 'byl bych přišel'],
    ]),
    module('C', 'Styl a registr', [
      ['Spisovná a obecná čeština', 'dobrý / dobrej, mléko / mlíko, píšu / píši'],
      ['Úřední styl', 'nominalizace: podání žádosti, vyřízení věci'],
      ['Ustálená spojení', 'mít na starosti, vzít v úvahu, dát najevo'],
    ]),
  ],
};
