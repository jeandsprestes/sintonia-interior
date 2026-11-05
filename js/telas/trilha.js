// T13 · Trilha: os sete dias de "Voltar para mim", as fases e onde a pessoa está.
// Com as folhas O dia abre amanhã, o dia depois, o resumo do dia feito e Refazer a trilha.
// Regras de 7.6 (regras.js): um dia por dia lógico, "Fazer agora" para o dia que abre amanhã, nada expira,
// "Espera por você" depois de 3 dias lógicos sem atividade na trilha. Nenhum texto daqui cobra a pessoa.
//
// O caminho é uma lista <ol> de 7 dias; o rótulo de cada fase vai no primeiro dia dela. O fio que liga os
// nós (uma linha fina que ondula de leve, com o tom de cada fase) é desenhado depois do layout, a partir
// do centro dos nós, e redesenhado quando a lista muda de tamanho.

import { h, svg, limpar, desenhos, iconeEl, abrirFolha, botaoPrincipal, botaoSecundario, botaoLink, focarTitulo } from "../ui.js";
import { estado } from "../estado.js";
import { diaLogico, diaEMes, diaCurtoRotulo } from "../dia.js";
import { flor, trilha, refazerTrilha } from "../regras.js";
import { TRILHA, DIAS, FASES, diaDaTrilha, faseDoDia, fraseDoCuidado } from "../conteudo/trilha.js";
import { navegar } from "../app.js";

export const moldura = { aba: "trilha", barra: "aba", titulo: "Trilha", esquerda: null, limite: "icone" };

// O fio: amplitude e comprimento da onda, em px.
const ONDA = { amplitude: 2.2, comprimento: 76, passo: 3 };

export function montar(el, ctx) {
  let observador = null;
  const desenhar = ({ focar = false } = {}) => {
    observador?.disconnect();
    limpar(el);
    const { raiz, caminho, fio } = telaDaTrilha(desenhar);
    el.append(raiz);
    observador = new ResizeObserver(() => requestAnimationFrame(() => desenharFio(caminho, fio)));
    observador.observe(caminho);
    if (focar) focarTitulo(raiz);
  };
  desenhar();
  return {
    aoMudarEstado() { desenhar(); },
    destruir() { observador?.disconnect(); }
  };
}

// ---------------------------------------------------------------- a tela

function telaDaTrilha(redesenhar) {
  const hoje = diaLogico();
  const t = trilha(hoje);
  const f = flor(hoje);
  const raiz = h("div.coluna.trilha");

  // Rótulo, título, linha e a flor (à direita do título a partir de 390 px; embaixo dele, antes disso).
  const rotuloFlor = desenhos.rotuloDaFlor({ estagio: f.estagio, descansa: f.descansa, cresceuHoje: f.cresceuHoje }) || "Sua flor";
  raiz.append(h("header.trilha-cabeca", null,
    h("div.trilha-cabeca-texto", null,
      h("p.rotulo", null, "TRILHA DE 7 DIAS"),
      h("h1.titulo.trilha-titulo", null, TRILHA.nome)),
    h("button.trilha-flor", { type: "button", "aria-label": rotuloFlor, onclick: abrirSuaFlor },
      svg(desenhos.florSVG({ estagio: f.estagio, descansa: f.descansa, cresceuHoje: f.cresceuHoje, altura: 120 }))),
    h("p.texto.trilha-linha", null, "Um dia de cada vez, no seu ritmo. Todo dia tem versão mínima de 1 a 2 minutos, e fazer só ela já conta.")
  ));

  // O alto: começar, a volta depois de dias ou a trilha concluída.
  if (t.concluida) {
    const em = estado.trilha.concluidaEm ?? estado.trilha.dias[7]?.dia ?? hoje;
    raiz.append(h("section.trilha-topo.trilha-concluida", { "aria-label": "Trilha concluída" },
      h("p.trilha-concluida-texto", null, `Você terminou a trilha em ${diaEMes(em)}.`),
      h("div.trilha-topo-acoes", null,
        botaoSecundario("Olhar o caminho", () => navegar("#/trilha/caminho")),
        botaoLink("Refazer a trilha", () => abrirRefazer(redesenhar)))));
  } else if (!t.comecou) {
    raiz.append(h("div.trilha-topo", null, botaoPrincipal("Começar pelo Dia 1", () => navegar("#/trilha/1"))));
  } else if (t.esperaPorVoce) {
    raiz.append(h("p.trilha-topo.trilha-espera", null, `A trilha está no Dia ${t.proximo}, esperando por você.`));
  }

  // O caminho.
  const lista = h("ol.trilha-dias");
  for (const fase of FASES) {
    fase.dias.forEach((n, i) => {
      const e = estadoDoDia(n, t);
      const li = h("li.trilha-dia", { class: `trilha-dia-${e.tipo}`, dataset: { n, fase: fase.id } });
      if (i === 0) {
        li.append(h("div.trilha-fase", null,
          h("span.trilha-fase-icone", { "aria-hidden": "true" }, iconeEl(fase.icone, { tamanho: 20 })),
          h("h2.rotulo.trilha-fase-rotulo", null, fase.rotulo)));
      }
      li.append(botaoDoDia(n, e));
      // O botão "Fazer o Dia N" do dia disponível (na trilha não começada, o botão do alto já faz isso).
      if ((e.tipo === "hoje" || e.tipo === "espera") && t.comecou) {
        li.append(h("div.trilha-dia-acao", null, botaoSecundario(`Fazer o Dia ${n}`, () => navegar(`#/trilha/${n}`))));
      }
      lista.append(li);
    });
  }
  const fio = svg(`<svg xmlns="http://www.w3.org/2000/svg" class="trilha-fio" aria-hidden="true" focusable="false"></svg>`);
  const caminho = h("div.trilha-caminho", null, fio, lista);
  raiz.append(caminho);
  return { raiz, caminho, fio };
}

/** O estado de um dia: feito, hoje (disponível), espera (disponível depois de 3 dias), amanha ou depois. */
function estadoDoDia(n, t) {
  const feito = estado.trilha.dias[n];
  if (feito) return { tipo: "feito", feito };
  if (!t.concluida && n === t.proximo) return { tipo: t.disponivel ? (t.esperaPorVoce ? "espera" : "hoje") : "amanha" };
  return { tipo: "depois" };
}

function rotuloDoEstado(n, e) {
  switch (e.tipo) {
    case "feito": return `FEITO EM ${diaCurtoRotulo(e.feito.dia)}${e.feito.versao === "minima" ? " · MÍNIMA" : ""}`;
    case "hoje": return "HOJE";
    case "espera": return "ESPERA POR VOCÊ";
    case "amanha": return "ABRE AMANHÃ";
    default: return `DEPOIS DO DIA ${n - 1}`;
  }
}

function leituraDoEstado(n, e) {
  switch (e.tipo) {
    case "feito": return `feito em ${diaEMes(e.feito.dia)}${e.feito.versao === "minima" ? ", na versão mínima" : ""}`;
    case "hoje": return "disponível hoje";
    case "espera": return "espera por você";
    case "amanha": return "abre amanhã";
    default: return `depois do Dia ${n - 1}`;
  }
}

function botaoDoDia(n, e) {
  const dia = diaDaTrilha(n);
  const marca = e.tipo === "feito" ? iconeEl("lotus", { tamanho: 18 }) : h("span.trilha-no-numero", null, String(n));
  return h("button.trilha-no-botao", {
    type: "button",
    "aria-label": `Dia ${n}, ${dia.titulo}, ${leituraDoEstado(n, e)}`,
    onclick: () => tocarNoDia(n, e)
  },
  h("span.trilha-no", { "aria-hidden": "true" }, marca),
  h("span.trilha-no-texto", { "aria-hidden": "true" },
    h("span.trilha-no-titulo", null, h("span.trilha-no-dia", null, `Dia ${n} · `), dia.titulo),
    h("span.apoio.trilha-no-linha", null, dia.linha),
    h("span.rotulo.trilha-no-estado", null, rotuloDoEstado(n, e))));
}

function tocarNoDia(n, e) {
  if (e.tipo === "feito") abrirResumo(n);
  else if (e.tipo === "hoje" || e.tipo === "espera") navegar(`#/trilha/${n}`);
  else if (e.tipo === "amanha") abrirAbreAmanha(n);
  else abrirDepois(n);
}

async function abrirSuaFlor() {
  try {
    const m = await import("./hoje.js");
    m.abrirSuaFlor?.();
  } catch (erro) {
    console.error(erro);
  }
}

// ---------------------------------------------------------------- o fio que liga os nós

function centro(el, caixa) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - caixa.left, y: r.top + r.height / 2 - caixa.top };
}

function desenharFio(caminho, fio) {
  if (!caminho.isConnected) return;
  const caixa = caminho.getBoundingClientRect();
  if (!caixa.width || !caixa.height) return;
  const marcos = [];
  for (const li of caminho.querySelectorAll(".trilha-dia")) {
    const icone = li.querySelector(".trilha-fase-icone");
    if (icone) marcos.push({ ...centro(icone, caixa), fase: li.dataset.fase, inicioDaFase: true });
    const no = li.querySelector(".trilha-no");
    if (no) marcos.push({ ...centro(no, caixa), fase: li.dataset.fase });
  }
  if (marcos.length < 2) return;
  const cx = marcos[0].x;
  const y0 = marcos[0].y;
  // Cada fase vai do seu ícone até o ícone da fase seguinte; a última, até o Dia 7.
  const trechos = [];
  for (let i = 0; i < marcos.length; i++) {
    if (!marcos[i].inicioDaFase) continue;
    const proximo = marcos.findIndex((m, j) => j > i && m.inicioDaFase);
    const fim = proximo === -1 ? marcos.at(-1).y : marcos[proximo].y;
    trechos.push({ fase: marcos[i].fase, de: marcos[i].y, ate: fim });
  }
  const onda = (y) => cx + ONDA.amplitude * Math.sin((2 * Math.PI * (y - y0)) / ONDA.comprimento);
  const caminhos = trechos.map(({ fase, de, ate }) => {
    let d = `M${onda(de).toFixed(2)} ${de.toFixed(2)}`;
    for (let y = de + ONDA.passo; y < ate; y += ONDA.passo) d += `L${onda(y).toFixed(2)} ${y.toFixed(2)}`;
    d += `L${onda(ate).toFixed(2)} ${ate.toFixed(2)}`;
    return `<path class="trilha-fio-${fase}" d="${d}"/>`;
  }).join("");
  fio.setAttribute("viewBox", `0 0 ${caixa.width.toFixed(1)} ${caixa.height.toFixed(1)}`);
  fio.setAttribute("width", caixa.width.toFixed(1));
  fio.setAttribute("height", caixa.height.toFixed(1));
  fio.innerHTML = caminhos;
}

// ---------------------------------------------------------------- folhas

function rotuloDoDia(n) {
  const fase = faseDoDia(n);
  return `DIA ${n}${fase ? ` · ${fase.nome.toLocaleUpperCase("pt-BR")}` : ""}`;
}

/** O dia que abre amanhã (7.6): dá para fazer agora, com a data de hoje. */
function abrirAbreAmanha(n) {
  const dia = diaDaTrilha(n);
  abrirFolha({
    rotulo: rotuloDoDia(n),
    titulo: dia.titulo,
    classe: "folha-trilha",
    conteudo(corpo, folha) {
      corpo.append(
        h("p.apoio.trilha-folha-linha", null, dia.linha),
        h("p.texto", null, "Este dia abre amanhã. Se quiser, dá para fazer agora."),
        h("div.folha-botoes", null,
          botaoPrincipal("Fazer agora", () => { folha.fechar(); navegar(`#/trilha/${n}`); }),
          botaoSecundario("Esperar", () => folha.fechar())));
    }
  });
}

/** Um dia depois do próximo. */
function abrirDepois(n) {
  const dia = diaDaTrilha(n);
  abrirFolha({
    rotulo: rotuloDoDia(n),
    titulo: dia.titulo,
    classe: "folha-trilha",
    conteudo(corpo, folha) {
      corpo.append(
        h("p.apoio.trilha-folha-linha", null, dia.linha),
        h("p.texto", null, `Ele abre depois do Dia ${n - 1}.`),
        h("div.folha-botoes", null, botaoPrincipal("Entendi", () => folha.fechar())));
    }
  });
}

const temValor = (v) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== "");
const comoTexto = (v) => (Array.isArray(v) ? juntarLista(v) : String(v ?? ""));
function juntarLista(lista) {
  const l = lista.filter(temValor).map(String);
  return l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} e ${l.at(-1)}`;
}

/** O que cada dia mostra no resumo: os itens dos cartões do Dia 7 (DIAS[6].cartoes) e, no Dia 7, o que ele guarda. */
function itensDoResumo(n, r) {
  const cfg = DIAS[6]?.cartoes ?? { porDia: {} };
  const dia = diaDaTrilha(n);
  const chaveDaPalavra = dia?.palavra;
  const itens = n === 7 ? ["percebeu", "mapa2"] : (cfg.porDia?.[n] ?? []);
  const saida = [];
  for (const item of itens) {
    if (Array.isArray(item)) {
      // "esta, ou, se não houver, a outra" (a mínima grava a escolha na chave da palavra, que já aparece acima)
      const k = item.find((x) => temValor(r[x]));
      if (k && k !== chaveDaPalavra) saida.push(h("p.texto", null, comoTexto(r[k])));
    } else if (item === "medicao") {
      if (temValor(r.antes) && temValor(r.depois)) {
        saida.push(h("p.texto", null, String(cfg.medicao ?? "").replace("{antes}", r.antes).replace("{depois}", r.depois)));
      }
    } else if (item === "mapa") {
      if (["corpo", "emocoes", "mente", "espirito"].some((k) => temValor(r[k]))) {
        saida.push(h("div.trilha-resumo-mapa", { "aria-hidden": "true" }, svg(desenhos.mapaCuidado(r, { tamanho: 148 }))));
      }
    } else if (item === "mapa2") {
      if (r.mapa2 && typeof r.mapa2 === "object") {
        const dia3 = estado.trilha.dias[3]?.respostas ?? {};
        const temDia3 = ["corpo", "emocoes", "mente", "espirito"].some((k) => temValor(dia3[k]));
        saida.push(h("div.trilha-resumo-mapas", { "aria-hidden": "true" },
          temDia3 ? h("figure.mapa-um", null, svg(desenhos.mapaCuidado(dia3, { tamanho: 132 })), h("figcaption.rotulo.mapa-rotulo", null, "DIA 3")) : null,
          h("figure.mapa-um", null, svg(desenhos.mapaCuidado(r.mapa2, { tamanho: 132 })), h("figcaption.rotulo.mapa-rotulo", null, "DIA 7"))));
      }
    } else if (item === "cuidado") {
      const dia6 = diaDaTrilha(6);
      const passoDoGesto = (dia6?.completa ?? []).find((x) => x.chave === "gesto");
      const c = fraseDoCuidado({ gesto: r.gesto, momento: r.momento, minima: r.minima },
        { pastilhas: [...(passoDoGesto?.opcoes ?? []), ...(estado.fazBem.coisas ?? [])] });
      if (c) {
        saida.push(h("p.trilha-resumo-cuidado", null, c.frase));
        if (c.minima) saida.push(h("p.apoio", null, c.minima));
      }
    } else if (item !== chaveDaPalavra && temValor(r[item])) {
      saida.push(h(item === "percebeu" ? "p.texto.trilha-resumo-escrito" : "p.texto", null, comoTexto(r[item])));
    }
  }
  return saida;
}

/** O resumo de um dia feito: a palavra, as respostas e "Fazer este dia de novo". */
function abrirResumo(n) {
  const dia = diaDaTrilha(n);
  const feito = estado.trilha.dias[n];
  if (!feito) return;
  const r = feito.respostas ?? {};
  const palavra = Array.isArray(feito.palavra) ? juntarLista(feito.palavra) : feito.palavra;
  abrirFolha({
    rotulo: rotuloDoDia(n),
    titulo: dia.titulo,
    classe: "folha-trilha folha-resumo",
    conteudo(corpo, folha) {
      // O append do DOM escreveria "null": o que falta sai da lista antes.
      corpo.append(...[
        h("p.apoio.trilha-resumo-quando", null, feito.versao === "minima"
          ? `Feito em ${diaEMes(feito.dia)}, na versão mínima.`
          : `Feito em ${diaEMes(feito.dia)}.`),
        palavra ? h("p.trilha-resumo-palavra", null, palavra) : null,
        ...itensDoResumo(n, r),
        h("div.trilha-resumo-acao", null,
          botaoLink("Fazer este dia de novo", () => { folha.fechar(); navegar(`#/trilha/${n}`); }))
      ].filter(Boolean));
    }
  });
}

/** Refazer a trilha (7.6): a rodada de agora vai para trilha.anteriores e uma nova começa do Dia 1. */
function abrirRefazer(redesenhar) {
  abrirFolha({
    titulo: "Refazer a trilha?",
    classe: "folha-trilha",
    conteudo(corpo, folha) {
      corpo.append(
        h("p.texto", null, "O caminho de agora fica guardado, e uma trilha nova começa do Dia 1."),
        h("div.folha-botoes", null,
          botaoPrincipal("Refazer", async () => {
            await folha.fechar();
            refazerTrilha();
            redesenhar({ focar: true });
          }),
          botaoSecundario("Cancelar", () => folha.fechar())));
    }
  });
}
