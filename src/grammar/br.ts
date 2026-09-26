import { module, type GrammarModule } from './types';

/**
 * Бразильский португальский — по программе пользователя: A2 (Plataforma), B1
 * (Limiar), B2 (Vantagem), C1 (Autonomia) и C2 (Maestria); подгруппы внутри
 * уровня — отдельные модули. A1 в программе нет — он собран из первого
 * списка тем португальского и переделан под бразильскую норму (você вместо
 * tu, seu вместо teu, «por que»). Пояснения — из программы.
 *
 * Как и украинский, это один сквозной курс без выбора уровня: модули идут
 * подряд от A1 до C2. Буквы ступеней в module() остаются — ключи юнитов от них
 * зависят, и уже написанные уроки не теряются.
 */
const BANDS = {
  A: [
    module('A', 'A1 — Iniciação', [
      ['O alfabeto e as regras de leitura', 'sons do português do Brasil; acentos e sinais: á, â, ã, ç'],
      ['Os artigos definidos e indefinidos', 'o, a, os, as; um, uma, uns, umas'],
      ['As contrações dos artigos com preposições', 'do, no, ao, num, pelo'],
      ['O gênero e o número dos substantivos e adjetivos', 'masculino / feminino; singular / plural'],
      ['Ser e estar', 'estado permanente e temporário no presente do indicativo'],
      ['O presente do indicativo: verbos regulares', '-ar, -er, -ir, nas formas de eu, você / ele, nós, vocês / eles'],
      ['O presente do indicativo: verbos irregulares', 'ter, ir, fazer, vir, ver'],
      ['Os demonstrativos', 'este / esse, aquele; isto / isso, aquilo'],
      ['Os possessivos', 'meu, seu, nosso; dele, dela'],
      ['Os interrogativos', 'quem, o que, onde, como, quanto, por que'],
      ['As preposições de lugar e de tempo', 'em, de, a, para, por'],
    ]),
    module('A', 'A2 — Verbos e pronomes', [
      ['Você e vocês', 'o tratamento no Brasil: você com as formas da 3.ª pessoa; tu quase não se usa'],
      ['O pretérito perfeito e o imperfeito do indicativo', 'formas de eu e de você / ele / ela'],
      ['O gerúndio', 'ação em curso: Estou comendo. Estou estudando.'],
    ]),
    module('A', 'A2 — A sintaxe do Brasil', [
      ['Ele e ela como objeto direto', 'na fala: Eu vi ele (norma culta: Eu o vi)'],
      ['Ter no sentido de existir', 'Tem muita gente aqui. (haver, existir)'],
    ]),
  ],
  B: [
    module('B', 'B1 — Limiar', [
      ['O presente do subjuntivo', 'dúvida, desejo, emoção, vontade'],
      ['O imperativo na fala', 'formas do presente do indicativo: Me dá! (norma culta: Dê-me)'],
      ['As contrações de preposições e artigos', 'a norma fonética do Brasil na sintaxe'],
      ['Ir + infinitivo', 'o futuro na fala: Vou fazer.'],
    ]),
    module('B', 'B2 — A colocação pronominal', [
      ['A próclise no Brasil', 'também no início da frase na fala: Me ajuda. Te amo. Fala e norma escrita'],
      ['A ênclise', 'só no estilo formal escrito: Ajuda-me.'],
    ]),
    module('B', 'B2 — O subjuntivo avançado', [
      ['O futuro e o imperfeito do subjuntivo', 'Se eu pudesse, eu faria. Quando eu chegar, eu te ligo.'],
    ]),
  ],
  C: [
    module('C', 'C1 — Infinitivo pessoal e subjuntivo', [
      ['O infinitivo pessoal na norma culta', 'para nós fazermos; quando é obrigatório em textos formais e no Celpe-Bras'],
    ]),
    module('C', 'C1 — A sintaxe escrita', [
      ['A crase', 'a + a = à: nomes geográficos, pronomes, locuções'],
      ['A regência verbal e nominal', 'assistir ao filme; a regência acadêmica e a fala'],
    ]),
    module('C', 'C2 — Mesóclise e concordância', [
      ['A mesóclise', 'dar-se-á, dir-se-ia — na literatura clássica e nos códigos jurídicos'],
      ['A concordância verbal e nominal', 'casos difíceis: a passiva com se — Alugam-se casas.'],
    ]),
    module('C', 'C2 — Estilo e discurso', [
      ['As construções de ênfase', 'clivagem e deslocamentos típicos do Brasil'],
      ['O gerundismo', 'vou estar te ligando — o erro de estilo e como evitá-lo'],
    ]),
  ],
};

export const BRAZILIAN: GrammarModule[] = [...BANDS.A, ...BANDS.B, ...BANDS.C];
