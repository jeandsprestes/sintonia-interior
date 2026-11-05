// T16 · Práticas: escolher uma prática sem as perguntas do começo. Primeiro, sempre, as três ferramentas;
// depois as 18 práticas por estado (cansaço, sobrecarga, desconexão, com 2 de 2 min, 2 de 5 e 2 de 10 em
// cada grupo) ou por dimensão (Corpo, Emoções, Mente, Espírito). A escolha do seletor fica em
// ajustes.praticasPor (só neste aparelho). Cada cartão leva à abertura da prática (T08, #/praticas/{id}).
//
// Também mora aqui o Respirar comigo como ferramenta (6.4 e 6.6), em #/praticas?respirar=1 (com &de=semana
// quando vem da Semana). É a mesma tela de dentro do Estou no limite, aberta como tela de foco: o círculo de
// 4 e 6 s, o apoio nos primeiros 10 s e, a cada minuto, "Mais um minuto" e "Já está bom". Com 60 s ou mais,
// "Já está bom" (e o "×") grava a sessão RESP e segue direto para o fecho com a flor (7.4), sem registro;
// antes de 60 s, o "×" só volta, sem gravar nada.

import { h, iconeEl, idUnico, botaoPrincipal, botaoLink, empilharVolta } from "../ui.js";
import { estado, alterar } from "../estado.js";
import { agora, isoLocal } from "../dia.js";
import { PRATICAS, DIMENSOES, nomeDaDimensao, ferramenta } from "../conteudo/praticas.js";
import { RESP } from "../conteudo/textos.js";
import { MATRIZ, registrarSessao } from "../regras.js";
import { criarRespiracao } from "../respirar.js";
import { tocarSino } from "../som.js";
import { voltarPara, aoAbrirLimite, abrirLimite } from "../app.js";

const GRUPOS_POR_ESTADO = [
  { id: "cansaco", nome: "Para o cansaço" },
  { id: "sobrecarga", nome: "Para a sobrecarga" },
  { id: "desconexao", nome: "Para a desconexão" }
];

const FERRAMENTAS_DA_LISTA = [
  { id: "DESC", texto: "Pôr para fora o que está na cabeça e separar.", icone: "mente", rota: "#/descarregar?de=praticas" },
  { id: "EXP", texto: "Medir a tensão antes e depois de um minuto de pausa.", icone: "tempo2", rota: "#/experimento?de=praticas" },
  { id: "RESP", texto: RESP.descricao, icone: "corpo", rota: "#/praticas?respirar=1" }
];

const destinoDoRespirar = (ctx) => (ctx.query.de === "semana" ? "#/semana" : "#/praticas");

export function moldura(ctx) {
  if (ctx.query.respirar) {
    return {
      aba: null, navegacao: "praticas", barra: "interna", esquerda: "fechar", rotuloEsquerda: "Encerrar",
      limite: "pilula", foco: true, pai: destinoDoRespirar(ctx)
    };
  }
  return { aba: "praticas", barra: "aba", titulo: "Práticas", esquerda: null, limite: "icone" };
}

export function montar(el, ctx) {
  if (ctx.query.respirar) return montarRespirar(el, ctx);
  return montarBiblioteca(el, ctx);
}

// ---------------------------------------------------------------- a biblioteca

function montarBiblioteca(el, ctx) {
  // No celular, o nome da barra só aparece depois de rolar: no alto, o título grande já diz "Práticas".
  document.documentElement.classList.add("casa-titulo-na-tela");

  const raiz = h("div.coluna.praticas");
  const idTitulo = idUnico("praticas");
  const idPainel = idUnico("praticas-painel");
  const opcoes = [
    { id: "estado", texto: "Por estado" },
    { id: "dimensao", texto: "Por dimensão" }
  ];
  let atual = estado.ajustes.praticasPor === "dimensao" ? "dimensao" : "estado";

  const abas = opcoes.map((o) => h("button.seletor-opcao", {
    type: "button", role: "tab", id: `${idPainel}-${o.id}`, "aria-controls": idPainel,
    "aria-selected": String(o.id === atual), tabindex: o.id === atual ? "0" : "-1", dataset: { modo: o.id }
  }, o.texto));
  const seletor = h("div.seletor.praticas-seletor", { role: "tablist", "aria-label": "Mostrar as práticas" }, ...abas);
  const painel = h("div.praticas-painel", { id: idPainel, role: "tabpanel", "aria-labelledby": `${idPainel}-${atual}` });

  const escolher = (modo, { focar = false } = {}) => {
    if (modo === atual) return;
    atual = modo;
    abas.forEach((b) => {
      const sim = b.dataset.modo === modo;
      b.setAttribute("aria-selected", String(sim));
      b.tabIndex = sim ? 0 : -1;
      if (sim && focar) b.focus();
    });
    painel.setAttribute("aria-labelledby", `${idPainel}-${modo}`);
    alterar((e) => { e.ajustes.praticasPor = modo; });
    desenharPainel({ trocando: true });
  };
  abas.forEach((b, i) => {
    b.addEventListener("click", () => escolher(b.dataset.modo));
    b.addEventListener("keydown", (ev) => {
      const passo = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
      if (ev.key === "Home" || ev.key === "End") {
        ev.preventDefault();
        escolher(opcoes[ev.key === "Home" ? 0 : opcoes.length - 1].id, { focar: true });
        return;
      }
      if (!passo) return;
      ev.preventDefault();
      escolher(opcoes[(i + passo + opcoes.length) % opcoes.length].id, { focar: true });
    });
  });

  function desenharPainel({ trocando = false } = {}) {
    painel.replaceChildren(grupoDasFerramentas(), ...(atual === "dimensao" ? gruposPorDimensao() : gruposPorEstado()));
    if (trocando) {
      painel.classList.remove("trocando");
      void painel.offsetWidth;
      painel.classList.add("trocando");
    }
  }

  raiz.append(
    h("h1.titulo.praticas-titulo", { id: idTitulo }, "Práticas"),
    h("p.texto.praticas-linha", null, "Todas cabem num dia cheio, e cada uma tem versão de 1 minuto."),
    seletor,
    painel
  );
  desenharPainel();
  el.append(raiz);

  return {
    destruir() { document.documentElement.classList.remove("casa-titulo-na-tela"); }
  };
}

function grupoDasFerramentas() {
  const id = idUnico("ferramentas");
  return h("section.praticas-grupo.praticas-ferramentas", { "aria-labelledby": id },
    h("h2.rotulo.praticas-grupo-rotulo", { id }, "FERRAMENTAS"),
    h("ul.praticas-lista", null, ...FERRAMENTAS_DA_LISTA.map((f) => h("li", null,
      h("a.cartao.praticas-cartao", { href: f.rota },
        h("span.praticas-cartao-icone", { "aria-hidden": "true" }, iconeEl(f.icone, { tamanho: 26 })),
        h("span.praticas-cartao-corpo", null,
          h("span.praticas-cartao-titulo", null, f.id === "RESP" ? RESP.titulo : ferramenta(f.id)?.titulo ?? ""),
          h("span.praticas-cartao-oque", null, f.texto)))))));
}

function gruposPorEstado() {
  return GRUPOS_POR_ESTADO.map((g) => {
    const ids = [2, 5, 10].flatMap((t) => MATRIZ[`${g.id}-${t}`] ?? []);
    const praticas = ids.map((id) => PRATICAS.find((p) => p.id === id)).filter(Boolean);
    return grupo(g.nome, null, praticas);
  });
}

function gruposPorDimensao() {
  return DIMENSOES.map((d) => {
    const praticas = PRATICAS.filter((p) => p.dimensao === d.id)
      .sort((a, b) => a.tempo - b.tempo || a.id.localeCompare(b.id));
    return grupo(d.nome, d.id, praticas);
  });
}

function grupo(nome, icone, praticas) {
  const id = idUnico("grupo");
  return h("section.praticas-grupo", { "aria-labelledby": id },
    h("h2.praticas-grupo-titulo", { id },
      icone ? h("span.praticas-grupo-icone", { "aria-hidden": "true" }, iconeEl(icone, { tamanho: 24 })) : null,
      h("span", null, nome)),
    h("ul.praticas-lista", null, ...praticas.map((p) => h("li", null, cartaoDaPratica(p)))));
}

function cartaoDaPratica(p) {
  return h("a.cartao.praticas-cartao", { href: `#/praticas/${p.id}` },
    h("span.praticas-cartao-icone", { "aria-hidden": "true" }, iconeEl(p.dimensao, { tamanho: 26 })),
    h("span.praticas-cartao-corpo", null,
      h("span.praticas-cartao-titulo", null, p.titulo),
      h("span.visivel-leitor", null, `. ${nomeDaDimensao(p.dimensao) ?? ""}. `),
      h("span.praticas-cartao-tempo", null, `${p.tempo} min · mínima ${p.minimaMin ?? 1} min`),
      h("span.visivel-leitor", null, ". "),
      h("span.praticas-cartao-oque", null, p.oQueE)));
}

// ---------------------------------------------------------------- Respirar comigo, a ferramenta

function montarRespirar(el, ctx) {
  const destino = destinoDoRespirar(ctx);
  const inicio = isoLocal(agora());
  const idTitulo = idUnico("respirar");
  const respiracao = criarRespiracao({ padrao: "simples", puxa: RESP.puxa, solta: RESP.solta, palavras: RESP.palavras });
  let proximoMinuto = RESP.segundos * 1000;
  let acabou = false;
  let pausado = false;
  let quadro = 0;
  let tirarVolta = null;

  const apoio = h("p.apoio.praticas-resp-apoio", { "aria-live": "polite" }, RESP.apoio);
  const maisUm = botaoPrincipal(RESP.maisUmMinuto, () => {
    escolhas.classList.remove("visivel");
    proximoMinuto += RESP.segundos * 1000;
    document.getElementById(idTitulo)?.focus({ preventScroll: true });
  });
  const jaEstaBom = botaoLink(RESP.jaEstaBom, () => terminar());
  const escolhas = h("div.praticas-resp-escolhas", null, maisUm, jaEstaBom);
  const centro = h("div.praticas-resp-centro", null, respiracao.el, apoio, escolhas);
  // O véu de pausa é o mesmo do tocador: a saída para o limite continua a um toque (princípio 2).
  const continuar = botaoPrincipal("Continuar", () => retomar());
  const veu = h("div.veu-pausa.praticas-resp-veu", { hidden: true, role: "group", "aria-label": "Pausado." },
    h("p.titulo", { role: "status" }, "Pausado."),
    continuar,
    botaoLink("Estou no limite", () => abrirLimite()),
    botaoLink("Encerrar", () => encerrar()));
  const raiz = h("div.coluna.praticas-resp",
    h("h1.visivel-leitor", { id: idTitulo, tabindex: "-1" }, RESP.titulo),
    centro, veu);
  el.append(raiz);

  ctx.moldura({ aoEsquerda: () => encerrar() });

  // O Voltar do aparelho e o Esc fazem o mesmo que o "×".
  const segurar = () => {
    if (tirarVolta) return;
    tirarVolta = empilharVolta((motivo) => {
      tirarVolta = null;
      if (motivo !== "navegar") encerrar();
    });
  };
  const soltarVolta = () => { const t = tirarVolta; tirarVolta = null; return t?.(); };
  segurar();

  // Ao abrir o limite, a respiração pausa; ao fechar, o véu de pausa espera o "Continuar".
  const pararDeOuvir = aoAbrirLimite(() => pausar());

  const vigiar = () => {
    if (acabou) return;
    const t = respiracao.tempo();
    if (t > RESP.apoioSegundos * 1000 && apoio.textContent) apoio.textContent = "";
    if (t >= proximoMinuto && !escolhas.classList.contains("visivel")) escolhas.classList.add("visivel");
    quadro = requestAnimationFrame(vigiar);
  };

  function pausar() {
    if (acabou || pausado) return;
    pausado = true;
    respiracao.pausar();
    raiz.classList.add("pausado");
    veu.hidden = false;
    requestAnimationFrame(() => veu.classList.add("visivel"));
  }

  function retomar() {
    if (acabou || !pausado) return;
    pausado = false;
    respiracao.continuar();
    raiz.classList.remove("pausado");
    veu.classList.remove("visivel");
    setTimeout(() => { if (!pausado) veu.hidden = true; }, 200);
    document.getElementById(idTitulo)?.focus({ preventScroll: true });
  }

  function aoTeclar(ev) {
    if (ev.key !== " " || ev.repeat || acabou) return;
    if (ev.target.closest?.("button, a, input, textarea")) return;
    if (document.getElementById("app")?.inert) return;
    ev.preventDefault();
    if (pausado) retomar();
    else pausar();
  }
  document.addEventListener("keydown", aoTeclar, { signal: ctx.sinal });

  function encerrar() {
    if (acabou) return;
    if (respiracao.tempo() >= 60 * 1000) { terminar(); return; }
    acabou = true;
    cancelAnimationFrame(quadro);
    respiracao.destruir();
    soltarVolta();
    voltarPara(destino);
  }

  async function terminar() {
    if (acabou) return;
    acabou = true;
    cancelAnimationFrame(quadro);
    respiracao.pausar();
    const segundos = Math.round(respiracao.tempo() / 1000);
    tocarSino(2);
    await soltarVolta();
    const resultado = registrarSessao({ praticaId: "RESP", origem: "praticas", versao: null, inicio, segundos });
    respiracao.destruir();
    try {
      const { seguirParaFecho } = await import("./pratica.js");
      if (ctx.sinal.aborted) return;
      seguirParaFecho(ctx, { resultado, destino });
    } catch (erro) {
      console.error(erro);
      voltarPara(destino);
    }
  }

  respiracao.tocar();
  tocarSino(1);
  quadro = requestAnimationFrame(vigiar);

  return {
    destruir() {
      acabou = true;
      cancelAnimationFrame(quadro);
      respiracao.destruir();
      pararDeOuvir();
      soltarVolta();
    }
  };
}
