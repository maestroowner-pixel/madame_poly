import { module, type Syllabus } from './types';

/**
 * Польский — черновик, составленный Claude по памяти о том, как обычно
 * строятся курсы польского как иностранного и что проверяет państwowy egzamin
 * certyfikatowy. С официальными перечнями не сверен: заменить программой по
 * стандартам экзамена (Państwowa Komisja) или учебнику (Hurra!!! Po polsku,
 * Krok po kroku), когда они будут.
 */
export const POLISH: Syllabus = {
  A: [
    module('A', 'Rzeczownik i przymiotnik', [
      ['Rodzaj rzeczowników', 'rodzaj męski, żeński, nijaki; zakończenia -a, -o, -e, spółgłoska'],
      ['Mianownik liczby mnogiej', 'domy, kobiety, okna; rodzaj męskoosobowy: studenci'],
      ['Zgoda przymiotnika z rzeczownikiem', 'nowy dom, nowa książka, nowe okno'],
      ['Zaimki wskazujące', 'ten, ta, to; tamten'],
      ['Zaimki dzierżawcze', 'mój, twój, jego, jej, nasz, wasz, ich'],
    ]),
    module('A', 'Czasownik: czas teraźniejszy', [
      ['Być i mieć', 'jestem, jesteś; mam, masz'],
      ['Koniugacja -m, -sz', 'czytam, czytasz; znam, rozumiem'],
      ['Koniugacja -ę, -esz', 'piszę, piszesz; idę, jadę'],
      ['Koniugacja -ę, -isz / -ysz', 'robię, robisz; mówię, słyszę'],
      ['Czasowniki modalne', 'móc, musieć, chcieć, woleć + bezokolicznik'],
      ['Czasowniki ruchu', 'iść / chodzić, jechać / jeździć'],
    ]),
    module('A', 'Przypadki: podstawy', [
      ['Biernik', 'Mam brata. Lubię kawę. — liczba pojedyncza'],
      ['Dopełniacz', 'nie ma + D.: Nie mam czasu. szklanka wody'],
      ['Narzędnik', 'Jestem studentem. z kim? z mamą'],
      ['Miejscownik', 'w domu, w Krakowie, o czym?'],
      ['Celownik — najczęstsze użycia', 'Daję mamie prezent. Podoba mi się.'],
      ['Przyimki z przypadkami', 'do, od, z, w, na, o, przy, dla'],
    ]),
    module('A', 'Czas przeszły i przyszły', [
      ['Czas przeszły', 'byłem, byłam, byliśmy; robiłem / robiłam'],
      ['Czas przyszły złożony', 'będę robić / robił'],
      ['Aspekt: wprowadzenie', 'robić / zrobić, pisać / napisać'],
      ['Czas przyszły prosty', 'zrobię, napiszę, kupię'],
    ]),
    module('A', 'Zdanie i liczebnik', [
      ['Pytania', 'kto, co, gdzie, kiedy, jak, dlaczego, ile, czy'],
      ['Przeczenie', 'nie; nikt, nic, nigdy, nigdzie'],
      ['Liczebniki główne', 'jeden, dwa, pięć; dwa domy, pięć domów'],
      ['Godzina i data', 'o piątej, wpół do szóstej; pierwszego maja'],
    ]),
  ],
  B: [
    module('B', 'Aspekt i czasowniki', [
      ['Aspekt w czasie przeszłym i przyszłym', 'czytałem / przeczytałem; kiedy którego używać'],
      ['Czasowniki ruchu z przedrostkami', 'wejść, wyjść, przyjść, dojechać, przejechać'],
      ['Tryb rozkazujący', 'zrób, zróbcie; niech zrobi; nie rób'],
      ['Czasowniki zwrotne', 'myć się, spotykać się, bać się'],
    ]),
    module('B', 'Przypadki w liczbie mnogiej', [
      ['Dopełniacz liczby mnogiej', 'domów, kobiet, okien; pięć minut'],
      ['Narzędnik i miejscownik liczby mnogiej', 'z przyjaciółmi, w miastach'],
      ['Rodzaj męskoosobowy', 'ci studenci / te kobiety; byli / były'],
      ['Liczebniki zbiorowe', 'dwoje dzieci, troje drzwi'],
    ]),
    module('B', 'Tryb przypuszczający i zdanie złożone', [
      ['Tryb przypuszczający', 'zrobiłbym, chciałabym; byłoby dobrze'],
      ['Zdania warunkowe', 'jeśli / jeżeli; gdyby + tryb przypuszczający'],
      ['Zdania przydawkowe', 'który, która, które; ten, który…'],
      ['Mowa zależna', 'Powiedział, że… Zapytał, czy…'],
      ['Spójniki', 'ponieważ, bo, chociaż, żeby, zanim, dopóki'],
    ]),
    module('B', 'Imiesłowy i strona bierna', [
      ['Imiesłów przymiotnikowy czynny', 'czytający, pracujący'],
      ['Imiesłów bierny i strona bierna', 'napisany; List został napisany. Dom jest budowany.'],
      ['Formy bezosobowe', 'mówi się, można, trzeba; zrobiono'],
    ]),
  ],
  C: [
    module('C', 'Składnia i styl', [
      ['Imiesłowy przysłówkowe', 'czytając, przeczytawszy'],
      ['Rzeczowniki odczasownikowe', 'czytanie, podjęcie decyzji'],
      ['Styl urzędowy i potoczny', 'Pan / Pani; formy grzecznościowe; język urzędów'],
      ['Szyk wyrazów i emfaza', 'akcent logiczny; to właśnie…'],
    ]),
    module('C', 'Trudniejsze formy', [
      ['Oboczności w odmianie', 'ręka / ręce, noga / nodze, Kraków / w Krakowie'],
      ['Nieregularne rzeczowniki', 'człowiek / ludzie, dziecko / dzieci, rok / lata'],
      ['Frazeologia i związki wyrazowe', 'podjąć decyzję, zwrócić uwagę na'],
    ]),
  ],
};
