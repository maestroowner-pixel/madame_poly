import { module, type Syllabus } from './types';

/**
 * Румынский — черновик Claude по памяти о курсах румынского как иностранного
 * (Institutul Limbii Române), дополненный по официальной программе Министерства
 * образования «Programa de Limba română — curs de inițiere pentru străinii
 * adulți» (приказ 3310/2020, уровни A1–B1). Программа коммуникативная, каталога
 * грамматики в ней нет; из неё взяты речевые действия по уровням («a se
 * prezenta», «a da un ordin», «a exprima opinii»…) — они стали модулями
 * «Comunicare» с грамматикой, которая за ними стоит, — и повелительное
 * наклонение перенесено на A: «a da un ordin» там уже на A1.
 */
export const ROMANIAN: Syllabus = {
  A: [
    module('A', 'Substantivul și articolul', [
      ['Genul substantivelor', 'masculin, feminin, neutru: un pom / doi pomi, o casă, un scaun / două scaune'],
      ['Pluralul substantivelor', '-i, -e, -uri: băieți, case, trenuri'],
      ['Articolul nehotărât', 'un, o; niște'],
      ['Articolul hotărât', '-ul, -a, -le; băiatul, casa, numele; pluralul -i, -le'],
      ['Articolul genitival', 'al, a, ai, ale: casa lui Ion, o prietenă a mea'],
    ]),
    module('A', 'Adjectivul și pronumele', [
      ['Acordul adjectivului', 'un băiat frumos, o fată frumoasă, băieți frumoși'],
      ['Pronumele personale', 'eu, tu, el, ea, noi, voi, ei, ele; dumneavoastră'],
      ['Pronumele și adjectivele posesive', 'meu, mea, mei, mele; al meu'],
      ['Demonstrativele', 'acesta, aceasta; acela, aceea; ăsta, ăla'],
      ['Comparația adjectivului', 'mai mare decât, la fel de mare ca, cel mai mare'],
    ]),
    module('A', 'Verbul: prezentul', [
      ['A fi și a avea', 'sunt, ești, este; am, ai, are'],
      ['Conjugarea I', 'a lucra: lucrez, lucrezi; a cânta: cânt'],
      ['Conjugările II–IV', 'a vedea, a face, a dormi, a citi: citesc, cobor'],
      ['Verbe neregulate frecvente', 'a merge, a veni, a da, a sta, a vrea, a putea, a ști'],
      ['Conjunctivul prezent', 'să + verb: Vreau să plec. Trebuie să învăț.'],
    ]),
    module('A', 'Trecutul și viitorul', [
      ['Perfectul compus', 'am lucrat, ai văzut, a fost'],
      ['Participiul', '-at, -ut, -it, -s: lucrat, văzut, dormit, scris'],
      ['Viitorul', 'o să + conjunctiv; voi / am să; o să plec'],
      ['Imperativul', 'vino, stai jos, deschide cartea; lucrați; nu lucra — instrucțiuni și rugăminți'],
    ]),
    module('A', 'Propoziția', [
      ['Întrebări', 'cine, ce, unde, când, cum, de ce, cât, care'],
      ['Negația', 'nu; nimeni, nimic, niciodată, nicăieri'],
      ['Prepozițiile de bază', 'în, la, pe, cu, de, din, pentru, fără'],
      ['Numeralul', 'unu, doi, douăzeci de: douăzeci de lei'],
      ['Ora și data', 'la ora cinci, e trei și jumătate; pe unu mai'],
    ]),
    module('A', 'Comunicare în situații uzuale', [
      ['A se prezenta și a saluta', 'Mă numesc…, Sunt din…, Încântat de cunoștință; bună ziua / bună seara; tu sau dumneavoastră'],
      ['A cere și a oferi informații', 'Unde este…? Cât costă…? Aveți…? La ce oră…? — întrebări politicoase'],
      ['A cere scuze și a mulțumi', 'Scuzați-mă, Îmi pare rău, Mulțumesc frumos, Cu plăcere, Nu-i nimic'],
      ['A exprima preferințe', 'Îmi place / nu-mi place, prefer, aș vrea, mi-ar plăcea'],
      ['Cantități, măsuri și prețuri', 'un kilogram de, o sticlă de, jumătate de pâine; Cât costă? E prea scump.'],
      ['A face o invitație', 'Vrei să…? Hai să…! Ce faci sâmbătă?'],
      ['A descrie persoane, locuri și lucruri', 'Cum este? E înalt, are ochii căprui; casa are trei camere'],
    ]),
  ],
  B: [
    module('B', 'Cazurile', [
      ['Genitivul și dativul', 'casei, băiatului, copiilor; Dau cartea mamei.'],
      ['Pronumele personale în acuzativ', 'mă, te, îl, o, ne, vă, îi, le: Îl văd.'],
      ['Pronumele personale în dativ', 'îmi, îți, îi, ne, vă, le: Îmi place.'],
      ['Dublarea complementului', 'Pe Ion îl cunosc. Mamei îi dau flori.'],
      ['Vocativul', 'Ioane! Mario! Doamnă!'],
    ]),
    module('B', 'Timpuri și moduri', [
      ['Imperfectul', 'lucram, eram, aveam'],
      ['Mai-mult-ca-perfectul', 'lucrasem, fusesem'],
      ['Condiționalul prezent', 'aș vrea, ai putea; Dacă aș avea timp, aș veni.'],
      ['Conjunctivul trecut', 'să fi lucrat'],
    ]),
    module('B', 'Fraza', [
      ['Propoziția relativă', 'care, pe care, căruia, al cărui'],
      ['Subordonatele', 'că, să, dacă, deși, pentru că, înainte să, după ce'],
      ['Vorbirea indirectă', 'A spus că vine. M-a întrebat dacă…'],
      ['Diateza pasivă și reflexivă', 'Casa a fost construită. Se vorbește română.'],
    ]),
    module('B', 'Comunicare: B1', [
      ['A exprima o opinie', 'cred că, mi se pare că, după părerea mea, sunt de acord / nu sunt de acord'],
      ['A propune și a sugera', 'Ce-ar fi să…? Hai să…, v-aș propune să…, ar fi bine să…'],
      ['A accepta și a refuza o invitație', 'Cu mare plăcere! Din păcate nu pot, pentru că…'],
      ['A relata întâmplări', 'mai întâi, apoi, după aceea, în final; perfectul compus și imperfectul în povestire'],
      ['A da instrucțiuni și a exprima condiții', 'trebuie să, e nevoie să; dacă…, atunci…'],
      ['Texte funcționale', 'CV-ul (Europass), scrisoarea de intenție, formularul, e-mailul formal'],
    ]),
  ],
  C: [
    module('C', 'Forme avansate', [
      ['Gerunziul', 'lucrând, citindu-l'],
      ['Supinul', 'de citit, de făcut: Am ceva de făcut.'],
      ['Condiționalul trecut', 'aș fi venit dacă…'],
      ['Prezumtivul', 'o fi plecat, va fi știind'],
    ]),
    module('C', 'Stil și registru', [
      ['Registrul formal', 'dumneavoastră, formule din corespondența oficială'],
      ['Nominalizarea', 'luarea deciziei, creșterea prețurilor'],
      ['Expresii și colocații', 'a lua o decizie, a da de știre, a ține cont de'],
    ]),
  ],
};
