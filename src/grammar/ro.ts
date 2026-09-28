import { module, type Syllabus } from './types';

/**
 * Румынский — черновик, составленный Claude по памяти о том, как обычно
 * строятся курсы румынского как иностранного (Institutul Limbii Române) и что
 * проверяет экзамен на сертификат. С официальными перечнями не сверен:
 * заменить программой ILR или учебником (Limba română pentru străini), когда
 * они будут.
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
    ]),
    module('A', 'Propoziția', [
      ['Întrebări', 'cine, ce, unde, când, cum, de ce, cât, care'],
      ['Negația', 'nu; nimeni, nimic, niciodată, nicăieri'],
      ['Prepozițiile de bază', 'în, la, pe, cu, de, din, pentru, fără'],
      ['Numeralul', 'unu, doi, douăzeci de: douăzeci de lei'],
      ['Ora și data', 'la ora cinci, e trei și jumătate; pe unu mai'],
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
      ['Imperativul', 'lucrează, lucrați; nu lucra'],
      ['Conjunctivul trecut', 'să fi lucrat'],
    ]),
    module('B', 'Fraza', [
      ['Propoziția relativă', 'care, pe care, căruia, al cărui'],
      ['Subordonatele', 'că, să, dacă, deși, pentru că, înainte să, după ce'],
      ['Vorbirea indirectă', 'A spus că vine. M-a întrebat dacă…'],
      ['Diateza pasivă și reflexivă', 'Casa a fost construită. Se vorbește română.'],
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
