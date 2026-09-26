import { module, type Syllabus } from './types';

/**
 * Итальянский — черновик, составленный Claude по памяти о том, как обычно
 * строятся курсы и что спрашивают на CILS и CELI. С официальными перечнями
 * не сверен: их надо заменить программой по Profilo della lingua italiana или
 * силлабусу CILS, когда они будут под рукой.
 */
export const ITALIAN: Syllabus = {
  A: [
    module('A', 'Il nome e l\'articolo', [
      ['Il genere dei nomi', 'maschile / femminile: -o, -a, -e; il problema, la mano'],
      ['Il plurale dei nomi', '-i, -e; nomi invariabili: la città / le città'],
      ['L\'articolo determinativo', 'il, lo, la, l\', i, gli, le'],
      ['L\'articolo indeterminativo', 'un, uno, una, un\''],
      ['Le preposizioni articolate', 'del, nel, sul, al, dal'],
      ['Il partitivo', 'del pane, dei libri, un po\' di'],
    ]),
    module('A', 'L\'aggettivo', [
      ['L\'accordo dell\'aggettivo', '-o / -a / -i / -e; -e / -i'],
      ['La posizione dell\'aggettivo', 'una casa grande, un bel ragazzo'],
      ['Bello, buono, quello', 'bel, bell\', begli; buon; quel, quegli'],
      ['Gli aggettivi possessivi', 'il mio, la mia; mia madre, la mia famiglia'],
      ['I dimostrativi', 'questo, quello'],
      ['I comparativi', 'più … di, meno … di, tanto … quanto; migliore'],
      ['Il superlativo', 'il più alto; bellissimo'],
    ]),
    module('A', 'Essere, avere e la frase semplice', [
      ['Essere e avere', 'sono, ho; età, nazionalità, professione'],
      ['C\'è / ci sono', 'C\'è un parco. Non ci sono negozi.'],
      ['La negazione', 'non; non … mai, niente, nessuno, più'],
      ['Le domande', 'intonazione; chi, che cosa, dove, quando, come, quanto, perché'],
      ['Quale e quanto', 'quale / quali; quanto, quanta, quanti, quante'],
    ]),
    module('A', 'Il presente', [
      ['Il presente dei verbi regolari', '-are, -ere, -ire; capire / capisco'],
      ['Il presente: verbi irregolari frequenti', 'andare, fare, venire, dare, stare, uscire'],
      ['I verbi modali', 'potere, volere, dovere, sapere + infinito'],
      ['I verbi riflessivi', 'alzarsi, chiamarsi, vestirsi'],
      ['Stare + gerundio', 'Sto mangiando.'],
      ['L\'imperativo', 'Vieni! Andiamo! Non partire! Alzati!'],
      ['Piacere', 'mi piace, mi piacciono; ti piace?'],
    ]),
    module('A', 'Il passato e il futuro', [
      ['Il passato prossimo con avere', 'ho parlato; participi regolari'],
      ['I participi passati irregolari', 'fatto, preso, visto, detto, messo, scritto'],
      ['Il passato prossimo con essere', 'sono andato / andata; accordo; riflessivi'],
      ['Essere o avere?', 'verbi di movimento e di cambiamento; ho finito / è finito'],
      ['L\'imperfetto', 'formazione; descrizione e abitudine'],
      ['Passato prossimo o imperfetto?', 'azione conclusa e sfondo'],
      ['Il futuro semplice', 'parlerò; futuri irregolari; futuro di probabilità'],
      ['Il condizionale di cortesia', 'vorrei, potrebbe, mi piacerebbe'],
    ]),
    module('A', 'I pronomi', [
      ['I pronomi soggetto e tonici', 'io, tu, lui, lei, Lei; con me, per te'],
      ['I pronomi diretti', 'lo, la, li, le; lo vedo'],
      ['I pronomi indiretti', 'gli, le, Le; gli scrivo'],
      ['I pronomi con il passato prossimo', 'l\'ho vista, li ho comprati'],
      ['Ci di luogo', 'ci vado, ci sono stato'],
      ['Ne partitivo', 'ne voglio due, non ne ho'],
      ['Il pronome relativo che', 'la ragazza che …, il libro che …'],
    ]),
    module('A', 'Le preposizioni e gli avverbi', [
      ['Le preposizioni di luogo', 'a Roma, in Italia, da Marco, in centro'],
      ['Le preposizioni di tempo', 'alle otto, a maggio, il lunedì, da due anni, fra'],
      ['Gli avverbi in -mente', 'lentamente, facilmente, veramente'],
      ['Bene, male, molto, troppo', 'avverbi frequenti; molto come aggettivo'],
      ['I connettivi semplici', 'e, ma, o, perché, allora, quindi, poi'],
    ]),
    module('A', 'I numeri e il tempo', [
      ['I numeri', 'da 0 a 1.000.000; ventuno, ventotto'],
      ['L\'ora e la data', 'Sono le tre e un quarto; il primo maggio'],
      ['I numeri ordinali', 'primo, secondo, ultimo'],
    ]),
  ],
  B: [
    module('B', 'I tempi del passato', [
      ['Il trapassato prossimo', 'avevo già mangiato; ero appena arrivato'],
      ['Il passato remoto', 'formazione; racconto storico e letterario'],
      ['La concordanza dei tempi all\'indicativo', 'Ha detto che veniva / sarebbe venuto'],
      ['Il futuro anteriore', 'Quando avrò finito …; supposizione nel passato'],
      ['Stare per + infinito', 'Stavo per uscire.'],
    ]),
    module('B', 'Il condizionale', [
      ['Il condizionale presente', 'desiderio, consiglio, ipotesi'],
      ['Il condizionale passato', 'avrei voluto; futuro nel passato'],
      ['Il condizionale di notizia non confermata', 'Secondo i giornali, il ministro sarebbe …'],
    ]),
    module('B', 'Il congiuntivo', [
      ['Il congiuntivo presente', 'formazione; verbi irregolari'],
      ['Congiuntivo dopo verbi di opinione', 'Penso che sia …; credo che'],
      ['Congiuntivo dopo verbi di volontà e sentimento', 'Voglio che tu venga; Sono contento che'],
      ['Congiuntivo dopo espressioni impersonali', 'è importante che, bisogna che'],
      ['Il congiuntivo passato', 'Penso che sia partito.'],
      ['Il congiuntivo imperfetto', 'Pensavo che fosse …; se fossi'],
      ['Congiunzioni con il congiuntivo', 'benché, affinché, prima che, a meno che'],
      ['Congiuntivo o indicativo?', 'so che / penso che; espressioni di certezza'],
    ]),
    module('B', 'Il periodo ipotetico', [
      ['Il periodo ipotetico della realtà', 'Se piove, resto a casa.'],
      ['Il periodo ipotetico della possibilità', 'Se avessi tempo, viaggerei.'],
      ['Il periodo ipotetico dell\'irrealtà', 'Se avessi studiato, avrei passato l\'esame.'],
    ]),
    module('B', 'I pronomi', [
      ['I pronomi combinati', 'me lo, glielo, ce ne'],
      ['Ci e ne: altri usi', 'ci penso, ne parlo; pensarci, parlarne'],
      ['I pronomi relativi', 'cui, il quale; in cui, con cui, il cui'],
      ['Chi e quello che', 'Chi cerca trova; quello che dici'],
      ['I pronomi e gli aggettivi indefiniti', 'qualcuno, nessuno, ognuno, qualche, alcuni'],
      ['I pronomi con i verbi modali e l\'imperativo', 'Devo dirglielo / Glielo devo dire; Dimmelo!'],
    ]),
    module('B', 'Forme del verbo', [
      ['La forma passiva', 'essere / venire + participio; da'],
      ['Il si impersonale e passivante', 'si mangia bene; si vendono case'],
      ['Il gerundio', 'causa, modo, tempo: Studiando si impara.'],
      ['L\'infinito', 'dopo preposizioni: prima di partire, senza dire'],
      ['I verbi pronominali', 'andarsene, farcela, cavarsela, metterci'],
      ['Fare + infinito', 'Ho fatto riparare la macchina.'],
    ]),
    module('B', 'Il discorso indiretto', [
      ['Il discorso indiretto', 'dire che, chiedere se; cambi di tempo e persona'],
      ['Le domande indirette', 'Mi chiedo dove sia …'],
    ]),
    module('B', 'Connettivi e testo', [
      ['I connettivi di causa e conseguenza', 'poiché, siccome, dato che; perciò, quindi'],
      ['I connettivi di opposizione e concessione', 'invece, mentre, però, tuttavia, anche se'],
      ['I connettivi di tempo', 'mentre, appena, dopo che, finché'],
      ['Preposizioni dopo verbi e aggettivi', 'pensare a, parlare di, capace di, interessato a'],
    ]),
  ],
  C: [
    module('C', 'Il verbo', [
      ['La concordanza dei tempi al congiuntivo', 'Credevo che fosse partito / che partisse'],
      ['Il congiuntivo trapassato', 'Se l\'avessi saputo …'],
      ['Il congiuntivo nelle frasi indipendenti', 'Magari fosse vero! Che entri pure.'],
      ['Periodi ipotetici misti', 'Se avessi studiato, ora sarei medico.'],
      ['Il passato remoto e il trapassato remoto', 'nella narrazione letteraria'],
      ['Il participio presente e passato con valore verbale', 'Finita la cena, …; gli studenti partecipanti'],
      ['Il gerundio composto', 'Avendo finito, …'],
      ['L\'infinito passato e sostantivato', 'dopo aver mangiato; il mangiare'],
    ]),
    module('C', 'La frase complessa', [
      ['Le subordinate concessive', 'sebbene, per quanto, nonostante, pur + gerundio'],
      ['Le subordinate finali e consecutive', 'affinché, in modo che, così … che, tanto … da'],
      ['Le subordinate temporali', 'non appena, finché non, prima che, dopo che'],
      ['Le subordinate condizionali', 'purché, a patto che, nel caso che, qualora'],
      ['Le relative con il congiuntivo', 'Cerco qualcuno che sappia …'],
      ['Le costruzioni implicite', 'infinito, gerundio e participio al posto della subordinata'],
    ]),
    module('C', 'Stile e registro', [
      ['L\'ordine delle parole e la dislocazione', 'Il libro, l\'ho letto; è lui che …'],
      ['La nominalizzazione', 'il rientro, la decisione di …'],
      ['I segnali discorsivi', 'insomma, cioè, comunque, anzi, mica'],
      ['Il registro formale', 'Lei, forme di cortesia, lettere e mail formali'],
      ['I prefissi e i suffissi', 'alterati: -ino, -one, -accio; ri-, s-, dis-'],
      ['Le espressioni idiomatiche', 'in bocca al lupo, avere le mani bucate'],
      ['La lingua parlata e quella scritta', 'variazione regionale, italiano neostandard'],
    ]),
  ],
};
