// O fluxo da prática (T08 a T12): abertura, régua de antes, tocador, régua de depois, registro leve e fecho.
// Rotas: #/pratica/{id} (com ?v=minima, &de=hoje|trilha|praticas|experimento|limite e &medir=1|0)
// e #/praticas/{id} (T08 vindo da lista). Trata os dias da trilha (T1 a T7) do mesmo jeito que as práticas.
// Também exporta o registro (T11) e o fecho (T12) para os fluxos próprios (Descarregar, Experimento,
// Respirar comigo): seguirParaRegistro(ctx, ...) e seguirParaFecho(ctx, ...).
// Os modos "so=cuidado" (passos 3 a 5 do Dia 6) e "so=fazbem" (passos 3 e 4 do Dia 5) mudam o cuidado
// possível e a lista do que faz bem sem contar como dia da trilha (o "Mudar" de Hoje e o caderno).

import {
  h, svg, botaoPrincipal, botaoLink, seletor, chave, iconeEl, desenhos,
  abrirFolha, avisoCurto, empilharVolta, idUnico
} from "../ui.js";
import { estado, alterar } from "../estado.js";
import { agora, isoLocal } from "../dia.js";
import { registrarSessao, atualizarSessao, gravarDiaDaTrilha, checkinRecente, sugestaoPorDimensao } from "../regras.js";
import { PRATICAS, pratica as praticaPorId, nomeDaDimensao, idDaDimensao, preencher, chavesDe } from "../conteudo/praticas.js";
import { diaDaTrilha } from "../conteudo/trilha.js";
import { REGISTRO, FLOR, TEMPO, resultadoDaMedicao } from "../conteudo/textos.js";
import { criarTocador } from "../tocador.js";
import { criarRegua } from "../ferramentas/regua.js";
import { aoAbrirLimite, abrirLimite, voltarPara, navegar } from "../app.js";

/** Para onde o "Concluir" volta, pela origem (de). */
const ORIGENS = { hoje: "#/hoje", trilha: "#/trilha", praticas: "#/praticas", experimento: "#/hoje", limite: "#/hoje" };

function conteudoDe(id) {
  if (/^T[1-7]$/.test(id)) return diaDaTrilha(id);
  return praticaPorId(id);
}

export function moldura(ctx) {
  const daLista = ctx.caminho.startsWith("praticas/");
  const de = ctx.query.de || (daLista ? "praticas" : "hoje");
  return {
    aba: null,
    navegacao: de === "trilha" ? "trilha" : de === "praticas" ? "praticas" : "hoje",
    barra: "interna",
    esquerda: "voltar",
    limite: "icone",
    pai: daLista ? "#/praticas" : ORIGENS[ctx.query.de] ?? "#/hoje"
  };
}

export async function montar(el, ctx) {
  const id = ctx.params.id;
  const conteudo = conteudoDe(id);
  if (!conteudo) {
    ctx.navegar("#/hoje", { substituir: true });
    return {};
  }
  const ehTrilha = /^T[1-7]$/.test(id);
  const daLista = ctx.caminho.startsWith("praticas/");
  if (ctx.query.so === "cuidado" || ctx.query.so === "fazbem") return montarEdicao(ctx, conteudo, ctx.query.so);
  if (ehTrilha && !ctx.query.de) {
    ctx.navegar(`#/trilha/${conteudo.n}`, { substituir: true });
    return {};
  }

  const de = ctx.query.de || (daLista ? "praticas" : null);
  const f = {
    ctx,
    conteudo,
    id,
    ehTrilha,
    de,
    origemDaSessao: de ?? "praticas",
    destino: ORIGENS[de] ?? "#/hoje",
    versao: ctx.query.v === "minima" ? "minima" : "completa",
    medir: ctx.query.medir === "1" ? true : ctx.query.medir === "0" ? false : null,
    checkin: de === "hoje" ? checkinRecente() : null,
    antes: null,
    inicio: null,
    tocador: null,
    resultado: null,
    respostas: {},
    diaGravado: null,
    limpezas: []
  };

  if (daLista || !de) telaAbertura(f, { daLista });
  else comecar(f);

  return {
    destruir() {
      f.tocador?.destruir();
      f.limpezas.forEach((fn) => { try { fn(); } catch { /* nada */ } });
    }
  };
}

// ---------------------------------------------------------------- T08 · Abertura da prática

function rotuloDaDimensao(conteudo, minutos) {
  const nome = conteudo.dimensao ? nomeDaDimensao(conteudo.dimensao) : "Trilha";
  return `${String(nome).toLocaleUpperCase("pt-BR")} · ${minutos} MIN`;
}

function telaAbertura(f, { daLista }) {
  const { ctx, conteudo: p } = f;
  ctx.moldura({ esquerda: "voltar", limite: "icone", foco: false, aoEsquerda: null });
  ctx.trocar((q) => {
    const idPorque = idUnico("porque");
    const medir = chave({
      rotulo: "Medir a tensão antes e depois",
      ligada: Boolean(estado.ajustes.medir),
      aoMudar: (v) => alterar((e) => { e.ajustes.medir = v; })
    });
    const versao = seletor({
      rotulo: "Versão",
      valor: f.versao,
      opcoes: [
        { valor: "completa", texto: `Completa · ${p.tempo} min` },
        { valor: "minima", texto: `Mínima · ${p.minimaMin ?? 1} min` }
      ],
      aoMudar: (v) => { f.versao = v; }
    });
    const comecarAgora = () => {
      const m = medir.botao.getAttribute("aria-checked") === "true";
      if (daLista) {
        ctx.navegar(`#/pratica/${p.id}?de=praticas&v=${f.versao}&medir=${m ? 1 : 0}`);
      } else {
        f.medir = m;
        comecar(f);
      }
    };
    q.append(h("div.coluna.abertura-pratica",
      h("p.rotulo.cartao-pratica-dim", null,
        p.dimensao ? iconeEl(p.dimensao, { tamanho: 18 }) : null,
        h("span", null, rotuloDaDimensao(p, p.tempo))),
      h("h1.titulo", null, p.titulo),
      h("p.lede", null, p.oQueE ?? p.linha ?? ""),
      p.precisaDe ? h("p.abertura-precisa", null, `Você vai precisar de: ${p.precisaDe}`) : null,
      p.aviso ? h("p.abertura-aviso", null, p.aviso) : null,
      h("div.abertura-versao", null, versao),
      h("section.bloco-papel.abertura-porque", { "aria-labelledby": idPorque },
        h("p.rotulo", { id: idPorque }, "POR QUE FUNCIONA"),
        h("p", null, p.porque)),
      h("div.abertura-medir", null, medir),
      h("div.abertura-comecar", null, botaoPrincipal("Começar", comecarAgora))
    ));
  });
}

// ---------------------------------------------------------------- começar: pergunta do Dia 1, régua e tocador

function comecar(f) {
  const ehDia1 = f.ehTrilha && f.conteudo.n === 1;
  if (f.medir === null && ehDia1 && f.conteudo.perguntaAntes) {
    telaPerguntaMedir(f);
    return;
  }
  const medir = f.medir ?? Boolean(estado.ajustes.medir);
  if (medir) telaReguaAntes(f);
  else telaTocador(f);
}

function telaPerguntaMedir(f) {
  const { ctx } = f;
  const t = f.conteudo.perguntaAntes;
  ctx.moldura({ esquerda: "voltar", limite: "icone", foco: false, aoEsquerda: null });
  ctx.trocar((q) => {
    q.append(h("div.coluna.medir-pergunta",
      h("p.rotulo", null, `DIA 1 · ${String(f.conteudo.titulo).toLocaleUpperCase("pt-BR")}`),
      h("h1.titulo", null, t.texto),
      h("div.botoes", null,
        botaoPrincipal(t.sim, () => { f.medir = true; telaReguaAntes(f); }),
        h("button.botao-secundario.botao-largo", { type: "button", onclick: () => { f.medir = false; telaTocador(f); } }, t.nao))
    ));
  });
}

// ---------------------------------------------------------------- T09 · Régua de 0 a 10

function telaReguaAntes(f) {
  const { ctx } = f;
  ctx.moldura({ esquerda: "voltar", limite: "icone", foco: false, aoEsquerda: null });
  ctx.trocar((q) => {
    const numero = h("p.numero.regua-numero", { "aria-hidden": "true" }, "·");
    const apoio = h("p.apoio.regua-apoio", null, "Toque na régua");
    let seguir;
    const regua = criarRegua({
      valor: null,
      aoMudar: (v) => {
        numero.textContent = String(v);
        apoio.textContent = "";
        seguir.disabled = false;
      }
    });
    const idPergunta = idUnico("pergunta");
    seguir = botaoPrincipal("Seguir", () => { f.antes = regua.valor(); telaTocador(f); }, { disabled: true });
    q.append(h("div.coluna.regua-tela",
      h("p.rotulo", null, "ANTES"),
      h("h1.titulo", { id: idPergunta }, "Quanta tensão você sente agora?"),
      numero, apoio, regua.el,
      h("div.regua-acoes", null, seguir,
        botaoLink("Pular a medida", () => { f.antes = null; telaTocador(f); }))
    ));
    regua.input.setAttribute("aria-labelledby", idPergunta);
  });
}

function telaReguaDepois(f) {
  const { ctx } = f;
  ctx.moldura({ esquerda: null, limite: "icone", foco: false, aoEsquerda: null });
  const irAoRegistro = () => {
    soltar();
    seguirParaRegistro(ctx, { resultado: f.resultado, frase: fraseDeFecho(f), destino: f.destino, links: linksDoFecho(f) });
  };
  const soltar = segurarVolta(f, irAoRegistro);
  ctx.trocar((q) => {
    const antes = f.antes;
    const numero = h("p.numero.regua-numero", { "aria-hidden": "true" }, String(antes));
    const apoio = h("p.apoio.regua-apoio", null, `antes: ${antes}`);
    const regua = criarRegua({ valor: antes, fantasma: antes, aoMudar: (v) => { numero.textContent = String(v); } });
    const idPergunta = idUnico("pergunta");
    const resultado = h("div.regua-resultado", { "aria-live": "polite" });
    const acoes = h("div.regua-acoes");
    const verResultado = () => {
      const depois = regua.valor();
      marcarDepois(f, depois);
      const r = resultadoDaMedicao(antes, depois, { minuto: false });
      // replaceChildren, como o append do DOM, escreveria "null": o apoio que falta sai da lista.
      resultado.replaceChildren(...[
        h("div.regua-par", { "aria-hidden": "true" }, ...desenharPar(antes, depois)),
        h("p.lede-display", null, r.texto),
        r.apoio ? h("p.texto", null, r.apoio) : null
      ].filter(Boolean));
      acoes.replaceChildren(botaoPrincipal("Seguir", irAoRegistro));
    };
    acoes.append(botaoPrincipal("Ver resultado", verResultado), botaoLink("Pular a medida", irAoRegistro));
    q.append(h("div.coluna.regua-tela",
      h("p.rotulo", null, "DEPOIS"),
      h("h1.titulo", { id: idPergunta }, "E agora, quanta tensão?"),
      numero, apoio, regua.el, resultado, acoes));
    regua.input.setAttribute("aria-labelledby", idPergunta);
  });
}

/** Grava o "depois" na sessão e, no Dia 1 (que guarda antes e depois), no dia da trilha. */
function marcarDepois(f, depois) {
  const sessaoId = f.resultado.sessao.id;
  atualizarSessao(sessaoId, { depois });
  const n = f.diaGravado;
  if (!n || !(diaDaTrilha(n)?.guarda ?? []).includes("depois")) return;
  alterar((e) => {
    const d = e.trilha.dias[n];
    if (d && d.sessaoId === sessaoId) d.respostas = { ...(d.respostas ?? {}), antes: f.antes, depois };
  }, { agora: true });
}

/** A régua mínima do resultado: o antes em anel, o depois em ponto cheio, ligados por um traço. */
export function desenharPar(antes, depois) {
  const pos = (v) => `calc(6px + (100% - 12px) * ${v / 10})`;
  const menor = Math.min(antes, depois);
  const maior = Math.max(antes, depois);
  return [
    h("span.regua-par-linha"),
    h("span.regua-par-liga", { style: `left: ${pos(menor)}; width: calc((100% - 12px) * ${(maior - menor) / 10})` }),
    h("span.regua-par-antes", { style: `left: ${pos(antes)}` }),
    h("span.regua-par-depois", { style: `left: ${pos(depois)}` })
  ];
}

// ---------------------------------------------------------------- T10 · Tocador

function telaTocador(f) {
  const { ctx, conteudo } = f;
  const tempoDoCheckin = f.checkin?.tempo ?? null;
  const passoAberto = f.ehTrilha && f.versao === "completa" && tempoDoCheckin === 10 ? TEMPO.passoAberto : null;
  f.inicio = isoLocal(agora());
  let segundosAntes = 0;

  const criar = (versao, { semAbertura = false } = {}) => criarTocador({
    pratica: conteudo,
    versao,
    passoAberto: versao === "completa" ? passoAberto : null,
    semAbertura,
    aoTerminar: ({ segundos, respostas }) => terminou(f, { segundos: segundos + segundosAntes, respostas, completa: true }),
    aoEncerrar: () => abrirParar(),
    aoLimite: () => abrirLimite()
  });

  ctx.moldura({ esquerda: "fechar", rotuloEsquerda: "Encerrar", limite: "pilula", foco: true, aoEsquerda: () => abrirParar() });

  // O Voltar do aparelho e o Esc, dentro do tocador, abrem "Quer parar aqui?" (2.2).
  let tirarVolta = null;
  const segurar = () => {
    if (tirarVolta) return;
    tirarVolta = empilharVolta((motivo) => {
      tirarVolta = null;
      if (motivo !== "navegar") abrirParar();
    });
  };
  const soltarVolta = () => { const t = tirarVolta; tirarVolta = null; t?.(); };
  f.soltarVolta = soltarVolta;
  f.limpezas.push(soltarVolta);
  f.limpezas.push(aoAbrirLimite(() => f.tocador?.pausar()));

  let folhaAberta = null;
  function abrirParar() {
    if (folhaAberta || !f.tocador) return;
    const estavaPausado = f.tocador.estaPausado();
    f.tocador.pausar({ semVeu: true });
    const segundos = f.tocador.segundos() + segundosAntes;
    const jaConta = segundos >= 60;
    let decidiu = false;
    folhaAberta = abrirFolha({
      titulo: "Quer parar aqui?",
      conteudo(corpo, folha) {
        corpo.append(h("p.texto", null, jaConta ? "O que você fez já conta." : "Tudo bem parar. Se quiser, a versão mínima leva 1 minuto."));
        const botoes = h("div.folha-botoes");
        botoes.append(h("button.botao-secundario", {
          type: "button",
          onclick: () => {
            decidiu = true;
            folha.fechar();
            const parado = f.tocador.parar();
            soltarVolta();
            if (jaConta) terminou(f, { segundos: parado.segundos + segundosAntes, respostas: parado.respostas, completa: false });
            else voltarPara(f.destino);
          }
        }, "Parar"));
        if (!jaConta && f.versao !== "minima" && (conteudo.minima ?? []).length) {
          botoes.append(h("button.botao-secundario", {
            type: "button",
            onclick: () => {
              decidiu = true;
              folha.fechar();
              const parado = f.tocador.parar();
              segundosAntes += parado.segundos;
              f.tocador.destruir();
              f.versao = "minima";
              f.tocador = criar("minima", { semAbertura: true });
              ctx.trocar((q) => { q.append(f.tocador.el); f.tocador.iniciar(); }, { focar: false });
              segurar();
            }
          }, "Fazer a mínima"));
        }
        botoes.append(botaoPrincipal("Continuar", () => folha.fechar()));
        corpo.append(botoes);
      },
      aoFechar() {
        folhaAberta = null;
        if (decidiu) return;
        if (!estavaPausado) f.tocador?.continuar();
        segurar();
      }
    });
  }

  f.tocador = criar(f.versao);
  ctx.trocar((q) => {
    q.append(f.tocador.el);
    f.tocador.iniciar();
  }, { focar: false });
  segurar();
}

// ---------------------------------------------------------------- o fim da prática: gravar na hora (7.4)

function terminou(f, { segundos, respostas, completa }) {
  const { conteudo } = f;
  f.respostas = respostas;
  f.soltarVolta?.();
  f.resultado = registrarSessao({
    praticaId: f.id,
    origem: f.origemDaSessao,
    versao: completa ? f.versao : "interrompida",
    inicio: f.inicio,
    segundos,
    checkinId: f.checkin?.id ?? null,
    antes: f.antes,
    depois: null,
    respostas: { ...respostas }
  });
  const fazBem = coletarFazBem(conteudo, f.versao, respostas);
  if (f.ehTrilha && completa) {
    // 7.6: o dia guarda a palavra e as respostas de "guarda"; o Dia 5 também vai para fazBem e o Dia 6 vira cuidadoPossivel.
    const todas = { ...respostas, antes: f.antes, depois: null };
    const guardadas = {};
    for (const k of conteudo.guarda ?? []) if (todas[k] !== undefined && todas[k] !== null) guardadas[k] = todas[k];
    gravarDiaDaTrilha({
      n: conteudo.n,
      sessao: f.resultado.sessao,
      versao: f.versao,
      palavra: respostas[conteudo.palavra] ?? null,
      respostas: guardadas,
      fazBem,
      cuidadoPossivel: conteudo.n === 6 ? { gesto: respostas.gesto, momento: respostas.momento, minima: respostas.minima } : null
    });
    f.diaGravado = conteudo.n;
  } else if (fazBem && completa) {
    aplicarFazBem(fazBem);
  }
  const mediuAntes = f.antes !== null && f.antes !== undefined;
  if (mediuAntes && completa) telaReguaDepois(f);
  else seguirParaRegistro(f.ctx, { resultado: f.resultado, frase: fraseDeFecho(f), destino: f.destino, links: linksDoFecho(f) });
}

/** As respostas que vão para fazBem: os passos com vaiPara e a caixa de marcar de P06 (guardaEm). */
function coletarFazBem(conteudo, versao, respostas) {
  const fb = {};
  for (const p of conteudo[versao] ?? []) {
    const alvos = [];
    if (p.vaiPara) alvos.push([p.vaiPara, respostas[p.chave]]);
    for (const c of p.campos ?? []) if (c.vaiPara) alvos.push([c.vaiPara, respostas[c.chave]]);
    if (p.marcar?.guardaEm && respostas[p.marcar.chave]) alvos.push([p.marcar.guardaEm, respostas.musica]);
    for (const [alvo, valor] of alvos) {
      if (valor === undefined || valor === null || valor === "" || (Array.isArray(valor) && !valor.length)) continue;
      const campo = alvo.split(".")[1];
      if (campo === "coisas") fb.coisas = Array.isArray(valor) ? valor : [valor];
      else fb[campo] = Array.isArray(valor) ? valor.join(", ") : valor;
    }
  }
  return Object.keys(fb).length ? fb : null;
}

function aplicarFazBem(fb) {
  alterar((e) => {
    if (fb.coisas?.length) e.fazBem.coisas = [...fb.coisas];
    if (fb.musica) e.fazBem.musica = fb.musica;
    if (fb.frase) e.fazBem.frase = fb.frase;
  }, { agora: true });
}

const copiar = (v) => (Array.isArray(v) ? [...v] : v ?? null);

/** O fim do "Editar" do que faz bem: cada passo com vaiPara troca o seu campo; campo apagado fica vazio. */
function aplicarEdicaoDoFazBem(passos, respostas) {
  const alvos = [];
  for (const p of passos) {
    if (p.vaiPara?.startsWith("fazBem.") && p.chave) alvos.push([p.vaiPara.split(".")[1], p.chave]);
    for (const c of p.campos ?? []) if (c.vaiPara?.startsWith("fazBem.") && c.chave) alvos.push([c.vaiPara.split(".")[1], c.chave]);
  }
  alterar((e) => {
    for (const [campo, chave] of alvos) {
      if (!(chave in respostas)) continue;
      const v = respostas[chave];
      if (campo === "coisas") {
        const lista = Array.isArray(v) ? v : v ? [v] : [];
        if (lista.length) e.fazBem.coisas = [...lista];
      } else {
        e.fazBem[campo] = typeof v === "string" && v.trim() ? v.trim() : null;
      }
    }
  }, { agora: true });
}

function fraseDeFecho(f) {
  const tom = estado.ajustes.tom === "espiritual" ? "espiritual" : "pratico";
  return f.conteudo.tom?.[tom]?.fecha ?? null;
}

/** Os links do fecho (linksNoFecho): só os que valem para as respostas, com as {chaves} trocadas. */
function linksDoFecho(f) {
  const r = f.respostas ?? {};
  const lista = [];
  for (const l of f.conteudo.linksNoFecho ?? []) {
    if (l.se) {
      const vale = (l.se.chaves ?? []).some((k) => {
        const v = r[k];
        return Array.isArray(v) ? v.includes(l.se.valor) : v === l.se.valor;
      });
      if (!vale) continue;
    }
    const valores = { ...r };
    const precisa = [...chavesDe(l.texto), ...chavesDe(l.destino)];
    if (precisa.includes("pratica") || precisa.includes("praticaId")) {
      const id = idDaDimensao(r.dimensao) ?? r.dimensao;
      const s = id ? sugestaoPorDimensao(id, PRATICAS) : null;
      if (!s) continue;
      valores.pratica = s.titulo;
      valores.praticaId = s.id;
    }
    lista.push({ texto: preencher(l.texto, valores), destino: preencher(l.destino, valores) });
  }
  return lista;
}

/** Segura o Voltar e o Esc numa tela de fim: em vez de voltar, segue (fn). Devolve a função de soltar. */
function segurarVolta(f, fn) {
  let tirar = empilharVolta((motivo) => { tirar = null; if (motivo !== "navegar") fn(); });
  const soltar = () => { const t = tirar; tirar = null; t?.(); };
  f.limpezas.push(soltar);
  return soltar;
}

// ---------------------------------------------------------------- T11 · Registro leve

/**
 * O registro leve (T11) e depois o fecho (T12), na tela de quem chama.
 * resultado: o que registrarSessao devolveu. frase: a frase de fecho (ou null). destino: para onde o
 * "Concluir" volta. links: [{ texto, destino }] oferecidos no fecho.
 */
export function seguirParaRegistro(ctx, { resultado, frase = null, destino = "#/hoje", links = [] }) {
  ctx.moldura({ esquerda: null, limite: "icone", foco: false, aoEsquerda: null, barra: "interna" });
  const sessao = resultado.sessao;
  let sinal = null;
  let tirar = null;
  const soltar = () => { const t = tirar; tirar = null; t?.(); };
  const irParaFecho = () => {
    soltar();
    seguirParaFecho(ctx, { resultado, frase, destino, links });
  };
  ctx.trocar((q) => {
    const idPergunta = idUnico("registro");
    const sinais = h("div.registro-sinais", { role: "radiogroup", "aria-labelledby": idPergunta });
    const botoes = REGISTRO.sinais.map((s) => {
      const b = h("button.sinal", { type: "button", role: "radio", "aria-checked": "false", "aria-label": s.nome, dataset: { sinal: s.id } },
        h("span.sinal-desenho", { "aria-hidden": "true" }, iconeEl(s.icone, { tamanho: 28 })),
        h("span.sinal-nome", { "aria-hidden": "true" }, s.nome));
      b.addEventListener("click", () => {
        sinal = sinal === s.id ? null : s.id;
        for (const x of botoes) x.setAttribute("aria-checked", String(x.dataset.sinal === sinal));
        atualizarTab();
      });
      return b;
    });
    const atualizarTab = () => {
      const alvo = botoes.find((b) => b.getAttribute("aria-checked") === "true") ?? botoes[0];
      botoes.forEach((b) => { b.tabIndex = b === alvo ? 0 : -1; });
    };
    sinais.append(...botoes);
    sinais.addEventListener("keydown", (ev) => {
      const passo = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0;
      if (!passo) return;
      const i = botoes.indexOf(document.activeElement);
      if (i === -1) return;
      ev.preventDefault();
      botoes[(i + passo + botoes.length) % botoes.length].focus();
    });
    atualizarTab();
    const idCampo = idUnico("linha");
    const max = REGISTRO.maxCaracteres;
    const contador = h("span.contador", { hidden: true });
    const aviso = h("span.visivel-leitor", { "aria-live": "polite" });
    const campo = h("input.campo", { id: idCampo, type: "text", maxlength: String(max), autocomplete: "off", enterkeyhint: "done" });
    campo.addEventListener("input", () => {
      const n = campo.value.length;
      contador.hidden = n === 0;
      contador.textContent = `${n} de ${max}`;
      aviso.textContent = n >= max ? `${n} de ${max}` : "";
    });
    const guardar = () => {
      const linha = campo.value.trim();
      if (sinal || linha) atualizarSessao(sessao.id, { registro: { sinal, linha: linha || null } });
      irParaFecho();
    };
    campo.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.isComposing) { ev.preventDefault(); guardar(); } });
    q.append(h("div.coluna.registro",
      h("h1.titulo", { id: idPergunta }, REGISTRO.pergunta),
      sinais,
      h("div.registro-linha", null,
        h("label.rotulo-campo", { for: idCampo }, REGISTRO.campo),
        campo, contador, aviso),
      h("div.registro-acoes", null,
        botaoPrincipal(REGISTRO.guardar, guardar),
        botaoLink(REGISTRO.pular, () => irParaFecho()))
    ));
  });
  tirar = empilharVolta((motivo) => { tirar = null; if (motivo !== "navegar") seguirParaFecho(ctx, { resultado, frase, destino, links }); });
  ctx.sinal.addEventListener("abort", soltar);
}

// ---------------------------------------------------------------- T12 · Fecho

/**
 * O fecho com a flor (T12), na tela de quem chama. A tela não volta sozinha.
 * Se a flor cresceu com esta sessão, o traço novo se desenha em cobre (e ela acorda antes, se descansava).
 * Se já houve outro cuidado hoje: o aviso curto "Guardado na sua semana." e a flor parada.
 */
export function seguirParaFecho(ctx, { resultado, frase = null, destino = "#/hoje", links = [] }) {
  ctx.moldura({ esquerda: null, limite: "icone", foco: false, aoEsquerda: null, barra: "interna" });
  const { cresceu, acordou, florDepois } = resultado;
  const estagio = florDepois.estagio;
  let tirar = null;
  const soltar = () => { const t = tirar; tirar = null; t?.(); };
  const concluir = () => { soltar(); voltarPara(destino); };
  ctx.trocar((q) => {
    const rotulo = desenhos.rotuloDaFlor({ estagio, descansa: false, cresceuHoje: true }) || `Sua flor: ${FLOR.nomes?.[estagio] ?? ""}.`;
    const animacao = cresceu ? (acordou ? "acordar" : "crescer") : null;
    const florEl = svg(desenhos.florSVG({ estagio, descansa: false, cresceuHoje: true, animacao, altura: 180, rotulo }));
    const textos = [];
    if (frase) textos.push(h("h1.lede-display.fecho-frase", null, frase));
    if (cresceu && acordou) textos.push(h("p.fecho-acordou", null, FLOR.acordou));
    if (cresceu && FLOR.frasesDoEstagio?.[estagio]) textos.push(h("p.texto.fecho-estagio", null, FLOR.frasesDoEstagio[estagio]));
    q.append(h("div.coluna.fecho",
      frase ? null : h("h1.visivel-leitor", null, rotulo),
      h("div.fecho-flor", null, florEl),
      h("div.fecho-textos", { class: cresceu ? "fecho-texto-sereno" : "" }, ...textos),
      h("p.apoio.fecho-apoio", null, "Pode guardar o celular."),
      botaoPrincipal("Concluir", concluir),
      links.length ? h("div.fecho-links", null, ...links.map((l) => h("button.link", {
        type: "button",
        onclick: () => { soltar(); navegar(l.destino); }
      }, l.texto))) : null
    ));
  });
  if (!cresceu) setTimeout(() => avisoCurto("Guardado na sua semana."), 450);
  tirar = empilharVolta((motivo) => { tirar = null; if (motivo !== "navegar") voltarPara(destino); });
  ctx.sinal.addEventListener("abort", soltar);
}

// ---------------------------------------------------------------- mudar o cuidado possível e o que faz bem

function montarEdicao(ctx, conteudo, modo) {
  const faixa = modo === "cuidado" ? [2, 5] : [2, 4];
  const passos = (conteudo.completa ?? []).slice(faixa[0], faixa[1]);
  const pratica = { ...conteudo, completa: passos, minima: passos };
  const destino = ORIGENS[ctx.query.de] ?? (ctx.query.de === "caderno" ? `#/caderno/${modo === "cuidado" ? "cuidado" : "bem"}` : modo === "cuidado" ? "#/hoje" : "#/caderno/bem");
  // Os passos abrem com o que já está guardado (o "Mudar" de Hoje e o "Editar" do caderno).
  const inicial = {};
  if (modo === "cuidado" && estado.cuidadoPossivel) {
    inicial.gesto = estado.cuidadoPossivel.gesto;
    inicial.momento = estado.cuidadoPossivel.momento;
    inicial.minima = estado.cuidadoPossivel.minima;
  }
  if (modo === "fazbem") {
    const fb = estado.fazBem ?? {};
    for (const p of passos) {
      if (p.vaiPara?.startsWith("fazBem.") && p.chave) inicial[p.chave] = copiar(fb[p.vaiPara.split(".")[1]]);
      for (const c of p.campos ?? []) {
        if (c.vaiPara?.startsWith("fazBem.") && c.chave) inicial[c.chave] = copiar(fb[c.vaiPara.split(".")[1]]);
      }
    }
  }
  ctx.moldura({ esquerda: "fechar", rotuloEsquerda: "Fechar", limite: "pilula", foco: true, aoEsquerda: () => voltarPara(destino) });
  const tocador = criarTocador({
    pratica,
    versao: "completa",
    semAbertura: true,
    respostasIniciais: inicial,
    aoTerminar: ({ respostas }) => {
      if (modo === "cuidado") {
        if (respostas.gesto) {
          alterar((e) => {
            const antes = e.cuidadoPossivel ?? {};
            e.cuidadoPossivel = {
              gesto: respostas.gesto,
              momento: respostas.momento ?? null,
              minima: respostas.minima ?? null,
              desde: antes.desde ?? null,
              naTelaHoje: true
            };
          }, { agora: true });
        }
      } else {
        aplicarEdicaoDoFazBem(passos, respostas);
      }
      voltarPara(destino);
    },
    aoEncerrar: () => voltarPara(destino),
    aoLimite: () => abrirLimite()
  });
  ctx.trocar((q) => { q.append(tocador.el); tocador.iniciar(); }, { focar: false });
  const desligar = aoAbrirLimite(() => tocador.pausar());
  return {
    destruir() {
      tocador.destruir();
      desligar();
    }
  };
}
