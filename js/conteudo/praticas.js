/*
  Conteúdo: as 18 práticas da biblioteca (especificação, 6.4), no formato de 7.8.
  Só dados e duas funções de texto. Nada aqui lê ou grava o estado.

  EXPORTS
    PRATICAS                 lista das 18 práticas, na ordem P01 a P18.
    pratica(id)              a prática com aquele id ("P01" a "P18") ou null.
    FERRAMENTAS              as ferramentas de 6.4: [{ id, titulo, dimensao }] para DESC, EXP e RESP.
    ferramenta(id)           a ferramenta com aquele id ou null.
    DIMENSOES                [{ id, nome }] na ordem Corpo, Emoções, Mente, Espírito.
    nomeDaDimensao(id)       "espirito" dá "Espírito".
    idDaDimensao(nome)       "Espírito" dá "espirito".
    preencher(modelo, valores)  troca as {chaves} de um texto (ver CHAVES, abaixo).
    chavesDe(modelo)         as chaves que um texto usa, na ordem: "{valor}, hoje: {gesto}." dá ["valor", "gesto"].
    juntar(lista)            ["a", "b", "c"] dá "a, b e c".

  PRÁTICA
    {
      id: "P10",
      titulo: string,
      dimensao: "corpo" | "emocoes" | "mente" | "espirito",
      estado: "cansaco" | "sobrecarga" | "desconexao",
      tempo: 2 | 5 | 10,                minutos da célula de 6.4 (a versão completa)
      minimaMin: 1,                     minutos da versão mínima
      oQueE: string,
      precisaDe: string | null,         vem depois de "Você vai precisar de:" (T08)
      aviso: string | null,
      porque: string,                   o "Por que funciona"
      tom: { pratico: { abre, fecha }, espiritual: { abre, fecha } },
      completa: [passo],
      minima: [passo],
      linksNoFecho: [{ texto, destino, se? }],
      duracaoReferencia?: segundos,     só P06 (10 min com duas músicas; o tempo é contado pelo relógio)
      audio: null                       lugar previsto para a voz gravada (8.2)
    }

  PASSO (o campo tipo diz qual é; o que não se aplica fica de fora)
    texto       { tipo, seg, texto, apoio?, semTela?, figura?, proximoLiberado?, semSom?, anel?, seHouver? }
    respirar    { tipo, padrao: "simples" | "duplo" | "aperta", puxa, mais? (só no duplo), solta, ciclos, texto, apoio? }
    escrever    { tipo, pergunta?, exemplo?, chave?, opcional?, campos?, longo?, apoio?, marcar?, estimativa? }
    escolher    { tipo, pergunta, opcoes, max?, chave, outra?, outraDica?, outraRepete?, deMarcadas?,
                  opcoesDe?, valores?, botoes?, repete?, opcional?, apoio?, preMarcar?, vaiPara? }
    mostrar     { tipo, seg?, texto?, modelo?, apoio?, chave?, respostasPorOpcao?, linhas?, grande?, figura?,
                  icone?, cartao?, cartoesDosDias?, rolagem?, semAnimacao?, estimativa? }
    esperar     { tipo, texto, botao, semTela?, id? }
    ferramenta  { tipo, nome: "descarregar" | "mapa" | "caminho" | "regua", minima?, opcional?, link?, chave?, perguntasDe?, rotulos? }

  O QUE CADA CAMPO QUER DIZER
    seg               segundos do passo (texto e mostrar). Mostrar sem seg espera o "Próximo".
    texto             string, ou { pratico, espiritual } quando muda com o tom. Entre asteriscos (*...*) vai em itálico.
    apoio             a linha menor, embaixo do texto.
    semTela           dá para fazer sem olhar o celular; com o som ligado, um toque marca a troca de passo.
    figura            "horizonte" | "ondas" | "autoabraco" | "ramo" | "mapa" (o mapa é o desenho do Dia 3).
    proximoLiberado   true só onde a especificação pede "Próximo" liberado (P15, passo 1).
    semSom            o texto que vale quando o som está desligado (P01, P04 e P17, na mínima).
    anel              true: um anel que se fecha no tempo do passo (o círculo do texto sem som de P01).
    seHouver          { chave, apoio }: quando a chave tem valor, o apoio é trocado por este (P06, a música do Dia 5).
    puxa, mais, solta segundos de cada fase do círculo. No "aperta" (P05), puxa é apertar e solta é soltar.
    ciclos            quantas vezes o círculo faz a volta. Duração do passo = ciclos x (puxa + mais + solta).
    chave             onde a resposta fica guardada (nas respostas da sessão ou do dia da trilha).
    opcional          a pergunta é opcional (o "Pular" existe em todo passo de escrever).
    campos            dois campos no mesmo passo: [{ chave, pergunta, exemplo?, vaiPara? }].
    longo             campo grande, com pauta.
    marcar            caixa de marcar: { texto, chave, marcada, guardaEm }. Marcada, a resposta "musica" vai para guardaEm.
    estimativa        segundos que a especificação estima para um passo que espera a pessoa; serve só à linha de progresso.
    opcoes            as pastilhas, na ordem da especificação.
    max               1: escolher um (a resposta é texto). 2, 3 ou 5: até tantas. Sem max: vários. Com mais de uma, a resposta é lista.
    outra             o nome da última pastilha, que abre um campo; o que a pessoa escreve vira a resposta.
                      Em respostasPorOpcao, a resposta escrita usa o texto guardado com o nome de outra.
    outraDica         a dica do campo de outra.
    outraRepete       o campo de outra pode ser usado mais de uma vez (Dia 5).
    deMarcadas        a chave de um passo anterior: as opções são as que a pessoa marcou ali.
                      Se só uma foi marcada, o passo some e a chave dele recebe essa única.
    opcoesDe          opções que vêm de uma resposta ou do estado, juntas com as fixas:
                      { chave? | estado?, separarPor?, posicao: "antes" | "depois" }.
    valores           a resposta gravada é o valor da mesma posição, não o texto (Dia 3: 0 a 3).
    botoes            as opções aparecem como botões, não como pastilhas (P06, "Mais uma?").
    repete            { opcao: idDoPasso }: tocar naquela opção volta ao passo com esse id (P06).
    preMarcar         regra da opção que já vem marcada (Dia 3: "menosEspaco").
    vaiPara           a resposta também vai para este lugar do estado (fazBem.coisas, fazBem.musica, fazBem.frase).
    modelo            texto com {chaves}; texto é a frase do passo, acima do que é mostrado.
    respostasPorOpcao { opção: texto }, lido na chave do passo; com resposta em lista, mostra o texto de cada uma.
    linhas            [{ modelo }]: só aparecem as linhas cujas chaves têm resposta.
    grande            o que é mostrado vai em tamanho grande.
    icone             a chave cuja resposta é o nome de uma dimensão; mostra o ícone dela.
    cartao            "cuidado": o cartão do cuidado possível (fraseDoCuidado, em trilha.js).
    cartoesDosDias    os cartões do Dia 7 (DIAS[6].cartoes, em trilha.js).

  CHAVES em texto, apoio, modelo, linhas e destino
    {chave}              resposta desta prática ou deste dia (a chave de um passo anterior)
    {dia3.dimensao}      resposta guardada de um dia da trilha (estado.trilha.dias["3"].respostas.dimensao)
    {fazBem.musica}      um campo do estado (fazBem, cuidadoPossivel)
    {chave|minuscula}    o valor todo em minúscula
    {chave|inicial}      o valor com a primeira letra em maiúscula
    Lista vira "a, b e c". Se o valor já termina em ponto, o ponto do modelo não se repete.
    Use o preencher daqui para os textos dos passos: ele entende os filtros e os caminhos com ponto
    (Dia 2, passo 7; P16, passo 5; Dia 6, passo 2; P06, passo 1). Um preencher que só troca {chave}
    deixaria esses textos com buracos.

  linksNoFecho        [{ texto, destino, se? }]. destino é um endereço de 2.3 ("#/pratica/P03", "#/descarregar",
                      "#/limite", "#/experimento"). se: { chaves: [...], valor } mostra o link só quando uma
                      dessas respostas é o valor (ou o contém, se for lista). Os links aparecem no fecho (T12).

  TEMPO DAS VERSÕES (critério 32)
    Contam o seg dos passos de texto e de mostrar e os ciclos do respirar. Escrever, escolher, esperar,
    ferramenta e mostrar sem seg esperam a pessoa e não contam.

  Os objetos são lidos por várias telas: não mude nenhum deles; copie antes, se precisar.
*/

export const DIMENSOES = [
  { id: "corpo", nome: "Corpo" },
  { id: "emocoes", nome: "Emoções" },
  { id: "mente", nome: "Mente" },
  { id: "espirito", nome: "Espírito" }
];

export function nomeDaDimensao(id) {
  const d = DIMENSOES.find((x) => x.id === id);
  return d ? d.nome : null;
}

export function idDaDimensao(nome) {
  const d = DIMENSOES.find((x) => x.nome === nome);
  return d ? d.id : null;
}

/* Ferramentas (6.4): Respirar comigo é a mesma tela de dentro do Estou no limite (6.6), aberta como tela
   de foco; fora do limite, "Já está bom" segue direto para o fecho com a flor, e a sessão conta com 60 s
   ou mais. Descarregar a cabeça é a ferramenta de 6.7, que também é a prática P09. O experimento é 6.8.
   Os textos das três estão em textos.js (DESCARREGAR, EXPERIMENTO, RESP). */
export const FERRAMENTAS = [
  { id: "DESC", titulo: "Descarregar a cabeça", dimensao: "mente" },
  { id: "EXP", titulo: "Experimento de 1 minuto", dimensao: null },
  { id: "RESP", titulo: "Respirar comigo", dimensao: "corpo" }
];

export function ferramenta(id) {
  return FERRAMENTAS.find((f) => f.id === id) || null;
}

/* ------------------------------------------------------------------ passos repetidos */

// P02: os passos 2 e 3 também são a mínima.
const P02_ESCOLHA = {
  tipo: "escolher", max: 1, chave: "cansaco",
  pergunta: "Que cansaço é esse?",
  opcoes: ["Sono", "Corpo pesado", "Cabeça cheia", "De cuidar de todo mundo", "De tudo", "Não sei"]
};
const P02_RESPOSTA = {
  tipo: "mostrar", seg: 40, chave: "cansaco",
  respostasPorOpcao: {
    "Sono": "Sono pede descanso. Se der, feche os olhos por alguns minutos hoje. Se não der, tente dormir um pouco mais cedo.",
    "Corpo pesado": "Corpo parado pede movimento leve. Levante e espreguice por um minuto.",
    "Cabeça cheia": "Cabeça cheia pede menos estímulo. Fique alguns minutos longe da tela, ou ponha tudo para fora.",
    "De cuidar de todo mundo": "Quem cuida de todo mundo também precisa de um tempo em que ninguém pede nada. Cinco minutos de porta fechada já contam.",
    "De tudo": "Quando é de tudo, comece pelo menor. Hoje, um minuto já basta.",
    "Não sei": "Tudo bem não saber. Parar para perguntar já foi um jeito de olhar para si."
  }
};

// P05: uma parte do corpo por passo. Apertar 5 s e soltar 22 s, duas vezes (54 s por parte).
const P05_APOIO = "Aperte, conte até 5 e solte.";
const p05Parte = (texto) => ({ tipo: "respirar", padrao: "aperta", puxa: 5, solta: 22, ciclos: 2, texto, apoio: P05_APOIO });

// P14: a frase do passo 3, que também fecha a mínima.
const P14_FRASE = {
  pratico: "Diga por dentro: *estou aqui comigo.*",
  espiritual: "Diga por dentro: *eu me recebo como estou.*"
};

// P16: os valores, no passo 2 e na mínima.
const P16_VALORES = [
  "Família", "Amizade", "Saúde", "Calma", "Liberdade", "Aprender", "Criar", "Cuidar de alguém",
  "Natureza", "Fé", "Trabalho bem feito", "Alegria", "Honestidade", "Beleza", "Descanso"
];

/* ------------------------------------------------------------------ as 18 práticas */

export const PRATICAS = [
  {
    id: "P01",
    titulo: "Olhar longe",
    dimensao: "mente", estado: "cansaco", tempo: 2, minimaMin: 1,
    oQueE: "Dar descanso aos olhos e à atenção, olhando para o ponto mais distante que você encontrar.",
    precisaDe: "uma janela, ou o ponto mais longe do lugar onde você está.",
    aviso: null,
    porque: "Para enxergar de perto, pequenos músculos dentro do olho ficam contraídos. Olhando para longe, eles relaxam, e a atenção sai da tela por um tempo. Quem passa horas no celular ou no computador costuma sentir essa diferença nos olhos.",
    tom: {
      pratico: { abre: "Uma pausa para os olhos, sem sair do lugar.", fecha: "Volte para perto aos poucos, piscando devagar." },
      espiritual: { abre: "Deixe o olhar ir até onde a vista alcança.", fecha: "Leve um pouco desse horizonte para o resto do dia." }
    },
    completa: [
      { tipo: "texto", seg: 15, texto: "Procure o ponto mais longe que dá para ver.", apoio: "O céu, uma árvore, o fim de um corredor." },
      { tipo: "texto", seg: 45, semTela: true, texto: "Deixe os olhos pousarem lá, sem forçar o foco." },
      { tipo: "texto", seg: 30, texto: "Repare nas cores e no que se mexe lá longe." },
      { tipo: "texto", seg: 30, texto: "Pisque devagar algumas vezes e solte o ar." }
    ],
    minima: [
      { tipo: "texto", seg: 10, texto: "Procure o ponto mais longe que dá para ver." },
      { tipo: "texto", seg: 50, semTela: true, anel: true,
        texto: "Deixe os olhos descansarem lá até o sino.",
        semSom: "Deixe os olhos descansarem lá até o círculo se fechar." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P02",
    titulo: "Que cansaço é esse?",
    dimensao: "emocoes", estado: "cansaco", tempo: 2, minimaMin: 1,
    oQueE: "Dar nome ao tipo de cansaço para descobrir do que ele precisa.",
    precisaDe: null,
    aviso: null,
    porque: "Cansaço tem tipos, e cada tipo pede um cuidado diferente. Dar nome ajuda a escolher o que combina com o seu, em vez de seguir no automático.",
    tom: {
      pratico: { abre: "Antes de resolver o cansaço, descubra de que tipo ele é.", fecha: "Agora você sabe um pouco mais do que ele pede." },
      espiritual: { abre: "Escute o seu cansaço com o carinho que daria a alguém querido.", fecha: "O cansaço também tinha algo a dizer, e você parou para ouvir." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 2, texto: "Solte o ar devagar, duas vezes." },
      P02_ESCOLHA,
      P02_RESPOSTA,
      { tipo: "escrever", opcional: true, chave: "coisaPequena",
        pergunta: "Uma coisa pequena para fazer com isso ainda hoje:", exemplo: "deitar dez minutos depois do almoço" }
    ],
    minima: [P02_ESCOLHA, P02_RESPOSTA],
    linksNoFecho: [
      { texto: "Abrir Espreguiçar sem pressa", destino: "#/pratica/P03", se: { chaves: ["cansaco"], valor: "Corpo pesado" } },
      { texto: "Abrir Descarregar a cabeça", destino: "#/descarregar", se: { chaves: ["cansaco"], valor: "Cabeça cheia" } },
      { texto: "Abrir Estou no limite", destino: "#/limite", se: { chaves: ["cansaco"], valor: "De tudo" } }
    ],
    audio: null
  },

  {
    id: "P03",
    titulo: "Espreguiçar sem pressa",
    dimensao: "corpo", estado: "cansaco", tempo: 5, minimaMin: 1,
    oQueE: "Alongar o corpo devagar, do pescoço aos pés, na cadeira ou em pé.",
    precisaDe: null,
    aviso: "Faça só o que for confortável. Se doer, pare.",
    porque: "Muito tempo na mesma posição deixa o corpo duro e pesado. Mexer devagar põe o corpo em movimento e mostra onde a tensão estava guardada. O corpo já faz isso sozinho ao acordar; aqui você faz de propósito.",
    tom: {
      pratico: { abre: "Hora de desenferrujar, do pescoço aos pés.", fecha: "Repare nos ombros agora e siga no seu ritmo." },
      espiritual: { abre: "Volte a morar no corpo, um movimento de cada vez.", fecha: "Agradeça ao corpo que te carrega o dia inteiro." }
    },
    completa: [
      { tipo: "texto", seg: 20, texto: "Pés no chão, na cadeira ou em pé." },
      { tipo: "texto", seg: 45, texto: "Leve os braços para cima e espreguice como quem acorda, devagar." },
      { tipo: "texto", seg: 40, texto: "Incline a cabeça para um lado, respire, e depois para o outro." },
      { tipo: "texto", seg: 40, texto: "Gire os ombros para trás cinco vezes. Depois, para a frente." },
      { tipo: "texto", seg: 45, texto: "Mãos na cintura. Gire o tronco com calma, olhando por cima de um ombro e depois do outro." },
      { tipo: "texto", seg: 35, texto: "Abra e feche as mãos. Gire os punhos." },
      { tipo: "texto", seg: 35, texto: "Se der, fique em pé e suba na ponta dos pés algumas vezes, devagar." },
      { tipo: "texto", seg: 40, texto: "Pare. Repare onde o corpo ficou mais leve." }
    ],
    minima: [
      { tipo: "texto", seg: 30, texto: "Braços para cima. Espreguice como quem acorda." },
      { tipo: "texto", seg: 30, texto: "Gire os ombros para trás, devagar." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P04",
    titulo: "Licença para descansar",
    dimensao: "emocoes", estado: "cansaco", tempo: 5, minimaMin: 1,
    oQueE: "Cinco minutos de descanso de verdade, com permissão para não fazer nada.",
    precisaDe: null,
    aviso: null,
    porque: "Muita gente cansada não descansa porque sente que parar é errado. Dizer para si que pode parar diminui essa briga por dentro, e o descanso fica mais fácil. As mãos quentes sobre os olhos dão a eles alguns minutos sem luz e sem tela.",
    tom: {
      pratico: { abre: "Cinco minutos sem obrigação nenhuma.", fecha: "O resto do dia continua lá, esperando por você." },
      espiritual: { abre: "Receba este descanso, sem precisar fazer nada para merecer.", fecha: "Que esse descanso fique um pouco com você." }
    },
    completa: [
      { tipo: "texto", seg: 30, texto: "Escolha uma posição confortável. Pode ser deitar, sentar ou encostar." },
      { tipo: "texto", seg: 30, texto: "Diga por dentro: *eu posso parar um pouco.*" },
      { tipo: "texto", seg: 30, texto: "Esfregue as mãos até esquentarem e cubra os olhos com elas." },
      { tipo: "texto", seg: 150, semTela: true, texto: "Fique assim. Não precisa fazer nada.",
        apoio: "Se a cabeça for para as tarefas, tudo bem. Volte para o calor das mãos." },
      { tipo: "texto", seg: 30, texto: "Tire as mãos devagar e abra os olhos aos poucos." },
      { tipo: "texto", seg: 30, texto: "Repare no que mudou, mesmo que pouco." }
    ],
    minima: [
      { tipo: "texto", seg: 15, texto: "Diga por dentro: *eu posso parar um pouco.*" },
      { tipo: "texto", seg: 45, semTela: true,
        texto: "Mãos quentes sobre os olhos. Fique assim até o sino.",
        semSom: "Mãos quentes sobre os olhos. Fique assim." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P05",
    titulo: "Aperta e solta",
    dimensao: "corpo", estado: "cansaco", tempo: 10, minimaMin: 1,
    oQueE: "Apertar e soltar cada parte do corpo, dos pés à testa, para perceber a tensão e largar.",
    precisaDe: null,
    aviso: "Aperte com força média, sem dor. Pule a parte que estiver machucada.",
    porque: "Muita tensão fica no corpo sem que a gente perceba. Apertar de propósito e depois soltar mostra a diferença entre tenso e solto, e com a prática fica mais fácil soltar quando você quiser. É uma técnica antiga e muito usada, chamada relaxamento progressivo.",
    tom: {
      pratico: { abre: "Parte por parte, dos pés à testa: apertar e soltar.", fecha: "Levante devagar, quando quiser." },
      espiritual: { abre: "Entregue ao chão, aos poucos, o peso que você carrega.", fecha: "O que você soltou pode ficar aí." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3,
        texto: "Deite ou sente com apoio. Feche os olhos, se quiser. Três respirações." },
      p05Parte("Pés: encolha os dedos com força."),
      p05Parte("Pernas: estique e endureça as pernas."),
      p05Parte("Barriga: contraia a barriga."),
      p05Parte("Mãos: feche as mãos com força."),
      p05Parte("Braços: dobre os braços e aperte."),
      p05Parte("Ombros: suba os ombros até perto das orelhas."),
      p05Parte("Rosto: aperte os olhos e a boca."),
      p05Parte("Testa: levante as sobrancelhas bem alto."),
      { tipo: "texto", seg: 90, semTela: true, texto: "Agora não aperte mais nada. Sinta o corpo inteiro, solto." },
      { tipo: "texto", seg: 30, texto: "Mexa os dedos devagar e volte quando quiser." }
    ],
    minima: [
      { tipo: "texto", seg: 30, texto: "Feche as mãos e suba os ombros. Aperte, conte até cinco e solte." },
      { tipo: "texto", seg: 30, texto: "De novo. Repare na diferença quando solta." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P06",
    titulo: "Uma música inteira",
    dimensao: "espirito", estado: "cansaco", tempo: 10, minimaMin: 1,
    oQueE: "Ouvir uma ou duas músicas de que você gosta, do começo ao fim, sem fazer mais nada.",
    precisaDe: "uma música no seu aplicativo de sempre e, se tiver, fone de ouvido.",
    aviso: null,
    porque: "Ouvir com atenção inteira é uma pausa que não pede esforço: a música conduz, e você só acompanha. Por alguns minutos, a cabeça sai do que estava cansando.",
    tom: {
      pratico: { abre: "Uma pausa com trilha sonora, escolhida por você.", fecha: "Se quiser, guarde o nome dessa música para outro dia." },
      espiritual: { abre: "Deixe a música conduzir, e só acompanhe.", fecha: "Guarde essa música como um lugar para voltar." }
    },
    completa: [
      { tipo: "texto", seg: 60, texto: "Escolha uma música que te faz bem, calma ou não.",
        apoio: "Abra no seu aplicativo de música e volte aqui.",
        seHouver: { chave: "fazBem.musica", apoio: "Que tal a sua: {fazBem.musica}?" } },
      { tipo: "texto", seg: 30, texto: "Sente ou deite de um jeito confortável. Feche os olhos, se quiser." },
      { tipo: "esperar", id: "escutar", semTela: true,
        texto: "Agora só escute. Quando a atenção fugir, volte para um instrumento ou para a voz.",
        botao: "A música acabou" },
      { tipo: "escolher", max: 1, chave: "maisUma", botoes: true,
        pergunta: "Mais uma?", opcoes: ["Ouvir mais uma", "Seguir"],
        repete: { "Ouvir mais uma": "escutar" } },
      { tipo: "escrever", opcional: true,
        campos: [
          { chave: "musica", pergunta: "Qual era a música?" },
          { chave: "palavraDaMusica", pergunta: "Que palavra fica dela?" }
        ],
        marcar: { texto: "Guardar esta música em O que te faz bem", chave: "guardarMusica", marcada: false, guardaEm: "fazBem.musica" } }
    ],
    minima: [
      { tipo: "texto", seg: 60, semTela: true, texto: "Ouça o primeiro minuto de uma música de que você gosta, de olhos fechados." }
    ],
    duracaoReferencia: 600,
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P07",
    titulo: "Suspiro duplo",
    dimensao: "corpo", estado: "sobrecarga", tempo: 2, minimaMin: 1,
    oQueE: "Duas puxadas de ar pelo nariz e uma saída longa pela boca, como o suspiro que o corpo já faz sozinho.",
    precisaDe: null,
    aviso: "Se sentir tontura, volte a respirar normalmente.",
    porque: "É o suspiro que o corpo já faz sozinho quando está cheio: duas puxadas enchem bem o pulmão, e a saída longa estica o tempo de soltar o ar. Feito de propósito, algumas vezes seguidas, dá à respiração um ritmo mais lento para seguir.",
    tom: {
      pratico: { abre: "Quando é muita coisa ao mesmo tempo, comece pelo ar.", fecha: "Agora, a próxima coisa, no seu ritmo." },
      espiritual: { abre: "Solte, a cada respiração, um pouco do que pesa no peito.", fecha: "A cada saída longa, um pouco do peso ficou para trás." }
    },
    completa: [
      { tipo: "texto", seg: 15, texto: "Costas apoiadas. Solte os ombros." },
      { tipo: "respirar", padrao: "duplo", puxa: 2, mais: 1, solta: 6, ciclos: 10,
        texto: "Puxe o ar pelo nariz. No fim, puxe mais um pouquinho. Solte devagar pela boca.", apoio: "Siga o círculo." },
      { tipo: "texto", seg: 15, texto: "Agora respire normalmente e repare como está." }
    ],
    minima: [
      { tipo: "respirar", padrao: "duplo", puxa: 2, mais: 1, solta: 6, ciclos: 5,
        texto: "Puxe o ar pelo nariz. No fim, puxe mais um pouquinho. Solte devagar pela boca." },
      { tipo: "texto", seg: 15, texto: "Respire normalmente." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P08",
    titulo: "Só a próxima",
    dimensao: "mente", estado: "sobrecarga", tempo: 2, minimaMin: 1,
    oQueE: "Tirar os olhos da montanha de coisas e escolher só a próxima.",
    precisaDe: null,
    aviso: null,
    porque: "Quando tudo parece urgente, a cabeça tenta segurar tudo ao mesmo tempo. Escolher uma coisa só, e o primeiro gesto dela, diminui o problema até ele caber nas suas mãos.",
    tom: {
      pratico: { abre: "Da montanha de coisas, você vai escolher uma só.", fecha: "Você já sabe qual é a próxima. As outras esperam a vez delas." },
      espiritual: { abre: "Volte ao agora, uma coisa de cada vez.", fecha: "Faça essa coisa com atenção inteira, como se fosse a única." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 2, texto: "Solte o ar devagar, duas vezes." },
      { tipo: "escrever", chave: "proxima",
        pergunta: "Das coisas que estão na sua cabeça, qual é a próxima? Só a próxima.", exemplo: "responder uma mensagem" },
      { tipo: "escrever", chave: "gesto",
        pergunta: "Qual é o primeiro gesto dela, algo que cabe em 2 minutos?", exemplo: "abrir a conversa" },
      { tipo: "mostrar", seg: 20, modelo: "{gesto}", grande: true, apoio: "O resto pode esperar enquanto você faz isso." },
      { tipo: "texto", seg: 10, texto: "Quando terminar, volte e escolha a próxima, uma de cada vez." }
    ],
    minima: [
      { tipo: "escrever", chave: "proxima", pergunta: "Qual é a próxima coisa? Só a próxima." },
      { tipo: "mostrar", seg: 20, modelo: "{proxima}", grande: true, apoio: "Por agora, só isso." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P09",
    titulo: "Descarregar a cabeça",
    dimensao: "mente", estado: "sobrecarga", tempo: 5, minimaMin: 1,
    oQueE: "Pôr para fora tudo o que está na cabeça e separar: o que dá para fazer, o que espera e o que não é seu.",
    precisaDe: null,
    aviso: null,
    porque: "O que fica só na cabeça precisa ser lembrado o tempo todo, e isso cansa. Escrito, deixa de ocupar esse espaço. Separar mostra que nem tudo é para agora, e que parte do peso nem é sua.",
    tom: {
      pratico: { abre: "Tire da cabeça e ponha aqui. Ninguém mais vê.", fecha: "O que é para agora está separado. O resto ficou guardado no seu caderno." },
      espiritual: { abre: "Esvazie um pouco a cabeça para sobrar espaço para você.", fecha: "O que não é seu pode ser entregue." }
    },
    // A ferramenta inteira (6.7), sem tempo fixo; conta ao concluir ou depois de 60 s.
    completa: [{ tipo: "ferramenta", nome: "descarregar" }],
    // A ferramenta com o limite de três itens (6.7).
    minima: [{ tipo: "ferramenta", nome: "descarregar", minima: true }],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P10",
    titulo: "Soltar mais do que puxa",
    dimensao: "corpo", estado: "sobrecarga", tempo: 5, minimaMin: 1,
    oQueE: "Respirar puxando em 4 tempos e soltando em 6, seguindo o círculo.",
    precisaDe: null,
    aviso: null,
    porque: "Ao puxar o ar, o coração acelera um pouco; ao soltar, desacelera um pouco. É um ritmo natural do corpo. Soltar por mais tempo do que puxa dá mais espaço à parte lenta desse ritmo, e com a mão no peito você acompanha a respiração.",
    tom: {
      pratico: { abre: "Cinco minutos de respiração, sem mistério.", fecha: "O que você sentiu, ou não sentiu, também é uma resposta." },
      espiritual: { abre: "Cinco minutos com o ritmo da sua respiração.", fecha: "A cada respiração, você volta um pouco para si." }
    },
    completa: [
      { tipo: "texto", seg: 20, texto: "Sente com apoio. Uma mão no peito, se quiser." },
      { tipo: "texto", seg: 40, texto: "Primeiro, só repare na respiração, sem mudar nada." },
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 20,
        texto: "Puxe o ar enquanto o círculo cresce. Solte enquanto ele diminui.", apoio: "Puxe em 4, solte em 6." },
      { tipo: "texto", seg: 40, texto: "Volte a respirar do seu jeito. Repare no peito sob a mão." }
    ],
    minima: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 5,
        texto: "Puxe o ar enquanto o círculo cresce. Solte enquanto ele diminui." },
      { tipo: "texto", seg: 10, texto: "Respire do seu jeito." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P11",
    titulo: "Caminhar devagar",
    dimensao: "espirito", estado: "sobrecarga", tempo: 10, minimaMin: 1,
    oQueE: "Andar devagar por dez minutos, com a atenção nos pés e no caminho.",
    precisaDe: "um lugar para andar: a casa, um corredor, a calçada.",
    aviso: null,
    porque: "Quando a cabeça está a mil, ficar parado pode ser difícil. Andar devagar dá ao corpo o que fazer e leva a atenção para os pés. É uma pausa em movimento.",
    tom: {
      pratico: { abre: "Uma caminhada sem destino, mais devagar que o normal.", fecha: "Volte às tarefas no ritmo dos seus passos." },
      espiritual: { abre: "Caminhe presente, um passo de cada vez.", fecha: "Cada passo foi um jeito de estar aqui." }
    },
    // Todos os passos sem tela; com o som ligado, um toque marca cada troca.
    completa: [
      { tipo: "texto", seg: 30, semTela: true, texto: "Fique em pé e sinta o peso nos dois pés." },
      { tipo: "texto", seg: 90, semTela: true, texto: "Comece a andar mais devagar que o normal. Repare no pé que sai do chão e no pé que pousa." },
      { tipo: "texto", seg: 120, semTela: true, texto: "Se quiser, junte a respiração aos passos: alguns passos puxando o ar, alguns soltando." },
      { tipo: "texto", seg: 120, semTela: true, texto: "Agora olhe em volta enquanto anda. Repare em algo que você não tinha notado." },
      { tipo: "texto", seg: 120, semTela: true, texto: "Escute os sons do caminho, perto e longe." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Diminua até parar. Sinta os pés no chão de novo." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Repare como você está agora." }
    ],
    minima: [
      { tipo: "texto", seg: 60, semTela: true, texto: "Ande devagar por um minuto, sentindo cada pé tocar o chão." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P12",
    titulo: "Uma pausa gentil",
    dimensao: "emocoes", estado: "sobrecarga", tempo: 10, minimaMin: 1,
    oQueE: "Falar consigo, por dentro, do jeito que você falaria com alguém de quem gosta.",
    precisaDe: null,
    aviso: null,
    porque: "Na sobrecarga, a voz de dentro costuma ficar dura e cobrar mais. Falar consigo com a gentileza que você teria com outra pessoa muda o tom dessa conversa. Esse jeito de se tratar tem nome, autocompaixão, e é estudado pela psicologia.",
    tom: {
      pratico: { abre: "Um tempo para baixar a cobrança que vem de dentro.", fecha: "A cobrança pode voltar. Agora você conhece outro jeito de responder a ela." },
      espiritual: { abre: "Acolha você como acolheria alguém querido.", fecha: "A gentileza que você oferece aos outros também é sua." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Sente com apoio. Três respirações lentas." },
      { tipo: "escrever", chave: "pesando", longo: true, estimativa: 90,
        pergunta: "O que está pesando agora? Escreva do jeito que vier." },
      { tipo: "texto", seg: 40, texto: "Diga por dentro: *isso está difícil.*", apoio: "Só reconhecer, sem brigar com o que sente." },
      { tipo: "texto", seg: 40, texto: "Lembre: muita gente se sente assim num dia como o seu. Você não é a única pessoa." },
      { tipo: "texto", seg: 60, figura: "autoabraco", texto: "Ponha uma mão no peito ou abrace os próprios braços. Sinta o calor." },
      { tipo: "escrever", chave: "paraVoce", longo: true, estimativa: 120,
        pergunta: "O que você diria a alguém querido no seu lugar? Escreva para você." },
      { tipo: "mostrar", seg: 60, texto: "Leia o que escreveu, devagar.", modelo: "{paraVoce}" },
      { tipo: "escolher", max: 1, chave: "fraseDoDia",
        pergunta: "Escolha uma frase para levar no dia.",
        opcoesDe: { chave: "paraVoce", separarPor: ".", posicao: "antes" },
        opcoes: ["Uma coisa de cada vez.", "Eu faço o que dá.", "Posso pedir ajuda."] },
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Três respirações para fechar." }
    ],
    minima: [
      { tipo: "texto", seg: 20, texto: "Diga por dentro: *isso está difícil.*" },
      { tipo: "texto", seg: 40, texto: "Mão no peito. Diga: *eu faço o que dá, do jeito que dá.*" }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P13",
    titulo: "Cinco sentidos",
    dimensao: "mente", estado: "desconexao", tempo: 2, minimaMin: 1,
    oQueE: "Voltar para o lugar onde você está, contando o que os sentidos percebem.",
    precisaDe: null,
    aviso: null,
    porque: "Contar o que os sentidos percebem traz a atenção para o lugar onde você está. Enquanto você procura quatro coisas para tocar, sobra pouco espaço para o piloto automático.",
    tom: {
      pratico: { abre: "Volte para o lugar onde você está, pelos sentidos.", fecha: "Você está aqui, neste lugar." },
      espiritual: { abre: "Presença pelos sentidos, um de cada vez.", fecha: "Fique mais um pouco neste lugar antes de seguir." }
    },
    completa: [
      { tipo: "texto", seg: 25, texto: "Olhe em volta e encontre cinco coisas que você vê." },
      { tipo: "texto", seg: 25, texto: "Quatro coisas que você pode tocar. Toque nelas." },
      { tipo: "texto", seg: 25, texto: "Três sons, perto ou longe." },
      { tipo: "texto", seg: 20, texto: "Dois cheiros. Pode ser o da roupa ou o do ar." },
      { tipo: "texto", seg: 15, texto: "Um sabor na boca, mesmo que leve." },
      { tipo: "texto", seg: 10, texto: "Solte o ar. Você está aqui." }
    ],
    minima: [
      { tipo: "texto", seg: 20, texto: "Três coisas que você vê." },
      { tipo: "texto", seg: 20, texto: "Dois sons." },
      { tipo: "texto", seg: 20, texto: "Uma coisa que você pode tocar." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P14",
    titulo: "Mão no peito",
    dimensao: "emocoes", estado: "desconexao", tempo: 2, minimaMin: 1,
    oQueE: "Pôr a mão no peito, sentir o calor e a respiração, e dizer uma frase gentil para si.",
    precisaDe: null,
    aviso: null,
    porque: "Pode parecer estranho na primeira vez. O toque é um sinal de cuidado que o corpo conhece desde cedo, mesmo quando a mão é a sua, e por isso esse gesto simples serve para se acolher. É o mesmo gesto do símbolo do Sintonia Interior.",
    tom: {
      pratico: { abre: "Uma mão no peito para voltar para o corpo.", fecha: "Dá para repetir em qualquer lugar, sem ninguém notar." },
      espiritual: { abre: "Um gesto de acolhimento, de você para você.", fecha: "Esse abraço é seu e vai com você." }
    },
    completa: [
      { tipo: "texto", seg: 20, texto: "Ponha uma mão no peito. A outra pode ficar na barriga ou por cima da primeira." },
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 4,
        texto: "Sinta o calor da mão. Sinta o peito subir e descer embaixo dela." },
      { tipo: "texto", seg: 30, texto: P14_FRASE },
      { tipo: "texto", seg: 20, figura: "autoabraco", texto: "Se quiser, abrace os próprios braços. É o gesto do autoabraço." },
      { tipo: "texto", seg: 10, texto: "Solte devagar." }
    ],
    minima: [
      { tipo: "texto", seg: 40, texto: "Mão no peito. Sinta o calor e a respiração." },
      { tipo: "texto", seg: 20, texto: P14_FRASE }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P15",
    titulo: "Uma bebida quente, devagar",
    dimensao: "corpo", estado: "desconexao", tempo: 5, minimaMin: 1,
    oQueE: "Preparar e tomar um chá, um café ou água morna com atenção inteira.",
    precisaDe: "uma bebida quente ou morna.",
    aviso: null,
    porque: "Fazer uma coisa simples com atenção inteira tira você do piloto automático. A bebida quente ajuda porque tem calor, cheiro e sabor para notar.",
    tom: {
      pratico: { abre: "Um intervalo de verdade, com uma xícara na mão.", fecha: "Volte ao dia quando a xícara acabar." },
      espiritual: { abre: "Um pequeno ritual, só seu.", fecha: "Um ritual pequeno também é um jeito de voltar para si." }
    },
    completa: [
      { tipo: "texto", seg: 90, proximoLiberado: true, texto: "Prepare a bebida sem pressa. Repare no som da água e no cheiro." },
      { tipo: "texto", seg: 30, texto: "Segure a xícara com as duas mãos. Sinta o calor." },
      { tipo: "texto", seg: 30, texto: "Antes do primeiro gole, sinta o cheiro." },
      { tipo: "texto", seg: 90, texto: "Beba em goles pequenos. Repare na temperatura e no sabor de cada um." },
      { tipo: "texto", seg: 60, texto: "Entre um gole e outro, olhe o vapor ou a janela." }
    ],
    minima: [
      { tipo: "texto", seg: 60, texto: "Três goles devagar, reparando no calor e no sabor." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P16",
    titulo: "O que importa hoje",
    dimensao: "espirito", estado: "desconexao", tempo: 5, minimaMin: 1,
    oQueE: "Lembrar do que importa para você e escolher um gesto pequeno que combine com isso.",
    precisaDe: null,
    aviso: null,
    porque: "No piloto automático, o dia é decidido pelas urgências. Lembrar do que importa ajuda a pôr no dia pelo menos uma coisa que tem a ver com você.",
    tom: {
      pratico: { abre: "Ponha no dia uma coisa que tem a ver com você.", fecha: "Um gesto pequeno, escolhido por você." },
      espiritual: { abre: "Lembre do que dá sentido aos seus dias.", fecha: "Que esse gesto leve um pouco do que importa para você." }
    },
    completa: [
      { tipo: "respirar", padrao: "simples", puxa: 4, solta: 6, ciclos: 3, texto: "Três respirações para chegar." },
      { tipo: "escolher", max: 3, chave: "valores", pergunta: "O que importa para você?",
        opcoes: P16_VALORES, outra: "Outra coisa" },
      { tipo: "escolher", max: 1, chave: "valor", deMarcadas: "valores", pergunta: "Destas, qual pede mais espaço hoje?" },
      { tipo: "escrever", chave: "gesto",
        pergunta: "Que gesto pequeno, ainda hoje, combina com isso?", exemplo: "mandar uma mensagem para alguém que eu amo" },
      { tipo: "mostrar", seg: 40, modelo: "{valor|inicial}, hoje: {gesto}.", apoio: "Isso fica guardado no registro de hoje." }
    ],
    minima: [
      { tipo: "escolher", max: 1, chave: "valor", pergunta: "O que importa para você hoje?",
        opcoes: P16_VALORES, outra: "Outra coisa" },
      { tipo: "escrever", chave: "gesto", pergunta: "Um gesto pequeno para isso, ainda hoje:" }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P17",
    titulo: "Visitar o corpo",
    dimensao: "corpo", estado: "desconexao", tempo: 10, minimaMin: 1,
    oQueE: "Passar a atenção pelo corpo, parte por parte, dos pés à cabeça, sem mudar nada.",
    precisaDe: null,
    aviso: null,
    porque: "Passar a atenção pelo corpo ajuda a perceber sinais que o dia esconde: um ombro preso, a mandíbula apertada, a respiração curta. Muita tensão só aparece quando a gente para para procurar.",
    tom: {
      pratico: { abre: "Uma conferência do corpo, parte por parte, sem mudar nada.", fecha: "Veja se dá para atender hoje a algo que o corpo pediu." },
      espiritual: { abre: "Habite o corpo, parte por parte, com calma.", fecha: "Você esteve em cada parte do corpo, com atenção." }
    },
    // Todos os passos sem tela; com o som ligado, um toque marca cada troca de parte.
    // É a prática que mais ganha com o áudio gravado (8.2).
    completa: [
      { tipo: "texto", seg: 40, semTela: true, texto: "Deite ou sente com apoio. Feche os olhos, se quiser." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Leve a atenção para os pés. Estão quentes ou frios, leves ou pesados?" },
      { tipo: "texto", seg: 60, semTela: true, texto: "Suba para as pernas e os joelhos." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Quadril e barriga. Sinta a barriga se mexer com a respiração." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Costas, de baixo para cima." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Peito e ombros. Se encontrar tensão, respire ali." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Braços, mãos e dedos." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Pescoço e garganta." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Rosto: mandíbula, boca, olhos, testa. Deixe soltar o que conseguir." },
      { tipo: "texto", seg: 60, semTela: true, texto: "Agora o corpo inteiro, de uma vez, respirando." },
      { tipo: "texto", seg: 20, semTela: true, texto: "Mexa os dedos e abra os olhos quando quiser." }
    ],
    minima: [
      { tipo: "texto", seg: 60, semTela: true,
        texto: "Feche os olhos e passe a atenção pelo corpo, da cabeça aos pés, devagar, até o sino.",
        semSom: "Feche os olhos e passe a atenção pelo corpo, da cabeça aos pés, devagar." }
    ],
    linksNoFecho: [],
    audio: null
  },

  {
    id: "P18",
    titulo: "Um traço só",
    dimensao: "espirito", estado: "desconexao", tempo: 10, minimaMin: 1,
    oQueE: "Desenhar devagar algo que está na sua frente, com uma linha só, sem tirar a caneta do papel.",
    precisaDe: "papel e caneta ou lápis.",
    aviso: null,
    porque: "Desenhar devagar faz o olho reparar em detalhes que passam batido no dia a dia. A mão acompanha o olho, e por alguns minutos a cabeça fica só nisso. É o mesmo traço único dos desenhos do Sintonia Interior.",
    tom: {
      pratico: { abre: "Desenho para quem acha que não sabe desenhar.", fecha: "O desenho pode ficar com você ou ir para o lixo. Os dois valem." },
      espiritual: { abre: "Veja de verdade o que está na sua frente.", fecha: "Olhar com calma também é uma forma de presença." }
    },
    completa: [
      { tipo: "texto", seg: 60, texto: "Escolha algo simples perto de você: sua mão, uma xícara, uma planta." },
      { tipo: "texto", seg: 60, texto: "Olhe para ele por um minuto inteiro, sem desenhar. Repare nas bordas." },
      { tipo: "texto", seg: 300, semTela: true,
        texto: "Agora desenhe bem devagar, sem tirar a caneta do papel. Olhe mais para o objeto do que para o desenho.",
        apoio: "Torto vale, e ninguém precisa ver." },
      { tipo: "texto", seg: 120, texto: "Continue. Quando o contorno acabar, siga pelos detalhes de dentro." },
      { tipo: "texto", seg: 60, texto: "Pare e olhe o desenho sem julgar." }
    ],
    minima: [
      { tipo: "texto", seg: 60, texto: "Desenhe o contorno da sua mão com uma linha só, devagar, olhando mais para a mão do que para o papel." }
    ],
    linksNoFecho: [],
    audio: null
  }
];

export function pratica(id) {
  return PRATICAS.find((p) => p.id === id) || null;
}

/* ------------------------------------------------------------------ texto com chaves */

export function juntar(lista) {
  const itens = (Array.isArray(lista) ? lista : [lista])
    .filter((x) => x !== null && x !== undefined && String(x).trim() !== "")
    .map((x) => String(x).trim());
  if (itens.length <= 1) return itens[0] || "";
  return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
}

const CHAVE = /\{([^{}|]+)(?:\|([^{}]+))?\}(\.)?/g;

export function chavesDe(modelo) {
  if (typeof modelo !== "string") return [];
  return [...modelo.matchAll(CHAVE)].map((m) => m[1].trim());
}

// valores: um objeto (com caminhos como "dia3.dimensao" ou "fazBem.musica") ou uma função (chave) => valor.
export function preencher(modelo, valores = {}) {
  if (typeof modelo !== "string") return modelo;
  const buscar = typeof valores === "function"
    ? valores
    : (caminho) => caminho.split(".").reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), valores);
  return modelo.replace(CHAVE, (_, caminho, filtro, ponto) => {
    let v = buscar(caminho.trim());
    if (Array.isArray(v)) v = juntar(v);
    v = v === null || v === undefined ? "" : String(v);
    if (filtro === "minuscula") v = v.toLocaleLowerCase("pt-BR");
    if (filtro === "inicial") v = v.charAt(0).toLocaleUpperCase("pt-BR") + v.slice(1);
    const fim = ponto && /[.!?…]$/.test(v) ? "" : (ponto || "");
    return v + fim;
  });
}
