import { module, type Syllabus } from './types';

/**
 * Португальский (европейская норма) — черновик, составленный Claude по памяти
 * о том, как обычно строятся курсы и что спрашивают на CAPLE (CIPLE, DEPLE,
 * DIPLE). С официальными перечнями не сверен: его надо заменить программой по
 * Referencial Camões PLE, когда он будет под рукой.
 */
export const PORTUGUESE: Syllabus = {
  A: [
    module('A', 'O nome e o artigo', [
      ['O género dos nomes', 'masculino / feminino: -o, -a, -e; o dia, a mão'],
      ['O plural dos nomes', '-s, -ões / -ães / -ãos, -is, -es'],
      ['Os artigos definidos e indefinidos', 'o, a, os, as; um, uma, uns, umas'],
      ['As contrações', 'do, no, ao, pelo, num, dum'],
      ['Os determinantes possessivos', 'o meu, a minha; o seu, o dele'],
      ['Os demonstrativos', 'este, esse, aquele; isto, isso, aquilo'],
    ]),
    module('A', 'O adjetivo', [
      ['A concordância do adjetivo', 'bonito / bonita / bonitos; feliz / felizes'],
      ['A posição do adjetivo', 'uma casa grande, um bom amigo'],
      ['Os comparativos', 'mais … do que, menos … do que, tão … como; melhor, pior'],
      ['O superlativo', 'o mais alto; muito alto, altíssimo'],
    ]),
    module('A', 'Ser, estar, ter e haver', [
      ['Ser e estar', 'identidade e estado: É professor. Está cansado.'],
      ['Estar a + infinitivo', 'Estou a trabalhar.'],
      ['Ter e haver', 'tenho dois irmãos; há um parque'],
      ['A negação', 'não; nunca, nada, ninguém, já não'],
      ['As perguntas', 'entoação; quem, o que, onde, quando, como, quanto, porque'],
      ['Qual e quanto', 'qual / quais; quanto, quanta, quantos, quantas'],
    ]),
    module('A', 'O presente e o imperativo', [
      ['O presente dos verbos regulares', '-ar, -er, -ir'],
      ['O presente: verbos irregulares frequentes', 'ir, fazer, vir, dar, dizer, pôr, poder, querer'],
      ['Verbos com alternância vocálica', 'dormir / durmo, preferir / prefiro, subir / sobe'],
      ['Os verbos reflexos', 'levantar-se, chamar-se; a posição do pronome'],
      ['Gostar de', 'gosto de café; gosto de viajar'],
      ['Ir + infinitivo', 'Vou jantar fora.'],
      ['O imperativo', 'Fala! Não fales! Fale, por favor.'],
    ]),
    module('A', 'O passado e o futuro', [
      ['O pretérito perfeito simples', 'falei, comi, parti; verbos irregulares'],
      ['O pretérito imperfeito', 'formação; descrição e hábito'],
      ['Perfeito ou imperfeito?', 'ação concluída e cenário'],
      ['Acabar de + infinitivo', 'Acabei de chegar.'],
      ['O futuro e o condicional de cortesia', 'falarei; queria, podia, gostaria'],
    ]),
    module('A', 'Os pronomes', [
      ['Os pronomes pessoais e o tratamento', 'eu, tu, você, o senhor; comigo, contigo'],
      ['Os pronomes de complemento direto', 'o, a, os, as; -lo, -no'],
      ['Os pronomes de complemento indireto', 'lhe, lhes, me, te'],
      ['A colocação dos pronomes', 'Vejo-o. Não o vejo. Já o vi.'],
      ['Os pronomes relativos que e onde', 'a rapariga que …, a cidade onde …'],
    ]),
    module('A', 'As preposições e os advérbios', [
      ['As preposições de lugar', 'em, a, para, de; em casa, para Lisboa'],
      ['As preposições de tempo', 'às oito, em maio, à segunda-feira, há dois anos'],
      ['Os advérbios em -mente', 'rapidamente, facilmente, realmente'],
      ['Os conectores simples', 'e, mas, ou, porque, então, por isso, depois'],
    ]),
    module('A', 'Os números e o tempo', [
      ['Os números', 'de 0 a 1 000 000; dois / duas, duzentos / duzentas'],
      ['As horas e as datas', 'São três e um quarto; no dia 25 de abril'],
      ['Os números ordinais', 'primeiro, segundo, último'],
    ]),
  ],
  B: [
    module('B', 'Os tempos do passado', [
      ['O pretérito perfeito composto', 'Tenho trabalhado muito.'],
      ['O pretérito mais-que-perfeito composto', 'tinha comido; já tinha saído'],
      ['O mais-que-perfeito simples', 'falara; uso na escrita'],
      ['O futuro composto', 'Quando chegares, já terei saído.'],
    ]),
    module('B', 'O condicional', [
      ['O condicional', 'desejo, conselho, hipótese; futuro no passado'],
      ['O condicional composto', 'teria gostado; teria sido melhor'],
    ]),
    module('B', 'O conjuntivo', [
      ['O presente do conjuntivo', 'formação; verbos irregulares: seja, esteja, vá, saiba'],
      ['Conjuntivo com verbos de vontade e sentimento', 'Quero que venhas. Espero que corra bem.'],
      ['Conjuntivo com expressões impessoais', 'é importante que, é possível que'],
      ['Conjuntivo com expressões de dúvida', 'Talvez seja … Não acho que …'],
      ['O pretérito imperfeito do conjuntivo', 'Se eu fosse …; Queria que viesses.'],
      ['O futuro do conjuntivo', 'Quando puderes, liga-me. Se quiseres, vamos.'],
      ['Conjunções com o conjuntivo', 'embora, para que, antes que, a não ser que, caso'],
      ['Conjuntivo ou indicativo?', 'Acho que é / Não acho que seja'],
    ]),
    module('B', 'As frases condicionais', [
      ['Condições reais', 'Se chover, fico em casa.'],
      ['Condições hipotéticas', 'Se tivesse tempo, viajava / viajaria.'],
      ['Condições irreais no passado', 'Se tivesse estudado, teria passado.'],
    ]),
    module('B', 'Os pronomes', [
      ['A colocação dos pronomes', 'próclise, ênclise e mesóclise: dir-lhe-ei'],
      ['As contrações de pronomes', 'mo, to, lho: Dei-lho.'],
      ['Os pronomes relativos', 'o qual, cujo, quem; em que, com quem'],
      ['Os indefinidos', 'alguém, ninguém, algum, nenhum, cada, qualquer'],
    ]),
    module('B', 'Formas do verbo', [
      ['O infinitivo pessoal', 'É melhor irmos. Para fazerem isso …'],
      ['A voz passiva', 'ser + particípio; por'],
      ['O se impessoal e passivo', 'Vende-se casa. Diz-se que …'],
      ['O gerúndio', 'Estudando, aprende-se.'],
      ['As perífrases verbais', 'ter de, dever, andar a, costumar, voltar a, deixar de'],
      ['Os particípios duplos', 'aceitado / aceite, ganhado / ganho'],
    ]),
    module('B', 'O discurso indireto', [
      ['O discurso indireto', 'dizer que, perguntar se; mudança de tempos'],
      ['As perguntas indiretas', 'Não sei onde fica …'],
    ]),
    module('B', 'Conectores e texto', [
      ['Causa e consequência', 'como, visto que, uma vez que; por isso, portanto'],
      ['Oposição e concessão', 'no entanto, contudo, apesar de, mesmo que'],
      ['Tempo', 'enquanto, assim que, logo que, até que'],
      ['Preposições depois de verbos', 'gostar de, pensar em, precisar de, acabar por'],
    ]),
  ],
  C: [
    module('C', 'O verbo', [
      ['Os tempos compostos do conjuntivo', 'tenha feito, tivesse feito, tiver feito'],
      ['O conjuntivo em frases independentes', 'Oxalá venha! Quem me dera!'],
      ['Condicionais mistas', 'Se tivesse estudado, agora seria médico.'],
      ['O infinitivo pessoal composto', 'Por termos chegado tarde, …'],
      ['O particípio e o gerúndio em orações reduzidas', 'Terminado o jantar, …; Tendo acabado, …'],
    ]),
    module('C', 'A frase complexa', [
      ['As orações concessivas', 'embora, ainda que, por mais que, se bem que'],
      ['As orações finais e consecutivas', 'a fim de que, de modo que, tão … que'],
      ['As orações temporais', 'mal, assim que, antes que, depois que'],
      ['As orações condicionais', 'desde que, a menos que, contanto que, caso'],
      ['As relativas com conjuntivo', 'Procuro alguém que saiba …'],
    ]),
    module('C', 'Estilo e registo', [
      ['A ordem das palavras e a ênfase', 'É ele que …; Esse livro, já o li.'],
      ['A nominalização', 'a chegada, a decisão de …'],
      ['Os marcadores do discurso', 'aliás, portanto, quer dizer, ora bem, pois'],
      ['O registo formal', 'o senhor, V. Ex.ª; cartas e emails formais'],
      ['Os afixos', 'diminutivos e aumentativos: -inho, -ão; des-, re-, in-'],
      ['As expressões idiomáticas', 'meter água, estar com a pulga atrás da orelha'],
      ['Português europeu e do Brasil', 'estar a fazer / estar fazendo, tu / você, léxico'],
    ]),
  ],
};
