// T25 · Aviso importante (dentro de Ajustes e do Sobre): o app não é terapia, o cuidado com o corpo e o CVV
// e o SAMU. Ligar e abrir o site só acontecem pelo toque da pessoa; o site abre numa aba nova (6.12).
// Abre também antes das boas-vindas.

import { h } from "../ui.js";
import { estado } from "../estado.js";
import { AVISO, CVV } from "../conteudo/textos.js";

export function moldura() {
  if (!estado?.boasVindasEm) return { aba: null, barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/boas-vindas/1" };
  return { aba: "semana", navegacao: "ajustes", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/ajustes" };
}

const NOMES_COMPLETOS = { [CVV.href]: `Ligar para o CVV, ${CVV.telefone}`, [CVV.hrefSamu]: `Ligar para o SAMU, ${CVV.samu}` };

function acao(a, i) {
  if (a.tipo === "link") {
    return h("a.link", { href: a.href, target: CVV.linkDoSite.target, rel: CVV.linkDoSite.rel }, a.texto);
  }
  return h(i === 0 ? "a.botao-principal" : "a.botao-secundario", { href: a.href, "aria-label": NOMES_COMPLETOS[a.href] ?? a.texto }, a.texto);
}

export function montar(el) {
  el.append(h("div.coluna.aviso-tela",
    h("h1.titulo.aviso-titulo", null, "Aviso importante"),
    ...AVISO.blocos.map((b) => h("div.aviso-bloco", { class: b.acoes ? "aviso-bloco-ajuda" : "" },
      h("p.texto", null, b.texto),
      b.acoes ? h("div.aviso-acoes", null, ...b.acoes.map(acao)) : null))
  ));
  return {};
}
