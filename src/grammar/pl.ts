import { module, type Syllabus } from './types';

/**
 * Польский — составлен Claude по памяти о курсах польского как иностранного,
 * затем сверен 2026-10-08 с официальными стандартами государственного
 * экзамена: «Standardy wymagań» из приложения 1 к распоряжению MNiSW от
 * 26.02.2016 (Dz.U. 2016 poz. 405), «Lista zagadnień gramatycznych» уровней
 * A1–C2 для взрослых. Каждая тема списка есть в программе своим юнитом или
 * внутри соседнего; недостававшие добавлены, прежние названия не тронуты —
 * от них зависят ключи сохранённых уроков (а ключ включает и ступень, поэтому
 * юниты не переносились между ступенями).
 *
 * Расхождения со стандартами: tryb rozkazujący и przypuszczający стандарт
 * даёт уже на A2, здесь они на B; imiesłowy przysłówkowe стандарт вводит на
 * B2 «w ograniczonym zakresie», здесь они на C.
 */
export const POLISH: Syllabus = {
  A: [
    module('A', 'Rzeczownik i przymiotnik', [
      ['Rodzaj rzeczowników', 'rodzaj męski, żeński, nijaki; zakończenia -a, -o, -e, spółgłoska'],
      ['Mianownik liczby mnogiej', 'domy, kobiety, okna; rodzaj męskoosobowy: studenci'],
      ['Zgoda przymiotnika z rzeczownikiem', 'nowy dom, nowa książka, nowe okno'],
      ['Zaimki wskazujące', 'ten, ta, to; tamten'],
      ['Zaimki dzierżawcze', 'mój, twój, jego, jej, nasz, wasz, ich'],
      ['Zaimek swój', 'Mam swój pokój. Jadę ze swoją siostrą. swój czy jego?'],
      ['Stopniowanie przymiotników', 'nowy — nowszy — najnowszy; dobry — lepszy, zły — gorszy; bardziej / najbardziej'],
      ['Stopniowanie przysłówków', 'szybko — szybciej — najszybciej; dobrze — lepiej, dużo — więcej'],
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
      ['Biernik: żywotne i nieżywotne', 'Widzę psa, brata / Widzę stół, zeszyt'],
      ['Być + mianownik czy narzędnik?', 'Zosia to Polka / Zosia jest Polką; On jest mały'],
      ['Dopełniacz', 'nie ma + D.: Nie mam czasu. szklanka wody'],
      ['Narzędnik', 'Jestem studentem. z kim? z mamą'],
      ['Miejscownik', 'w domu, w Krakowie, o czym?'],
      ['Celownik — najczęstsze użycia', 'Daję mamie prezent. Podoba mi się.'],
      ['Przyimki z przypadkami', 'do, od, z, w, na, o, przy, dla'],
      ['Wołacz', 'Panie dyrektorze! Drogi Marku! Kochana mamo! Szanowni Państwo!'],
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
      ['Liczebniki porządkowe', 'pierwszy, drugi, trzeci; na drugim piętrze; w dwudziestym pierwszym wieku'],
      ['Liczebniki z rodzajem męskoosobowym', 'dwaj / dwóch panów, czterej studenci / cztery studentki, pięciu kolegów'],
      ['Pierwsze zdania złożone', 'i, a, lub, albo, więc, ale; że, bo, dlatego że, kiedy, gdy, żeby'],
      ['Godzina i data', 'o piątej, wpół do szóstej; pierwszego maja'],
    ]),
  ],
  B: [
    module('B', 'Aspekt i czasowniki', [
      ['Aspekt w czasie przeszłym i przyszłym', 'czytałem / przeczytałem; kiedy którego używać'],
      ['Czasowniki ruchu z przedrostkami', 'wejść, wyjść, przyjść, dojechać, przejechać'],
      ['Tryb rozkazujący', 'zrób, zróbcie; niech zrobi; nie rób'],
      ['Czasowniki zwrotne', 'myć się, spotykać się, bać się'],
      ['Tworzenie par aspektowych', 'przedrostki: pisać — napisać; przyrostki: kupować — kupić; brać — wziąć'],
    ]),
    module('B', 'Przypadki w liczbie mnogiej', [
      ['Dopełniacz liczby mnogiej', 'domów, kobiet, okien; pięć minut'],
      ['Narzędnik i miejscownik liczby mnogiej', 'z przyjaciółmi, w miastach'],
      ['Rodzaj męskoosobowy', 'ci studenci / te kobiety; byli / były'],
      ['Liczebniki zbiorowe', 'dwoje dzieci, troje drzwi'],
      ['Liczebniki nieokreślone i daty', 'kilka / kilku, wiele / wielu, parę / paru; pierwszego maja dwa tysiące dwudziestego roku'],
      ['Rzeczowniki o trudnej odmianie', '-um: liceum; -ę: imię, zwierzę; -anin: Amerykanin; żeńskie na spółgłoskę: noc, rzecz; przyjaciel, pieniądz'],
      ['Zaimki nieokreślone, przeczące i zwrotne', 'ktoś, coś, nikt, nic w przypadkach; siebie, sobie, sobą, się'],
    ]),
    module('B', 'Tryb przypuszczający i zdanie złożone', [
      ['Tryb przypuszczający', 'zrobiłbym, chciałabym; byłoby dobrze'],
      ['Zdania warunkowe', 'jeśli / jeżeli; gdyby + tryb przypuszczający'],
      ['Zdania przydawkowe', 'który, która, które; ten, który…'],
      ['Mowa zależna', 'Powiedział, że… Zapytał, czy…'],
      ['Spójniki', 'ponieważ, bo, chociaż, żeby, zanim, dopóki; gdyż, lecz, toteż, czyli, mimo że; im …, tym …'],
      ['Przyimki przyczyny i przyzwolenia', 'dzięki, wbrew, z powodu, na skutek, wskutek, mimo, w razie'],
      ['Synonimia składniowa', 'zdanie złożone ↔ pojedyncze; który został zapłacony / zapłacony przez; z powodu / ponieważ'],
    ]),
    module('B', 'Imiesłowy i strona bierna', [
      ['Imiesłów przymiotnikowy czynny', 'czytający, pracujący'],
      ['Imiesłów bierny i strona bierna', 'napisany; List został napisany. Dom jest budowany.'],
      ['Formy bezosobowe', 'mówi się, można, trzeba; zrobiono'],
    ]),
    module('B', 'Słowotwórstwo i styl', [
      ['Formy żeńskie i nazwy wykonawców', 'lekarz — lekarka, król — królowa; nauczyciel, kierowca, pływak'],
      ['Nazwy miejsc i przymiotniki od rzeczowników', 'czytelnia, pływalnia; drewno — drewniany; bezalkoholowy, przeciwdeszczowy'],
      ['Zdrobnienia i spieszczenia', 'dom — domek, kot — kotek, Anna — Ania; mamusia'],
      ['Styl formalny i nieformalny', 'Szanowny Panie / Cześć; list oficjalny i prywatny; wyrazy złożone'],
    ]),
  ],
  C: [
    module('C', 'Składnia i styl', [
      ['Imiesłowy przysłówkowe', 'czytając, przeczytawszy'],
      ['Rzeczowniki odczasownikowe', 'czytanie, podjęcie decyzji'],
      ['Styl urzędowy i potoczny', 'Pan / Pani; formy grzecznościowe; język urzędów'],
      ['Style funkcjonalne', 'naukowy, publicystyczny, artystyczny; przenośnie, pytania retoryczne, archaizmy'],
      ['Spójniki książkowe i równoważniki zdań', 'iż, o ile, jak gdyby, zarówno …, jak i …; Zatrzymawszy auto, zapytała …'],
      ['Szyk wyrazów i emfaza', 'akcent logiczny; to właśnie…'],
    ]),
    module('C', 'Trudniejsze formy', [
      ['Oboczności w odmianie', 'ręka / ręce, noga / nodze, Kraków / w Krakowie'],
      ['Nieregularne rzeczowniki', 'człowiek / ludzie, dziecko / dzieci, rok / lata'],
      ['Rzeczowniki dwurodzajowe i podwójne formy', 'sierota, kaleka, niemowa; akt — akty / akta, organ — organy / organa'],
      ['Odmiana imion i nazwisk', 'Kowalski — Kowalskiej, Nowak — Nowakowa; nazwiska obce: Hugo, Goethe'],
      ['Liczebniki trudne', 'oba / obaj / oboje; ułamki: dwie trzecie, półtora; ciągi: dwa tysiące dwudziestu pięciu'],
      ['Przedrostki czasownikowe: znaczenia', 'prze-, roz-, wy-, za-, do-, od-, na-: przepisać, rozpisać, wypisać, zapisać'],
      ['Słowotwórstwo: nazwy cech, narzędzi i czynności', 'bladość, głupota; otwieracz, zamrażarka; zgrubienia: psisko'],
      ['Frazeologia i związki wyrazowe', 'podjąć decyzję, zwrócić uwagę na'],
    ]),
  ],
};
