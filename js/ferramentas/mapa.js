// A ferramenta de passo "mapa": o mapa de cuidado (4.6, o desenho mapaCuidado de js/desenhos.js).
// Contrato das ferramentas (js/LEIA.md): montar(el, ctx) devolve { destruir() }.
//
// Com ctx.passo.perguntasDe (Dia 7, passo 3, "Refazer o mapa de cuidado e comparar"):
//   faz de novo as quatro perguntas do dia indicado (as do Dia 3: corpo, emocoes, mente e espirito, cada uma
//   de 0 a 3), uma por vez, e mostra os dois mapas lado a lado, com os rótulos de ctx.passo.rotulos
//   ("DIA 3" e "HOJE"), sem nenhum comentário. "Seguir" devolve { [ctx.passo.chave]: { corpo, emocoes,
//   mente, espirito } } (no Dia 7, a chave é "mapa2"). "Pular" segue sem o mapa novo.
//   Se o Dia 3 não deixou mapa (feito na mínima), aparece só o mapa de hoje.
// Sem perguntasDe: mostra o mapa das respostas que já existem (o formato do Dia 3) e "Seguir".
// No Dia 3, o mapa do passo 6 é desenhado pelo próprio tocador (passo "mostrar" com figura "mapa").

import { h, svg, desenhos, iconeEl, idUnico } from "../ui.js";
import { diaDaTrilha } from "../conteudo/trilha.js";

const DIMENSOES = [["corpo", "Corpo"], ["emocoes", "Emoções"], ["mente", "Mente"], ["espirito", "Espírito"]];
const NOMES_DO_ESPACO = ["quase nenhum", "pouco", "algum", "bastante"];

/** O tamanho do texto do passo (o mesmo critério do tocador, para caber em até três linhas). */
function classeDoPasso(texto) {
  const n = String(texto ?? "").length;
  if (n > 92) return "passo passo-longo";
  if (n > 58) return "passo passo-medio";
  return "passo";
}

const temMapa = (r) => DIMENSOES.some(([k]) => Number.isInteger(Number(r?.[k])) && r?.[k] !== null && r?.[k] !== undefined);

/** "Dia 3: Corpo, pouco. Emoções, algum. ..." (o nome acessível de um mapa). */
function leituraDoMapa(rotulo, r) {
  const partes = DIMENSOES.filter(([k]) => Number.isInteger(r?.[k])).map(([k, nome]) => `${nome}, ${NOMES_DO_ESPACO[r[k]] ?? ""}`);
  return `${rotulo}: ${partes.join(". ")}.`;
}

function mapaEl(r, rotulo, tamanho) {
  const nomeLegivel = rotulo.charAt(0) + rotulo.slice(1).toLocaleLowerCase("pt-BR");
  return h("figure.mapa-um", { role: "img", "aria-label": leituraDoMapa(nomeLegivel, r) },
    h("div.mapa-desenho", { "aria-hidden": "true" }, svg(desenhos.mapaCuidado(r, { tamanho }))),
    h("figcaption.rotulo.mapa-rotulo", { "aria-hidden": "true" }, rotulo));
}

export function montar(el, ctx) {
  const p = ctx.passo ?? {};
  const fonte = p.perguntasDe ? diaDaTrilha(p.perguntasDe) : null;
  const perguntas = (fonte?.completa ?? []).filter((x) => x.tipo === "escolher" && DIMENSOES.some(([k]) => k === x.chave));
  const raiz = h("div.mapa");
  el.append(raiz);

  const trocarQuadro = (quadro, focar) => {
    raiz.replaceChildren(quadro);
    if (focar) setTimeout(() => { try { focar.focus({ preventScroll: true }); } catch { /* nada */ } }, 60);
  };

  // Sem perguntas: só o mapa das respostas que já existem.
  if (!perguntas.length) {
    const seguir = h("button.botao-principal", { type: "button", onclick: () => ctx.concluir({}) }, "Seguir");
    trocarQuadro(h("div.mapa-quadro.mapa-entra", null,
      h("div.mapa-par.mapa-par-um", null, mapaEl(ctx.respostas ?? {}, "HOJE", 200)),
      h("div.tocador-acao-botoes", null, seguir)), seguir);
    return { destruir() {} };
  }

  const novas = {};
  const anterior = ctx.trilha?.[p.perguntasDe] ?? {};
  const [rotuloAntes, rotuloAgora] = p.rotulos ?? [`DIA ${p.perguntasDe}`, "HOJE"];

  function pergunta(i) {
    const q = perguntas[i];
    const texto = q.pergunta ?? "";
    const idTexto = idUnico("mapa-pergunta");
    let marcada = Number.isInteger(novas[q.chave]) ? novas[q.chave] : null;
    const seguir = h("button.botao-principal", {
      type: "button",
      disabled: marcada === null,
      onclick: () => {
        if (marcada === null) return;
        novas[q.chave] = marcada;
        if (i + 1 < perguntas.length) pergunta(i + 1);
        else comparar();
      }
    }, "Seguir");
    const opcoes = (q.opcoes ?? []).map((o, j) => {
      const valor = q.valores ? q.valores[j] : j;
      const b = h("button.pastilha", {
        type: "button", role: "radio", "aria-checked": String(marcada === valor), tabindex: "-1", dataset: { valor }
      }, h("span.pastilha-check", { "aria-hidden": "true" }, iconeEl("check", { tamanho: 12 })), h("span", null, o));
      b.addEventListener("click", () => {
        marcada = valor;
        for (const x of opcoes) x.setAttribute("aria-checked", String(Number(x.dataset.valor) === valor));
        ajustarTab();
        seguir.disabled = false;
      });
      return b;
    });
    const ajustarTab = () => {
      const alvo = opcoes.find((x) => x.getAttribute("aria-checked") === "true") ?? opcoes[0];
      opcoes.forEach((x) => { x.tabIndex = x === alvo ? 0 : -1; });
    };
    ajustarTab();
    const grupo = h("div.pastilhas", { role: "radiogroup", "aria-labelledby": idTexto }, ...opcoes);
    grupo.addEventListener("keydown", (ev) => {
      const passo = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0;
      if (!passo) return;
      const j = opcoes.indexOf(document.activeElement);
      if (j === -1) return;
      ev.preventDefault();
      const k = (j + passo + opcoes.length) % opcoes.length;
      opcoes[k].focus();
      opcoes[k].click();
    });
    const titulo = h(`p.${classeDoPasso(texto).split(" ").join(".")}.tocador-texto.mapa-texto`, { id: idTexto, tabindex: "-1" }, texto);
    trocarQuadro(h("div.mapa-quadro.mapa-entra", null,
      titulo,
      h("div.tocador-acao", null,
        grupo,
        h("div.tocador-acao-botoes", null,
          seguir,
          h("button.link", { type: "button", onclick: () => ctx.concluir({}) }, "Pular")))), titulo);
  }

  function comparar() {
    const hoje = Object.fromEntries(DIMENSOES.map(([k]) => [k, novas[k]]));
    const seguir = h("button.botao-principal", {
      type: "button",
      onclick: () => ctx.concluir({ [p.chave ?? "mapa2"]: hoje })
    }, "Seguir");
    const doisMapas = temMapa(anterior);
    trocarQuadro(h("div.mapa-quadro.mapa-entra", null,
      h("div.mapa-par", { class: doisMapas ? "" : "mapa-par-um" },
        doisMapas ? mapaEl(anterior, rotuloAntes, 168) : null,
        mapaEl(hoje, rotuloAgora, 168)),
      h("div.tocador-acao-botoes", null, seguir)), seguir);
  }

  pergunta(0);
  return { destruir() {} };
}
