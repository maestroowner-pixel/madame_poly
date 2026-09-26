import { module, type Syllabus } from './types';

/**
 * Португальский (европейская норма) — по программам пользователя. A1 — из
 * первого списка тем (Iniciação); A2 (Plataforma), B1 (Limiar), B2 (Vantagem),
 * C1 (Autonomia) и C2 (Maestria) — из программы европейского португальского:
 * подгруппы внутри уровня — отдельные модули. Названия юнитов по-португальски,
 * пояснения — из программ.
 */
export const PORTUGUESE: Syllabus = {
  A: [
    module('A', 'A1 — Iniciação', [
      ['O alfabeto e as regras de leitura', 'sons específicos; acentos e sinais: á, à, â, ã, ç'],
      ['Os artigos definidos e indefinidos', 'o, a, os, as; um, uma, uns, umas'],
      ['As contrações dos artigos com preposições', 'do, no, ao, num, pelo'],
      ['O género e o número dos nomes e adjetivos', 'masculino / feminino; singular / plural'],
      ['Ser e estar', 'estado permanente e temporário no presente do indicativo'],
      ['O presente do indicativo: verbos regulares', '-ar, -er, -ir'],
      ['O presente do indicativo: verbos irregulares', 'ter, ir, fazer, vir, ver'],
      ['Os demonstrativos', 'este, esse, aquele; isto, isso, aquilo'],
      ['Os possessivos', 'meu, teu, seu, nosso, vosso'],
      ['Os interrogativos', 'quem, o que, onde, como, quanto, porquê'],
      ['As preposições de lugar e de tempo', 'em, de, a, para, por'],
    ]),
    module('A', 'A2 — Os tempos do passado', [
      ['O pretérito perfeito simples', 'regulares e irregulares: ser, ir, ter, fazer, poder, querer, vir, ver, dar'],
      ['O pretérito imperfeito do indicativo', 'contexto, hábitos, tempo e idade no passado'],
      ['Perfeito ou imperfeito?', 'o acontecimento e o processo ou cenário'],
      ['O imperativo', 'você / vocês e tu: pedido delicado, ordem, conselho'],
    ]),
    module('A', 'A2 — Estruturas idiomáticas de Portugal', [
      ['Estar a + infinitivo', 'a norma europeia para a ação em curso: Estou a comer.'],
      ['Ir + infinitivo', 'futuro próximo na fala: Amanhã vou viajar.'],
      ['Haver de + infinitivo', 'intenção firme ou promessa: Hei de conseguir.'],
      ['Costumar + infinitivo', 'hábito no presente e no passado: Costumo acordar cedo.'],
    ]),
    module('A', 'A2 — Pronomes', [
      ['Os pronomes de complemento direto', 'o, a, os, as; -lo, -la depois do verbo'],
      ['Os pronomes de complemento indireto', 'me, te, lhe, nos, vos, lhes'],
      ['Os demonstrativos e as contrações', 'este, esse, aquele; deste, nisto, àquela'],
    ]),
  ],
  B: [
    module('B', 'B1 — Limiar', [
      ['O presente do conjuntivo', 'dúvida, desejo, emoção, vontade: Quero que faças isso.'],
      ['O infinitivo pessoal', 'depois de para, por, sem: para nós sabermos'],
      ['O condicional', 'pedidos delicados e hipóteses: Gostaria de pedir…'],
      ['A voz passiva analítica', 'ser + particípio: O livro foi escrito por…'],
    ]),
    module('B', 'B2 — O conjuntivo', [
      ['O pretérito imperfeito do conjuntivo', 'condições irreais no presente: Se eu tivesse tempo, iria…'],
      ['O futuro do conjuntivo', 'depois de quando, se, enquanto: Quando tu chegares, liga-me.'],
      ['A correlação de tempos', 'pares lógicos de indicativo e conjuntivo'],
    ]),
    module('B', 'B2 — A colocação pronominal', [
      ['A próclise', 'atratores: negação, que, se, já, sempre, tudo'],
      ['As formas dos pronomes depois de -r, -s, -z e de sons nasais', 'fazê-lo, compramo-lo, dizem-no'],
    ]),
  ],
  C: [
    module('C', 'C1 — A sintaxe dos pronomes', [
      ['A mesóclise', 'dar-te-ei, fá-lo-íamos — correspondência oficial e literatura'],
      ['As contrações de pronomes', 'mo, to, lho, no-lo — em todos os tempos'],
    ]),
    module('C', 'C1 — Discurso e conectores', [
      ['Conectores concessivos e consecutivos raros', 'conquanto, posto que, por conseguinte, destarte; indicativo ou conjuntivo'],
      ['O infinitivo pessoal composto', 'por terem dito'],
    ]),
    module('C', 'C2 — Maestria', [
      ['O pretérito mais-que-perfeito simples', 'fizera, dissera — na literatura e no direito'],
      ['Verbos abundantes e regência verbal', 'duas formas do particípio; regência preposicional'],
      ['A sintaxe retórica', 'inversão, elipse, clivagem; pontuação em períodos complexos'],
    ]),
  ],
};
