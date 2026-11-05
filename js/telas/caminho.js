// T15 · Olhar o caminho: a lótus feita das palavras que a pessoa deixou em cada dia da trilha.
// Aparece em dois lugares: no Dia 7, como a ferramenta de passo "caminho" (js/ferramentas/caminho.js),
// antes do fecho; e na rota #/trilha/caminho, aberta pelo "Olhar o caminho" da trilha concluída.
//
// EXPORTS (além de moldura e montar, a interface de tela)
//   montarCaminho(alvo, { palavras, inicio, fim, aoSeguir, nivel, focar })
//       desenha T15 dentro de alvo e devolve { destruir() }.
//       palavras: a lista de palavrasDaTrilha(); inicio e fim: "AAAA-MM-DD" (o intervalo de datas);
//       aoSeguir: o que "Seguir" faz; nivel: "h1" (padrão) ou "h2" para o título "Seu caminho";
//       focar: leva o foco ao título ao montar (dentro do tocador, que não faz isso sozinho).
//   palavrasDaTrilha({ dias, dia7 })
//       [{ n, titulo, palavra }] dos dias 1 a 7, na ordem dos dias. dias: estado.trilha.dias (padrão);
//       dia7: a palavra do Dia 7 quando ele ainda não foi gravado (dentro do próprio Dia 7).
//   intervaloDaTrilha({ dias, fim })  { inicio, fim }: o primeiro e o último dia feito ("AAAA-MM-DD").
//   encurtar(palavra)                 a palavra com no máximo 18 letras; mais que isso termina em "…".
//   disporPalavras({ largura, lotusLargura, palavras, medir, alturaLinha, espaco, folga })
//       o arranjo das palavras em volta da lótus (usado aqui e no PNG de js/imagem.js).
//   PETALA_DO_DIA, PONTAS, BASE       o lugar de cada dia na lótus (quadro 120 x 70 de 4.7).
//
// O ARRANJO DAS PALAVRAS. As palavras ficam na horizontal, em rótulo, perto da ponta de cada pétala.
// Cada uma procura, em volta da sua ponta, o lugar livre mais perto (sem encostar nas pétalas nem nas
// outras palavras, sem sair da largura), em uma linha ou, se precisar, em duas. Em pé, ao longo das
// pétalas, palavras longas não cabem num celular de 390 px.

import { h, svg, botaoPrincipal, botaoSecundario, avisoCurto, idUnico } from "../ui.js";
import { estado } from "../estado.js";
import { diaLogico, diaEMes, intervalo } from "../dia.js";
import { trilha } from "../regras.js";
import { DIAS, TRILHA } from "../conteudo/trilha.js";
import { PETALAS, GEO } from "../desenhos.js";

export const moldura = { aba: null, navegacao: "trilha", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/trilha" };

// ---------------------------------------------------------------- a lótus dos dias

// Da esquerda para a direita: Dia 1 (a de fora), Dia 2, Dia 3, Dia 7 (o centro, em cobre), Dia 4, Dia 5,
// Dia 6 (a de fora). O número é o índice em PETALAS (js/desenhos.js).
export const PETALA_DO_DIA = { 1: 5, 2: 3, 3: 1, 4: 2, 5: 4, 6: 6, 7: 0 };
export const PONTAS = [[60, 6], [44, 16], [76, 16], [26, 30], [94, 30], [8, 46], [112, 46]];
export const BASE = [60, 64];
const LIMITE_DE_LETRAS = 18;

/** As palavras dos sete dias, na ordem dos dias. */
export function palavrasDaTrilha({ dias = estado.trilha.dias, dia7 } = {}) {
  return DIAS.map((d) => {
    let p = d.n === 7 && dia7 !== undefined ? dia7 : dias?.[d.n]?.palavra ?? null;
    if (Array.isArray(p)) p = p.filter(Boolean).join(", ");
    p = p === null || p === undefined ? "" : String(p).trim();
    return { n: d.n, titulo: d.titulo, palavra: p || null };
  });
}

/** O primeiro e o último dia lógico da trilha. fim: o dia do Dia 7, se ele ainda não foi gravado. */
export function intervaloDaTrilha({ dias = estado.trilha.dias, fim = null } = {}) {
  const lista = Object.values(dias ?? {}).map((d) => d?.dia).filter(Boolean);
  if (fim) lista.push(fim);
  lista.sort();
  const hoje = diaLogico();
  return { inicio: lista[0] ?? hoje, fim: fim ?? lista.at(-1) ?? hoje };
}

/** No desenho, palavras com mais de 18 letras terminam em "…" (de preferência num espaço). */
export function encurtar(palavra, max = LIMITE_DE_LETRAS) {
  const s = String(palavra ?? "").trim().replace(/\s+/g, " ");
  const letras = [...s];
  if (letras.length <= max) return s;
  let corte = letras.slice(0, max - 1).join("");
  const espaco = corte.lastIndexOf(" ");
  if (espaco >= 8) corte = corte.slice(0, espaco);
  return `${corte.replace(/[\s,.;:·]+$/u, "")}…`;
}

// Pontos ao longo das sete pétalas (no quadro 120 x 70), para as palavras não encostarem nelas.
const PONTOS_DAS_PETALAS = (() => {
  const pts = [];
  for (const d of PETALAS) {
    for (const s of GEO.ler(d)) {
      let x = s.x0, y = s.y0;
      for (const g of s.segs) {
        for (let k = 0; k <= 24; k++) pts.push(GEO.pontoCubica(x, y, g, k / 24));
        x = g[4]; y = g[5];
      }
    }
  }
  return pts;
})();

/** As duas linhas mais parelhas de um texto, ou null se ele não tem espaço. */
function emDuasLinhas(texto, medir, espaco) {
  const palavras = texto.split(" ");
  if (palavras.length < 2) return null;
  let melhor = null;
  for (let i = 1; i < palavras.length; i++) {
    const a = palavras.slice(0, i).join(" ");
    const b = palavras.slice(i).join(" ");
    const w = Math.max(medir(a, espaco), medir(b, espaco));
    if (!melhor || w < melhor.w) melhor = { linhas: [a, b], w };
  }
  return melhor;
}

/**
 * O arranjo das palavras em volta da lótus, em pixels.
 * largura: a largura toda; lotusLargura: a da lótus (centrada); palavras: [{ n, texto }] (texto já encurtado,
 * em caixa alta); medir(texto, espacoEm): a largura do texto; alturaLinha: px; espaco: o espaçamento das
 * letras, em em (o menor vem depois, só se faltar lugar); folga: px entre palavras.
 * Devolve { altura, lotus: { x, y, s }, rotulos: [{ n, linhas, x, y, w, h, alinhar, espaco }] }, com y = 0 no
 * alto da primeira coisa desenhada (e "respiro" px de sobra em cima e embaixo).
 */
export function disporPalavras({
  largura, lotusLargura, palavras, medir, alturaLinha, espaco = 0.16, espacoMenor = 0.08, folga = 6,
  margemPetala = 4, margemLateral = 0, respiro = 4
}) {
  const s = lotusLargura / 120;
  const x0 = (largura - lotusLargura) / 2;
  const px = ([u, v]) => [x0 + u * s, v * s];
  const pontos = PONTOS_DAS_PETALAS.map(px);
  const base = px(BASE);
  const postos = [];

  const livreDasPetalas = (r) => !pontos.some(([x, y]) =>
    x > r.x - margemPetala && x < r.x + r.w + margemPetala && y > r.y - margemPetala && y < r.y + r.h + margemPetala);
  const livreDosOutros = (r) => !postos.some((o) =>
    r.x < o.x + o.w + folga && r.x + r.w + folga > o.x && r.y < o.y + o.h + folga && r.y + r.h + folga > o.y);
  // Uma palavra que passaria da borda escorrega para dentro, sem sair da altura da sua ponta.
  const escorregar = (r) => {
    const min = margemLateral;
    const max = largura - margemLateral;
    if (r.w > max - min + 0.5) return null;
    let desvio = 0;
    if (r.x < min) desvio = min - r.x;
    else if (r.x + r.w > max) desvio = max - (r.x + r.w);
    return { ...r, x: r.x + desvio, desvio: Math.abs(desvio) };
  };

  // A ordem de quem escolhe primeiro: as de fora (as mais apertadas), as do meio, o centro (a palavra do Dia 7,
  // logo acima da sua ponta) e, por fim, as de dentro, que se ajeitam em volta dela.
  const ordem = [1, 6, 2, 5, 7, 3, 4];
  const porDia = new Map(palavras.filter((p) => p.texto).map((p) => [p.n, p.texto]));

  for (const n of ordem) {
    const texto = porDia.get(n);
    if (!texto) continue;
    const ponta = px(PONTAS[PETALA_DO_DIA[n]]);
    const raio = Math.hypot(ponta[0] - base[0], ponta[1] - base[1]) || 1;
    const dir = [(ponta[0] - base[0]) / raio, (ponta[1] - base[1]) / raio];
    const lado = Math.abs(dir[0]) < 0.05 ? 0 : Math.sign(dir[0]);
    const anguloRaio = Math.atan2(dir[1], dir[0]);

    // As formas possíveis do texto: uma linha ou duas, no espaçamento normal ou no menor.
    const formas = [];
    for (const [esp, multa] of [[espaco, 0], [espacoMenor, 16]]) {
      formas.push({ linhas: [texto], w: medir(texto, esp), espaco: esp, multa });
      const duas = emDuasLinhas(texto, medir, esp);
      if (duas) formas.push({ linhas: duas.linhas, w: duas.w, espaco: esp, multa: multa + 9 });
    }

    // Direções em volta do raio da pétala, girando para o alto (e um pouco para baixo, nas de fora).
    // Girar para o alto para na vertical: nenhuma palavra atravessa para o outro lado da lótus.
    const giros = lado === 0 ? [0, -22, 22] : [0, 15, 30, 45, 60, 75, 90, -15, -30];
    const direcoes = [];
    for (const giro of giros) {
      const a = lado === 0 ? anguloRaio + (giro * Math.PI) / 180 : anguloRaio + (lado < 0 ? 1 : -1) * (giro * Math.PI) / 180;
      let v = [Math.cos(a), Math.sin(a)];
      if (lado !== 0 && v[0] * lado < 0) v = [0, -1];
      if (direcoes.some((x) => Math.abs(x.v[0] - v[0]) < 0.01 && Math.abs(x.v[1] - v[1]) < 0.01)) continue;
      direcoes.push({ giro: Math.abs(giro), v });
    }
    const distancias = [4, 8, 13, 19, 26, 34, 44, 56, 70, 86, 104, 124, 146];
    let melhor = null;
    let melhorSemPetalas = null;
    for (const forma of formas) {
      const w = Math.ceil(forma.w);
      const hh = forma.linhas.length * alturaLinha;
      for (const { giro, v } of direcoes) {
        const m = Math.max(Math.abs(v[0]), Math.abs(v[1]));
        // Em duas linhas, o texto se alinha para fora da lótus (à direita do lado esquerdo e vice-versa).
        const alinhar = lado < 0 && forma.linhas.length > 1 ? "fim"
          : lado > 0 && forma.linhas.length > 1 ? "inicio"
            : v[0] / m <= -0.45 ? "fim" : v[0] / m >= 0.45 ? "inicio" : "centro";
        for (const d of distancias) {
          const ax = ponta[0] + d * v[0];
          const ay = ponta[1] + d * v[1];
          const cx = ax + (v[0] / m) * (w / 2);
          const cy = ay + (v[1] / m) * (hh / 2);
          const r = escorregar({ x: cx - w / 2, y: cy - hh / 2, w, h: hh });
          if (!r || !livreDosOutros(r)) continue;
          const nota = d + giro * 0.32 + forma.multa + r.desvio * 0.3;
          const posto = { n, linhas: forma.linhas, x: r.x, y: r.y, w, h: hh, alinhar, espaco: forma.espaco, nota };
          if (livreDasPetalas(r)) {
            if (!melhor || nota < melhor.nota) melhor = posto;
            break;
          }
          if (!melhorSemPetalas || nota < melhorSemPetalas.nota) melhorSemPetalas = posto;
        }
      }
    }
    let escolhido = melhor ?? melhorSemPetalas;
    if (!escolhido) {
      // Último recurso (nunca some uma palavra): por cima de tudo, centrada na ponta, dentro da largura.
      const forma = formas.reduce((a, b) => (b.w < a.w ? b : a));
      const w = Math.ceil(forma.w);
      const hh = forma.linhas.length * alturaLinha;
      const topo = Math.min(6 * s, ...postos.map((o) => o.y)) - folga - hh;
      const r = escorregar({ x: ponta[0] - w / 2, y: topo, w, h: hh }) ?? { x: 0, y: topo, w, h: hh };
      escolhido = { n, linhas: forma.linhas, x: r.x, y: r.y, w, h: hh, alinhar: "centro", espaco: forma.espaco, nota: 0 };
    }
    postos.push(escolhido);
  }

  // A caixa de tudo (a lótus e as palavras) começa em y = respiro.
  const topoLotus = 6 * s - 2;
  const peLotus = 66 * s + 2;
  const minY = Math.min(topoLotus, ...postos.map((p) => p.y));
  const maxY = Math.max(peLotus, ...postos.map((p) => p.y + p.h));
  const desloca = respiro - minY;
  for (const p of postos) p.y += desloca;
  return {
    altura: Math.ceil(maxY - minY + 2 * respiro),
    lotus: { x: x0, y: desloca, s },
    rotulos: postos.map(({ nota, ...p }) => p)
  };
}

// ---------------------------------------------------------------- montar T15

/** "5 a 12 de novembro"; num dia só, "12 de novembro". */
function textoDasDatas(inicio, fim) {
  if (!inicio || !fim) return "";
  return inicio === fim ? diaEMes(fim) : intervalo(inicio, fim);
}

/**
 * Desenha T15 dentro de alvo. Devolve { destruir }.
 * focar: leva o foco ao título depois de montar (dentro do tocador, que não faz isso sozinho).
 */
export function montarCaminho(alvo, { palavras, inicio, fim, aoSeguir, nivel = "h1", focar = false }) {
  const idTitulo = idUnico("caminho");
  const figura = h("figure.cam-lotus");
  const info = h("p.apoio.cam-info", { "aria-live": "polite" });
  const botaoSalvar = botaoSecundario("Salvar a imagem", () => salvar());
  const leitura = palavras.map((p) => (p.palavra ? `Dia ${p.n}, ${p.palavra}.` : `Dia ${p.n}, sem palavra.`)).join(" ");
  const titulo = h(`${nivel}.titulo.cam-titulo`, { id: idTitulo, tabindex: "-1" }, "Seu caminho");

  alvo.append(h("section.cam", { "aria-labelledby": idTitulo },
    titulo,
    h("p.texto.cam-texto", null, "Cada pétala guarda a palavra que você deixou em um dos dias."),
    figura,
    h("div.cam-assinatura", null,
      h("p.cam-nome", null, TRILHA.nome),
      h("p.apoio.cam-datas", null, textoDasDatas(inicio, fim))),
    info,
    h("div.cam-acoes", null,
      botaoSalvar,
      h("p.apoio.cam-apoio", null, "A imagem fica no seu aparelho e leva as palavras que você escolheu."),
      botaoPrincipal("Seguir", () => aoSeguir?.()))
  ));
  if (focar) setTimeout(() => { try { titulo.focus({ preventScroll: true }); } catch { /* nada */ } }, 60);

  // O desenho espera a largura de verdade (a tela pode ainda não estar na página) e a fonte das palavras.
  let largura = 0;
  let animar = true;
  let selecionado = null;
  let caminhos = {};
  let vez = 0;
  let vivo = true;
  // O desenho muda a altura da figura: fica para o próximo quadro, fora da volta do ResizeObserver.
  const observador = new ResizeObserver((entradas) => {
    const w = Math.floor(entradas[0]?.contentRect?.width ?? 0);
    if (!w || Math.abs(w - largura) < 4) return;
    largura = w;
    requestAnimationFrame(() => desenhar());
  });
  observador.observe(figura);

  async function desenhar() {
    const minha = ++vez;
    const tamanho = parseFloat(getComputedStyle(document.documentElement).fontSize || "16") * 0.6875;
    try { await document.fonts.load(`600 ${tamanho}px "Josefin Sans"`); } catch { /* segue com a reserva */ }
    if (!vivo || minha !== vez) return;
    const w = largura;
    // 300 px no celular (T15); num celular estreito, um pouco menos, para as palavras terem onde ficar.
    const lotusLargura = Math.round(w >= 600 ? 360 : w >= 330 ? Math.min(300, w - 16) : w * 0.84);
    const contexto = document.createElement("canvas").getContext("2d");
    contexto.font = `600 ${tamanho}px "Josefin Sans", "Segoe UI", system-ui, sans-serif`;
    const medir = (texto, esp) => contexto.measureText(texto).width + Math.max(0, [...texto].length - 1) * esp * tamanho;
    const alturaLinha = Math.round(tamanho * 1.42);
    const lista = palavras.map((p) => ({ n: p.n, texto: p.palavra ? encurtar(p.palavra).toLocaleUpperCase("pt-BR") : null }));
    const arranjo = disporPalavras({ largura: w, lotusLargura, palavras: lista, medir, alturaLinha, folga: 7, margemPetala: 5 });
    pintar(arranjo, { w, alturaLinha, comMovimento: animar });
    animar = false;
  }

  function pintar(arranjo, { w, alturaLinha, comMovimento }) {
    const { s, x: lx, y: ly } = arranjo.lotus;
    const m = [s, 0, 0, s, lx, ly];
    caminhos = {};
    for (const p of palavras) caminhos[p.n] = GEO.transformar(PETALAS[PETALA_DO_DIA[p.n]], m);
    // O traço que se desenha usa a largura em unidades do desenho (aqui, 1 unidade = 1 px).
    // Uma pétala por vez, na ordem dos dias: o centro, em cobre, fecha o desenho.
    const petala = (n) => {
      const classe = n === 7 ? "dz-tr dz-cobre" : "dz-tr";
      return comMovimento
        ? GEO.caminhoDesenhado(caminhos[n], { classe, k: 1, dur: 400, atraso: (n - 1) * 400 })
        : GEO.caminho(caminhos[n], classe);
    };
    // Os alvos de toque: as de dentro por cima, para o toque perto da base cair na pétala do centro.
    const alvosEmOrdem = [1, 6, 2, 5, 3, 4, 7];
    const desenho = svg(
      `<svg xmlns="http://www.w3.org/2000/svg" class="dz-svg cam-desenho" viewBox="0 0 ${w} ${arranjo.altura}" width="${w}" height="${arranjo.altura}" role="img" aria-label="${GEO.esc(leitura)}" focusable="false">` +
      `<g class="cam-petalas">${[1, 2, 3, 4, 5, 6, 7].map(petala).join("")}</g>` +
      `<path class="cam-destaque" d=""/>` +
      `<g class="cam-alvos">${alvosEmOrdem.map((n) => `<path data-n="${n}" d="${caminhos[n]}"/>`).join("")}</g>` +
      "</svg>");
    const rotulos = h("div.cam-rotulos");
    const porDia = new Map(arranjo.rotulos.map((r) => [r.n, r]));
    for (const p of palavras) {
      const r = porDia.get(p.n);
      const nome = p.palavra ? `Dia ${p.n}, ${p.titulo}, ${p.palavra}` : `Dia ${p.n}, ${p.titulo}`;
      const atraso = comMovimento ? (p.n - 1) * 400 + 260 : 0;
      let botao;
      if (r) {
        botao = h("button.cam-rotulo", {
          type: "button",
          class: [`cam-rotulo-${r.alinhar}`, p.n === 7 ? "cam-rotulo-dia7" : "", comMovimento ? "cam-entra" : ""].filter(Boolean).join(" "),
          "aria-label": nome,
          "aria-pressed": String(selecionado === p.n),
          dataset: { n: p.n },
          style: `left:${r.x.toFixed(1)}px;top:${r.y.toFixed(1)}px;width:${r.w}px;height:${r.h}px;line-height:${alturaLinha}px;letter-spacing:${r.espaco}em;--atraso:${atraso}ms`
        }, ...r.linhas.map((l) => h("span.cam-rotulo-linha", null, l)));
      } else {
        // Dia sem palavra: a pétala aparece sem texto, e o botão fica na ponta, do tamanho de um dedo.
        const [ux, uy] = PONTAS[PETALA_DO_DIA[p.n]];
        botao = h("button.cam-rotulo.cam-rotulo-vazio", {
          type: "button", "aria-label": nome, "aria-pressed": String(selecionado === p.n), dataset: { n: p.n },
          style: `left:${(lx + ux * s - 22).toFixed(1)}px;top:${(ly + uy * s - 22).toFixed(1)}px`
        });
      }
      botao.addEventListener("click", () => escolher(p.n));
      rotulos.append(botao);
    }
    desenho.addEventListener("click", (ev) => {
      const tocado = ev.target.closest?.("[data-n]");
      if (tocado) escolher(Number(tocado.dataset.n));
    });
    figura.style.height = `${arranjo.altura}px`;
    figura.style.minHeight = "0px";
    figura.replaceChildren(desenho, rotulos);
    if (selecionado) marcar(selecionado);
  }

  function escolher(n) {
    selecionado = n;
    marcar(n);
  }

  function marcar(n) {
    const p = palavras.find((x) => x.n === n);
    if (!p) return;
    const destaque = figura.querySelector(".cam-destaque");
    if (destaque && caminhos[n]) {
      destaque.setAttribute("d", caminhos[n]);
      destaque.classList.toggle("cam-destaque-centro", n === 7);
      destaque.classList.add("visivel");
    }
    for (const b of figura.querySelectorAll(".cam-rotulo")) b.setAttribute("aria-pressed", String(Number(b.dataset.n) === n));
    const frase = [`Dia ${n}`, p.titulo, p.palavra].filter(Boolean).join(" · ");
    if (info.textContent !== frase) info.replaceChildren(h("span.cam-info-texto", null, frase));
  }

  async function salvar() {
    botaoSalvar.disabled = true;
    try {
      const m = await import("../imagem.js");
      const ok = await m.salvarImagemDoCaminho({
        palavras: Object.fromEntries(palavras.map((p) => [p.n, p.palavra])),
        inicio,
        fim
      });
      avisoCurto(ok ? "Imagem salva no aparelho." : "Não deu para salvar a imagem agora.");
    } catch (erro) {
      console.error(erro);
      avisoCurto("Não deu para salvar a imagem agora.");
    } finally {
      botaoSalvar.disabled = false;
    }
  }

  return {
    destruir() {
      vivo = false;
      observador.disconnect();
    }
  };
}

// ---------------------------------------------------------------- a rota #/trilha/caminho

export function montar(el, ctx) {
  const t = trilha();
  if (!t.concluida) {
    ctx.navegar("#/trilha", { substituir: true });
    return {};
  }
  const dias = estado.trilha.dias;
  const fim = estado.trilha.concluidaEm ?? dias[7]?.dia ?? null;
  const datas = intervaloDaTrilha({ dias, fim });
  const quadro = h("div.coluna.cam-tela");
  el.append(quadro);
  const api = montarCaminho(quadro, {
    palavras: palavrasDaTrilha({ dias }),
    inicio: datas.inicio,
    fim: datas.fim,
    aoSeguir: () => ctx.voltarPara("#/trilha")
  });
  return { destruir() { api.destruir(); } };
}
