import { module, type Syllabus } from './types';

/**
 * Французский — по «Grammaire progressive du français» (CLE International):
 * débutant (A1) и intermédiaire (A2–B1, 4-е изд., 52 главы) для ступеней A и
 * B, avancé (B1–B2, 3-е изд., 27 глав) для B; C1–C2 — по схеме тома
 * perfectionnement (B2–C2). Названия и группировка свои.
 *
 * Сверено с оглавлениями débutant, intermédiaire и avancé 2026-10-06:
 * каждая грамматическая глава книг есть в программе своим юнитом или внутри
 * соседнего; недостававшие темы добавлены, прежние названия не тронуты — от
 * них зависят ключи сохранённых уроков. Passé simple и style indirect libre
 * в книге идут на B1–B2, здесь оставлены на C: в речи они не нужны, а в
 * письме их спрашивают с DALF. Ступень C сверена только по семи разделам
 * тома perfectionnement (lieu, moment, nom, pronom, temps, modes, discours):
 * его оглавление по главам доступно лишь сканом.
 */
export const FRENCH: Syllabus = {
  A: [
    module('A', 'Le nom et l\'article', [
      ['Le genre des noms', 'masculin / féminin: -e, -eur / -euse, -ion'],
      ['Le pluriel des noms', '-s, -x, -aux'],
      ['Les articles définis et indéfinis', 'le, la, les, l\'; un, une, des'],
      ['Les articles contractés', 'au, aux, du, des'],
      ['Les articles partitifs', 'du, de la, de l\'; pas de'],
      ['L\'expression de la quantité', 'beaucoup de, un peu de, trop de, un kilo de'],
      ['La comparaison de quantités', 'plus de, moins de, autant de … que'],
    ]),
    module('A', 'L\'adjectif', [
      ['Le féminin des adjectifs', 'petit / petite, beau / belle, heureux / heureuse'],
      ['Le pluriel des adjectifs', 'accord en genre et en nombre'],
      ['La place de l\'adjectif', 'un grand appartement, une voiture rouge'],
      ['Les adjectifs démonstratifs', 'ce, cet, cette, ces'],
      ['Les adjectifs possessifs', 'mon, ma, mes, notre, leur'],
      ['La comparaison', 'plus … que, moins … que, aussi … que; meilleur'],
      ['Le superlatif', 'le plus, le moins, le meilleur'],
    ]),
    module('A', 'Être, avoir et la phrase simple', [
      ['Être et avoir', 'je suis, j\'ai; âge, nationalité, profession'],
      ['C\'est / il est', 'C\'est un ami. Il est médecin.'],
      ['Il y a', 'Il y a un parc. Il n\'y a pas de …'],
      ['Qui est-ce ? Qu\'est-ce que c\'est ?', 'identifier une personne ou une chose; ce n\'est pas'],
      ['Les expressions avec avoir', 'avoir faim, froid, mal à la tête; avoir les yeux bleus; avoir besoin de, envie de'],
      ['La négation', 'ne … pas; ne … jamais, rien, personne, plus'],
      ['Les questions', 'intonation, est-ce que, inversion'],
      ['Les mots interrogatifs', 'où, quand, comment, combien, pourquoi, qui, que'],
      ['L\'adjectif interrogatif quel', 'quel, quelle, quels, quelles'],
      ['L\'exclamation', 'Quel beau temps ! Comme c\'est beau ! Qu\'est-ce que c\'est cher !'],
    ]),
    module('A', 'Le présent', [
      ['Le présent des verbes en -er', 'parler, manger, appeler, acheter'],
      ['Le présent des verbes en -ir', 'finir, choisir; partir, dormir'],
      ['Le présent: aller, faire, venir', 'verbes irréguliers fréquents'],
      ['Le présent: prendre, mettre, dire, lire', 'verbes irréguliers fréquents'],
      ['Le présent des verbes en -re et -oir', 'écrire, attendre; boire, recevoir; savoir / connaître, croire, voir'],
      ['Pouvoir, vouloir, devoir, savoir', '+ infinitif'],
      ['Les verbes pronominaux', 'se lever, s\'appeler, se promener'],
      ['L\'impératif', 'Viens! Allons-y! Ne pars pas! Lève-toi!'],
      ['Il faut', 'il faut + infinitif / + nom'],
      ['Les verbes de déplacement', 'aller, venir, revenir, rentrer, retourner; aller voir / visiter; en train, à pied'],
    ]),
    module('A', 'Le passé et le futur', [
      ['Le futur proche', 'aller + infinitif'],
      ['Le passé récent', 'venir de + infinitif'],
      ['Être en train de, être sur le point de', 'action en cours, action imminente'],
      ['Le passé composé avec avoir', 'j\'ai parlé; participes réguliers'],
      ['Les participes passés irréguliers', 'fait, pris, vu, eu, été, mis'],
      ['Le passé composé avec être', 'aller, venir, naître, verbes pronominaux; accord'],
      ['Le passé composé: négation et questions', 'je n\'ai pas vu; Tu es allé où?'],
      ['L\'imparfait', 'formation; description et habitude'],
      ['Le futur simple', 'je parlerai; futurs irréguliers'],
      ['Le conditionnel de politesse', 'je voudrais, pourriez-vous'],
    ]),
    module('A', 'Les pronoms', [
      ['Les pronoms sujets et toniques', 'moi, toi, lui, elle; chez moi, avec lui'],
      ['Les pronoms COD', 'le, la, les; je le vois'],
      ['Les pronoms COI', 'lui, leur; je lui parle'],
      ['Le pronom y', 'lieu: j\'y vais'],
      ['Le pronom en', 'quantité: j\'en veux deux'],
      ['Les pronoms relatifs qui et que', 'la femme qui …, le livre que …'],
      ['Le pronom on', 'on = nous, on = les gens'],
    ]),
    module('A', 'Les prépositions et les adverbes', [
      ['Les prépositions de lieu', 'à, en, au, aux, chez, dans, sur, sous'],
      ['Villes et pays', 'à Paris, en France, au Japon, aux États-Unis'],
      ['Les prépositions de temps', 'à 8 heures, en mai, le lundi, pendant, depuis'],
      ['Les adverbes en -ment', 'lentement, facilement, vraiment'],
      ['Bien, mal, beaucoup, trop', 'adverbes fréquents'],
      ['Les connecteurs simples', 'et, mais, ou, parce que, alors, donc'],
    ]),
    module('A', 'Les nombres et le temps', [
      ['Les nombres', 'de 0 à 1 000 000; soixante-dix, quatre-vingts'],
      ['L\'heure et la date', 'Il est trois heures et quart; le 14 juillet'],
      ['Le temps qu\'il fait, les mois et les saisons', 'il fait froid, il pleut, il neige; en hiver, au printemps, en juillet'],
      ['Les nombres ordinaux', 'premier, deuxième, dernier'],
    ]),
  ],
  B: [
    module('B', 'Les temps du passé', [
      ['Passé composé ou imparfait?', 'action et description; interruption'],
      ['Le plus-que-parfait', 'j\'avais fait; antériorité dans le passé'],
      ['L\'accord du participe passé avec avoir', 'COD placé avant: la lettre que j\'ai écrite'],
      ['Les verbes pronominaux au passé composé', 'elle s\'est levée; ils se sont parlé'],
      ['Le récit au passé', 'enchaîner les temps; il y a, depuis, pendant'],
    ]),
    module('B', 'Le futur et le conditionnel', [
      ['Le futur antérieur', 'j\'aurai fini; quand j\'aurai fini'],
      ['Le conditionnel présent', 'formation; souhait, conseil, suggestion'],
      ['Le conditionnel passé', 'j\'aurais fait; regret, reproche'],
      ['Le conditionnel: information incertaine', 'Le ministre serait malade; selon la presse, il y aurait …'],
      ['L\'hypothèse avec si', 'si + présent / imparfait / plus-que-parfait'],
      ['Le futur dans le passé', 'il a dit qu\'il viendrait'],
    ]),
    module('B', 'Le subjonctif', [
      ['Le subjonctif présent: formation', 'que je parle; être, avoir, aller, faire, pouvoir'],
      ['Le subjonctif après la volonté et l\'obligation', 'je veux que, il faut que'],
      ['Le subjonctif après les sentiments', 'je suis content que, j\'ai peur que'],
      ['Le subjonctif après le doute et la possibilité', 'je doute que, il est possible que'],
      ['Subjonctif ou indicatif?', 'je pense que / je ne pense pas que'],
      ['Subjonctif ou infinitif?', 'je veux partir / je veux que tu partes'],
    ]),
    module('B', 'Les pronoms', [
      ['Les pronoms y et en: autres emplois', 'penser à → y penser; parler de → en parler'],
      ['La place des doubles pronoms', 'je le lui donne; donne-le-moi'],
      ['Les pronoms relatifs dont et où', 'le livre dont je parle; le jour où'],
      ['Les pronoms relatifs composés', 'lequel, auquel, duquel; avec qui'],
      ['Ce qui, ce que, ce dont', 'Ce qui me plaît, c\'est …'],
      ['Les pronoms possessifs', 'le mien, la tienne, les leurs'],
      ['Les pronoms démonstratifs', 'celui, celle, ceux; celui qui, celui-ci'],
      ['Les indéfinis', 'quelqu\'un, chacun, aucun, plusieurs, certains, n\'importe qui'],
    ]),
    module('B', 'Formes verbales', [
      ['Le gérondif', 'en travaillant: simultanéité, manière, condition'],
      ['Le participe présent', 'les étudiants ayant … ; ne sachant pas'],
      ['La voix passive', 'être + participe; par / de'],
      ['Le faire causatif', 'faire réparer, se faire couper les cheveux'],
      ['Les verbes + à / de + infinitif', 'commencer à, décider de, réussir à'],
      ['L\'infinitif passé', 'après avoir mangé, après être parti'],
      ['L\'adjectif verbal', 'fatigant / fatiguant, différent / différant, convaincant / convainquant; accord'],
      ['La forme pronominale: sens', 'réfléchi, réciproque, passif: ça se mange froid, ça ne se dit pas'],
      ['La forme impersonnelle', 'il est arrivé un accident, il reste, il manque, il suffit de, il s\'agit de'],
    ]),
    module('B', 'Le discours rapporté', [
      ['Le discours indirect au présent', 'il dit que, il demande si, il veut savoir ce que'],
      ['Le discours indirect au passé', 'concordance des temps'],
      ['L\'interrogation indirecte', 'si, ce que, ce qui, où, quand'],
    ]),
    module('B', 'La phrase', [
      ['La mise en relief', 'c\'est … qui, c\'est … que'],
      ['La négation complexe', 'ne … que, ni … ni, ne … aucun, sans'],
      ['Les adverbes: place et formation', 'place au passé composé; -amment, -emment'],
      ['Les prépositions avec les noms géographiques', 'en Provence, dans le Midi, au Québec'],
      ['Les prépositions à, de, en, par, pour', 'une tasse à café / de café; en bois, en deux heures; par jour; pour deux jours'],
      ['L\'absence d\'article', 'sans sucre, avec plaisir; un verre de vin; il est médecin; énumérations, titres'],
    ]),
    module('B', 'Les relations logiques', [
      ['L\'expression du temps', 'depuis, il y a, pendant, en, dans; quand, lorsque, pendant que'],
      ['La cause', 'parce que, puisque, comme, grâce à, à cause de, car'],
      ['La conséquence', 'donc, alors, c\'est pourquoi, si bien que, tellement … que'],
      ['Le but', 'pour, pour que, afin de, afin que'],
      ['L\'opposition et la concession', 'mais, pourtant, cependant, alors que, bien que, malgré'],
      ['La comparaison', 'plus … plus, de plus en plus, comme, le même que'],
      ['La condition', 'à condition que, au cas où, sinon, en cas de'],
    ]),
  ],
  C: [
    module('C', 'Les modes et les temps', [
      ['Le subjonctif passé', 'je suis content qu\'il soit venu'],
      ['Le subjonctif après les conjonctions', 'avant que, sans que, à condition que, de peur que'],
      ['Le subjonctif dans la relative', 'le seul qui, je cherche quelqu\'un qui sache'],
      ['La concordance des temps', 'principale au passé: indicatif, subjonctif, conditionnel'],
      ['Le passé simple', 'reconnaître et employer dans le récit écrit'],
      ['Le passé antérieur', 'quand il eut fini'],
      ['Le subjonctif imparfait et plus-que-parfait', 'reconnaissance: qu\'il fût, qu\'il eût fait'],
    ]),
    module('C', 'Participes et infinitifs', [
      ['Le participe composé', 'ayant terminé, étant arrivée'],
      ['La proposition participiale', 'Le travail terminé, il est sorti.'],
      ['L\'accord du participe: cas difficiles', 'se + verbe, laisser / faire + infinitif, en'],
      ['La nominalisation', 'la construction du pont, l\'arrivée du train'],
      ['Tournures passives', 'se faire, se voir, se laisser, s\'entendre dire'],
    ]),
    module('C', 'Les pronoms et la relative', [
      ['Les relatifs composés avec préposition', 'sur lequel, grâce auquel, à côté duquel'],
      ['Dont ou de qui / duquel?', 'complément du nom et préposition composée'],
      ['Les indéfinis: nuances', 'quiconque, n\'importe lequel, tel, nul'],
      ['Le pronom neutre le', 'Je le sais; il est plus grand que je ne le pensais'],
    ]),
    module('C', 'Les relations logiques', [
      ['L\'hypothèse avancée', 'au cas où, à supposer que, pour peu que, quand bien même, à moins que'],
      ['La concession avancée', 'quoique, si … que, où que, quoi que, avoir beau, tout … que'],
      ['La cause avancée', 'étant donné que, vu que, du fait que, faute de, sous prétexte que'],
      ['La conséquence avancée', 'de sorte que, au point que, si bien que, d\'où'],
      ['Le but avancé', 'de crainte que, de manière à, de façon que, en vue de'],
      ['Le temps avancé', 'dès que, aussitôt que, à peine … que, tant que, jusqu\'à ce que'],
      ['Les articulateurs du discours', 'en effet, or, toutefois, néanmoins, en revanche, d\'ailleurs'],
    ]),
    module('C', 'La phrase et le style', [
      ['Le ne explétif', 'avant qu\'il ne parte, je crains qu\'il ne vienne'],
      ['La dislocation et l\'emphase', 'Ce livre, je l\'ai adoré. Ce que je veux, c\'est …'],
      ['L\'inversion du sujet', 'peut-être, aussi, ainsi, sans doute; dit-il'],
      ['La modalisation', 'il semblerait que, il se peut que, sans doute, apparemment'],
      ['Le discours rapporté: verbes introducteurs', 'affirmer, prétendre, reconnaître, nier'],
      ['Le style indirect libre', 'reconnaître dans les textes'],
      ['La négation littéraire', 'ne seul, ne … guère, ne … point'],
      ['La place de l\'adjectif et le sens', 'un grand homme / un homme grand; ancien, propre'],
      ['Les registres', 'familier, courant, soutenu'],
    ]),
  ],
};
