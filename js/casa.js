// Ajudantes das telas da biblioteca e da casa (T16 a T18, T22 a T27): o nome de uma sessão, a linha
// que leva a outra tela, a seta desenhada (a fonte não tem a seta), a folha de confirmação e o tamanho
// em KB. Dono: a biblioteca e a casa (ver a tabela de js/LEIA.md). Estilos em css/casa.css.

import { h, svg, iconeEl, abrirFolha, botaoPrincipal, botaoSecundario } from "./ui.js";
import { pratica as praticaPorId } from "./conteudo/praticas.js";
import { diaDaTrilha } from "./conteudo/trilha.js";

const NOMES = {
  DESC: "Descarregar a cabeça",
  EXP: "Experimento de 1 minuto",
  RESP: "Respirar comigo",
  LIMITE: "Estou no limite",
  CUIDADO: "Seu cuidado possível"
};

/** O nome de uma sessão para as listas: a prática, o dia da trilha ou a ferramenta. */
export function tituloDaSessao(s) {
  const id = s?.praticaId ?? "";
  if (NOMES[id]) return NOMES[id];
  if (/^T[1-7]$/.test(id)) return diaDaTrilha(id)?.titulo ?? "";
  return praticaPorId(id)?.titulo ?? "";
}

/** "versão mínima" ou "versão completa"; nada para as outras (interrompida, limite, cuidado). */
export function textoDaVersao(versao) {
  if (versao === "minima") return "versão mínima";
  if (versao === "completa") return "versão completa";
  return "";
}

/**
 * A linha que leva a outra tela (Semana, Seu caderno, Ajustes): o nome, uma prévia opcional e o "›".
 * Com rota, é um <a>; com aoTocar, um <button>.
 */
export function linhaDeIr({ nome, previa = null, rota = null, aoTocar = null, classe = "" }) {
  const filhos = [
    h("span.casa-linha-texto", null,
      h("span.casa-linha-nome", null, nome),
      previa ? h("span.casa-linha-previa", null, previa) : null),
    h("span.casa-linha-seta", { "aria-hidden": "true" }, iconeEl("voltar", { tamanho: 20 }))
  ];
  if (rota) return h("a.casa-linha", { href: rota, class: classe }, ...filhos);
  return h("button.casa-linha", { type: "button", class: classe, onclick: aoTocar }, ...filhos);
}

/** Uma lista de linhas de ir, em <ul>. */
export function listaDeIr(linhas, classe = "") {
  return h("ul.casa-linhas", { class: classe }, ...linhas.filter(Boolean).map((l) => h("li", null, l)));
}

/** A seta de "7 seta 4", desenhada em traço (a fonte do app não tem o caractere). */
export function seta() {
  return svg('<svg class="casa-seta" viewBox="0 0 18 10" width="18" height="10" aria-hidden="true" focusable="false">' +
    '<path d="M1.5 5h14M11.5 1.5 15.5 5l-4 3.5" fill="none" stroke="currentColor" stroke-width="1.5" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>');
}

/**
 * Pede confirmação numa folha (T18: cada exclusão pede confirmação numa folha).
 * Devolve uma Promise com true (a pessoa confirmou) ou false.
 */
export function confirmar({ titulo, texto = null, sim = "Apagar", nao = "Cancelar", rotulo = null }) {
  return new Promise((resolver) => {
    let resposta = false;
    abrirFolha({
      titulo,
      rotulo,
      classe: "casa-folha-confirmar",
      conteudo(corpo, folha) {
        if (texto) corpo.append(h("p.texto", null, texto));
        corpo.append(h("div.folha-botoes", null,
          botaoPrincipal(sim, () => { resposta = true; folha.fechar(); }),
          botaoSecundario(nao, () => folha.fechar())));
      },
      aoFechar() { resolver(resposta); }
    });
  });
}

/** Bytes em texto: "42 KB" ou "1,2 MB". */
export function tamanhoEmTexto(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  const mb = n / (1024 * 1024);
  return `${mb.toLocaleString("pt-BR", { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
}
