// T06 · Tempo: quanto tempo a pessoa tem. Grava o tempo no check-in e abre o passo de agora.

import { h, iconeEl } from "../ui.js";
import { checkinRecente, escolherTempo } from "../regras.js";
import { TEMPO } from "../conteudo/textos.js";
import { navegar } from "../app.js";

export const moldura = { aba: null, navegacao: "hoje", barra: "interna", esquerda: "voltar", limite: "pilula", pai: "#/hoje" };

export function montar(el, ctx) {
  const checkin = checkinRecente();
  if (!checkin) {
    ctx.navegar("#/hoje", { substituir: true });
    return {};
  }
  const opcoes = h("div.tempo-opcoes");
  for (const o of TEMPO.opcoes) {
    opcoes.append(h("button.cartao-escolha.sem-ponto", {
      type: "button",
      class: checkin.tempo === o.tempo ? "marcado" : "",
      onclick: () => {
        escolherTempo(checkin.id, o.tempo);
        navegar("#/hoje/passo");
      }
    },
    h("span.cartao-escolha-texto", null, h("span.cartao-escolha-nome", null, o.texto)),
    h("span.tempo-arco", { "aria-hidden": "true" }, iconeEl(o.icone, { tamanho: 28 }))));
  }
  el.append(h("div.coluna.tempo",
    h("h1.titulo.tempo-titulo", null, TEMPO.pergunta),
    opcoes,
    h("p.apoio.tempo-apoio", null, TEMPO.apoio)
  ));
  return {};
}
