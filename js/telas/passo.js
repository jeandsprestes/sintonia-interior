// T07 · Seu passo de agora: duas opções do tamanho do dia (regra fixa de 7.7), começar com um toque.

import { h, iconeEl, botaoPrincipal, botaoLink, idUnico, plural } from "../ui.js";
import { checkinRecente, passoDeAgora, lembrarEscolha } from "../regras.js";
import { pratica as praticaPorId, nomeDaDimensao } from "../conteudo/praticas.js";
import { diaDaTrilha } from "../conteudo/trilha.js";
import { navegar, voltarPara, abrirLimite } from "../app.js";

export const moldura = { aba: null, navegacao: "hoje", barra: "interna", esquerda: "voltar", limite: "pilula", pai: "#/hoje" };

const PARA = { cansaco: "Para o cansaço", sobrecarga: "Para a sobrecarga", desconexao: "Para a desconexão" };
const EM = { 2: "em 1 ou 2 minutos", 5: "em uns 5 minutos", 10: "em 10 minutos ou mais" };

export function montar(el, ctx) {
  const checkin = checkinRecente();
  if (!checkin) {
    ctx.navegar("#/hoje", { substituir: true });
    return {};
  }
  if (!checkin.tempo) {
    ctx.navegar("#/hoje/tempo", { substituir: true });
    return {};
  }
  const celula = `${checkin.estado}-${checkin.tempo}`;
  const escolha = passoDeAgora(checkin.estado, checkin.tempo);
  const curto = checkin.tempo === 2;

  const cartoes = h("div.passo-cartoes");
  const raiz = h("div.coluna.passo-de-agora",
    h("p.rotulo", null, "SEU PASSO DE AGORA"),
    h("div.passo-contexto",
      h("p", null, `${PARA[checkin.estado]}, ${EM[checkin.tempo]}.`),
      botaoLink("Mudar", () => voltarPara("#/hoje"))),
    h("h1.titulo.passo-titulo", null, "Fique com a opção que parecer mais possível."),
    cartoes,
    h("p.passo-dificil", null, botaoLink("Hoje está difícil", () => abrirLimite()))
  );

  // O primeiro cartão (o dia da trilha ou a prática escolhida por último) e o segundo.
  const [primeiro, segundo] = escolha.cartoes;
  cartoes.append(primeiro.trilha ? cartaoDaTrilha(primeiro.trilha, primeiro.versao) : cartaoDaPratica(primeiro.pratica));
  let segundoEl = cartaoDaPratica(segundo.pratica);
  cartoes.append(segundoEl);

  if (escolha.trocarPor) {
    let atual = segundo.pratica;
    let outra = escolha.trocarPor;
    const trocar = botaoLink("", () => {
      [atual, outra] = [outra, atual];
      const novo = cartaoDaPratica(atual);
      novo.classList.add("trocando");
      segundoEl.replaceWith(novo);
      segundoEl = novo;
      rotularTroca();
    });
    const rotularTroca = () => { trocar.textContent = `Trocar por: ${praticaPorId(outra)?.titulo ?? ""}`; };
    rotularTroca();
    cartoes.append(h("p.passo-trocar", null, trocar));
  }

  el.append(raiz);
  return {};

  function porQue(texto) {
    const id = idUnico("porque");
    const corpo = h("div.abre-fecha", { id }, h("div", null, h("p.porque-texto", null, texto)));
    const botao = h("button.link.link-porque", { type: "button", "aria-expanded": "false", "aria-controls": id }, "Por que funciona");
    botao.addEventListener("click", () => {
      const aberto = botao.getAttribute("aria-expanded") !== "true";
      botao.setAttribute("aria-expanded", String(aberto));
      corpo.classList.toggle("aberto", aberto);
    });
    return [botao, corpo];
  }

  function cartaoDaTrilha(n, versao) {
    const dia = diaDaTrilha(n);
    const idTitulo = idUnico("cartao");
    const minimo = dia.minimaMin ?? 1;
    const minutos = curto ? minimo : dia.tempo;
    const ir = (v) => navegar(`#/pratica/T${n}?de=hoje&v=${v}`);
    return h("article.cartao.cartao-pratica", { "aria-labelledby": idTitulo },
      h("p.rotulo.cartao-pratica-dim", null, iconeEl("trilha", { tamanho: 18 }), h("span", null, `TRILHA · DIA ${n} DE 7`)),
      h("h2.titulo-cartao.cartao-pratica-titulo", { id: idTitulo }, dia.titulo),
      h("p.cartao-pratica-oque", null, dia.linha),
      ...porQue(dia.porque),
      botaoPrincipal(`Começar · ${minutos} min`, () => ir(curto ? "minima" : versao), {
        "aria-label": `Começar ${dia.titulo}, ${plural(minutos, "minuto", "minutos")}`
      }),
      curto ? null : h("p.cartao-pratica-minima", null, botaoLink(`Versão mínima · ${minimo} min`, () => ir("minima"), {
        "aria-label": `Versão mínima de ${dia.titulo}, ${plural(minimo, "minuto", "minutos")}`
      }))
    );
  }

  function cartaoDaPratica(id) {
    const p = praticaPorId(id);
    const idTitulo = idUnico("cartao");
    const minimo = p.minimaMin ?? 1;
    const ir = (v) => navegar(`#/pratica/${id}?de=hoje${v === "minima" ? "&v=minima" : ""}`);
    return h("article.cartao.cartao-pratica", { "aria-labelledby": idTitulo },
      h("p.rotulo.cartao-pratica-dim", null, iconeEl(p.dimensao, { tamanho: 18 }),
        h("span", null, `${String(nomeDaDimensao(p.dimensao)).toLocaleUpperCase("pt-BR")} · ${p.tempo} MIN`)),
      h("h2.titulo-cartao.cartao-pratica-titulo", { id: idTitulo }, p.titulo),
      h("p.cartao-pratica-oque", null, p.oQueE),
      ...porQue(p.porque),
      botaoPrincipal(`Começar · ${p.tempo} min`, () => { lembrarEscolha(celula, id); ir("completa"); }, {
        "aria-label": `Começar ${p.titulo}, ${plural(p.tempo, "minuto", "minutos")}`
      }),
      h("p.cartao-pratica-minima", null, botaoLink(`Versão mínima · ${minimo} min`, () => ir("minima"), {
        "aria-label": `Versão mínima de ${p.titulo}, ${plural(minimo, "minuto", "minutos")}`
      }))
    );
  }
}
