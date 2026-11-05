// T22 · Ajustes (dentro de Semana): o tom, o sino, medir a tensão, o tema, menos movimento, letra maior e os
// caminhos para Seus dados, Instalar, Sobre, o Aviso importante e o CVV (que abre o Estou no limite).
// Toda mudança vale na hora, sem botão de salvar: esta tela só grava a escolha no estado, e a fundação
// (app.js) reaplica tema, movimento e letra maior no <html>. Cinco toques seguidos, em até 3 s, na linha da
// versão (no pé) abrem a demonstração (T27); nenhuma lista mostra uma linha para ela.

import { h, idUnico, chave, seletor, botaoLink } from "../ui.js";
import { estado, alterar } from "../estado.js";
import { AJUSTES } from "../conteudo/textos.js";
import { tocarSino } from "../som.js";
import { navegar, abrirLimite, estaInstalado } from "../app.js";
import { linhaDeIr, listaDeIr } from "../casa.js";

export const moldura = { aba: "semana", navegacao: "ajustes", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/semana" };

const movimentoDoAparelho = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function grupo(rotulo, ...itens) {
  const id = idUnico("ajustes");
  return h("section.ajustes-grupo", { "aria-labelledby": id },
    h("h2.rotulo.ajustes-grupo-rotulo", { id }, rotulo),
    h("div.ajustes-itens", null, ...itens));
}

function itemComSeletor(nome, controle, apoio = null) {
  const id = idUnico("ajuste");
  controle.removeAttribute("aria-label");
  controle.setAttribute("aria-labelledby", id);
  return h("div.ajustes-item.ajustes-item-seletor",
    h("p.ajustes-nome", { id }, nome),
    controle,
    apoio ? h("p.apoio.ajustes-apoio", null, apoio) : null);
}

export function montar(el) {
  const a = AJUSTES;
  const aj = estado.ajustes;

  const tom = seletor({
    rotulo: a.pratica.tom.nome,
    valor: aj.tom === "espiritual" ? "espiritual" : "pratico",
    opcoes: a.pratica.tom.opcoes.map((o) => ({ valor: o.id, texto: o.nome })),
    aoMudar: (v) => alterar((e) => { e.ajustes.tom = v; }),
    classe: "ajustes-seletor"
  });
  const sino = chave({
    rotulo: a.pratica.sino.nome,
    apoio: a.pratica.sino.apoio,
    ligada: Boolean(aj.som),
    aoMudar: (v) => alterar((e) => { e.ajustes.som = v; })
  });
  const medir = chave({
    rotulo: a.pratica.medir.nome,
    apoio: a.pratica.medir.texto,
    ligada: Boolean(aj.medir),
    aoMudar: (v) => alterar((e) => { e.ajustes.medir = v; })
  });
  const tema = seletor({
    rotulo: a.aparencia.tema.nome,
    valor: ["claro", "noite", "auto"].includes(aj.tema) ? aj.tema : "claro",
    opcoes: a.aparencia.tema.opcoes.map((o) => ({ valor: o.id, texto: o.nome })),
    aoMudar: (v) => alterar((e) => { e.ajustes.tema = v; }),
    classe: "ajustes-seletor ajustes-tema"
  });
  const movimento = chave({
    rotulo: a.aparencia.menosMovimento.nome,
    ligada: aj.menosMovimento ?? movimentoDoAparelho(),
    aoMudar: (v) => alterar((e) => { e.ajustes.menosMovimento = v; })
  });
  const letra = chave({
    rotulo: a.aparencia.letraMaior.nome,
    ligada: Boolean(aj.letraMaior),
    aoMudar: (v) => alterar((e) => { e.ajustes.letraMaior = v; })
  });

  // A linha da versão: cinco toques seguidos, em até 3 s, abrem a demonstração.
  const versao = h("p.ajustes-versao", null, a.rodape);
  let toques = [];
  versao.addEventListener("pointerup", () => {
    const t = Date.now();
    toques = toques.filter((x) => t - x < 3000);
    toques.push(t);
    if (toques.length >= 5) {
      toques = [];
      navegar("#/demonstracao");
    }
  });

  el.append(h("div.coluna.ajustes-tela",
    h("h1.titulo.ajustes-titulo", null, a.titulo),
    grupo(a.pratica.rotulo,
      itemComSeletor(a.pratica.tom.nome, tom, a.pratica.tom.apoio),
      h("div.ajustes-item", null, sino,
        h("p.ajustes-ouvir", null, botaoLink(a.pratica.sino.ouvir, () => tocarSino(1, { sempre: true })))),
      h("div.ajustes-item", null, medir)),
    grupo(a.aparencia.rotulo,
      itemComSeletor(a.aparencia.tema.nome, tema),
      h("div.ajustes-item", null, movimento),
      h("div.ajustes-item", null, letra)),
    h("section.ajustes-grupo.ajustes-mais", { "aria-labelledby": "ajustes-mais" },
      h("h2.rotulo.ajustes-grupo-rotulo", { id: "ajustes-mais" }, a.mais.rotulo),
      listaDeIr([
        linhaDeIr({ nome: a.mais.dados, rota: "#/ajustes/dados" }),
        estaInstalado() ? null : linhaDeIr({ nome: a.mais.instalar, rota: "#/ajustes/instalar" }),
        linhaDeIr({ nome: a.mais.sobre, rota: "#/sobre" }),
        linhaDeIr({ nome: a.mais.aviso, rota: "#/aviso" }),
        linhaDeIr({ nome: a.mais.ajuda, aoTocar: () => abrirLimite(), classe: "ajustes-ajuda" })
      ])),
    versao
  ));
  return {};
}
