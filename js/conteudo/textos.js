/*
  Conteúdo: os textos de tela da seção 6 da especificação que não são práticas, trilha nem frases.
  Os textos das telas de moldura (seção 3: Hoje, passo de agora, tocador, trilha, práticas, semana,
  caderno, mensagens e erros de 3.28) ficam com as telas.

  REGRAS DE FORMATO
    Texto fixo é string. Texto com valor variável é função: recebe os valores e devolve o texto pronto,
    com singular e plural certos ("1 dia" e "3 dias"). Datas e intervalos chegam já escritos pela tela
    (js/dia.js), por exemplo "12 de novembro" ou "3 a 9 de novembro".
    Texto que muda com o tom é { pratico, espiritual }.
    Rótulo (Josefin Sans em caixa alta) já vem em caixa alta, como na especificação.
    A seta (U+2192) não está nas fontes: onde a especificação mostra o par antes e depois com seta
    ("5 nov · 7", seta, "4"), a tela desenha a seta em SVG.
    Linha numerada (T02 e T04): a tela mostra "{numero} · {texto}", com o número em rótulo cobre.

  EXPORTS
    BOAS_VINDAS   6.1   { abertura, comoFunciona, tom, combinados, legendaPrimeiraVez }
    CHECKIN       6.2   { pergunta, estados: [{ id, nome, descricao, icone }], apoio, link }
    TEMPO         6.3   { pergunta, opcoes: [{ tempo, texto, icone, versaoDaTrilha, passoAberto? }], apoio, passoAberto }
    LIMITE        6.6   { entrada, respirar (o mesmo objeto de RESP), frase, desabafar, comoEsta } (as frases estão em frases.js)
    RESP          6.4 e 6.6  Respirar comigo, a ferramenta: { id, titulo, descricao, puxa, solta, segundos, palavras, apoio, apoioSegundos, maisUmMinuto, jaEstaBom }
    DESCARREGAR   6.7   { despejar, separar, resultado, soltos(n) }
    EXPERIMENTO   6.8   { comeco, antes, escolha, minuto, depois, resultado }
    resultadoDaMedicao(antes, depois, { minuto })  o resultado de 6.8: { caso, texto, apoio }
    REGISTRO      6.9   { pergunta, sinais: [{ id, nome, icone }], campo, maxCaracteres, guardar, pular }
    FLOR          6.10  { rotulos, nomes, rotulo(estagio, descansa), frasesDoEstagio, acordou, legendas, ordemDasLegendas, folhaFlor, folhaLago }
    SEMANA        6.11  rótulos e funções da semana
    AJUSTES       6.12  { titulo, pratica, aparencia, mais, rodape }
    DADOS         6.12  { titulo, texto, espaco(t), guardar, trazer, apagar, demonstracao, iphone }
    SOBRE         6.12  { nome, linha, paragrafos, aviso (o objeto AVISO), cvv (o cartão de CVV), rodape }
    AVISO         6.12  { blocos: [{ texto, acoes? }] }
    INSTALAR      6.12  { titulo, texto, iphone, android, computador, instalado }
    CVV           6.12  { telefone, href, samu, hrefSamu, site, hrefSite, cartao, conferidoEm }
    DEMONSTRACAO  6.13  { titulo, texto, chave, relogio(data), botoes }

  Os objetos são lidos por várias telas: não mude nenhum deles; copie antes, se precisar.
*/

import { juntar } from "./praticas.js";

const plural = (n, um, varios) => (n === 1 ? um : varios);
const caixaAlta = (t) => String(t).toLocaleUpperCase("pt-BR");

/* ------------------------------------------------------------------ 6.1 Boas-vindas */

export const BOAS_VINDAS = {
  // T01
  abertura: {
    nome: "Sintonia Interior",
    linha: "Autocuidado possível, no seu ritmo.",
    botao: "Começar",
    link: "Já usei antes: trazer meus dados",
    rodape: "SEM CONTA · TUDO FICA NESTE APARELHO"
  },
  // T02 (o número vai em rótulo cobre, antes do texto: "01 · Você diz...")
  comoFunciona: {
    rotulo: "COMO FUNCIONA",
    titulo: "O app que pergunta antes de pedir.",
    itens: [
      { numero: "01", texto: "Você diz como chega e quanto tempo tem. Leva uns dez segundos." },
      { numero: "02", texto: "O app sugere duas opções do tamanho do seu dia, e você fica com uma. Um minuto já conta." },
      { numero: "03", texto: "Se faltar alguns dias, a trilha continua de onde parou, e a sua flor só descansa." }
    ],
    botao: "Seguir",
    link: "Voltar"
  },
  // T03 (o exemplo aparece quando a pessoa escolhe o cartão)
  tom: {
    rotulo: "DO SEU JEITO",
    titulo: "Como você prefere que o app fale com você?",
    opcoes: [
      { id: "pratico", nome: "Prático", texto: "Direto ao corpo e à cabeça, sem linguagem espiritual.",
        exemplo: "Cinco minutos de respiração, sem mistério." },
      { id: "espiritual", nome: "Espiritual", texto: "As mesmas práticas, com espaço para presença e sentido. Do seu jeito, com ou sem religião.",
        exemplo: "Cinco minutos com o ritmo da sua respiração." }
    ],
    apoio: "Nenhuma prática exige meditação. Dá para trocar o tom quando quiser, em Ajustes.",
    botao: "Seguir"
  },
  // T04
  combinados: {
    rotulo: "ANTES DE COMEÇAR",
    titulo: "Três combinados",
    itens: [
      { numero: "1", texto: "Este app é um apoio para o dia a dia. Ele não substitui terapia, consulta médica nem atendimento de emergência. Se a dor estiver grande demais, o CVV atende de graça, 24 horas, pelo telefone 188." },
      { numero: "2", texto: "O que você registra fica só neste aparelho. Não há conta, e ninguém mais tem acesso." },
      { numero: "3", texto: "Num dia pesado demais, toque em Estou no limite, no alto da tela." }
    ],
    botao: "Combinado"
  },
  // A legenda de Hoje na primeira vez (também é a primeira das legendas de FLOR).
  legendaPrimeiraVez: "Esta é a sua semente. Ela cresce um pouco em cada dia em que você se cuidar, nem que seja por um minuto."
};

/* ------------------------------------------------------------------ 6.2 Check-in */

// O check-in grava o estado e a hora e vale por 2 horas para a tela Hoje.
// "Prefiro escolher na lista" não grava check-in.
export const CHECKIN = {
  pergunta: "Como você está chegando até aqui?",
  estados: [
    { id: "cansaco", nome: "Cansaço", descricao: "Pouca energia, corpo pedindo pausa.", icone: "cansaco" },
    { id: "sobrecarga", nome: "Sobrecarga", descricao: "Coisa demais ao mesmo tempo.", icone: "sobrecarga" },
    { id: "desconexao", nome: "Desconexão", descricao: "No piloto automático, longe de si.", icone: "desconexao" }
  ],
  apoio: "Escolha o que mais se aproxima de como você está. Não precisa ser exato.",
  link: "Prefiro escolher na lista"
};

/* ------------------------------------------------------------------ 6.3 Tempo */

// tempo: o tempo das práticas da biblioteca (2 inclui a mínima de 1). versaoDaTrilha: a versão do dia
// da trilha. passoAberto: no fim do dia da trilha, o passo aberto de TEMPO.passoAberto.
export const TEMPO = {
  pergunta: "Quanto espaço você tem para si agora?",
  opcoes: [
    { tempo: 2, texto: "Só 1 ou 2 minutos", icone: "tempo2", versaoDaTrilha: "minima" },
    { tempo: 5, texto: "Uns 5 minutos", icone: "tempo5", versaoDaTrilha: "completa" },
    { tempo: 10, texto: "10 minutos ou mais", icone: "tempo10", versaoDaTrilha: "completa", passoAberto: true }
  ],
  apoio: "Qualquer um conta como dia de cuidado.",
  passoAberto: { texto: "Se quiser, fique mais um pouco aqui.", botao: "Concluir" }
};

/* ------------------------------------------------------------------ 6.12 CVV (antes do resto, porque outros blocos usam) */

// Os botões usam tel:188 e tel:192; o site abre numa aba nova (target="_blank" rel="noopener noreferrer"),
// sempre pelo toque da pessoa. Os números foram conferidos em 23/10/2026 e precisam ser conferidos de novo
// em fonte oficial antes de publicar (critério 46). O 192 aparece só para risco imediato à vida.
export const CVV = {
  telefone: "188", href: "tel:188",
  samu: "192", hrefSamu: "tel:192",
  site: "cvv.org.br", hrefSite: "https://cvv.org.br",
  linkDoSite: { target: "_blank", rel: "noopener noreferrer" },
  // O cartão preso ao pé do Estou no limite (6.6), que também vai no Sobre.
  cartao: {
    rotulo: "FALAR COM ALGUÉM AGORA",
    texto: "O CVV (Centro de Valorização da Vida) atende de graça, 24 horas, pelo telefone 188 e pelo site cvv.org.br. A conversa é sigilosa.",
    ligar: "Ligar para o 188",
    abrirSite: "Abrir cvv.org.br",
    samu: "Em risco imediato à vida, ligue 192 (SAMU).",
    ligarSamu: "Ligar para o 192"
  },
  conferidoEm: "2026-10-23"
};

/* ------------------------------------------------------------------ 6.4 e 6.6 Respirar comigo */

// A mesma tela dentro do Estou no limite e como ferramenta (RESP). O círculo de 4 e 6 s; o apoio aparece
// nos primeiros 10 s; a cada minuto aparecem devagar "Mais um minuto" e "Já está bom". Com o som ligado,
// o sino toca no começo e quando a pessoa para. Fora do limite, "Já está bom" segue direto para o fecho
// com a flor (sem registro e sem "Como está agora?"), e a sessão conta com 60 s ou mais.
export const RESP = {
  id: "RESP",
  titulo: "Respirar comigo",
  descricao: "Um minuto, seguindo um círculo.",
  puxa: 4, solta: 6, segundos: 60,
  palavras: { puxa: "Inspire", solta: "Solte" },
  apoio: "Não precisa acertar o ritmo. Siga como der.",
  apoioSegundos: 10,
  maisUmMinuto: "Mais um minuto",
  jaEstaBom: "Já está bom"
};

/* ------------------------------------------------------------------ 6.6 Estou no limite (as frases estão em frases.js) */

// 60 segundos ou mais na camada fazem o dia contar, sem festa e sem tela de flor (7.4).
// Nenhuma resposta de "Como está agora?" liga para ninguém sozinha.
export const LIMITE = {
  entrada: {
    titulo: "Tudo bem parar aqui.",
    linha: "Escolha o que parecer possível agora. Qualquer uma serve.",
    opcoes: [
      { id: "respirar", nome: "Respirar comigo", descricao: "Um minuto, seguindo um círculo." },
      { id: "frase", nome: "Uma frase para agora", descricao: "Palavras para ler devagar." },
      { id: "desabafar", nome: "Desabafar", descricao: "Falar ou escrever o que está aí. Nada sai deste aparelho." }
    ],
    // O bloco aparece se existe a lista do Dia 5 (ou montada no caderno), com até cinco itens.
    fazBem: {
      rotulo: "O QUE TE FAZ BEM",
      texto: "Você escreveu que isto te faz bem:",
      maxItens: 5,
      musica: (musica) => `Sua música: ${musica}`,
      frase: (frase) => `Sua frase: ${frase}`
    },
    aviso: "O Sintonia Interior não substitui ajuda profissional.",
    cvv: CVV.cartao
  },
  respirar: RESP,
  frase: {
    rotuloDaSua: "A SUA FRASE",
    outra: "Outra frase",
    jaEstaBom: "Já está bom",
    guardar: "Guardar esta frase",
    guardada: "Guardada"
  },
  desabafar: {
    titulo: "Desabafar",
    linha: "Fale ou escreva o que está aí, do jeito que sair. Ninguém mais vai ouvir ou ler.",
    falar: {
      botao: "Falar",
      // O padrão é não gravar. O anel se enche em 2 minutos; "Terminei" pode ser tocado antes.
      texto: "Fale o que está pesando, baixinho ou em voz alta. Ninguém está ouvindo.",
      terminei: "Terminei",
      segundosDoAnel: 120,
      chave: "Gravar só para mim, neste aparelho",
      primeiraVez: {
        texto: "O navegador vai pedir para usar o microfone. A gravação fica só neste aparelho e não é enviada nem transcrita.",
        botao: "Entendi"
      },
      gravando: "Gravando só neste aparelho.",
      parar: "Parar",
      limiteSegundos: 300,
      avisoSegundos: 270,
      avisoDoLimite: "Faltam 30 segundos para o limite desta gravação.",
      depois: {
        pergunta: "Gravação feita. O que fazer com ela?",
        apagar: "Apagar agora",
        guardar: "Guardar neste aparelho",
        ouvir: "Ouvir antes"
      },
      apagada: "Apagada. Você pode voltar aqui quando precisar.",
      guardada: "Guardada só neste aparelho, em Seu caderno, Áudios."
    },
    escrever: {
      botao: "Escrever",
      dica: "Escreva aqui. Sem revisão, sem ordem.",
      terminei: "Terminei",
      pergunta: "O que fazer com o que você escreveu?",
      deixarIr: "Deixar ir",
      guardar: "Guardar neste aparelho",
      foi: "Foi. Você pode voltar aqui quando precisar."
    }
  },
  comoEsta: {
    pergunta: "Como está agora?",
    opcoes: [
      { id: "melhor", texto: "Um pouco melhor",
        resposta: "Que bom. Fique mais um pouco aqui, se quiser.",
        botoes: ["Voltar ao app", "Mais um minuto de respiração"] },
      // Depois desta resposta, as três opções aparecem de novo.
      { id: "igual", texto: "Igual",
        resposta: "Tudo bem. Às vezes leva mais tempo. Quer tentar outra opção?" },
      { id: "pior", texto: "Pior",
        resposta: "Você fez bem em dizer. Às vezes o que ajuda é falar com uma pessoa.",
        botao: "Ligar para o CVV, 188",
        links: ["Abrir cvv.org.br", "Voltar às opções"] }
    ]
  }
};

/* ------------------------------------------------------------------ 6.7 Descarregar a cabeça */

// A pessoa despeja e ela mesma separa. O app não lê, não sugere e não organiza nada sozinho.
// Texto colado com várias linhas vira um item por linha; linha vazia não vira item.
// Os itens soltos são apagados de verdade (fica só a contagem). Nada disso aparece em Hoje.
export const DESCARREGAR = {
  despejar: {
    rotulo: "DESCARREGAR A CABEÇA",
    titulo: "O que está na sua cabeça?",
    tituloMinima: "Quais são as três coisas que mais pesam agora?",
    limiteMinima: 3,
    linha: "Escreva uma coisa por linha, do jeito que vier. Pode ser tarefa ou preocupação, grande ou pequena.",
    adicionar: "Adicionar",
    dicas: ["pagar a conta de luz", "a conversa de ontem", "marcar o dentista"],
    contador: (n) => `${n} ${plural(n, "coisa", "coisas")}`,
    // Depois de 20 s parado com menos de 3 itens.
    apoioParado: "Coisa pequena também vale.",
    apoioParadoSegundos: 20,
    separar: "Separar",
    soPorPraFora: "Só queria pôr para fora"
  },
  separar: {
    contador: (atual, total) => `${atual} de ${total}`,
    grupos: [
      { id: "fazer", nome: "Dá para fazer", descricao: "Depende de você e cabe nos próximos dias." },
      { id: "esperar", nome: "Pode esperar", descricao: "Importa, mas não é para agora." },
      { id: "naoMeu", nome: "Não é meu", descricao: "Depende de outra pessoa, já passou ou não está nas suas mãos." }
    ],
    voltar: "Voltar ao anterior"
  },
  resultado: {
    titulo: "Separado.",
    grupo: (nome, n) => `${nome} · ${n}`,
    fazer: {
      apoio: "Escolha só uma para começar.",
      proximo: "Seu próximo passo",
      gesto: "Qual é o primeiro gesto?"
    },
    esperar: {
      apoio: "Fica guardado no seu caderno. Você não precisa lembrar."
    },
    naoMeu: {
      soltar: { pratico: "Soltar", espiritual: "Entregar" },
      apoio: "Soltar apaga estes itens.",
      depois: {
        pratico: "Isso não depende de você. Pode deixar ir.",
        espiritual: "Entregue. Você não precisa carregar o que não é seu."
      }
    },
    // Copia em texto simples "Dá para fazer" e "Pode esperar", com a marca no próximo passo.
    copiar: "Copiar a lista",
    marcaDoProximo: "(começar por aqui)",
    copiada: "Lista copiada.",
    concluir: "Concluir"
  },
  soltos: (n) => `${n} ${plural(n, "solto", "soltos")}`
};

/* ------------------------------------------------------------------ 6.8 Experimento de 1 minuto */

export const EXPERIMENTO = {
  comeco: {
    rotulo: "EXPERIMENTO DE 1 MINUTO",
    titulo: "Você testa. O resultado é seu.",
    texto: "Você mede a sua tensão de 0 a 10, faz um minuto de pausa e mede de novo. O app mostra os seus números, sem comparar com ninguém.",
    apoio: "Leva uns 90 segundos.",
    botao: "Começar o teste"
  },
  antes: { pergunta: "Quanta tensão você sente agora, de 0 a 10?" },
  escolha: {
    pergunta: "Como prefere passar este minuto?",
    opcoes: [
      { id: "respirar", nome: "Respirar devagar", descricao: "Seis respirações seguindo um círculo." },
      { id: "janela", nome: "Olhar pela janela", descricao: "Um minuto olhando o ponto mais longe que você vê." }
    ]
  },
  // Com o som ligado, sino no começo e no fim.
  minuto: {
    respirar: { puxa: 4, solta: 6, ciclos: 6 },
    janela: {
      figura: "horizonte",
      segundos: 60,
      texto: "Deixe os olhos pousarem lá longe.",
      apoioDaMetade: "Mais trinta segundos.",
      metadeSegundos: 30
    }
  },
  // A régua começa no valor de antes.
  depois: { pergunta: "E agora?" },
  resultado: {
    // O texto do resultado sai de resultadoDaMedicao(antes, depois).
    rotuloDosTestes: "SEUS TESTES ATÉ AGORA",
    perguntaMedir: "Quer medir antes e depois nas outras práticas também?",
    sim: "Sim, medir",
    nao: "Agora não",
    concluir: "Concluir"
  }
};

// O resultado usa sempre os números que a pessoa marcou: sem média, sem arredondar e sem chamar nenhum
// resultado de bom ou ruim. caso: "baixou" | "igual" | "subiu" | "zero" (começou e ficou em 0).
// { minuto: false } tira "em um minuto" da frase de baixou, para a régua das outras práticas (T09).
export function resultadoDaMedicao(antes, depois, { minuto = true } = {}) {
  const a = Number(antes);
  const d = Number(depois);
  if (a === 0 && d === 0) {
    return { caso: "zero", texto: "Você começou em 0, sem tensão nenhuma. Dá para testar de novo num dia mais pesado.", apoio: null };
  }
  if (d < a) {
    const n = a - d;
    return {
      caso: "baixou",
      texto: `Antes, ${a}. Depois, ${d}. Baixou ${n} ${plural(n, "ponto", "pontos")}${minuto ? " em um minuto" : ""}.`,
      apoio: "Quem mediu foi você."
    };
  }
  if (d === a) {
    return {
      caso: "igual",
      texto: `Antes, ${a}. Depois, ${d}. Ficou igual.`,
      apoio: "Também é uma resposta. Talvez a outra opção combine mais com você, ou talvez hoje não seja o dia. Dá para testar de novo outra hora."
    };
  }
  return {
    caso: "subiu",
    texto: `Antes, ${a}. Depois, ${d}. Subiu um pouco.`,
    apoio: "Acontece. Às vezes, parar faz a gente notar uma tensão que já estava ali. Se quiser, tente a outra opção ou abra o Estou no limite."
  };
}

/* ------------------------------------------------------------------ 6.9 Registro leve */

// Tudo é opcional; o sinal e a linha ficam presos à sessão; nenhum sinal dispara mensagem ou desvio.
// Os sinais vão do mais leve ao mais pesado, sem cor, cada um com o nome embaixo.
export const REGISTRO = {
  pergunta: "Como ficou?",
  sinais: [
    { id: "leveza", nome: "Leveza", icone: "leveza" },
    { id: "calma", nome: "Calma", icone: "calma" },
    { id: "alivio", nome: "Alívio", icone: "alivio" },
    { id: "igual", nome: "Igual", icone: "igual" },
    { id: "peso", nome: "Peso", icone: "peso" }
  ],
  // Aceita emoji do teclado.
  campo: "Uma linha, se quiser",
  maxCaracteres: 140,
  guardar: "Guardar",
  pular: "Pular"
};

/* ------------------------------------------------------------------ 6.10 A flor */

// O app não mostra "3 de 7" nem quanto falta: o desenho já diz.
// Os mesmos rótulos estão em js/flor.js (ROTULOS), que desenha a flor.
const ROTULOS_DA_FLOR = ["SEMENTE", "BROTO", "BROTO", "BOTÃO", "BOTÃO", "BOTÃO", "BOTÃO", "LÓTUS"];
const NOMES_DA_FLOR = ["Semente", "Broto", "Broto", "Botão", "Botão", "Botão", "Botão", "Lótus"];

export const FLOR = {
  rotulos: ROTULOS_DA_FLOR,
  // O título da folha Sua flor, em Fraunces ("Botão").
  nomes: NOMES_DA_FLOR,
  rotulo: (estagio, descansa = false) => (ROTULOS_DA_FLOR[estagio] || "") + (descansa ? " · DESCANSANDO" : ""),
  // A frase do fecho quando o estágio muda (a chave é o estágio novo).
  frasesDoEstagio: {
    1: "Brotou. Cada dia de cuidado faz a flor crescer um pouco.",
    2: "Uma folha nova se abriu na água.",
    3: "Um botão se formou.",
    4: "O botão cresceu, no seu ritmo.",
    5: "As primeiras pétalas se soltaram.",
    6: "Quase aberta, no tempo dela.",
    7: "Sua lótus abriu. Sete dias de cuidado, um de cada vez."
  },
  // Vem antes da frase do estágio quando a flor descansava.
  acordou: "Sua flor acordou.",
  // As legendas de Hoje, uma por vez, na ordem de ordemDasLegendas (a primeira que valer).
  legendas: {
    primeiraVez: BOAS_VINDAS.legendaPrimeiraVez,
    lotusHoje: "Sua lótus abriu hoje. Amanhã ela vai para o seu lago.",
    descanso: "Sua flor está descansando. Ela não murcha e espera você, do jeito que estiver.",
    sementeNova: "Uma semente nova está na água. A lótus que abriu está no seu lago."
  },
  ordemDasLegendas: ["primeiraVez", "lotusHoje", "descanso", "sementeNova"],
  // Ao tocar na flor. Depois dos textos, a fileira com os oito estágios em miniatura (5.4).
  folhaFlor: {
    titulo: (estagio) => NOMES_DA_FLOR[estagio] || "",
    textos: [
      "Sua flor cresce um pouco em cada dia em que você se cuida, com qualquer prática, completa ou mínima. Se fizer mais de uma no mesmo dia, fica tudo guardado na sua semana, e a flor cresce uma vez por dia.",
      "No sétimo dia de cuidado, seguidos ou não, a lótus abre. No dia seguinte, ela vai para o seu lago e uma semente nova está na água.",
      "Se você some por uns dias, ela fecha e descansa, como a lótus de verdade faz à noite. Ela nunca murcha, e nada do que cresceu se perde.",
      "O que cresceu hoje aparece em cobre até o dia virar, às 4 da manhã."
    ],
    lago: (n) => `Lótus no seu lago: ${n}`,
    verLago: "Ver o lago"
  },
  folhaLago: {
    titulo: "Seu lago",
    texto: "Cada lótus aqui abriu depois de sete dias de cuidado.",
    item: (abriuEm, comecouEm) => `Abriu em ${abriuEm} · começou em ${comecouEm}`,
    vazio: "O lago espera a primeira lótus. Ela abre no sétimo dia de cuidado."
  }
};

/* ------------------------------------------------------------------ 6.11 Resumo semanal */

// "Pequeno se acumula" só aparece aqui e no rótulo do cartão de Hoje. Dias sem prática não aparecem,
// nem como espaço vazio. Nenhum número compara uma semana com outra, e nenhum mostra o que faltou.
// Sem frase de moral no fim.
export const SEMANA = {
  titulo: "Pequeno se acumula",
  // intervalo: "3 a 9 de novembro" (vira caixa alta aqui).
  rotuloAtual: (intervalo) => `ESTA SEMANA · ${caixaAlta(intervalo)}`,
  rotuloPassada: (intervalo) => `SUA SEMANA · ${caixaAlta(intervalo)}`,
  // minutos null: sem a parte dos minutos (quando todo o cuidado da semana foi "Fiz hoje").
  comCuidado: (dias, minutos = null) => {
    const parteDias = `${dias} ${plural(dias, "dia", "dias")}`;
    if (minutos === null || minutos === undefined) return `Você se cuidou em ${parteDias} nesta semana.`;
    return `Você se cuidou em ${parteDias} nesta semana, somando ${minutos} ${plural(minutos, "minuto", "minutos")}.`;
  },
  rotuloFez: "O QUE VOCÊ FEZ",
  // dia: "seg, 3". versao: "completa" | "minima" | "interrompida".
  itemFez: (dia, titulo, versao = null) => `${dia} · ${titulo}${versao === "minima" ? " · mínima" : ""}`,
  itemCuidado: (dia) => `${dia} · Seu cuidado possível`,
  rotuloComoFicou: "COMO FICOU",
  rotuloMedicoes: "SUAS MEDIÇÕES",
  // As partes com zero somem. Sem medição, null (o bloco não aparece).
  medicoes: ({ baixou = 0, igual = 0, subiu = 0 } = {}) => {
    const total = baixou + igual + subiu;
    if (total === 0) return null;
    if (total === 1) {
      const so = baixou ? "baixou" : igual ? "ficou igual" : "subiu";
      return `Em 1 medição, a tensão ${so}.`;
    }
    const partes = [];
    if (baixou) partes.push(`baixou em ${baixou}`);
    if (igual) partes.push(`ficou igual em ${igual}`);
    if (subiu) partes.push(`subiu em ${subiu}`);
    return `Em ${total} medições, a tensão ${juntar(partes)}.`;
  },
  rotuloLinhas: "SUAS LINHAS",
  // dias: os números dos dias da trilha feitos na semana; terminou: o Dia 7 foi feito nesta semana.
  // Sem trilha na semana, null (o bloco não aparece).
  trilha: ({ dias = [], terminou = false } = {}) => {
    if (terminou) return "Você terminou a trilha nesta semana.";
    if (dias.length === 0) return null;
    if (dias.length === 1) return `Na trilha: Dia ${dias[0]}.`;
    return `Na trilha: dias ${juntar(dias)}.`;
  },
  descargas: (n) => `Você descarregou a cabeça ${n} ${plural(n, "vez", "vezes")}.`,
  // Com pelo menos um dia de cuidado desde o começo; sem a parte do lago enquanto for zero.
  desdeOComeco: (dias, lotus = 0) => {
    const parteDias = `${dias} ${plural(dias, "dia", "dias")} de cuidado`;
    return lotus > 0
      ? `Desde que você começou: ${parteDias} e ${lotus} lótus no lago.`
      : `Desde que você começou: ${parteDias}.`;
  },
  vaziaAtual: "Nesta semana ainda não houve prática. Quando quiser, um minuto já conta.",
  // Botão secundário da semana atual sem cuidado; abre Respirar comigo.
  respirarAgora: "Respirar um minuto agora",
  vaziaPassada: "Esta semana foi de descanso. Sua flor esperou."
};

/* ------------------------------------------------------------------ 6.12 Ajustes (T22) */

export const AJUSTES = {
  titulo: "Ajustes",
  pratica: {
    rotulo: "PRÁTICA",
    tom: {
      nome: "Tom",
      opcoes: [{ id: "pratico", nome: "Prático" }, { id: "espiritual", nome: "Espiritual" }],
      apoio: "Muda a abertura, o fecho e algumas frases das práticas."
    },
    // Chave, desligada no começo.
    sino: {
      nome: "Sino no começo e no fim",
      apoio: "Um som suave, criado no próprio aparelho. Nas práticas feitas sem olhar a tela, um toque baixo marca a troca de passo.",
      ouvir: "Ouvir o sino"
    },
    // Chave, desligada no começo.
    medir: {
      nome: "Medir a tensão",
      texto: "Perguntar de 0 a 10 antes e depois de cada prática"
    }
  },
  aparencia: {
    rotulo: "APARÊNCIA",
    // Padrão: Claro.
    tema: {
      nome: "Tema",
      opcoes: [{ id: "claro", nome: "Claro" }, { id: "noite", nome: "Noite" }, { id: "auto", nome: "Igual ao aparelho" }]
    },
    // Chave; vem ligada se o aparelho pedir.
    menosMovimento: { nome: "Menos movimento" },
    letraMaior: { nome: "Letra maior" }
  },
  mais: {
    rotulo: "MAIS",
    dados: "Seus dados",
    // Some quando o app está instalado.
    instalar: "Instalar na tela de início",
    sobre: "Sobre o Sintonia Interior",
    aviso: "Aviso importante",
    // Abre o Estou no limite.
    ajuda: "Precisa de ajuda agora? CVV, 188"
  },
  // A linha que esconde o acesso à demonstração (cinco toques).
  rodape: "Sintonia Interior · versão 0.1 · protótipo · novembro de 2026"
};

/* ------------------------------------------------------------------ 6.12 Seus dados (T23) */

export const DADOS = {
  titulo: "Seus dados",
  texto: "Tudo o que você registra fica guardado só neste navegador, neste aparelho. Nada é enviado para lugar nenhum. Se você limpar os dados do navegador ou trocar de aparelho, os registros vão junto, a não ser que você guarde uma cópia antes.",
  // Só quando o navegador informa. tamanho: "42 KB".
  espaco: (tamanho) => `Espaço usado: ${tamanho}`,
  guardar: {
    botao: "Guardar uma cópia",
    apoio: "Baixa um arquivo com suas práticas, registros, trilha e descargas. Os áudios ficam de fora; dá para baixar cada um em Seu caderno.",
    // data: "5 de novembro", ou null.
    ultima: (data = null) => `Última cópia: ${data || "nunca"}`,
    // dia: "2026-11-05".
    arquivo: (dia) => `sintonia-interior-${dia}.json`
  },
  trazer: {
    botao: "Trazer uma cópia",
    apoio: "Abre um arquivo guardado antes e substitui os dados deste aparelho.",
    // A folha depois de escolher o arquivo. data: "1 de novembro de 2026". diaDaTrilha: o próximo dia
    // da trilha (1 a 7), ou null com a trilha terminada.
    previa: ({ data, dias = 0, lotus = 0, diaDaTrilha = 1 } = {}) => {
      const parteTrilha = diaDaTrilha ? `a trilha no Dia ${diaDaTrilha}` : "a trilha completa";
      return `Esta cópia é de ${data}. Ela tem ${dias} ${plural(dias, "dia", "dias")} de cuidado, ${lotus} lótus no lago e ${parteTrilha}. Ela vai substituir o que está neste aparelho.`;
    },
    substituir: "Substituir",
    cancelar: "Cancelar"
  },
  apagar: {
    // Botão de texto em --tinta, no fim da tela. Depois, o app volta às boas-vindas.
    botao: "Apagar tudo deste aparelho",
    folha1: {
      titulo: "Apagar tudo deste aparelho?",
      texto: "Práticas, registros, trilha, descargas, escritos e áudios. Não dá para desfazer.",
      guardarAntes: "Guardar uma cópia antes",
      continuar: "Continuar"
    },
    folha2: {
      titulo: "Tem certeza?",
      texto: "Toque em Apagar tudo para confirmar.",
      apagar: "Apagar tudo",
      cancelar: "Cancelar"
    }
  },
  // No modo de demonstração, no lugar dos botões de cópia.
  demonstracao: "Desligue o modo de demonstração para guardar ou trazer uma cópia.",
  // Nota no pé, só no iPhone fora da tela de início.
  iphone: {
    texto: "No iPhone, adicione o app à Tela de Início. Assim o Safari não apaga os seus dados depois de alguns dias sem uso.",
    link: "Como fazer"
  }
};

/* ------------------------------------------------------------------ 6.12 Aviso importante (T25) */

export const AVISO = {
  blocos: [
    { texto: "O Sintonia Interior é um apoio para o dia a dia. Ele não é terapia e não substitui acompanhamento psicológico, consulta médica nem atendimento de emergência." },
    { texto: "Faça as práticas de movimento e de respiração até onde for confortável. Se sentir dor, tontura ou falta de ar, pare e respire normalmente. Se você tem alguma condição de saúde, converse com quem acompanha você antes das práticas de movimento." },
    {
      texto: "Se estiver em sofrimento intenso, ou se pensar em se machucar, fale com alguém agora. O CVV atende de graça, 24 horas, pelo 188 e por cvv.org.br. Em risco imediato à vida, ligue 192 (SAMU).",
      acoes: [
        { tipo: "botao", texto: "Ligar para o 188", href: CVV.href },
        { tipo: "botao", texto: "Ligar para o 192", href: CVV.hrefSamu },
        { tipo: "link", texto: "Abrir cvv.org.br", href: CVV.hrefSite }
      ]
    },
    { texto: "Se você já faz acompanhamento, o que perceber aqui pode ser assunto para a próxima conversa." }
  ]
};

/* ------------------------------------------------------------------ 6.12 Sobre o Sintonia Interior (T24) */

// No alto, o logo (4.6) e, embaixo, o nome em --berinjela (estilo titulo). Depois dos parágrafos,
// o texto do Aviso importante e o cartão "Falar com alguém agora" (o mesmo de 6.6).
export const SOBRE = {
  nome: "Sintonia Interior",
  linha: BOAS_VINDAS.abertura.linha,
  paragrafos: [
    "O Sintonia Interior é um app de autocuidado em poucos minutos. Ele pergunta como você chega e quanto tempo tem, e sugere um passo do tamanho do seu dia. Faltar não tira nada: a trilha espera, e a flor só descansa.",
    "As práticas usam técnicas simples e conhecidas de respiração, movimento, atenção e escrita. Cada uma traz uma explicação curta de por que costuma ajudar, sem promessa. Você escolhe o tom, prático ou espiritual, e nenhuma prática exige meditação.",
    "O cuidado passa por quatro dimensões: Corpo, Emoções, Mente e Espírito.",
    "Não há conta nem anúncios, e nada do que você registra sai deste aparelho. Depois da primeira visita, o app funciona sem internet."
  ],
  aviso: AVISO,
  cvv: CVV.cartao,
  rodape: {
    fontes: "Fontes tipográficas Fraunces, Mulish e Josefin Sans, sob a licença SIL Open Font License 1.1.",
    licencas: "Ver as licenças",
    arquivosDasLicencas: ["fonts/OFL-fraunces.txt", "fonts/OFL-mulish.txt", "fonts/OFL-josefinsans.txt"],
    versao: "Versão 0.1 · protótipo · novembro de 2026"
  }
};

/* ------------------------------------------------------------------ 6.12 Instalar na tela de início (T26) */

export const INSTALAR = {
  titulo: "Use como app",
  texto: "Na tela de início, o Sintonia Interior abre em tela cheia, funciona sem internet e seus dados ficam mais bem guardados.",
  iphone: "No Safari, toque em Compartilhar (o quadrado com a seta para cima) e depois em Adicionar à Tela de Início. Depois, abra o Sintonia Interior pelo ícone.",
  android: {
    // Quando o navegador oferece a instalação.
    botao: "Instalar o app",
    // Quando não oferece.
    semPedido: "No Chrome, toque no menu (os três pontos) e depois em Instalar app ou Adicionar à tela inicial."
  },
  computador: "No Chrome ou no Edge, use o ícone de instalar na barra de endereço.",
  instalado: "Você já está usando o app instalado."
};

/* ------------------------------------------------------------------ 6.13 Para testar o protótipo (T27) */

export const DEMONSTRACAO = {
  titulo: "Para testar o protótipo",
  texto: "Use para ver a flor crescer e a trilha andar sem esperar os dias. Os dados de teste ficam separados dos seus e somem quando você desliga.",
  chave: "Modo de demonstração",
  // Só com o modo ligado. data: "sexta-feira, 6 de novembro".
  relogio: (data) => `Relógio da demonstração: ${data}`,
  botoes: {
    avancar: "Avançar um dia",
    descansar: "Mostrar a flor descansando",
    liberar: "Liberar todos os dias da trilha",
    preencher: "Preencher uma semana de exemplo",
    zerar: "Zerar a demonstração"
  }
};
