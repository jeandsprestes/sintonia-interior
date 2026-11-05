/*
  js/flor.js · a flor de lótus dos 8 estágios, o descanso, as animações, as miniaturas e o lago (seção 5).

  Tudo devolve o TEXTO de um <svg>. Cor só por classes de css/desenhos.css (dz-tr = café, dz-cobre,
  dz-agua = --cobre-claro, dz-linha), para o tema Noite funcionar. Quadro da flor: viewBox 0 0 240 260.

  EXPORTS DO CONTRATO

  ROTULOS
    ["SEMENTE","BROTO","BROTO","BOTÃO","BOTÃO","BOTÃO","BOTÃO","LÓTUS"], um por estágio (6.10).

  florSVG({ estagio = 0, descansa = false, cresceuHoje = false, animacao = null, altura = 168, rotulo = null })
    estagio     0 a 7 (5.2). Fora disso, vale o mais perto.
    descansa    true: a lua aparece e, do estágio 5 em diante, as pétalas ficam fechadas no botão (5.3);
                o balanço passa a 11 s e a água a 22 s. Nada encolhe nem perde cor.
    cresceuHoje true: o que é novo no estágio (5.2, última coluna) sai em cobre. No estágio 7, a pétala
                do centro é sempre cobre. Com descansa, cresceuHoje não vale (não acontecem juntos).
    animacao    null (parada, só balanço e água) | "crescer" (o traço novo se desenha em 1.600 ms, as folhas
                abrem em 600 ms, o botão cresce, as pétalas se abrem) | "acordar" (a lua some em 600 ms, as
                pétalas fechadas reabrem em 1.200 ms e só então o traço novo se desenha; use com o estágio NOVO
                e descansa = false) | "pousar" (primeira vez: o círculo duplo se desenha em 1.600 ms, as ondas
                em 800 ms, a semente desce 12 px até a água em 900 ms, em cobre, e o anel abre em volta dela,
                nascendo cobre e assentando na cor da água) | "descansar" (com descansa = true: a lua aparece
                em 800 ms e as pétalas fecham em 1.200 ms). "crescer" e "acordar" já pintam o novo de cobre,
                mesmo sem cresceuHoje.
    altura      altura em px; a largura sai em altura x 240/260. O <svg> sai com width e height.
    rotulo      null: aria-hidden="true". Texto: role="img" e aria-label com ele.
                true: role="img" com o nome de rotuloDaFlor(...) (extra, para comodidade).
    Classes do <svg>: "dz-svg dz-flor", mais "dz-flor--descansa" e "dz-flor--{animacao}" quando valem.
    Grupos por dentro: dz-moldura, dz-agua-grupo (com as ondas dz-onda-1 a 3), dz-folhas, dz-semente,
    dz-anel, dz-balanco (haste, botão e pétalas; balança a partir da base, em 120, 199) e dz-lua.
    Toda animação para com html.menos-movimento (fica só opacidade em 200 ms, o desenho já pronto).

  rotuloDaFlor({ estagio, descansa, cresceuHoje })
    O nome acessível de 5.5: "Sua flor: semente. Ela brota no primeiro dia de cuidado." ·
    "Sua flor: botão. O traço de hoje está em cobre." · "Sua flor: lótus aberta hoje." ·
    "Sua flor está descansando." (e "Sua flor: broto." quando não há nada novo hoje).

  miniaturaFlor(estagio, { atual = false })
    40 px, para a fileira da folha Sua flor (5.4): a planta do estágio, sem animação, num anel.
    Com atual = true, o anel é --cobre e mais grosso (1,5 px); sem, é --linha de 1 px.
    Tem role="img" e aria-label ("Semente", "Broto", "Botão", "Lótus", com " · agora" no atual).
    Classes do <svg>: "dz-svg dz-mini" e "dz-mini--atual".

  lagoSVG(quantas, { largura = 360 })
    O lago de 5.6: quadro 360 x 60, as três ondas em --cobre-claro e uma lótus de 24 px para cada flor
    que já abriu, pousada no vale da sua onda (caminhos de 4.7 em escala 0,2, café, pétala do centro em
    cobre). Os 12 lugares são os de 5.6 (onda 1: x 40, 110, 180, 250, 320; onda 2: 75, 145, 215, 285;
    onda 3: 110, 180, 250), preenchidos sempre na mesma ordem, a partir do centro para o lago crescer
    equilibrado: 180 da onda 1; 145 e 215 da onda 2; 110 e 250 da onda 1; 180 da onda 3; 75 e 285 da
    onda 2; 40 e 320 da onda 1; 110 e 250 da onda 3. A partir da 13ª, aparece ao lado o texto "e mais N"
    (12 px na largura pedida). Passe em "largura" a largura real em px. As ondas boiam devagar, cada lótus
    com a sua onda. Decorativo (aria-hidden): a tela diz quantas lótus há ("Lótus no seu lago: 2").
    Classes do <svg>: "dz-svg dz-lago".

  COMO O TRAÇO NOVO SE DESENHA
    Ver o topo de js/desenhos.js: traço parado com non-scaling-stroke; traço que se desenha (dz-desenha)
    em unidades do desenho, com largura e comprimento calculados aqui para o tamanho pedido.
    A primeira onda passa por trás do anel da semente e da folha da esquerda: uma máscara parada (uma por
    desenho, com id único) é uma faixa que segue essa onda e a esconde ali, e as ondas deslizam por baixo dela.
    A faixa cobre a onda inteira em qualquer ponto do deslizar e nunca toca a segunda nem a terceira onda,
    de 100 a 320 px de altura (conferido em números em 05/11/2026). No pousar, a faixa do anel surge junto com
    ele, e a primeira onda passa inteira até a semente chegar. Como no traço que se desenha, a largura da faixa
    é calculada para a altura pedida: não mude o tamanho do <svg> da flor por CSS.
*/

import { PETALAS, ONDAS, GEO } from "./desenhos.js";

const { f2, ler, escrever, transformar, dividirCubica, pontoCubica, esc, abrirSvg, caminho, caminhoDesenhado, circuloCaminho, crescente, yEmX } = GEO;

export const ROTULOS = ["SEMENTE", "BROTO", "BROTO", "BOTÃO", "BOTÃO", "BOTÃO", "BOTÃO", "LÓTUS"];
const NOMES = ["semente", "broto", "broto", "botão", "botão", "botão", "botão", "lótus"];

// ------------------------------------------------------------------ o quadro (5.1)

const CX = 120, CY = 124, R_FORA = 112, R_DENTRO = 107;
const BASE = [120, 199];
// As ondas do logo em escala 1,1 (a especificação pede 1,36): com 1,36 a terceira onda cruza o círculo de
// dentro e, deslizando, a segunda também. Em 1,1 a primeira onda continua centrada na haste, em y 200.
const ESCALA_AGUA = 1.1;
const M_AGUA = [ESCALA_AGUA, 0, 0, ESCALA_AGUA, 120 - 80 * ESCALA_AGUA, 200 - 94 * ESCALA_AGUA];
const AGUA = ONDAS.map((d) => transformar(d, M_AGUA));

// ------------------------------------------------------------------ a haste: um S leve, de uma vez só

// Pontos por onde a haste passa (5.2): sai da semente, (122, 172) no 1, (120, 150) no 2, (120, 112) no 3,
// (120, 104) no 5. Os pontos (122.4, 183) e (117.6, 131) dão o S. A curva é a mesma em todos os estágios:
// cada estágio só mostra mais um trecho dela.
const HP = [[120, 193.3], [122.4, 183], [122, 172], [120, 150], [117.6, 131], [120, 112], [120, 104]];
const HS = [];
for (let i = 0; i < HP.length - 1; i++) {
  const p0 = HP[Math.max(i - 1, 0)], p1 = HP[i], p2 = HP[i + 1], p3 = HP[Math.min(i + 2, HP.length - 1)];
  HS.push({
    x0: p1[0], y0: p1[1],
    g: [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]]
  });
}

function tangente(x0, y0, g, t) {
  const u = 1 - t;
  return [
    3 * u * u * (g[0] - x0) + 6 * u * t * (g[2] - g[0]) + 3 * t * t * (g[4] - g[2]),
    3 * u * u * (g[1] - y0) + 6 * u * t * (g[3] - g[1]) + 3 * t * t * (g[5] - g[3])
  ];
}

/** Trecho da haste dos segmentos i0 até i1 - 1; com cortarT, o último segmento para em t. */
function trechoHaste(i0, i1, cortarT = null) {
  const segs = [];
  let fim = null, dir = null;
  for (let i = i0; i < i1; i++) {
    const s = HS[i];
    if (i === i1 - 1 && cortarT !== null) {
      const [a] = dividirCubica(s.x0, s.y0, s.g, cortarT);
      segs.push(a);
      fim = [a[4], a[5]];
      dir = tangente(s.x0, s.y0, s.g, cortarT);
    } else {
      segs.push(s.g);
      fim = [s.g[4], s.g[5]];
      dir = tangente(s.x0, s.y0, s.g, 1);
    }
  }
  return { subs: [{ x0: HS[i0].x0, y0: HS[i0].y0, segs, fechado: false }], fim, dir };
}

// O gancho da ponta que cresce (estágios 1 e 2): enrola para a esquerda e desce, como um broto.
// Desenhado com a ponta para cima (frente = -y); depois é girado para seguir a haste.
const GANCHO = [
  [0, -3, -1, -5.7, -3.4, -6],
  [-5.7, -6.3, -6.9, -4.4, -6.6, -2.4],
  [-6.45, -1.3, -5.75, -0.75, -4.95, -1.05]
];

function comGancho(trecho, escala = 1) {
  const [px, py] = trecho.fim;
  const ang = Math.atan2(trecho.dir[1], trecho.dir[0]) + Math.PI / 2;
  const c = Math.cos(ang), s = Math.sin(ang);
  const T = (x, y) => [px + (c * x - s * y) * escala, py + (s * x + c * y) * escala];
  const segs = GANCHO.map((g) => [...T(g[0], g[1]), ...T(g[2], g[3]), ...T(g[4], g[5])]);
  const sub = trecho.subs[0];
  return escrever([{ ...sub, segs: [...sub.segs, ...segs] }]);
}

// ------------------------------------------------------------------ botão, pétalas, folhas, semente, lua

/** O botão fechado: duas pétalas que se encontram na ponta (contorno esquerdo, direito e a borda da da frente). */
function botao(cx, by, w, h) {
  const p = (x, y) => f2(x) + " " + f2(y);
  const esquerda = `M${p(cx, by)}C${p(cx - 0.37 * w, by - 0.02 * h)} ${p(cx - 0.53 * w, by - 0.25 * h)} ${p(cx - 0.5 * w, by - 0.44 * h)}` +
    `C${p(cx - 0.47 * w, by - 0.63 * h)} ${p(cx - 0.15 * w, by - 0.84 * h)} ${p(cx, by - h)}`;
  const direita = `M${p(cx, by)}C${p(cx + 0.37 * w, by - 0.02 * h)} ${p(cx + 0.53 * w, by - 0.25 * h)} ${p(cx + 0.5 * w, by - 0.44 * h)}` +
    `C${p(cx + 0.47 * w, by - 0.63 * h)} ${p(cx + 0.15 * w, by - 0.84 * h)} ${p(cx, by - h)}`;
  const frente = `M${p(cx, by)}C${p(cx + 0.24 * w, by - 0.3 * h)} ${p(cx + 0.21 * w, by - 0.72 * h)} ${p(cx, by - h)}`;
  return [esquerda, direita, frente];
}

/** As pétalas de 4.7, abertas na largura sx, com a base em (120, base). */
function petalas(lista, sx, base = 104) {
  const m = [sx, 0, 0, 1, 120 - 60 * sx, base - 64];
  return lista.map((i) => ({ i, d: transformar(PETALAS[i], m) }));
}

/** Pontos de uma elipse (ângulo em graus, 0 = direita, 90 = embaixo) e um arco dela em cúbicas. */
function arcoElipse(cx, cy, rx, ry, a0, a1, partes = 4) {
  const segs = [];
  const P = (a) => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  const D = (a) => [-rx * Math.sin(a), ry * Math.cos(a)];
  const A0 = (a0 * Math.PI) / 180, A1 = (a1 * Math.PI) / 180;
  const passo = (A1 - A0) / partes;
  const kk = (4 / 3) * Math.tan(passo / 4);
  for (let n = 0; n < partes; n++) {
    const a = A0 + n * passo, b = a + passo;
    const pa = P(a), pb = P(b), da = D(a), db = D(b);
    segs.push([pa[0] + kk * da[0], pa[1] + kk * da[1], pb[0] - kk * db[0], pb[1] - kk * db[1], pb[0], pb[1]]);
  }
  return { inicio: P(A0), segs };
}

/**
 * Folha de lótus boiando, vista de lado (uma elipse achatada), com o corte em V voltado para a haste.
 * lado = 1: o corte fica à direita; lado = -1: à esquerda.
 */
function folhaLotus(cx, cy, w, h, lado) {
  const rx = w / 2, ry = h / 2, th = 35;
  const meio = lado > 0 ? 0 : 180;
  const arco = arcoElipse(cx, cy, rx, ry, meio + th, meio + 360 - th, 6);
  const fimArco = arco.segs[arco.segs.length - 1];
  const apice = [cx + lado * rx * 0.62, cy + ry * 0.1];
  const reta = (a, b) => [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3, a[0] + (2 * (b[0] - a[0])) / 3, a[1] + (2 * (b[1] - a[1])) / 3, b[0], b[1]];
  const segs = [...arco.segs, reta([fimArco[4], fimArco[5]], apice), reta(apice, arco.inicio)];
  return {
    d: escrever([{ x0: arco.inicio[0], y0: arco.inicio[1], segs, fechado: true }]),
    origem: [cx + lado * rx, cy]
  };
}

// As folhas de 5.2 (48 x 10 e 36 x 8), um pouco mais altas e mais para a esquerda que na especificação
// ((88, 199) e (152, 201)): assim a primeira onda passa atrás da folha da esquerda (a máscara a esconde ali;
// "halo" marca essa folha) e por baixo da folha da direita, sem encostar, e o corte em V não toca o anel da semente.
const FOLHA_1 = { ...folhaLotus(86, 196.6, 48, 10, 1), halo: true };
const FOLHA_2 = { ...folhaLotus(149, 196.4, 36, 8, -1), halo: false };

// A semente e o anel (5.2, estágio 0). A especificação pede a amêndoa de 10 x 6 em (120, 197) e o anel de
// 14 x 3 em (120, 199); nessas medidas, no tamanho da tela, a borda de baixo da semente e a frente do anel
// viram um borrão só (parecia um chapéu). Aqui a semente sobe 0,8 e o anel abre para 20 x 6, na cor da água
// (ele é uma onda), com a parte de trás escondida atrás da semente: ela fica sentada no anel, com ar em volta.
const SEMENTE_Y = 196.2;
const ANEL = { cx: 120, cy: 199.7, rx: 10, ry: 3 };

/** A semente: uma amêndoa de 10 x 6 deitada na água, inclinada 6 graus. */
function semente(escala = 1) {
  const y = SEMENTE_Y;
  const d = `M115 ${y + 0.2}C115.4 ${y - 1.9} 117.4 ${y - 3} 120 ${y - 3}C122.6 ${y - 3} 124.6 ${y - 1.8} 125 ${y}` +
    `C124.6 ${y + 1.9} 122.6 ${y + 3} 120 ${y + 3}C117.4 ${y + 3} 115.4 ${y + 2} 115 ${y + 0.2}Z`;
  const r = (-6 * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
  const giro = [c, sn, -sn, c, 120 - c * 120 + sn * y, y - sn * 120 - c * y];
  const m = [escala, 0, 0, escala, 120 - 120 * escala, y - y * escala];
  return transformar(transformar(d, giro), m);
}

/** O anel de onda em volta da semente; a parte de trás some atrás dela. */
function anel(escala = 1) {
  const { cx, cy, rx, ry } = ANEL;
  const m = [escala, 0, 0, escala, cx - cx * escala, cy - cy * escala];
  const linha = (a0, a1, partes) => {
    const a = arcoElipse(cx, cy, rx, ry, a0, a1, partes);
    return escrever([{ x0: a.inicio[0], y0: a.inicio[1], segs: a.segs, fechado: false }]);
  };
  // a frente vai de 0 (direita) a 180 (esquerda) passando por baixo; atrás, só as pontas que a semente não cobre
  return [linha(0, 180, 4), linha(180, 232, 1), linha(308, 360, 1)].map((d) => transformar(d, m));
}

/**
 * O trecho da primeira onda entre xa e xb, para a faixa da máscara. Com xa = null, a faixa começa no começo
 * da onda e recua mais 5 unidades na mesma direção: quando a água desliza para a esquerda, a ponta da onda
 * continua escondida atrás da folha.
 */
function faixaDaOnda(xa, xb) {
  if (xa !== null) return cortarX(AGUA[0], xa, xb);
  const s = ler(AGUA[0])[0];
  const dx = s.segs[0][0] - s.x0, dy = s.segs[0][1] - s.y0, n = Math.hypot(dx, dy);
  return `M${f2(s.x0 - (5 * dx) / n)} ${f2(s.y0 - (5 * dy) / n)}L` + cortarX(AGUA[0], s.x0, xb).slice(1);
}

// A lua do descanso (5.3): arco de fora com raio 10, de dentro com raio 8, abertura para a direita.
// Centro em (180, 56) e não em (184, 52): ali a ponta de cima encosta no círculo de dentro.
const LUA = { cx: 180, cy: 56 };
const LUA_D = crescente(LUA.cx, LUA.cy, 10, 8, 4.6, 0);

// ------------------------------------------------------------------ peças de cada estágio

/**
 * O que existe em cada estágio e o que é novo nele.
 * Devolve { hasteVelha, hasteNova, botao: { ds, base, novo, cresceDe } | null,
 *           petalasAbertas: [{i,d}] (as que já existiam e se abrem mais), abreDe (a largura de antes),
 *           petalasNovas: [{i,d}], folhas: [{folha, nova}] }
 */
function pecas(s, descansa) {
  const r = { hasteVelha: null, hasteNova: null, botao: null, petalasAbertas: [], abreDe: null, petalasNovas: [], folhas: [] };
  if (s >= 2) r.folhas.push({ folha: FOLHA_1, nova: s === 2 });
  if (s >= 4) r.folhas.push({ folha: FOLHA_2, nova: s === 4 });

  if (s === 1) {
    r.hasteNova = comGancho(trechoHaste(0, 2, 0.5));
  } else if (s === 2) {
    r.hasteVelha = escrever(trechoHaste(0, 2).subs);
    r.hasteNova = comGancho(trechoHaste(2, 3, 0.74));
  } else if (s === 3) {
    r.hasteVelha = escrever(trechoHaste(0, 3).subs);
    r.hasteNova = escrever(trechoHaste(3, 5).subs);
    r.botao = { ds: botao(120, 112, 16, 30), base: [120, 112], novo: true, cresceDe: null };
  } else if (s === 4) {
    r.hasteVelha = escrever(trechoHaste(0, 5).subs);
    r.botao = { ds: botao(120, 112, 20, 38), base: [120, 112], novo: true, cresceDe: [16 / 20, 30 / 38] };
  } else if (s >= 5) {
    if (s === 5) {
      r.hasteVelha = escrever(trechoHaste(0, 5).subs);
      r.hasteNova = escrever(trechoHaste(5, 6).subs);
    } else {
      r.hasteVelha = escrever(trechoHaste(0, 6).subs);
    }
    if (descansa) {
      r.botao = { ds: botao(120, 104, 20, 38), base: [120, 104], novo: false, cresceDe: null };
    } else if (s === 5) {
      r.petalasNovas = petalas([0, 1, 2], 0.35);
    } else if (s === 6) {
      r.petalasAbertas = petalas([0, 1, 2], 0.7);
      r.abreDe = 0.35 / 0.7;
      r.petalasNovas = petalas([3, 4], 0.7);
    } else {
      r.petalasAbertas = petalas([0, 1, 2, 3, 4], 1);
      r.abreDe = 0.7;
      r.petalasNovas = petalas([5, 6], 1);
    }
  }
  return r;
}

// ------------------------------------------------------------------ a flor

let contador = 0;
const novoId = () => `dzf${(++contador).toString(36)}${Math.floor(Math.random() * 1679616).toString(36)}`;

const ANIMACOES = ["crescer", "acordar", "pousar", "descansar"];

export function rotuloDaFlor({ estagio = 0, descansa = false, cresceuHoje = false } = {}) {
  const s = Math.min(7, Math.max(0, Math.round(Number(estagio) || 0)));
  if (descansa) return "Sua flor está descansando.";
  if (s === 7) return "Sua flor: lótus aberta hoje.";
  if (s === 0) return "Sua flor: semente. Ela brota no primeiro dia de cuidado.";
  if (cresceuHoje) return `Sua flor: ${NOMES[s]}. O traço de hoje está em cobre.`;
  return `Sua flor: ${NOMES[s]}.`;
}

export function florSVG({ estagio = 0, descansa = false, cresceuHoje = false, animacao = null, altura = 168, rotulo = null } = {}) {
  const s = Math.min(7, Math.max(0, Math.round(Number(estagio) || 0)));
  const anim = ANIMACOES.includes(animacao) ? animacao : null;
  const k = altura / 260;
  const largura = (altura * 240) / 260;
  const descanso = Boolean(descansa);
  const novoEmCobre = !descanso && (Boolean(cresceuHoje) || anim === "crescer" || anim === "acordar");
  const desenhaNovo = !descanso && (anim === "crescer" || anim === "acordar");
  const pousar = anim === "pousar";
  const p = pecas(s, descanso);
  const id = novoId();

  // quando o traço novo começa: no acordar, depois da lua (600 ms) e das pétalas que reabrem (1.200 ms)
  const reabre = anim === "acordar" && s >= 6;
  const t0 = anim === "acordar" ? (reabre ? 1200 : 600) : 0;
  const corNova = novoEmCobre ? "dz-tr dz-cobre" : "dz-tr";

  let rot = null;
  if (rotulo === true) rot = rotuloDaFlor({ estagio: s, descansa: descanso, cresceuHoje });
  else if (rotulo) rot = String(rotulo);

  const classes = ["dz-flor"];
  if (descanso) classes.push("dz-flor--descansa");
  if (anim) classes.push(`dz-flor--${anim}`);
  let out = abrirSvg({ viewBox: "0 0 240 260", largura, altura, classe: classes.join(" "), rotulo: rot });

  // margem da máscara: 2,3 px de ar entre o anel da semente e a água que aparece dos dois lados
  const margem = 2.3 / k;

  // --- máscara parada: a primeira onda some atrás do anel da semente e, com a folha da esquerda, atrás dela.
  // A máscara é uma faixa que segue a própria onda, com meia largura de meio traço da onda (0,8 px) mais o
  // desvio do deslizar (3 unidades numa inclinação de até 0,44) e uma folga; assim ela nunca toca a segunda onda,
  // que passa logo abaixo da folha e do anel, em nenhum tamanho.
  const meia = 0.8 / k + 1.8;
  const xa = 120 - ANEL.rx - margem, xb = 120 + ANEL.rx + margem;
  out += `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="280" height="300">` +
    `<rect class="dz-m-sim" x="-20" y="-20" width="280" height="300"/>` +
    `<path class="dz-m-faixa${pousar ? " dz-m-surge" : ""}" d="${faixaDaOnda(xa, xb)}" style="stroke-width:${f2(2 * meia)}px${pousar ? ";--atraso:2700ms" : ""}"/>`;
  for (const { folha, nova } of p.folhas) {
    if (!folha.halo) continue;
    const abre = nova && desenhaNovo;
    const estilo = `stroke-width:${f2(2 * meia)}px` + (abre ? `;transform-origin:${f2(folha.origem[0])}px ${f2(folha.origem[1])}px;--atraso:${t0 + 500}ms` : "");
    out += `<path class="dz-m-faixa${abre ? " dz-folha-abre" : ""}" d="${faixaDaOnda(null, xa + 1)}" style="${estilo}"/>`;
  }
  out += `</mask></defs>`;

  // --- moldura: o círculo duplo
  out += `<g class="dz-moldura">`;
  if (pousar) {
    out += caminhoDesenhado(circuloCaminho(CX, CY, R_FORA), { classe: "dz-linha", k, traco: 1, dur: 1600 });
    out += caminhoDesenhado(circuloCaminho(CX, CY, R_DENTRO, false), { classe: "dz-linha", k, traco: 1, dur: 1600, atraso: 120 });
  } else {
    out += caminho(circuloCaminho(CX, CY, R_FORA), "dz-linha") + caminho(circuloCaminho(CX, CY, R_DENTRO), "dz-linha");
  }
  out += `</g>`;

  // --- a água (três ondas que deslizam por baixo da máscara)
  out += `<g class="dz-agua-grupo" mask="url(#${id})">`;
  AGUA.forEach((d, n) => {
    const onda = pousar
      ? caminhoDesenhado(d, { classe: "dz-tr dz-agua", k, dur: 800, atraso: 1250 + n * 110 })
      : caminho(d, "dz-tr dz-agua");
    out += `<g class="dz-onda dz-onda-${n + 1}">${onda}</g>`;
  });
  out += `</g>`;

  // --- folhas boiando
  if (p.folhas.length) {
    out += `<g class="dz-folhas">`;
    for (const { folha, nova } of p.folhas) {
      const cor = nova && novoEmCobre ? "dz-tr dz-cobre" : "dz-tr";
      if (nova && desenhaNovo) {
        out += `<g class="dz-folha-abre" style="transform-origin:${f2(folha.origem[0])}px ${f2(folha.origem[1])}px;--atraso:${t0 + 500}ms">${caminho(folha.d, cor)}</g>`;
      } else {
        out += caminho(folha.d, cor);
      }
    }
    out += `</g>`;
  }

  // --- semente e anel
  const corSemente = pousar ? "dz-tr dz-cobre" : "dz-tr";
  if (pousar) {
    out += `<g class="dz-semente dz-semente-pousa" style="--queda:${f2(-12 / k)}px;--atraso:1900ms">${caminho(semente(), corSemente)}</g>`;
    out += `<g class="dz-anel dz-anel-surge" style="transform-origin:120px 199.7px;--atraso:2700ms">` +
      anel().map((d) => caminho(d, "dz-tr dz-agua dz-anel-assenta", ` style="--atraso:2700ms"`)).join("") + `</g>`;
  } else {
    out += `<g class="dz-semente">${caminho(semente(), "dz-tr")}</g>`;
    out += `<g class="dz-anel">${anel().map((d) => caminho(d, "dz-tr dz-agua")).join("")}</g>`;
  }

  // --- a planta que balança
  out += `<g class="dz-balanco" style="transform-origin:${BASE[0]}px ${BASE[1]}px">`;
  if (p.hasteVelha) out += caminho(p.hasteVelha, "dz-tr");
  if (p.hasteNova) {
    if (desenhaNovo) {
      const dur = s === 3 ? 1000 : s === 5 ? 500 : 1600;
      out += caminhoDesenhado(p.hasteNova, { classe: corNova, k, dur, atraso: t0 });
    } else {
      out += caminho(p.hasteNova, corNova);
    }
  }

  // botão
  if (p.botao) {
    const b = p.botao;
    const fechadoNoDescanso = descanso && s >= 5;
    const cor = b.novo ? corNova : "dz-tr";
    if (fechadoNoDescanso) {
      const entra = anim === "descansar";
      out += `<g class="dz-botao${entra ? " dz-botao-entra" : ""}" style="transform-origin:${f2(b.base[0])}px ${f2(b.base[1])}px">` +
        b.ds.map((d) => caminho(d, "dz-tr")).join("") + `</g>`;
    } else if (desenhaNovo && b.novo && b.cresceDe) {
      out += `<g class="dz-cresce" style="transform-origin:${f2(b.base[0])}px ${f2(b.base[1])}px;--de-x:${f2(b.cresceDe[0])};--de-y:${f2(b.cresceDe[1])};--atraso:${t0}ms">` +
        b.ds.map((d) => caminho(d, cor)).join("") + `</g>`;
    } else if (desenhaNovo && b.novo) {
      out += b.ds.map((d) => caminhoDesenhado(d, { classe: cor, k, dur: 900, atraso: t0 + 700 })).join("");
    } else {
      out += b.ds.map((d) => caminho(d, cor)).join("");
    }
  }

  // no descanso que começa agora (estágio 5 ou mais), as pétalas abertas se fecham sobre o botão
  if (descanso && s >= 5 && anim === "descansar") {
    const abertas = s === 5 ? petalas([0, 1, 2], 0.35) : s === 6 ? petalas([0, 1, 2, 3, 4], 0.7) : petalas([0, 1, 2, 3, 4, 5, 6], 1);
    out += `<g class="dz-petalas-fecham" style="transform-origin:120px 104px">` +
      abertas.map(({ i, d }) => caminho(d, s === 7 && i === 0 ? "dz-tr dz-cobre" : "dz-tr")).join("") + `</g>`;
  }

  // ao acordar do estágio 5 ou mais, o botão fechado se abre
  if (reabre) {
    out += `<g class="dz-botao-sai" style="transform-origin:120px 104px">` + botao(120, 104, 20, 38).map((d) => caminho(d, "dz-tr")).join("") + `</g>`;
  }

  // pétalas que já existiam e se abrem mais
  if (p.petalasAbertas.length) {
    const cor = (i) => (s === 7 && i === 0 ? "dz-tr dz-cobre" : corNova);
    const corpo = p.petalasAbertas.map(({ i, d }) => caminho(d, cor(i))).join("");
    if (reabre) {
      out += `<g class="dz-reabre" style="transform-origin:120px 104px">${corpo}</g>`;
    } else if (desenhaNovo) {
      out += `<g class="dz-abre" style="transform-origin:120px 104px;--de-x:${f2(p.abreDe)};--atraso:${t0}ms">${corpo}</g>`;
    } else {
      out += corpo;
    }
  }

  // pétalas novas
  if (p.petalasNovas.length) {
    const cor = (i) => (s === 7 && i === 0 ? "dz-tr dz-cobre" : corNova);
    if (desenhaNovo) {
      const atraso = s === 5 ? t0 + 300 : t0 + (reabre ? 0 : 400);
      const dur = s === 5 ? 1300 : 1200;
      out += p.petalasNovas.map(({ i, d }) => caminhoDesenhado(d, { classe: cor(i), k, dur, atraso })).join("");
    } else {
      out += p.petalasNovas.map(({ i, d }) => caminho(d, cor(i))).join("");
    }
  }
  out += `</g>`;

  // --- a lua
  if (descanso) {
    out += `<g class="dz-lua${anim === "descansar" ? " dz-lua-entra" : ""}">${caminho(LUA_D, "dz-tr")}</g>`;
  } else if (anim === "acordar") {
    out += `<g class="dz-lua dz-lua-sai">${caminho(LUA_D, "dz-tr")}</g>`;
  }

  return out + "</svg>";
}

// ------------------------------------------------------------------ miniaturas (folha Sua flor)

function tEmX(x0, y0, g, X) {
  let lo = 0, hi = 1;
  const crescente2 = g[4] >= x0;
  for (let n = 0; n < 40; n++) {
    const m = (lo + hi) / 2;
    if ((pontoCubica(x0, y0, g, m)[0] < X) === crescente2) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/** O trecho de um caminho (que anda para a direita) entre xa e xb. */
function cortarX(d, xa, xb) {
  const s = ler(d)[0];
  const out = { x0: null, y0: null, segs: [], fechado: false };
  let x = s.x0, y = s.y0;
  for (const g of s.segs) {
    if (g[4] <= xa || x >= xb) { x = g[4]; y = g[5]; continue; }
    let seg = g, sx = x, sy = y;
    if (sx < xa) {
      const t = tEmX(sx, sy, seg, xa);
      const p = pontoCubica(sx, sy, seg, t);
      seg = dividirCubica(sx, sy, seg, t)[1];
      sx = p[0]; sy = p[1];
    }
    if (seg[4] > xb) seg = dividirCubica(sx, sy, seg, tEmX(sx, sy, seg, xb))[0];
    if (out.x0 === null) { out.x0 = sx; out.y0 = sy; }
    out.segs.push(seg);
    x = g[4]; y = g[5];
  }
  return escrever([out]);
}

const NOMES_MINI = ["Semente", "Broto", "Broto", "Botão", "Botão", "Botão", "Botão", "Lótus"];

export function miniaturaFlor(estagio, { atual = false } = {}) {
  const s = Math.min(7, Math.max(0, Math.round(Number(estagio) || 0)));
  const p = pecas(s, false);
  const rot = NOMES_MINI[s] + (atual ? " · agora" : "");
  let out = abrirSvg({ viewBox: "20 28 200 200", largura: 40, altura: 40, classe: "dz-mini" + (atual ? " dz-mini--atual" : ""), rotulo: rot });
  out += caminho(circuloCaminho(120, 128, 97), atual ? "dz-mini-anel dz-mini-anel--atual" : "dz-mini-anel");
  out += caminho(cortarX(AGUA[0], 62, 106), "dz-mini-tr dz-agua") + caminho(cortarX(AGUA[0], 134, 178), "dz-mini-tr dz-agua");
  for (const { folha } of p.folhas) out += caminho(folha.d, "dz-mini-tr");
  out += caminho(semente(s === 0 ? 2 : 1.35), "dz-mini-tr");
  if (s === 0) out += anel(2).map((d) => caminho(d, "dz-mini-tr dz-agua")).join("");
  if (s === 1) out += caminho(comGancho(trechoHaste(0, 2, 0.5), 1.5), "dz-mini-tr");
  if (s === 2) out += caminho(escrever(trechoHaste(0, 2).subs), "dz-mini-tr") + caminho(comGancho(trechoHaste(2, 3, 0.74), 1.5), "dz-mini-tr");
  if (p.hasteVelha && s >= 3) out += caminho(p.hasteVelha, "dz-mini-tr");
  if (p.hasteNova && s >= 3) out += caminho(p.hasteNova, "dz-mini-tr");
  if (p.botao) out += p.botao.ds.map((d) => caminho(d, "dz-mini-tr")).join("");
  for (const { i, d } of [...p.petalasAbertas, ...p.petalasNovas]) out += caminho(d, s === 7 && i === 0 ? "dz-mini-tr dz-cobre" : "dz-mini-tr");
  return out + "</svg>";
}

// ------------------------------------------------------------------ o lago (5.6)

/** Onda periódica: cristas e vales a cada meio período, começando numa crista em x0. */
function ondaPeriodica(x0, x1, y, A, P) {
  const meio = P / 2, k = 0.3642 * meio;
  let d = `M${f2(x0)} ${f2(y - A)}`;
  let crista = true;
  for (let x = x0; x < x1 - 0.01; x += meio) {
    const ya = crista ? y - A : y + A, yb = crista ? y + A : y - A;
    d += `C${f2(x + k)} ${f2(ya)} ${f2(x + meio - k)} ${f2(yb)} ${f2(x + meio)} ${f2(yb)}`;
    crista = !crista;
  }
  return d;
}

const LAGO_ONDAS = [
  { d: ondaPeriodica(5, 355, 22, 1.8, 70), vale: 23.8 },
  { d: ondaPeriodica(40, 320, 37, 1.8, 70), vale: 38.8 },
  { d: ondaPeriodica(75, 285, 52, 1.8, 70), vale: 53.8 }
];

// [onda, x] na ordem em que as lótus chegam (do centro para fora)
const LAGO_LUGARES = [
  [0, 180], [1, 145], [1, 215], [0, 110], [0, 250], [2, 180],
  [1, 75], [1, 285], [0, 40], [0, 320], [2, 110], [2, 250]
];

function lotusDoLago(x, y) {
  const m = [0.2, 0, 0, 0.2, x - 12, y - 12.8];
  return PETALAS.map((d, i) => caminho(transformar(d, m), i === 0 ? "dz-tr dz-lago-lotus dz-cobre" : "dz-tr dz-lago-lotus")).join("");
}

export function lagoSVG(quantas, { largura = 360 } = {}) {
  const n = Math.max(0, Math.floor(Number(quantas) || 0));
  const altura = largura / 6;
  const k = largura / 360;
  const porOnda = [[], [], []];
  LAGO_LUGARES.slice(0, Math.min(n, 12)).forEach(([o, x]) => porOnda[o].push(x));
  let out = abrirSvg({ viewBox: "0 0 360 60", largura, altura, classe: "dz-lago" });
  LAGO_ONDAS.forEach((onda, o) => {
    out += `<g class="dz-onda dz-onda-${o + 1}">` + caminho(onda.d, "dz-tr dz-agua") +
      porOnda[o].map((x) => lotusDoLago(x, yEmX(onda.d, x) ?? onda.vale)).join("") + `</g>`;
  });
  if (n > 12) {
    out += `<text class="dz-lago-mais" x="297" y="56.5" style="font-size:${f2(12 / k)}px">${esc(`e mais ${n - 12}`)}</text>`;
  }
  return out + "</svg>";
}
