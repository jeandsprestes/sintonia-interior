/*
  Conteúdo: a trilha de 7 dias "Voltar para mim" (especificação, 6.5), no formato de 7.8.
  Os passos usam o mesmo formato das práticas (ver o topo de praticas.js).

  EXPORTS
    TRILHA                   { nome: "Voltar para mim", dias: 7 }
    FASES                    as três fases, na ordem:
                             { id, nome, rotulo, icone, frase, dias: [n] }
                             rotulo aparece no caminho de T13; frase, na abertura do primeiro dia da fase (T14);
                             icone é o nome do ícone em desenhos.js (as ondas são "emocoes", o ramo é "corpo",
                             a lótus é "espirito").
    DIAS                     os 7 dias, na ordem 1 a 7.
    diaDaTrilha(n)           o dia n (1 a 7, número, "3" ou "T3") ou null.
    faseDoDia(n)             a fase do dia n ou null.
    fraseDoCuidado(cuidado, { pastilhas })  o cartão do cuidado possível (regra de escrita do Dia 6).

  DIA
    {
      id: "T1", n: 1,
      titulo: string,
      fase: "perceber" | "compreender" | "escolher",
      dimensao: "corpo" | "emocoes" | "mente" | "espirito" | null   (Dia 3: null, as quatro dimensões)
      tempo: 5,                       minutos da completa
      minimaMin: 1 | 2,               minutos da mínima (no Dia 7, 2)
      linha: string,                  a linha do dia; faz o papel do "o que é" das práticas
      perguntaAntes?: { texto, sim, nao }   só no Dia 1 (a régua antes do primeiro passo)
      porque: string,
      tom: { pratico: { abre, fecha }, espiritual: { abre, fecha } },
      completa: [passo],
      minima: [passo],
      palavra: string,                a chave da resposta que vira pétala em Olhar o caminho (T15)
      guarda: [string],               as chaves das respostas que o dia guarda (7.6)
      linksNoFecho: [{ texto, destino, se? }],
      audio: null
    }

  RESPOSTAS DE CADA DIA (as chaves de guarda)
    Dia 1  antes, depois (da régua, se mediu), palavra
    Dia 2  palavras (lista), maisForte, lugares (lista)
    Dia 3  corpo, emocoes, mente, espirito (cada uma de 0 a 3: "Quase nenhum" é 0, "Bastante" é 3; no
           desenho do mapa, valor + 1 contornos), dimensao (o nome: "Corpo", "Emoções", "Mente", "Espírito")
    Dia 4  travas (lista), principal, menorVersao
    Dia 5  momento, coisas (lista, vai para fazBem.coisas), musica (fazBem.musica), frase (fazBem.frase), escolha
    Dia 6  gesto, momento, minima (viram cuidadoPossivel)
    Dia 7  percebeu, palavra, mapa2 ({ corpo, emocoes, mente, espirito }, se refez o mapa)
    Nas mínimas, a escolha única grava direto na chave de palavra (Dia 2 maisForte, Dia 4 principal,
    Dia 5 escolha), então a pétala sempre tem de onde vir.

  CHAVES CALCULADAS (não são respostas; quem preenche é a tela)
    Dia 3  {pratica} e {praticaId}: a prática sugerida para a dimensão escolhida (6.5, "Regra da sugestão":
           a primeira daquela dimensão, de P01 a P18, que a pessoa ainda não fez; se já fez todas, a primeira).
    Dia 6  {dia3.dimensao}, {dia4.principal}, {dia5.escolha}: respostas guardadas dos dias anteriores.
    Dia 7  os cartões (DIAS[6].cartoes): {antes}, {depois} e {data}.

  O passo 3 do Dia 7 (refazer o mapa e comparar) usa as quatro perguntas do Dia 3 (perguntasDe: 3) e
  mostra os dois mapas lado a lado, com os rótulos "DIA 3" e "HOJE", sem nenhum comentário do app.
  Se o Dia 7 é o sétimo dia de cuidado do ciclo, a flor abre no fecho dele (regra de 7.5, não daqui).
*/

export const TRILHA = { nome: "Voltar para mim", dias: 7 };

export const FASES = [
  {
    id: "perceber", nome: "Perceber",
    rotulo: "PERCEBER · DIAS 1 A 3", icone: "emocoes",
    frase: "Nos três primeiros dias, o convite é só notar como você está, sem mudar nada ainda.",
    dias: [1, 2, 3]
  },
  {
    id: "compreender", nome: "Compreender",
    rotulo: "COMPREENDER · DIAS 4 E 5", icone: "corpo",
    frase: "Nos dias 4 e 5, você olha para o que atrapalha e para o que ajuda.",
    dias: [4, 5]
  },
  {
    id: "escolher", nome: "Escolher",
    rotulo: "ESCOLHER · DIAS 6 E 7", icone: "espirito",
    frase: "Nos dias 6 e 7, você escolhe um cuidado possível e o que levar adiante.",
    dias: [6, 7]
  }
];

/* ------------------------------------------------------------------ passos repetidos */

const DIA1_PALAVRA = {
  tipo: "escolher", max: 1, chave: "palavra",
  pergunta: "Que palavra descreve este instante?",
  opcoes: ["Pausa", "Pressa", "Silêncio", "Barulho", "Calma", "Peso", "Leveza", "Cansaço"],
  outra: "Outra"
};

// Dia 2: em ordem misturada de propósito, para não separar sentimentos em bons e ruins.
const DIA2_SENTIMENTOS = [
  "Cansaço", "Calma", "Tristeza", "Alívio", "Raiva", "Alegria", "Medo", "Esperança", "Culpa", "Gratidão",
  "Preocupação", "Saudade", "Irritação", "Ternura", "Solidão", "Paz", "Frustração", "Leveza", "Vergonha",
  "Confiança", "Angústia", "Tédio", "Vazio", "Confusão"
];

const DIA3_ESPACO = ["Quase nenhum", "Pouco", "Algum", "Bastante"];
const DIA3_VALORES = [0, 1, 2, 3];
const DIA3_DIMENSOES = ["Corpo", "Emoções", "Mente", "Espírito"];
const DIA3_SUGESTAO = "Uma prática de {dimensao} para um dia destes: {pratica}.";

const DIA4_TRAVAS = [
  "Falta de tempo", "Culpa de parar", "Esqueço", "Acho que não adianta", "Começo e paro",
  "Cansaço demais até para começar", "Não sei por onde começar"
];
const DIA4_PERGUNTA = "Quando você pensa em se cuidar, o que costuma atrapalhar?";
const DIA4_RESPOSTAS = {
  "Falta de tempo": "Por isso tudo aqui cabe em 1 minuto. A versão mínima conta como dia inteiro.",
  "Culpa de parar": "Você não precisa merecer uma pausa. Um minuto seu não tira nada de ninguém.",
  "Esqueço": "No Dia 6, você vai ligar um gesto pequeno a algo que já faz todo dia. Assim fica mais fácil lembrar.",
  "Acho que não adianta": "Faz sentido duvidar. O experimento de 1 minuto mede a sua tensão antes e depois, e o resultado é seu.",
  "Começo e paro": "Aqui, parar não apaga nada. A trilha espera onde você deixou, e a flor só descansa.",
  "Cansaço demais até para começar": "Então comece pelo menor: a versão mínima, ou só respirar no Estou no limite.",
  "Não sei por onde começar": "Comece pelo Hoje. Ele pergunta como você está e sugere duas opções.",
  "Outra coisa": "Anotado. No Dia 7, você vai ver isso de novo."
};

const DIA5_FAZ_BEM = [
  "Dormir bem", "Caminhar", "Conversar com alguém", "Silêncio", "Música", "Natureza", "Escrever",
  "Rezar ou meditar", "Cozinhar", "Ler", "Dançar", "Banho demorado", "Rir", "Arte"
];
const DIA5_GUARDADO = "Isso fica guardado. Num dia pesado, você encontra essas palavras no Estou no limite.";

// Dia 6: as pastilhas fixas do gesto (os itens da lista do Dia 5 entram depois delas) e os momentos.
const DIA6_GESTOS = [
  "Beber um copo d’água devagar", "Respirar fundo três vezes", "Alongar o pescoço", "Olhar longe por um minuto",
  "Pôr a mão no peito", "Ouvir uma música", "Escrever uma linha"
];
const DIA6_GESTO = {
  tipo: "escolher", max: 1, chave: "gesto",
  pergunta: "Escolha um gesto de cuidado que caiba em 2 minutos.",
  opcoes: DIA6_GESTOS,
  opcoesDe: { estado: "fazBem.coisas", posicao: "depois" },
  outra: "Outro", outraDica: "Comece por um verbo, como caminhar ou ligar"
};
const DIA6_MOMENTO = {
  tipo: "escolher", max: 1, opcional: true, chave: "momento",
  pergunta: "Em que momento do dia ele cabe? Escolha algo que você já faz todo dia.",
  opcoes: ["Depois do café", "Depois de escovar os dentes", "Ao chegar em casa", "Ao sentar para trabalhar", "Antes de dormir"],
  outra: "Outro"
};

const DIA7_PALAVRA = {
  tipo: "escolher", max: 1, chave: "palavra",
  pergunta: "Que palavra você quer levar adiante?",
  opcoes: ["Pausa", "Gentileza", "Presença", "Paciência", "Coragem", "Leveza", "Constância", "Descanso"],
  outra: "Outra"
};

/* ------------------------------------------------------------------ os 7 dias */

export const DIAS = [
  {
    id: "T1", n: 1,
    titulo: "Parar por um instante",
    fase: "perceber", dimensao: "mente", tempo: 5, minimaMin: 1,
    linha: "Interromper o piloto automático por alguns minutos.",
    perguntaAntes: { texto: "Quer medir a tensão antes e depois? Leva 5 segundos.", sim: "Medir", nao: "Agora não" },
    porque: "No piloto automático, o dia passa sem que a gente note como está. Parar de propósito, mesmo por um minuto, abre um intervalo para perceber. O resto da trilha parte daqui.",
    tom: {
      pratico: { abre: "Primeiro dia. Hoje, a prática é só parar um pouco.", fecha: "O próximo dia fica para quando você quiser." },
      espiritual: { abre: "Primeiro dia: um instante de silêncio para você.", fecha: "Esse instante é seu. Volte a ele quando precisar." }
    },
    completa: [
      { tipo: "texto", seg: 20, texto: "Pare onde está. Ponha os dois pés no chão." },
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 4,
        texto: "Solte o ar devagar pela boca, como quem sopra a chama de uma vela sem apagar." },
      { tipo: "texto", seg: 40, texto: "Agora deixe a respiração do jeito dela. Só repare: curta ou longa, no peito ou na barriga?" },
      { tipo: "texto", seg: 40, texto: "Olhe em volta. Encontre três coisas que você vê." },
      { tipo: "texto", seg: 40, semTela: true, texto: "Feche os olhos, se quiser. Escute dois sons." },
      { tipo: "texto", seg: 40, texto: "Repare em uma coisa que o corpo sente: a roupa, a cadeira, o chão." },
      DIA1_PALAVRA,
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 4, texto: "Mais quatro respirações devagar." },
      { tipo: "texto", seg: 20, texto: "Abra os olhos. Você parou por alguns minutos." }
    ],
    minima: [
      { tipo: "texto", seg: 10, texto: "Pés no chão." },
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 4, texto: "Solte o ar devagar, quatro vezes." },
      DIA1_PALAVRA
    ],
    palavra: "palavra",
    guarda: ["antes", "depois", "palavra"],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "T2", n: 2,
    titulo: "Como estou por dentro",
    fase: "perceber", dimensao: "emocoes", tempo: 5, minimaMin: 1,
    linha: "Nomear o que sente, sem julgar.",
    porque: "Pôr em palavras o que se sente costuma deixar o sentimento um pouco menos forte. Dar nome ajuda a olhar para ele de um pouco mais longe, sem precisar resolver nada.",
    tom: {
      pratico: { abre: "Segundo dia: dar nome ao que está aí.", fecha: "As palavras ficam guardadas só aqui. No Dia 7, você vai vê-las de novo." },
      espiritual: { abre: "Segundo dia: escute o que se passa por dentro, com gentileza.", fecha: "O que você sente também merece acolhimento." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Três respirações para chegar." },
      { tipo: "texto", seg: 60, texto: "Passe a atenção pelo corpo: testa, mandíbula, ombros, peito, barriga. Só repare." },
      { tipo: "escolher", max: 3, chave: "palavras",
        pergunta: "Que palavras chegam perto do que você sente agora?",
        apoio: "Pode ser mais de uma, e elas podem não combinar entre si.",
        opcoes: DIA2_SENTIMENTOS, outra: "Outra palavra" },
      { tipo: "escolher", max: 1, chave: "maisForte", deMarcadas: "palavras", pergunta: "Qual delas está mais forte agora?" },
      { tipo: "escolher", chave: "lugares", pergunta: "Onde isso aparece no corpo?",
        opcoes: ["Cabeça", "Mandíbula", "Garganta", "Peito", "Ombros", "Estômago", "Barriga", "Mãos", "Pernas", "Não sei"] },
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 4, texto: "Ponha a mão onde você sente. Respire ali, devagar." },
      { tipo: "texto", seg: 20, texto: "Diga por dentro: *isso é {maisForte|minuscula}, e tudo bem sentir.*" },
      { tipo: "texto", seg: 30, texto: "Repare se algo mudou, mesmo que pouco. Se nada mudou, tudo bem também." }
    ],
    minima: [
      { tipo: "escolher", max: 1, chave: "maisForte", pergunta: "Complete: agora eu sinto...",
        opcoes: DIA2_SENTIMENTOS, outra: "Outra palavra" },
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Mão no peito. Três respirações." }
    ],
    palavra: "maisForte",
    guarda: ["palavras", "maisForte", "lugares"],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "T3", n: 3,
    titulo: "Meu mapa de cuidado",
    fase: "perceber", dimensao: null, tempo: 5, minimaMin: 1,
    linha: "Ver como andam o corpo, as emoções, a mente e o espírito.",
    porque: "Quando a gente cuida de uma parte só, as outras ficam esquecidas sem que se perceba. Ver as quatro juntas ajuda a escolher por onde começar, sem tentar dar conta de tudo de uma vez.",
    tom: {
      pratico: { abre: "Terceiro dia: um retrato rápido de como anda o seu cuidado.", fecha: "Mapa feito. A primeira fase, Perceber, está completa." },
      espiritual: { abre: "Terceiro dia: olhe para você por inteiro.", fecha: "Perceber já é um jeito de se cuidar. A primeira fase está completa." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Três respirações para começar." },
      { tipo: "escolher", max: 1, chave: "corpo", opcoes: DIA3_ESPACO, valores: DIA3_VALORES,
        pergunta: "Corpo: respirar, alongar, beber água, dormir. Quanto espaço isso tem tido na sua vida?" },
      { tipo: "escolher", max: 1, chave: "emocoes", opcoes: DIA3_ESPACO, valores: DIA3_VALORES,
        pergunta: "Emoções: perceber o que sente e se acolher. Quanto espaço isso tem tido?" },
      { tipo: "escolher", max: 1, chave: "mente", opcoes: DIA3_ESPACO, valores: DIA3_VALORES,
        pergunta: "Mente: foco, clareza, cabeça descansada. Quanto espaço isso tem tido?" },
      { tipo: "escolher", max: 1, chave: "espirito", opcoes: DIA3_ESPACO, valores: DIA3_VALORES,
        pergunta: "Espírito: presença, sentido, valores, arte. Quanto espaço isso tem tido?" },
      { tipo: "mostrar", seg: 60, figura: "mapa",
        modelo: "Este é o seu mapa de hoje. Ele pode mudar amanhã, e tudo bem." },
      // Vem marcada a dimensão com menos espaço; no empate, vale a ordem Corpo, Emoções, Mente, Espírito.
      { tipo: "escolher", max: 1, chave: "dimensao", preMarcar: "menosEspaco",
        pergunta: "Qual parte pede mais cuidado agora?", opcoes: DIA3_DIMENSOES },
      { tipo: "mostrar", seg: 30, modelo: DIA3_SUGESTAO }
    ],
    minima: [
      { tipo: "escolher", max: 1, chave: "dimensao", pergunta: "Das quatro, qual pede mais cuidado agora?", opcoes: DIA3_DIMENSOES },
      { tipo: "mostrar", seg: 30, icone: "dimensao", modelo: DIA3_SUGESTAO }
    ],
    palavra: "dimensao",
    guarda: ["corpo", "emocoes", "mente", "espirito", "dimensao"],
    linksNoFecho: [
      { texto: "Abrir {pratica}", destino: "#/pratica/{praticaId}" }
    ],
    audio: null
  },

  {
    id: "T4", n: 4,
    titulo: "O que me trava",
    fase: "compreender", dimensao: "mente", tempo: 5, minimaMin: 1,
    linha: "Descobrir o que atrapalha o seu cuidado.",
    porque: "Saber o que atrapalha permite planejar em volta disso. Quem esquece pode ligar o cuidado a algo que já faz todo dia, e quem duvida pode testar antes de acreditar.",
    tom: {
      pratico: { abre: "Começa a fase Compreender. Hoje, olhar para o que trava, sem bronca.", fecha: "Uma trava conhecida é mais fácil de contornar." },
      espiritual: { abre: "Quarto dia: olhar com paciência para o que te segura.", fecha: "Ver o que trava, sem se culpar, também é cuidado." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 4, texto: "Quatro respirações devagar." },
      { tipo: "escolher", max: 2, chave: "travas", pergunta: DIA4_PERGUNTA, opcoes: DIA4_TRAVAS, outra: "Outra coisa" },
      { tipo: "mostrar", seg: 60, chave: "travas", respostasPorOpcao: DIA4_RESPOSTAS },
      { tipo: "escolher", max: 1, chave: "principal", deMarcadas: "travas", pergunta: "Qual delas aparece mais?" },
      { tipo: "escrever", opcional: true, chave: "menorVersao",
        pergunta: "Qual seria a menor versão de cuidado que passa por essa trava?",
        exemplo: "um minuto de respiração antes de abrir o computador" },
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 2, texto: "Mais duas respirações.",
        apoio: "Isso fica guardado para o Dia 7." }
    ],
    minima: [
      { tipo: "escolher", max: 1, chave: "principal", pergunta: DIA4_PERGUNTA, opcoes: DIA4_TRAVAS, outra: "Outra coisa" },
      { tipo: "mostrar", seg: 60, chave: "principal", respostasPorOpcao: DIA4_RESPOSTAS }
    ],
    palavra: "principal",
    guarda: ["travas", "principal", "menorVersao"],
    linksNoFecho: [
      { texto: "Fazer o experimento", destino: "#/experimento", se: { chaves: ["travas", "principal"], valor: "Acho que não adianta" } }
    ],
    audio: null
  },

  {
    id: "T5", n: 5,
    titulo: "O que me faz bem",
    fase: "compreender", dimensao: "espirito", tempo: 5, minimaMin: 1,
    linha: "Lembrar do que ajudou, com uma música ou uma frase.",
    porque: "Na hora do aperto, fica difícil lembrar do que ajuda. Uma lista feita num momento mais calmo fica pronta para os dias pesados, nas suas palavras.",
    tom: {
      pratico: { abre: "Quinto dia: a sua lista do que funciona para você.", fecha: "Lista pronta. Ela está no Estou no limite para quando você precisar." },
      espiritual: { abre: "Quinto dia: lembrar do que te alimenta por dentro.", fecha: "O que te faz bem diz muito de quem você é." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Três respirações." },
      { tipo: "escrever", opcional: true, longo: true, chave: "momento",
        pergunta: "Lembre de um momento recente em que você se sentiu um pouco melhor. O que estava acontecendo?" },
      { tipo: "escolher", max: 5, chave: "coisas", vaiPara: "fazBem.coisas",
        pergunta: "O que costuma te fazer bem?", opcoes: DIA5_FAZ_BEM, outra: "Outra coisa", outraRepete: true },
      { tipo: "escrever", opcional: true,
        campos: [
          { chave: "musica", pergunta: "Uma música que te faz bem", vaiPara: "fazBem.musica" },
          { chave: "frase", pergunta: "Uma frase que te ajuda", vaiPara: "fazBem.frase" }
        ],
        apoio: "Pode ser de alguém, de um livro ou sua." },
      { tipo: "escolher", max: 1, chave: "escolha", deMarcadas: "coisas", pergunta: "Qual destas cabe nos próximos dias?" },
      { tipo: "mostrar", seg: 30, modelo: DIA5_GUARDADO }
    ],
    minima: [
      { tipo: "escolher", max: 1, chave: "escolha", vaiPara: "fazBem.coisas",
        pergunta: "Uma coisa pequena que te faz bem:", opcoes: DIA5_FAZ_BEM, outra: "Outra coisa" },
      { tipo: "mostrar", seg: 30, modelo: DIA5_GUARDADO }
    ],
    palavra: "escolha",
    guarda: ["momento", "coisas", "musica", "frase", "escolha"],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "T6", n: 6,
    titulo: "Meu cuidado possível",
    fase: "escolher", dimensao: "corpo", tempo: 5, minimaMin: 1,
    linha: "Escolher um gesto pequeno que cabe no seu dia.",
    porque: "Ligar um gesto novo a algo que você já faz todo dia ajuda a lembrar sem depender de força de vontade. Um gesto pequeno é mais fácil de repetir num dia cheio, e decidir antes a versão dos dias difíceis tira o peso de decidir na hora.",
    tom: {
      pratico: { abre: "Começa a fase Escolher, com um cuidado só.", fecha: "Combinado. Ele aparece na tela Hoje, com o botão Fiz hoje." },
      espiritual: { abre: "Sexto dia: escolher, com carinho, um jeito de se cuidar.", fecha: "Que esse gesto pequeno te acompanhe nos próximos dias." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Três respirações." },
      { tipo: "mostrar", seg: 20, texto: "Nos últimos dias, você notou:",
        linhas: [
          { modelo: "Pede mais cuidado: {dia3.dimensao}" },
          { modelo: "O que trava: {dia4.principal}" },
          { modelo: "O que ajuda: {dia5.escolha}" }
        ] },
      DIA6_GESTO,
      DIA6_MOMENTO,
      { tipo: "escrever", opcional: true, chave: "minima",
        pergunta: "E a versão mínima dele, para os dias difíceis?", exemplo: "abrir a janela e respirar fundo uma vez" },
      { tipo: "mostrar", seg: 30, cartao: "cuidado", grande: true },
      { tipo: "texto", seg: 60, texto: "Se der, faça o gesto agora, uma vez. Se não der, imagine o lugar e a hora em que ele vai acontecer." },
      { tipo: "texto", seg: 20, texto: "Seu cuidado possível fica na tela Hoje, com o botão Fiz hoje. Se esquecer um dia, ele continua lá." }
    ],
    minima: [
      DIA6_GESTO,
      DIA6_MOMENTO,
      { tipo: "mostrar", seg: 30, cartao: "cuidado", grande: true }
    ],
    // O cartão, grande, em Fraunces. Ver fraseDoCuidado, no fim deste arquivo.
    cartao: {
      comMomento: "{momento}: {gesto}.",
      semMomento: "Meu cuidado possível: {gesto}.",
      minima: "Nos dias difíceis: {minima}."
    },
    palavra: "gesto",
    guarda: ["gesto", "momento", "minima"],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "T7", n: 7,
    titulo: "Olhar o caminho",
    fase: "escolher", dimensao: "espirito", tempo: 5, minimaMin: 2,
    linha: "Ver o que percebeu e escolher o que levar adiante.",
    porque: "Olhar para trás mostra o que já mudou, mesmo que pouco, e o que ainda pede atenção. Escolher uma palavra para levar dá uma direção simples aos próximos dias.",
    tom: {
      pratico: { abre: "Sétimo dia: ver o que ficou desses dias.", fecha: "Trilha completa. Seu cuidado possível continua na tela Hoje." },
      espiritual: { abre: "Sétimo dia: olhar o caminho com gratidão.", fecha: "Voltar para si, um passo possível por vez." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Antes de olhar para trás, três respirações." },
      // Com rolagem, cerca de 2 min; avança no "Próximo".
      { tipo: "mostrar", texto: "Estes foram os seus dias.", cartoesDosDias: true, rolagem: true, estimativa: 120 },
      { tipo: "ferramenta", nome: "mapa", opcional: true, link: "Refazer o mapa de cuidado e comparar",
        chave: "mapa2", perguntasDe: 3, rotulos: ["DIA 3", "HOJE"] },
      { tipo: "escrever", opcional: true, longo: true, chave: "percebeu",
        pergunta: "O que você percebeu sobre você nesses dias?" },
      DIA7_PALAVRA,
      { tipo: "ferramenta", nome: "caminho" },
      { tipo: "texto", seg: 20, texto: "Você terminou a trilha Voltar para mim. Ela fica guardada aqui, e dá para refazer quando quiser." }
    ],
    minima: [
      { tipo: "mostrar", texto: "Estes foram os seus dias.", cartoesDosDias: true, semAnimacao: true },
      DIA7_PALAVRA,
      { tipo: "ferramenta", nome: "caminho" }
    ],
    // Um cartão por dia, só com o que a pessoa guardou. Em porDia, cada item é uma chave das respostas
    // daquele dia; uma lista dentro da lista quer dizer "esta, ou, se não houver, a outra" (a mínima grava
    // a escolha única na chave da palavra). "medicao" é o par antes e depois; "mapa" é o desenho com
    // corpo, emocoes, mente e espirito; "cuidado" é o cartão de fraseDoCuidado.
    // Dia feito na mínima mostra só o que foi respondido; sem nada respondido, mostra semResposta.
    cartoes: {
      medicao: "Antes, {antes}. Depois, {depois}.",
      semResposta: "Feito em {data}, na versão mínima.",
      porDia: {
        1: ["palavra", "medicao"],
        2: [["palavras", "maisForte"], "lugares"],
        3: ["mapa"],
        4: [["travas", "principal"], "menorVersao"],
        5: [["coisas", "escolha"], "musica", "frase"],
        6: ["cuidado"]
      }
    },
    palavra: "palavra",
    guarda: ["percebeu", "palavra", "mapa2"],
    linksNoFecho: [],
    audio: null
  }
];

export function diaDaTrilha(n) {
  const numero = typeof n === "string" ? Number(n.replace(/^T/i, "")) : Number(n);
  return DIAS.find((d) => d.n === numero) || null;
}

export function faseDoDia(n) {
  const dia = diaDaTrilha(n);
  return dia ? FASES.find((f) => f.id === dia.fase) || null : null;
}

/* ------------------------------------------------------------------ o cartão do cuidado possível */

// Regra de escrita do cartão (6.5): sempre "{Momento}: {gesto}.", com a primeira letra do gesto em
// minúscula quando ele vem de uma pastilha; o que a pessoa escreveu fica como ela escreveu. Sem
// momento: "Meu cuidado possível: {gesto}.". A mínima, se houver: "Nos dias difíceis: {mínima}.".
// pastilhas: as do passo 3; passe também os itens de fazBem.coisas, que aparecem ali como pastilhas.
// O momento começa a frase, então ganha a primeira letra maiúscula.
// Devolve { frase, minima } (minima é null quando não há) ou null sem gesto.
export function fraseDoCuidado({ gesto = null, momento = null, minima = null } = {}, { pastilhas = DIA6_GESTOS } = {}) {
  const limpo = (t) => (typeof t === "string" ? t.trim() : "");
  const g0 = limpo(gesto);
  if (!g0) return null;
  const m0 = limpo(momento);
  const n0 = limpo(minima);
  const g = pastilhas.includes(g0) ? g0.charAt(0).toLocaleLowerCase("pt-BR") + g0.slice(1) : g0;
  const m = m0 ? m0.charAt(0).toLocaleUpperCase("pt-BR") + m0.slice(1) : "";
  const comPonto = (t) => (/[.!?…]$/.test(t) ? t : t + ".");
  const cartao = DIAS[5].cartao;
  // A troca usa função para que um "$" escrito pela pessoa não seja lido como padrão de troca.
  const frase = m
    ? cartao.comMomento.replace("{momento}", () => m).replace("{gesto}.", () => comPonto(g))
    : cartao.semMomento.replace("{gesto}.", () => comPonto(g));
  return { frase, minima: n0 ? cartao.minima.replace("{minima}.", () => comPonto(n0)) : null };
}
