/*
  Conteúdo: as frases de acolhimento de "Uma frase para agora", no Estou no limite (especificação, 6.6).

  EXPORTS
    FRASES             { pratico: [string], espiritual: [string] }: as 12 frases de cada tom, na ordem da
                       especificação. A tela embaralha e não repete até passar por todas.
    FRASES_NUMERADAS   [{ n, texto, tons }]: as 16 frases com o número de 6.6, uma vez só cada uma
                       (tons: ["pratico"], ["espiritual"] ou os dois).

  Se existe a frase do Dia 5 (fazBem.frase), ela vem primeiro, com o rótulo "A SUA FRASE" (textos.js, LIMITE).
  Cada frase aparece sozinha na tela, centrada (estilo frase).
*/

export const FRASES_NUMERADAS = [
  { n: 1, texto: "Você não precisa resolver nada agora.", tons: ["pratico", "espiritual"] },
  { n: 2, texto: "Só este minuto. O resto pode esperar um pouco.", tons: ["pratico", "espiritual"] },
  { n: 3, texto: "Com esse peso todo, qualquer pessoa estaria assim.", tons: ["pratico"] },
  { n: 4, texto: "Respire do jeito que der. Do jeito que der já serve.", tons: ["pratico", "espiritual"] },
  { n: 5, texto: "Sinta os pés no chão. O chão está segurando você.", tons: ["pratico", "espiritual"] },
  { n: 6, texto: "Hoje, fazer o mínimo já é bastante.", tons: ["pratico"] },
  { n: 7, texto: "Uma coisa de cada vez, só a próxima.", tons: ["pratico", "espiritual"] },
  { n: 8, texto: "Beba um gole d’água. Às vezes é por aí que se começa.", tons: ["pratico"] },
  { n: 9, texto: "Este aperto é real, e dá para cuidar dele aos poucos.", tons: ["pratico", "espiritual"] },
  { n: 10, texto: "Pedir ajuda também é um jeito de se cuidar.", tons: ["pratico", "espiritual"] },
  { n: 11, texto: "Você já atravessou outros dias difíceis, e este também vai passar.", tons: ["pratico"] },
  { n: 12, texto: "Tudo bem não estar bem hoje.", tons: ["pratico", "espiritual"] },
  { n: 13, texto: "Você não está só neste momento.", tons: ["espiritual"] },
  { n: 14, texto: "Entregue o que não cabe nas suas mãos.", tons: ["espiritual"] },
  { n: 15, texto: "Há em você um lugar quieto, mesmo agora.", tons: ["espiritual"] },
  { n: 16, texto: "A vida continua em você, mesmo neste cansaço.", tons: ["espiritual"] }
];

const doTom = (tom) => FRASES_NUMERADAS.filter((f) => f.tons.includes(tom)).map((f) => f.texto);

export const FRASES = {
  pratico: doTom("pratico"),
  espiritual: doTom("espiritual")
};
