// T01 a T04 · Boas-vindas: só na primeira vez, sem abas, sem barra e sem o Estou no limite.
// Uma rota por quadro (#/boas-vindas/1 a 4). Os quadros trocam no lugar (substituir), para o histórico
// guardar uma entrada só; nos quadros 2 a 4, o Voltar do aparelho e o Esc voltam um quadro.
// Arrastar para o lado também troca de quadro (T02); para a frente, o Tom pede a escolha antes,
// e os Combinados pedem o toque em "Combinado".
// "Combinado" grava boasVindasEm, pede armazenamento persistente e abre Hoje, onde a semente pousa.
// No computador, as boas-vindas abrem por cima do caderno (foco), sem a página esquerda.

import { h, svg, desenhos, botaoPrincipal, botaoLink, empilharVolta, avisoCurto, idUnico } from "../ui.js";
import { alterar, pedirPersistencia } from "../estado.js";
import { agora, isoLocal } from "../dia.js";
import { BOAS_VINDAS } from "../conteudo/textos.js";

export const moldura = { barra: "nenhuma", aba: null, esquerda: null, limite: null, foco: true };

const QUADROS = 4;

// A escolha do tom nesta visita. Na primeira vez, nenhum cartão vem marcado (T03), mesmo que o estado
// já traga o tom padrão; ao voltar dos Combinados, a escolha feita continua marcada.
let tomEscolhido = null;
// A lótus de T01 se desenha só na primeira vez que aparece; ao voltar de T02, ela já está pronta.
let aberturaJaAnimou = false;

export function montar(el, ctx) {
  const n = Number(ctx.params.n);
  if (!Number.isInteger(n) || n < 1 || n > QUADROS) {
    ctx.navegar("#/boas-vindas/1", { substituir: true });
    return {};
  }
  const ir = (m) => ctx.navegar(`#/boas-vindas/${m}`, { substituir: true });
  const voltarUm = () => ir(n - 1);
  const tirarVolta = n > 1 ? empilharVolta((motivo) => { if (motivo !== "navegar") voltarUm(); }) : null;

  const quadro = [null, abertura, comoFunciona, tom, combinados][n](ctx, ir);
  el.append(quadro.el);
  arrastar(quadro.el, {
    sinal: ctx.sinal,
    antes: n > 1 ? voltarUm : null,
    depois: () => { if (quadro.podeSeguir?.()) ir(n + 1); }
  });
  return { destruir() { tirarVolta?.(); } };
}

// ---------------------------------------------------------------- T01 · Abertura

function abertura(ctx, ir) {
  const t = BOAS_VINDAS.abertura;
  const animar = !aberturaJaAnimou;
  aberturaJaAnimou = true;

  const trazer = async () => {
    try {
      const m = await import("./dados.js");
      if (typeof m.trazerCopia !== "function") throw new Error("trazerCopia ausente");
      await m.trazerCopia();
    } catch (erro) {
      console.error(erro);
      avisoCurto("Não deu para abrir seus dados agora. Tente de novo daqui a pouco.");
    }
  };

  const el = h("div.bv.bv-abertura", { class: animar ? "bv-chegando" : "" },
    h("div.bv-capa", null,
      h("div.bv-lotus", { "aria-hidden": "true" }, svg(desenhos.lotusComOndas({ largura: 160, animar }))),
      h("h1.nome-grande.bv-nome.bv-entra", null, t.nome),
      h("p.bv-linha.bv-entra", null, t.linha)
    ),
    h("div.bv-acoes.bv-entra", null,
      botaoPrincipal(t.botao, () => ir(2)),
      botaoLink(t.link, trazer)
    ),
    h("p.rotulo.bv-rodape.bv-entra", null, t.rodape)
  );
  return { el, podeSeguir: () => true };
}

// ---------------------------------------------------------------- T02 · Como funciona

function comoFunciona(ctx, ir) {
  const t = BOAS_VINDAS.comoFunciona;
  const el = pagina({
    atual: 0,
    corpo: [
      h("p.rotulo", null, t.rotulo),
      h("h1.titulo.bv-titulo", null, t.titulo),
      listaNumerada(t.itens)
    ],
    principal: botaoPrincipal(t.botao, () => ir(3)),
    voltar: botaoLink(t.link, () => ir(1))
  });
  return { el, podeSeguir: () => true };
}

// ---------------------------------------------------------------- T03 · Tom

function tom(ctx, ir) {
  const t = BOAS_VINDAS.tom;
  const idTitulo = idUnico("bv-tom");
  const seguir = botaoPrincipal(t.botao, () => { if (tomEscolhido) ir(4); }, { disabled: !tomEscolhido });
  const exemplo = h("div.bv-exemplo", { "aria-live": "polite" });

  const cartoes = t.opcoes.map((o) => h("button.cartao-escolha.bv-cartao-tom", {
    type: "button",
    role: "radio",
    "aria-checked": String(tomEscolhido === o.id),
    dataset: { tom: o.id }
  },
  h("span.cartao-escolha-texto", null,
    h("span.cartao-escolha-nome", null, o.nome),
    h("span.cartao-escolha-desc", null, o.texto))));

  const ajustarTab = () => {
    const alvo = cartoes.find((c) => c.getAttribute("aria-checked") === "true") ?? cartoes[0];
    cartoes.forEach((c) => { c.tabIndex = c === alvo ? 0 : -1; });
  };

  const mostrarExemplo = (id, { animar = true } = {}) => {
    const o = t.opcoes.find((x) => x.id === id);
    exemplo.replaceChildren(...[o ? h("p.abertura.bv-exemplo-frase", { class: animar ? "bv-exemplo-entra" : "" }, o.exemplo) : null].filter(Boolean));
  };

  const marcar = (id) => {
    const mudou = tomEscolhido !== id;
    tomEscolhido = id;
    alterar((e) => { e.ajustes.tom = id; });
    cartoes.forEach((c) => c.setAttribute("aria-checked", String(c.dataset.tom === id)));
    ajustarTab();
    if (mudou) mostrarExemplo(id);
    seguir.disabled = false;
  };

  cartoes.forEach((c, i) => {
    c.addEventListener("click", () => marcar(c.dataset.tom));
    c.addEventListener("keydown", (ev) => {
      const passo = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0;
      if (!passo) return;
      ev.preventDefault();
      const j = (i + passo + cartoes.length) % cartoes.length;
      marcar(cartoes[j].dataset.tom);
      cartoes[j].focus();
    });
  });
  ajustarTab();
  if (tomEscolhido) mostrarExemplo(tomEscolhido, { animar: false });

  const el = pagina({
    atual: 1,
    corpo: [
      h("p.rotulo", null, t.rotulo),
      h("h1.titulo.bv-titulo", { id: idTitulo }, t.titulo),
      h("div.bv-tons", { role: "radiogroup", "aria-labelledby": idTitulo }, ...cartoes),
      exemplo,
      h("p.apoio.bv-apoio", null, t.apoio)
    ],
    principal: seguir,
    voltar: botaoLink(BOAS_VINDAS.comoFunciona.link, () => ir(2))
  });
  return { el, podeSeguir: () => Boolean(tomEscolhido) };
}

// ---------------------------------------------------------------- T04 · Combinados

function combinados(ctx, ir) {
  const t = BOAS_VINDAS.combinados;
  const entrar = () => {
    alterar((e) => { e.boasVindasEm = isoLocal(agora()); }, { agora: true });
    pedirPersistencia();
    ctx.navegar("#/hoje", { substituir: true, dados: { pousar: true } });
  };
  const el = pagina({
    atual: 2,
    corpo: [
      h("p.rotulo", null, t.rotulo),
      h("h1.titulo.bv-titulo", null, t.titulo),
      listaNumerada(t.itens)
    ],
    principal: botaoPrincipal(t.botao, entrar),
    voltar: botaoLink(BOAS_VINDAS.comoFunciona.link, () => ir(3))
  });
  // Arrastar para a frente não entra: "Combinado" é um toque de propósito.
  return { el, podeSeguir: () => false };
}

// ---------------------------------------------------------------- peças

/** O quadro de T02 a T04: o corpo em cima; os pontos de página e os botões presos embaixo. */
function pagina({ atual, corpo, principal, voltar }) {
  return h("div.bv.bv-pagina", null,
    h("div.bv-corpo", null, ...corpo),
    h("div.bv-pe", null,
      h("div.bv-pontos", { "aria-hidden": "true" },
        ...[0, 1, 2].map((i) => h("span.bv-ponto", { class: i === atual ? "atual" : "" }))),
      principal,
      voltar
    )
  );
}

/** As linhas numeradas de T02 e T04: "{numero} · {texto}", com o número em rótulo cobre. */
function listaNumerada(itens) {
  return h("ol.bv-lista", null, ...itens.map((i) => h("li.bv-item", null,
    h("span.rotulo.bv-numero", null, `${i.numero} ·`),
    h("span.bv-item-texto", null, i.texto))));
}

/** Arrastar para o lado troca de quadro (toque e caneta; o mouse usa os botões). */
function arrastar(alvo, { antes, depois, sinal }) {
  let x0 = null;
  let y0 = 0;
  let id = null;
  alvo.addEventListener("pointerdown", (ev) => {
    if (ev.pointerType === "mouse" || !ev.isPrimary) return;
    x0 = ev.clientX;
    y0 = ev.clientY;
    id = ev.pointerId;
  }, { signal: sinal, passive: true });
  alvo.addEventListener("pointerup", (ev) => {
    if (x0 === null || ev.pointerId !== id) return;
    const dx = ev.clientX - x0;
    const dy = ev.clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (dx < 0) depois?.();
    else antes?.();
  }, { signal: sinal });
  alvo.addEventListener("pointercancel", () => { x0 = null; }, { signal: sinal });
}
