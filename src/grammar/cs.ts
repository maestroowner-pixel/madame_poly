import { module, type Syllabus } from './types';

/**
 * Чешский — черновик Claude по памяти о курсах чешского как иностранного и
 * о требованиях экзамена A2 для постоянного пребывания и CCE (ÚJOP UK).
 * Источника пользователя пока нет; порядок — как в польском: падежи
 * вводятся по одному, вид глагола — с прошедшего времени.
 */
export const CZECH: Syllabus = {
  A: [
    module('A', 'Podstatné jméno a rod', [
      ['Rod podstatných jmen', 'mužský životný, mužský neživotný, ženský, střední: pán, hrad, žena, město'],
      ['Přídavné jméno ve shodě', 'nový dům, nová kniha, nové auto; tvrdá a měkká: moderní'],
      ['Ukazovací zájmena', 'ten, ta, to; tenhle, tahle, tohle'],
      ['Přivlastňovací zájmena', 'můj, tvůj, jeho, její, náš, váš, jejich; svůj'],
    ]),
    module('A', 'Sloveso: přítomný čas', [
      ['Být a mít', 'jsem, jsi, je; mám, máš, má'],
      ['Slovesné třídy', '-á (dělat: dělám), -í (mluvit: mluvím), -e (psát: píšu), -uje (pracovat: pracuju)'],
      ['Zápor', 'ne- ke slovesu: nemám, nejsem, nevím; dvojí zápor: nikdo nic neví'],
      ['Modální slovesa', 'chtít, moct, muset, smět: Musím jít. Můžu se zeptat?'],
      ['Zvratná slovesa', 'se, si: jmenuju se, dám si kávu'],
      ['Slovesa pohybu', 'jít / chodit, jet / jezdit: jdu do práce, jezdím autobusem'],
    ]),
    module('A', 'Pády I', [
      ['Akuzativ', 'Vidím Petra, mám sestru, chci kávu; mužský životný -a'],
      ['Lokál', 'v Praze, na poště, o víkendu; kde?'],
      ['Genitiv', 'do Prahy, z práce, bez cukru, u doktora; kilo jablek'],
      ['Instrumentál', 's kamarádem, autobusem, před domem; jsem učitelem'],
      ['Dativ', 'Dám to mamince. Je mi zima. Líbí se mi to.'],
      ['Vokativ', 'pane Nováku! Petře! paní Nováková!'],
    ]),
    module('A', 'Minulý a budoucí čas', [
      ['Minulý čas', 'dělal jsem, byla jsi, šli jsme; bez jsem ve 3. osobě'],
      ['Budoucí čas', 'budu dělat; nedokonavá slovesa'],
      ['Vid slovesa', 'dělat / udělat, psát / napsat; dokonavé v přítomném tvaru = budoucnost'],
      ['Rozkazovací způsob', 'pojď, podívej se, zavolejte mi; nekuřte'],
    ]),
    module('A', 'Věta a čísla', [
      ['Otázky', 'kdo, co, kde, kam, kdy, jak, proč, kolik, jaký, který'],
      ['Číslovky', 'jeden, dva, tři, čtyři + nominativ; pět a víc + genitiv: pět korun'],
      ['Čas a datum', 'v pět hodin, ve čtvrt na tři; prvního května'],
      ['Slovosled a příklonky', 'Dal jsem mu to. — jsem, se, si, mu na druhém místě'],
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
