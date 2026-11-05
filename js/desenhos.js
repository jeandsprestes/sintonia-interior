/*
  js/desenhos.js · os desenhos de traço do Sintonia Interior (seções 4.5 a 4.8 da especificação).

  Todas as funções devolvem o TEXTO de um <svg> pronto para ir ao DOM (por exemplo, com o svg() de ui.js).
  A cor nunca vem escrita aqui: cada traço leva uma classe de css/desenhos.css, que usa var(--tinta),
  var(--cobre), var(--cobre-claro), var(--linha) e var(--kraft). Assim o tema Noite funciona sozinho.
  Com "rotulo", o <svg> leva role="img" e aria-label; sem rotulo, aria-hidden="true".

  EXPORTS DO CONTRATO

  PETALAS
    Os 7 caminhos da lótus de 4.7, quadro 120 x 70, base em (60, 64). O primeiro é a pétala do centro;
    depois: 2 interna esquerda, 3 interna direita, 4 do meio esquerda, 5 do meio direita,
    6 de fora esquerda, 7 de fora direita.
    Para Olhar o caminho (T15), a ordem da esquerda para a direita é: Dia 1 = PETALAS[5], Dia 2 = PETALAS[3],
    Dia 3 = PETALAS[1], Dia 7 = PETALAS[0] (centro, em cobre), Dia 4 = PETALAS[2], Dia 5 = PETALAS[4],
    Dia 6 = PETALAS[6]. As pontas ficam em: [60,6] [44,16] [76,16] [26,30] [94,30] [8,46] [112,46].

  ONDAS
    Os 3 caminhos das ondas de 4.7 (quadro 160 x 120 da lótus com as ondas). A flor usa as mesmas ondas
    em escala 1,1, centradas na haste (ver js/flor.js: com a escala 1,36 de 5.1 elas tocam o círculo).

  icone(nome, { rotulo = null, tamanho = 24 })
    Ícone de 4.5 no quadro de 24, traço de 1,5 px (fica 1,5 px em qualquer tamanho), pontas redondas,
    sem preenchimento, cor currentColor (classe dz-ic). Nome desconhecido devolve "".
    Nomes: hoje, trilha, praticas, semana, ajustes, limite, cansaco, sobrecarga, desconexao,
    tempo2, tempo5, tempo10, corpo, emocoes, mente, espirito, leveza, calma, alivio, igual, peso,
    sino, pausar, seguir, voltar, fechar, check, lotus, lua, som.
    tempo2 e tempo5 trazem o círculo inteiro bem apagado atrás do arco (classe dz-ic-trilho, opacidade 0,3),
    para o sexto e o meio círculo se lerem como parte de um todo; tempo10 é o círculo inteiro.
    Classes do <svg>: "dz-svg dz-icone dz-icone-{nome}".

  figura(nome, { tamanho = 200 })
    Desenho de passo do tocador, quadro 200 x 200, traço de 1,6 px, café, com um traço só em cobre.
    Nomes: "horizonte" (uma reta com meio sol, o sol em cobre, e dois reflexos curtos embaixo), "ondas" (as
    três ondas; a de cima em cobre),
    "autoabraco" (o mesmo desenho de autoabraco(), parado), "ramo" (ramo de folhas; a folha da ponta em cobre).
    Também aceita "mapa", que devolve mapaCuidado({}, { tamanho }) (o conteúdo usa esse nome de figura).
    Sempre decorativa (aria-hidden): o texto do passo diz o que fazer.

  lotusMarca({ tamanho = 28, rotulo = null })
    A lótus de 7 pétalas da barra de Hoje, pétala do centro em cobre, traço de 1,25 px.
    "tamanho" é a ALTURA em px; a largura sai em tamanho x 12/7 (28 de altura, 48 de largura).

  lotusComOndas({ largura = 160, animar = false })
    A marca das boas-vindas (T01) e de Sobre no Noite: a lótus com as 3 ondas, quadro 160 x 120,
    pétala do centro em cobre. Com animar = true, as pétalas se desenham uma depois da outra e as ondas
    em seguida, 2.400 ms no total (4.8). Decorativa (aria-hidden).

  autoabraco({ tamanho = 56 })
    O autoabraço grande do Estou no limite, num traço contínuo só (a cabeça, os ombros e os braços
    cruzados com as mãos repousando nos ombros), quadro 100 x 100. Ele se desenha em 1.200 ms ao entrar
    no DOM; com html.menos-movimento, aparece pronto (só opacidade, 200 ms). Decorativo (aria-hidden).

  mapaCuidado(respostas, { tamanho = 200 })
    O mapa do Dia 3: quatro pétalas em volta de um centro, sobre um disco --kraft a 50%.
    FORMATO DE respostas (o que o Dia 3 guarda, 6.5): { corpo, emocoes, mente, espirito }, cada um um
    número de 0 a 3, onde 0 = "Quase nenhum", 1 = "Pouco", 2 = "Algum", 3 = "Bastante".
    A pétala leva (valor + 1) contornos, de 1 a 4, um dentro do outro (estreitos perto do centro, largos
    e arredondados para fora): quanto mais espaço, maior a pétala. Valor ausente ou inválido: a pétala fica
    sem contorno e só o ícone aparece. Posições: Corpo em cima, Emoções à direita, Mente embaixo, Espírito
    à esquerda, cada uma com o ícone da dimensão (24 px) na ponta. O centro é um círculo pequeno em cobre.
    Aceita também o objeto de respostas inteiro do dia, desde que traga essas quatro chaves
    (ou { mapa: { corpo, ... } }). Decorativo (aria-hidden): a tela diz o que o mapa mostra.

  circuloDuplo()
    O círculo duplo enorme do fundo no computador (4.10): dois círculos em --linha, parados, com opacidade
    0,06 (classe dz-circulo-duplo). O <svg> tem width e height 100% e viewBox 0 0 1000 1000: quem o usa
    dá o tamanho ao elemento que o contém.

  EXTRA (uso interno, não faz parte do contrato)
    GEO: as funções de geometria que js/flor.js usa (ler, transformar e medir caminhos). Quem desenhar
    Olhar o caminho pode usar GEO.caminhoDesenhado(PETALAS[i], { classe: "dz-tr", k, dur: 400, atraso })
    para cada pétala se desenhar, com k = largura em px / 120.

  O TRAÇO QUE SE DESENHA (por que não usa pathLength)
    No Chromium, stroke-dasharray com pathLength não convive com vector-effect: non-scaling-stroke
    (o tracejado passa a ser medido em pixels da tela e o desenho sai partido; testado em 05/11/2026).
    Por isso: todo traço parado usa non-scaling-stroke (1,6 px ou 1,5 px exatos em qualquer tamanho);
    só os traços que se desenham (classe dz-desenha) trocam para um traço em unidades do desenho, com a
    largura calculada a partir do tamanho pedido e o comprimento do caminho medido aqui, em JavaScript
    (variáveis --d, --g e --o no style). No tamanho pedido, os dois saem iguais. Por isso o <svg> sai com
    width e height: não mude o tamanho dele por CSS enquanto ele se desenha.
*/

// ------------------------------------------------------------------ geometria

const f2 = (n) => {
  const r = Math.round(n * 100) / 100;
  return String(Object.is(r, -0) ? 0 : r);
};

/** Lê um caminho (M, L, H, V, C, S, Q, Z, absolutos ou relativos) e devolve subcaminhos com cúbicas. */
function ler(d) {
  const tk = String(d).match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const subs = [];
  let i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0, c2x = null, c2y = null, sub = null;
  const n = () => parseFloat(tk[i++]);
  while (i < tk.length) {
    if (/[a-zA-Z]/.test(tk[i])) cmd = tk[i++];
    const rel = cmd !== cmd.toUpperCase();
    const C = cmd.toUpperCase();
    if (C === "M") {
      let nx = n(), ny = n();
      if (rel) { nx += x; ny += y; }
      x = sx = nx; y = sy = ny;
      sub = { x0: x, y0: y, segs: [], fechado: false };
      subs.push(sub);
      cmd = rel ? "l" : "L";
      c2x = null;
    } else if (C === "L" || C === "H" || C === "V") {
      let nx = x, ny = y;
      if (C === "L") { nx = n(); ny = n(); if (rel) { nx += x; ny += y; } }
      else if (C === "H") { nx = n(); if (rel) nx += x; }
      else { ny = n(); if (rel) ny += y; }
      sub.segs.push([x + (nx - x) / 3, y + (ny - y) / 3, x + (2 * (nx - x)) / 3, y + (2 * (ny - y)) / 3, nx, ny]);
      x = nx; y = ny; c2x = null;
    } else if (C === "C") {
      const a = [n(), n(), n(), n(), n(), n()];
      if (rel) for (let k = 0; k < 6; k += 2) { a[k] += x; a[k + 1] += y; }
      sub.segs.push(a);
      c2x = a[2]; c2y = a[3]; x = a[4]; y = a[5];
    } else if (C === "S") {
      const a = [n(), n(), n(), n()];
      if (rel) for (let k = 0; k < 4; k += 2) { a[k] += x; a[k + 1] += y; }
      const c1x = c2x === null ? x : 2 * x - c2x;
      const c1y = c2y === null ? y : 2 * y - c2y;
      sub.segs.push([c1x, c1y, a[0], a[1], a[2], a[3]]);
      c2x = a[0]; c2y = a[1]; x = a[2]; y = a[3];
    } else if (C === "Q") {
      const a = [n(), n(), n(), n()];
      if (rel) for (let k = 0; k < 4; k += 2) { a[k] += x; a[k + 1] += y; }
      sub.segs.push([x + (2 / 3) * (a[0] - x), y + (2 / 3) * (a[1] - y), a[2] + (2 / 3) * (a[0] - a[2]), a[3] + (2 / 3) * (a[1] - a[3]), a[2], a[3]]);
      x = a[2]; y = a[3]; c2x = null;
    } else if (C === "Z") {
      sub.fechado = true;
      x = sx; y = sy; c2x = null;
    } else {
      i++;
    }
  }
  return subs;
}

/** Escreve os subcaminhos de volta em texto (só M, C e Z). */
function escrever(subs) {
  return subs.map((s) => "M" + f2(s.x0) + " " + f2(s.y0) +
    s.segs.map((g) => "C" + g.map(f2).join(" ")).join("") + (s.fechado ? "Z" : "")).join("");
}

/** Matriz afim [a, b, c, d, e, f]: x' = a x + c y + e; y' = b x + d y + f. */
const mat = {
  id: () => [1, 0, 0, 1, 0, 0],
  mover: (tx, ty) => [1, 0, 0, 1, tx, ty],
  escala: (sx, sy = sx) => [sx, 0, 0, sy, 0, 0],
  girar: (graus) => { const r = (graus * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return [c, s, -s, c, 0, 0]; },
  /** compor(a, b): aplica b primeiro, depois a. */
  compor: (a, b) => [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]
  ],
  /** Encadeia da esquerda para a direita, como o atributo transform do SVG. */
  serie: (...ms) => ms.reduce((acc, m) => mat.compor(acc, m), [1, 0, 0, 1, 0, 0])
};

function transformarSubs(subs, m) {
  const T = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  return subs.map((s) => {
    const [x0, y0] = T(s.x0, s.y0);
    return {
      x0, y0, fechado: s.fechado,
      segs: s.segs.map((g) => [...T(g[0], g[1]), ...T(g[2], g[3]), ...T(g[4], g[5])])
    };
  });
}

/** Aplica a matriz ao caminho e devolve o texto novo (assim nenhum traço fica esticado). */
function transformar(d, m) {
  return escrever(transformarSubs(ler(d), m));
}

function pontoCubica(x0, y0, g, t) {
  const u = 1 - t;
  return [
    u * u * u * x0 + 3 * u * u * t * g[0] + 3 * u * t * t * g[2] + t * t * t * g[4],
    u * u * u * y0 + 3 * u * u * t * g[1] + 3 * u * t * t * g[3] + t * t * t * g[5]
  ];
}

/** Comprimento de um caminho, em unidades do desenho. */
function comprimento(d) {
  const subs = typeof d === "string" ? ler(d) : d;
  let L = 0;
  for (const s of subs) {
    let x = s.x0, y = s.y0;
    for (const g of s.segs) {
      let px = x, py = y;
      for (let k = 1; k <= 40; k++) {
        const [qx, qy] = pontoCubica(x, y, g, k / 40);
        L += Math.hypot(qx - px, qy - py);
        px = qx; py = qy;
      }
      x = g[4]; y = g[5];
    }
    if (s.fechado) L += Math.hypot(s.x0 - x, s.y0 - y);
  }
  return L;
}

/** Divide uma cúbica (começando em x0, y0) em t; devolve [primeira, segunda] no formato [c1x, c1y, c2x, c2y, x, y]. */
function dividirCubica(x0, y0, g, t) {
  const lerp = (a, b) => a + (b - a) * t;
  const ax = lerp(x0, g[0]), ay = lerp(y0, g[1]);
  const bx = lerp(g[0], g[2]), by = lerp(g[1], g[3]);
  const cx = lerp(g[2], g[4]), cy = lerp(g[3], g[5]);
  const dx = lerp(ax, bx), dy = lerp(ay, by);
  const ex = lerp(bx, cx), ey = lerp(by, cy);
  const fx = lerp(dx, ex), fy = lerp(dy, ey);
  return [[ax, ay, dx, dy, fx, fy], [ex, ey, cx, cy, g[4], g[5]]];
}

/** y de um caminho (que anda da esquerda para a direita) num x dado. */
function yEmX(d, X) {
  const subs = typeof d === "string" ? ler(d) : d;
  for (const s of subs) {
    let x = s.x0, y = s.y0;
    for (const g of s.segs) {
      const xa = x, xb = g[4];
      if ((X - xa) * (X - xb) <= 0) {
        let lo = 0, hi = 1;
        const crescente = xb >= xa;
        for (let k = 0; k < 40; k++) {
          const m = (lo + hi) / 2;
          const [px] = pontoCubica(x, y, g, m);
          if ((px < X) === crescente) lo = m; else hi = m;
        }
        return pontoCubica(x, y, g, (lo + hi) / 2)[1];
      }
      x = g[4]; y = g[5];
    }
  }
  return null;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Abre o <svg> com tamanho, classes e acessibilidade. */
function abrirSvg({ viewBox, largura, altura, classe = "", rotulo = null, extra = "" }) {
  const a11y = rotulo ? `role="img" aria-label="${esc(rotulo)}"` : `aria-hidden="true"`;
  const w = typeof largura === "number" ? f2(largura) : largura;
  const h = typeof altura === "number" ? f2(altura) : altura;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="dz-svg ${classe}" viewBox="${viewBox}" width="${w}" height="${h}" ${a11y} focusable="false"${extra}>`;
}

const caminho = (d, classe, extra = "") => `<path class="${classe}" d="${d}"${extra}/>`;

/**
 * Um traço que se desenha. k = px por unidade do desenho no tamanho pedido; traco em px.
 * O comprimento vai em --d (traço), --g (vão) e --o (o deslocamento inicial, que esconde até a ponta redonda).
 */
function caminhoDesenhado(d, { classe, k, traco = 1.6, dur = 1600, atraso = 0, extraClasse = "" }) {
  const L = comprimento(d);
  const w = traco / k;
  const D = L + 0.5;
  const G = L + 3 * w + 2;
  const O = D + w;
  return `<path class="${classe} dz-desenha${extraClasse ? " " + extraClasse : ""}" d="${d}" style="stroke-width:${f2(w)}px;--d:${f2(D)}px;--g:${f2(G)}px;--o:${f2(O)}px;--dur:${dur}ms;--atraso:${atraso}ms"/>`;
}

/** Arco de um círculo, de um ângulo a outro (graus, 0 = direita, sentido horário na tela). */
function arco(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  const grande = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const varre = a1 > a0 ? 1 : 0;
  return `M${f2(x0)} ${f2(y0)}A${f2(r)} ${f2(r)} 0 ${grande} ${varre} ${f2(x1)} ${f2(y1)}`;
}

/** Círculo como duas cúbicas por quarto (um caminho só, que pode se desenhar), começando no alto. */
function circuloCaminho(cx, cy, r, sentidoHorario = true) {
  const k = 0.5522847498 * r;
  const s = sentidoHorario ? 1 : -1;
  return `M${f2(cx)} ${f2(cy - r)}` +
    `C${f2(cx + s * k)} ${f2(cy - r)} ${f2(cx + s * r)} ${f2(cy - k)} ${f2(cx + s * r)} ${f2(cy)}` +
    `C${f2(cx + s * r)} ${f2(cy + k)} ${f2(cx + s * k)} ${f2(cy + r)} ${f2(cx)} ${f2(cy + r)}` +
    `C${f2(cx - s * k)} ${f2(cy + r)} ${f2(cx - s * r)} ${f2(cy + k)} ${f2(cx - s * r)} ${f2(cy)}` +
    `C${f2(cx - s * r)} ${f2(cy - k)} ${f2(cx - s * k)} ${f2(cy - r)} ${f2(cx)} ${f2(cy - r)}`;
}

/**
 * Lua crescente: círculo de fora (cx, cy, R) e de dentro (raio r) deslocado d na direção "graus"
 * (0 = abertura para a direita). Devolve um caminho fechado.
 */
function crescente(cx, cy, R, r, d, graus = 0) {
  const a = (graus * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const vx = -uy, vy = ux;
  const x0 = (d * d + R * R - r * r) / (2 * d);
  const h = Math.sqrt(Math.max(R * R - x0 * x0, 0));
  const p1 = [cx + x0 * ux - h * vx, cy + x0 * uy - h * vy];
  const p2 = [cx + x0 * ux + h * vx, cy + x0 * uy + h * vy];
  const grandeDentro = x0 > d ? 1 : 0;
  return `M${f2(p1[0])} ${f2(p1[1])}A${f2(R)} ${f2(R)} 0 1 0 ${f2(p2[0])} ${f2(p2[1])}` +
    `A${f2(r)} ${f2(r)} 0 ${grandeDentro} 1 ${f2(p1[0])} ${f2(p1[1])}Z`;
}

/**
 * Folha pontuda (amêndoa) presa em (x, y), apontando para "graus", com comprimento e largura.
 * curva > 0 entorta a folha para um lado, como folha de verdade.
 */
function folhaPontuda(x, y, graus, comp, larg, curva = 0) {
  const a = (graus * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const vx = -uy, vy = ux;
  const P = (s, t) => [x + ux * s + vx * t, y + uy * s + vy * t];
  const w = larg / 2;
  const ponta = P(comp, curva * w * 0.6);
  const a1 = P(comp * 0.22, -w * 1.18), a2 = P(comp * 0.72, -w * 0.92 + curva * w * 0.5);
  const b1 = P(comp * 0.72, w * 0.92 + curva * w * 0.5), b2 = P(comp * 0.22, w * 1.18);
  const pt = (p) => f2(p[0]) + " " + f2(p[1]);
  return `M${f2(x)} ${f2(y)}C${pt(a1)} ${pt(a2)} ${pt(ponta)}C${pt(b1)} ${pt(b2)} ${f2(x)} ${f2(y)}Z`;
}

function derivadaCubica(x0, y0, g, t) {
  const u = 1 - t;
  return [
    3 * u * u * (g[0] - x0) + 6 * u * t * (g[2] - g[0]) + 3 * t * t * (g[4] - g[2]),
    3 * u * u * (g[1] - y0) + 6 * u * t * (g[3] - g[1]) + 3 * t * t * (g[5] - g[3])
  ];
}

/**
 * Ramo: a haste (uma cúbica só) e folhas alternadas, inclinadas para a ponta.
 * ts: onde nasce cada folha (0 a 1); comps e largs: tamanho de cada uma; angulo: abertura em graus.
 * Devolve { haste, folhas: [d...], ponta: [x, y, graus] } (a ponta serve para a folha final).
 */
function ramo(haste, { ts, comps, largs, angulo = 44, curva = 0.45, primeiro = -1 }) {
  const s = ler(haste)[0];
  const g = s.segs[0];
  const folhas = ts.map((t, i) => {
    const [x, y] = pontoCubica(s.x0, s.y0, g, t);
    const [dx, dy] = derivadaCubica(s.x0, s.y0, g, t);
    const th = (Math.atan2(dy, dx) * 180) / Math.PI;
    const lado = i % 2 === 0 ? primeiro : -primeiro;
    return folhaPontuda(x, y, th + lado * angulo, comps[i], largs[i], -lado * curva);
  });
  const [dx, dy] = derivadaCubica(s.x0, s.y0, g, 1);
  return { haste, folhas, ponta: [g[4], g[5], (Math.atan2(dy, dx) * 180) / Math.PI] };
}

export const GEO = { f2, ler, escrever, mat, transformar, transformarSubs, comprimento, dividirCubica, pontoCubica, derivadaCubica, yEmX, esc, abrirSvg, caminho, caminhoDesenhado, arco, circuloCaminho, crescente, folhaPontuda, ramo };

// ------------------------------------------------------------------ caminhos-base (4.7)

export const PETALAS = [
  "M60 64 C52 48 52 22 60 6 C68 22 68 48 60 64",
  "M60 64 C46 54 40 34 44 16 C56 26 62 46 60 64",
  "M60 64 C74 54 80 34 76 16 C64 26 58 46 60 64",
  "M60 64 C40 60 28 46 26 30 C42 34 56 48 60 64",
  "M60 64 C80 60 92 46 94 30 C78 34 64 48 60 64",
  "M60 64 C38 66 18 58 8 46 C26 44 48 52 60 64",
  "M60 64 C82 66 102 58 112 46 C94 44 72 52 60 64"
];

export const ONDAS = [
  "M30 94 C48 86 62 86 80 94 S112 102 130 94",
  "M42 104 C58 97 70 97 86 104 S112 110 122 104",
  "M56 113 C66 108 76 108 86 113 S102 117 110 113"
];

// ------------------------------------------------------------------ ícones (4.5), quadro de 24

function leque() {
  // sete traços curtos num arco suave, como os sete dias da semana
  const cx = 12, cy = 27.5, r0 = 13.4, r1 = 16.9, passo = 12.5;
  let d = "";
  for (let k = -3; k <= 3; k++) {
    const a = ((90 + k * passo) * Math.PI) / 180;
    d += `M${f2(cx + r0 * Math.cos(a))} ${f2(cy - r0 * Math.sin(a))}L${f2(cx + r1 * Math.cos(a))} ${f2(cy - r1 * Math.sin(a))}`;
  }
  return d;
}

function ramoIcone() {
  // ramo de quatro folhas (Corpo)
  const r = ramo("M7.2 20.8C8.6 16.6 11.2 11.6 16.4 4.2", {
    ts: [0.3, 0.47, 0.64, 0.8], comps: [6, 5.8, 5.4, 4.9], largs: [3.5, 3.4, 3.2, 3], angulo: 50, curva: 0.5
  });
  return [r.haste, ...r.folhas];
}

const ICONES = {
  hoje: ["M3.75 15.75H20.25", "M6.75 15.75A5.25 5.25 0 0 1 17.25 15.75"],
  trilha: [
    "M12 7.25V9.75M12 14.25V16.75",
    circuloCaminho(12, 5, 2.25), circuloCaminho(12, 12, 2.25), circuloCaminho(12, 19, 2.25)
  ],
  praticas: [
    "M12 7.1C10 5.7 7 5.1 3.75 5.35V17.85C7 17.6 10 18.2 12 19.6C14 18.2 17 17.6 20.25 17.85V5.35C17 5.1 14 5.7 12 7.1Z",
    "M12 7.1V19.6"
  ],
  semana: [leque()],
  ajustes: [
    "M3.75 8.25H12.25M17.25 8.25H20.25", circuloCaminho(14.75, 8.25, 2.5),
    "M3.75 15.75H6.75M11.75 15.75H20.25", circuloCaminho(9.25, 15.75, 2.5)
  ],
  limite: [
    circuloCaminho(12, 6.3, 3.1),
    "M4.9 21C4.9 15.6 8 12.5 12 12.5C16 12.5 19.1 15.6 19.1 21",
    "M5.5 18.3C8.7 19.4 12.7 17.7 15.9 14.3",
    "M18.5 18.3C15.3 19.4 11.3 17.7 8.1 14.3"
  ],
  cansaco: [crescente(11.2, 12.6, 7.6, 6.3, 3.3, -38)],
  sobrecarga: ["M3 15.6C6.6 15.6 9.1 15.1 10.6 12.7C12.1 10.3 11.6 7 9.5 7C7.4 7 6.9 10.3 8.5 12.7C10 15 12.6 15.6 21 15.6"],
  desconexao: ["M3.25 12.25H10.25M13.75 12.25H20.75"],
  tempo2: [{ d: circuloCaminho(12, 12, 7.75), trilho: true }, "M12 4.25A7.75 7.75 0 0 1 18.71 8.13"],
  tempo5: [{ d: circuloCaminho(12, 12, 7.75), trilho: true }, "M12 4.25A7.75 7.75 0 0 1 12 19.75"],
  tempo10: [circuloCaminho(12, 12, 7.75)],
  corpo: ramoIcone(),
  emocoes: [
    "M4 7.6C6.7 5.7 9.3 5.7 12 7.6S17.3 9.5 20 7.6",
    "M5.6 12.1C7.7 10.5 9.9 10.5 12 12.1S16.3 13.7 18.4 12.1",
    "M7.6 16.6C9.1 15.4 10.5 15.4 12 16.6S14.9 17.8 16.4 16.6"
  ],
  mente: [circuloCaminho(12, 12, 8.25), circuloCaminho(12, 12, 5.25)],
  espirito: [
    "M12 19.25C9.7 16 9.7 9.9 12 5.25C14.3 9.9 14.3 16 12 19.25Z",
    "M12 19.25C8 18.7 4.9 15.7 4 11.2C7.6 11.7 10.8 14.6 12 19.25",
    "M12 19.25C16 18.7 19.1 15.7 20 11.2C16.4 11.7 13.2 14.6 12 19.25"
  ],
  leveza: [
    "M5.2 19.4C8.4 15.9 11.7 11.9 17.4 4.8",
    "M17.4 4.8C19.9 7.6 19.1 12.4 15.6 15.2C13.4 17 10.6 17.4 8.4 16.5",
    "M17.4 4.8C13.6 5.1 10.6 7.7 9.4 10.9C8.6 12.9 8.4 14.8 8.4 16.5",
    "M14.2 14.2L12.9 16.4"
  ],
  calma: [
    "M3.75 9.9C7.1 8.1 9.6 8.1 12 9.9S16.9 11.7 20.25 9.9",
    "M3.75 14.6C7.1 12.8 9.6 12.8 12 14.6S16.9 16.4 20.25 14.6"
  ],
  alivio: ["M3.4 16.8C6.5 16.8 8.7 15.2 9.4 12.8C10.1 10.4 8.9 8.3 7 8.5C5 8.7 4.8 11.6 6.7 13.3C8.6 15 11.6 15.1 14.2 13.8L20.6 9.9"],
  igual: ["M4.75 12.25H19.25"],
  peso: ["M5.5 17.6C3.7 16.5 3.7 13.4 5.7 11.2C7.8 8.9 11.4 7.7 14.9 8.3C18.7 9 21.1 12 20.4 14.9C19.8 17.4 16.9 18.5 13 18.6C9.9 18.7 7.1 18.6 5.5 17.6Z"],
  sino: [
    "M12 3.9V5.9",
    "M6.9 16.4V11.7C6.9 8.6 9.1 6.1 12 6.1C14.9 6.1 17.1 8.6 17.1 11.7V16.4",
    "M5.1 16.75H18.9",
    "M10.3 19.3C10.65 20.05 11.25 20.45 12 20.45C12.75 20.45 13.35 20.05 13.7 19.3"
  ],
  pausar: ["M9.25 6.25V17.75M14.75 6.25V17.75"],
  seguir: ["M8.6 6.3V17.7L18 12Z"],
  voltar: ["M14.75 5.75L8.5 12L14.75 18.25"],
  fechar: ["M6.75 6.75L17.25 17.25M17.25 6.75L6.75 17.25"],
  check: ["M5 12.75L9.75 17.25L19 7.5"],
  lotus: [
    "M12 18.3C10.4 15.6 10.4 10.7 12 7.3C13.6 10.7 13.6 15.6 12 18.3Z",
    "M11.15 18.5C8.75 16.95 7.5 14 7.75 10.55C9.95 12.1 11.2 14.8 11.15 18.5",
    "M12.85 18.5C15.25 16.95 16.5 14 16.25 10.55C14.05 12.1 12.8 14.8 12.85 18.5",
    "M10.35 18.75C7.25 18.8 4.55 17.05 3.35 14.35C6.15 14.05 8.75 15.75 10.35 18.75",
    "M13.65 18.75C16.75 18.8 19.45 17.05 20.65 14.35C17.85 14.05 15.25 15.75 13.65 18.75"
  ],
  lua: [crescente(11, 12, 8, 6.4, 3.5, 0)],
  som: [
    "M4.25 9.75H7.5L11.75 6V18L7.5 14.25H4.25Z",
    "M14.75 9.4C15.95 10.75 15.95 13.25 14.75 14.6",
    "M17.5 6.9C19.95 9.65 19.95 14.35 17.5 17.1"
  ]
};

export function icone(nome, { rotulo = null, tamanho = 24 } = {}) {
  const partes = ICONES[nome];
  if (!partes) return "";
  return abrirSvg({ viewBox: "0 0 24 24", largura: tamanho, altura: tamanho, classe: `dz-icone dz-icone-${nome}`, rotulo }) +
    partes.map((d) => (typeof d === "string" ? caminho(d, "dz-ic") : caminho(d.d, "dz-ic dz-ic-trilho"))).join("") + "</svg>";
}

/** O desenho de um ícone dentro de outro desenho, num quadro de "lado" unidades com o centro em (x, y). */
function iconeDentro(nome, x, y, lado, classe = "dz-ic dz-ic-tinta") {
  const partes = ICONES[nome];
  if (!partes) return "";
  const s = lado / 24;
  return `<g transform="translate(${f2(x - lado / 2)} ${f2(y - lado / 2)}) scale(${f2(s)})">` +
    partes.map((d) => (typeof d === "string" ? caminho(d, classe) : caminho(d.d, classe + " dz-ic-trilho"))).join("") + "</g>";
}

// ------------------------------------------------------------------ autoabraço (quadro 100 x 100)

// Um traço só: começa na mão pousada no ombro esquerdo (do desenho), cruza o peito até o cotovelo direito,
// sobe pelo braço direito, contorna o ombro, o pescoço e a cabeça (inclinada, em repouso), desce pelo
// outro lado até o cotovelo esquerdo e cruza o peito de novo até a mão pousada no ombro direito.
const AUTOABRACO = "M25.8 59.5C27.3 58.1 29.6 58.5 30.6 60.5" +
  "C41 73.6 62.4 81.4 75.6 80" +
  "C78.6 71.6 78.2 61.4 72.6 55.6C68.4 51.2 60.6 49.4 57.4 46.6" +
  "C56.2 45.2 55.9 42.8 56.3 40.6C60.6 38.6 63.6 34 63.4 28.4" +
  "C63.1 20.8 57.2 15.4 50.2 15.6C43 15.8 37.6 21.4 38 28.6" +
  "C38.3 33.8 41.1 38.2 44.6 40.3C45 42.6 44.6 45 43 46.6" +
  "C39.8 49.4 32 51.2 27.6 55.6C22 61.4 21.6 71.6 24.4 80" +
  "C37.6 81.4 59 73.6 69.4 60.5" +
  "C70.4 58.5 72.7 58.1 74.2 59.5";

function desenhoAutoabraco({ tamanho, animar }) {
  const k = tamanho / 100;
  const traco = animar
    ? caminhoDesenhado(AUTOABRACO, { classe: "dz-tr", k, dur: 1200 })
    : caminho(AUTOABRACO, "dz-tr");
  return abrirSvg({ viewBox: "0 0 100 100", largura: tamanho, altura: tamanho, classe: "dz-autoabraco" }) + traco + "</svg>";
}

export function autoabraco({ tamanho = 56 } = {}) {
  return desenhoAutoabraco({ tamanho, animar: true });
}

// ------------------------------------------------------------------ figuras de passo (quadro 200 x 200)

function figuraHorizonte(tamanho) {
  return abrirSvg({ viewBox: "0 0 200 200", largura: tamanho, altura: tamanho, classe: "dz-figura dz-figura-horizonte" }) +
    caminho("M30 124H170", "dz-tr") +
    caminho("M64 124A36 36 0 0 1 136 124", "dz-tr dz-cobre") +
    caminho("M76 140H124", "dz-tr") +
    caminho("M90 153H110", "dz-tr") +
    "</svg>";
}

function figuraOndas(tamanho) {
  const m = mat.serie(mat.mover(-20, -50), mat.escala(1.5));
  return abrirSvg({ viewBox: "0 0 200 200", largura: tamanho, altura: tamanho, classe: "dz-figura dz-figura-ondas" }) +
    caminho(transformar(ONDAS[0], m), "dz-tr dz-cobre") +
    caminho(transformar(ONDAS[1], m), "dz-tr") +
    caminho(transformar(ONDAS[2], m), "dz-tr") +
    "</svg>";
}

function figuraRamo(tamanho) {
  const r = ramo("M70 170C80 136 97 94 129 44", {
    ts: [0.16, 0.29, 0.42, 0.55, 0.68, 0.8], comps: [31, 30, 28.5, 27, 25, 22.5], largs: [14, 13.6, 13, 12.4, 11.6, 10.6],
    angulo: 42, curva: 0.55
  });
  const ponta = folhaPontuda(r.ponta[0], r.ponta[1], r.ponta[2], 21, 10, 0);
  return abrirSvg({ viewBox: "0 0 200 200", largura: tamanho, altura: tamanho, classe: "dz-figura dz-figura-ramo" }) +
    caminho(r.haste, "dz-tr") +
    r.folhas.map((d) => caminho(d, "dz-tr")).join("") +
    caminho(ponta, "dz-tr dz-cobre") +
    "</svg>";
}

export function figura(nome, { tamanho = 200 } = {}) {
  if (nome === "horizonte") return figuraHorizonte(tamanho);
  if (nome === "ondas") return figuraOndas(tamanho);
  if (nome === "autoabraco") return desenhoAutoabraco({ tamanho, animar: false });
  if (nome === "ramo") return figuraRamo(tamanho);
  if (nome === "mapa") return mapaCuidado({}, { tamanho });
  return "";
}

// ------------------------------------------------------------------ lótus

export function lotusMarca({ tamanho = 28, rotulo = null } = {}) {
  const altura = tamanho, largura = (tamanho * 120) / 70;
  return abrirSvg({ viewBox: "0 0 120 70", largura, altura, classe: "dz-lotus-marca", rotulo }) +
    PETALAS.map((d, i) => caminho(d, i === 0 ? "dz-tr dz-fino dz-cobre" : "dz-tr dz-fino")).join("") +
    "</svg>";
}

export function lotusComOndas({ largura = 160, animar = false } = {}) {
  const k = largura / 160;
  const altura = (largura * 120) / 160;
  const m = mat.mover(20, 6);
  const petalas = PETALAS.map((d) => transformar(d, m));
  let corpo = "";
  if (animar) {
    // centro, interna esquerda, interna direita, do meio, de fora: uma depois da outra
    const ordem = [0, 1, 2, 3, 4, 5, 6];
    corpo += ordem.map((i, n) => caminhoDesenhado(petalas[i], {
      classe: i === 0 ? "dz-tr dz-cobre" : "dz-tr", k, dur: 640, atraso: n * 230
    })).join("");
    corpo += ONDAS.map((d, n) => caminhoDesenhado(d, { classe: "dz-tr", k, dur: 820, atraso: 1380 + n * 100 })).join("");
  } else {
    corpo += petalas.map((d, i) => caminho(d, i === 0 ? "dz-tr dz-cobre" : "dz-tr")).join("");
    corpo += ONDAS.map((d) => caminho(d, "dz-tr")).join("");
  }
  return abrirSvg({ viewBox: "0 0 160 120", largura, altura, classe: "dz-lotus-ondas" + (animar ? " dz-anima" : "") }) + corpo + "</svg>";
}

// ------------------------------------------------------------------ mapa de cuidado (Dia 3)

const DIMENSOES = [
  { chave: "corpo", icone: "corpo", graus: -90 },
  { chave: "emocoes", icone: "emocoes", graus: 0 },
  { chave: "mente", icone: "mente", graus: 90 },
  { chave: "espirito", icone: "espirito", graus: 180 }
];

function petalaDoMapa(graus, s) {
  // a pétala maior vai do raio 11 ao 64: estreita perto do centro, larga e arredondada para fora;
  // os contornos menores encolhem em volta de um ponto a 58% dela, um dentro do outro, sem se tocar
  const base = 11, L = 53, foco = base + 0.58 * L;
  const P = (u, v) => [foco + s * (base + u * L - foco), s * v * L];
  const pt = (u, v) => { const [x, y] = P(u, v); return f2(x) + " " + f2(y); };
  const d = `M${pt(0, 0)}C${pt(0.14, -0.13)} ${pt(0.34, -0.3)} ${pt(0.6, -0.3)}C${pt(0.84, -0.3)} ${pt(0.97, -0.15)} ${pt(1, 0)}` +
    `C${pt(0.97, 0.15)} ${pt(0.84, 0.3)} ${pt(0.6, 0.3)}C${pt(0.34, 0.3)} ${pt(0.14, 0.13)} ${pt(0, 0)}Z`;
  return transformar(d, mat.serie(mat.mover(100, 100), mat.girar(graus)));
}

export function mapaCuidado(respostas, { tamanho = 200 } = {}) {
  let r = respostas && typeof respostas === "object" ? respostas : {};
  if (r.mapa && typeof r.mapa === "object") r = r.mapa;
  const escalas = [0.34, 0.56, 0.78, 1];
  let corpo = `<circle class="dz-disco" cx="100" cy="100" r="71"/>`;
  for (const dim of DIMENSOES) {
    const v = Number(r[dim.chave]);
    const n = Number.isInteger(v) && v >= 0 && v <= 3 ? v + 1 : 0;
    for (let i = 0; i < n; i++) corpo += caminho(petalaDoMapa(dim.graus, escalas[i]), "dz-tr");
    const a = (dim.graus * Math.PI) / 180;
    corpo += iconeDentro(dim.icone, 100 + 86 * Math.cos(a), 100 + 86 * Math.sin(a), 24, "dz-ic dz-ic-tinta");
  }
  corpo += caminho(circuloCaminho(100, 100, 4.5), "dz-tr dz-cobre");
  return abrirSvg({ viewBox: "0 0 200 200", largura: tamanho, altura: tamanho, classe: "dz-mapa" }) + corpo + "</svg>";
}

// ------------------------------------------------------------------ círculo duplo do fundo

export function circuloDuplo() {
  return abrirSvg({ viewBox: "0 0 1000 1000", largura: "100%", altura: "100%", classe: "dz-circulo-duplo", extra: ` preserveAspectRatio="xMidYMid meet"` }) +
    caminho(circuloCaminho(500, 500, 498), "dz-linha") +
    caminho(circuloCaminho(500, 500, 476), "dz-linha") +
    "</svg>";
}
