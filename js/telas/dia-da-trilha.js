// T14 · Abertura do dia da trilha: a fase, o título, a linha, a frase da fase (no primeiro dia de cada
// uma), a escolha entre completa e mínima, o "Por que funciona" e "Começar".
// "Começar" segue pelo fluxo da prática (#/pratica/T{n}?de=trilha, com &v=minima na mínima). No Dia 1,
// o próprio fluxo pergunta "Quer medir a tensão antes e depois?" antes do primeiro passo (sem medir na
// rota); nos outros dias, a régua segue ajustes.medir.
// Abre para o próximo dia (disponível hoje ou "Abre amanhã", pelo "Fazer agora") e para os dias feitos
// ("Fazer este dia de novo"). Um dia depois do próximo não abre: a rota volta para a Trilha.

import { h, iconeEl, seletor, botaoPrincipal, idUnico } from "../ui.js";
import { estado } from "../estado.js";
import { trilha } from "../regras.js";
import { diaDaTrilha, faseDoDia } from "../conteudo/trilha.js";

export const moldura = { aba: null, navegacao: "trilha", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/trilha" };

export function montar(el, ctx) {
  const n = Number(ctx.params.n);
  const dia = Number.isInteger(n) ? diaDaTrilha(n) : null;
  const t = trilha();
  const pode = dia && (estado.trilha.dias[n] || t.concluida || n === t.proximo);
  if (!pode) {
    ctx.navegar("#/trilha", { substituir: true });
    return {};
  }
  const fase = faseDoDia(n);
  const primeiroDaFase = fase?.dias?.[0] === n;
  const idPorque = idUnico("porque");
  let versao = "completa";

  const comecar = () => ctx.navegar(`#/pratica/T${n}?de=trilha${versao === "minima" ? "&v=minima" : ""}`);

  el.append(h("div.coluna.abertura-pratica.dia-trilha",
    h("p.rotulo.cartao-pratica-dim.dia-trilha-fase", null,
      fase ? iconeEl(fase.icone, { tamanho: 18 }) : null,
      h("span", null, `DIA ${n}${fase ? ` · ${fase.nome.toLocaleUpperCase("pt-BR")}` : ""}`)),
    h("h1.titulo", null, dia.titulo),
    h("p.lede", null, dia.linha),
    primeiroDaFase ? h("p.fase-frase.dia-trilha-frase", null, fase.frase) : null,
    h("div.abertura-versao", null, seletor({
      rotulo: "Versão",
      valor: versao,
      opcoes: [
        { valor: "completa", texto: `Completa · ${dia.tempo} min` },
        { valor: "minima", texto: `Mínima · ${dia.minimaMin ?? 1} min` }
      ],
      aoMudar: (v) => { versao = v; }
    })),
    h("section.bloco-papel.abertura-porque", { "aria-labelledby": idPorque },
      h("p.rotulo", { id: idPorque }, "POR QUE FUNCIONA"),
      h("p", null, dia.porque)),
    h("div.abertura-comecar", null, botaoPrincipal("Começar", comecar))
  ));
  return {};
}
