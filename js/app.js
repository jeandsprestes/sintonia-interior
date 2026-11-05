// Início do app: estado, aparência, a moldura (barra do alto, abas, página esquerda do computador),
// as rotas por hash (2.3), a troca de tela (4.8), Voltar e Esc (2.2), o Estou no limite em toda tela,
// as faixas (dados não guardados, demonstração, versão nova) e o service worker.
// Como as telas se ligam a isto: js/LEIA.md.

import { iniciarEstado, estado, emDemo, podeGravar, aoMudar, alterar } from "./estado.js";
import { diaLogico, rotuloDoDia } from "./dia.js";
import { flor, legendaDaFlor } from "./regras.js";
import {
  h, svg, limpar, registrarDesenhos, desenhos, iconeEl, fecharTopo, desempilharTudo, limparPilha,
  algumModalAberto, temVoltaEmpilhada, avisoCurto, focarTitulo, trocar, abrirCamada, idUnico
} from "./ui.js";
import { prepararSom } from "./som.js";

// ---------------------------------------------------------------- rotas (2.3)

// A ordem importa: o primeiro padrão que bate vence ("trilha/caminho" antes de "trilha/:n").
// livre: abre mesmo antes das boas-vindas.
const ROTAS = [
  { padrao: "boas-vindas/:n", modulo: "./telas/boas-vindas.js", livre: true },
  { padrao: "hoje", modulo: "./telas/hoje.js" },
  { padrao: "hoje/tempo", modulo: "./telas/tempo.js" },
  { padrao: "hoje/passo", modulo: "./telas/passo.js" },
  { padrao: "pratica/:id", modulo: "./telas/pratica.js" },
  { padrao: "trilha", modulo: "./telas/trilha.js" },
  { padrao: "trilha/caminho", modulo: "./telas/caminho.js" },
  { padrao: "trilha/:n", modulo: "./telas/dia-da-trilha.js" },
  { padrao: "praticas", modulo: "./telas/praticas.js" },
  { padrao: "praticas/:id", modulo: "./telas/pratica.js" },
  { padrao: "semana", modulo: "./telas/semana.js" },
  { padrao: "semana/:segunda", modulo: "./telas/semana.js" },
  { padrao: "caderno", modulo: "./telas/caderno.js" },
  { padrao: "caderno/:lista", modulo: "./telas/caderno.js" },
  { padrao: "descarregar", modulo: "./telas/descarregar.js" },
  { padrao: "experimento", modulo: "./telas/experimento.js" },
  { padrao: "ajustes", modulo: "./telas/ajustes.js" },
  { padrao: "ajustes/dados", modulo: "./telas/dados.js" },
  { padrao: "ajustes/instalar", modulo: "./telas/instalar.js" },
  { padrao: "sobre", modulo: "./telas/sobre.js", livre: true },
  { padrao: "aviso", modulo: "./telas/aviso.js", livre: true },
  { padrao: "demonstracao", modulo: "./telas/demonstracao.js" }
];

const ABAS = [
  { id: "hoje", rota: "#/hoje", rotulo: "HOJE", nome: "Hoje" },
  { id: "trilha", rota: "#/trilha", rotulo: "TRILHA", nome: "Trilha" },
  { id: "praticas", rota: "#/praticas", rotulo: "PRÁTICAS", nome: "Práticas" },
  { id: "semana", rota: "#/semana", rotulo: "SEMANA", nome: "Semana" }
];

/** Lê o endereço: "#/pratica/P10?v=minima&de=hoje" vira { caminho: "pratica/P10", query: { v, de } }. */
export function lerEndereco(hash = location.hash) {
  const semCerquilha = hash.replace(/^#\/?/, "");
  const [caminho, busca = ""] = semCerquilha.split("?");
  const query = Object.fromEntries(new URLSearchParams(busca));
  return { caminho: caminho.replace(/\/+$/, ""), query };
}

function acharRota(caminho) {
  const partes = caminho.split("/").filter(Boolean);
  for (const def of ROTAS) {
    const p = def.padrao.split("/");
    if (p.length !== partes.length) continue;
    const params = {};
    let bate = true;
    for (let i = 0; i < p.length; i++) {
      if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(partes[i]);
      else if (p[i] !== partes[i]) { bate = false; break; }
    }
    if (bate) return { def, params };
  }
  return null;
}

// ---------------------------------------------------------------- histórico das telas

// Cada entrada de tela recebe history.state.tela = n. Assim "voltarPara" sabe quantas voltar.
let telaN = 0;
const visitadas = [];

function marcarEntrada() {
  const st = history.state ?? {};
  if (typeof st.tela === "number") {
    telaN = st.tela;
  } else {
    telaN = (visitadas.at(-1)?.n ?? 0) + 1;
    history.replaceState({ ...st, tela: telaN }, "", location.href);
  }
  const i = visitadas.findIndex((v) => v.n >= telaN);
  if (i !== -1) visitadas.splice(i);
  visitadas.push({ n: telaN, caminho: lerEndereco().caminho });
}

const mesmoCaminho = (a, b) => lerEndereco(a.startsWith("#") ? a : `#/${a}`).caminho === lerEndereco(b.startsWith("#") ? b : `#/${b}`).caminho;

let dadosDaProxima = null;

/**
 * Vai para uma rota ("#/hoje/tempo"). Fecha antes as folhas e camadas abertas.
 * substituir: troca a entrada do histórico em vez de criar outra.
 * dados: um objeto entregue à próxima tela em ctx.dados (por exemplo { pousar: true }).
 */
export async function navegar(rota, { substituir = false, dados = null } = {}) {
  const alvo = rota.startsWith("#") ? rota : `#/${rota.replace(/^\/+/, "")}`;
  const { caminho } = lerEndereco(alvo);
  if (caminho === "limite" || caminho.startsWith("limite/")) {
    // O limite é uma camada: abre por cima do que estiver aberto, sem mudar de tela.
    abrirLimite({ sub: caminho.split("/")[1] ?? null });
    return;
  }
  await desempilharTudo();
  dadosDaProxima = dados;
  if (alvo === location.hash) {
    rotear({ forcar: true });
    return;
  }
  if (substituir) {
    history.replaceState({ tela: telaN }, "", alvo);
    rotear({ forcar: true, mesmaEntrada: true });
  } else {
    location.hash = alvo;
  }
}

/** Volta uma tela ("‹"). Sem tela anterior no app, vai para o pai da tela atual. */
export async function voltar() {
  await desempilharTudo();
  const anterior = visitadas.find((v) => v.n === telaN - 1);
  if (anterior) history.back();
  else navegar(molduraAtual?.pai ?? "#/hoje", { substituir: true });
}

/** Volta até a última entrada com aquela rota (a origem de uma prática); sem ela, substitui. */
export async function voltarPara(rota) {
  await desempilharTudo();
  const alvo = [...visitadas].reverse().find((v) => v.n < telaN && mesmoCaminho(`#/${v.caminho}`, rota));
  if (alvo) history.go(alvo.n - telaN);
  else navegar(rota, { substituir: true });
}

export const rotaAtual = () => lerEndereco();

// ---------------------------------------------------------------- moldura

const MOLDURA_PADRAO = {
  aba: null,            // "hoje" | "trilha" | "praticas" | "semana" | null (sem abas)
  navegacao: null,      // item aceso na página esquerda do computador (padrão: a aba; "ajustes" nas telas de Ajustes)
  barra: "interna",     // "hoje" | "aba" | "interna" | "nenhuma"
  titulo: "",           // "aba": nome em Fraunces à esquerda; "interna": rótulo no centro
  esquerda: "voltar",   // "voltar" | "fechar" | null
  rotuloEsquerda: null, // nome acessível ("Voltar", "Fechar", "Encerrar")
  aoEsquerda: null,     // função; padrão: voltar()
  limite: "icone",      // "pilula" | "icone" | null
  acoes: [],            // [{ icone, rotulo, rota }] antes do limite (Semana: Ajustes)
  foco: false,          // tela de foco: no computador, por cima do caderno
  pai: "#/hoje"         // para onde "voltar" vai quando não há tela anterior
};

let molduraAtual = { ...MOLDURA_PADRAO };
let instancia = null;
let controle = null;
let ficha = 0;
let primeiraTela = true;
let rotaRenderizada = null;

const el = {};

function montarEsqueleto() {
  el.app = document.getElementById("app");
  el.barra = document.getElementById("barra");
  el.tela = document.getElementById("tela");
  el.abas = document.getElementById("abas");
  el.faixas = document.getElementById("faixas");
  el.esquerda = document.getElementById("pagina-esquerda");
  el.demo = document.getElementById("faixa-demo");
  el.fundoCirculo = document.getElementById("fundo-circulo");

  limpar(el.abas);
  for (const a of ABAS) {
    el.abas.append(h("a.aba", { href: a.rota, dataset: { aba: a.id } },
      h("span.aba-ponto", { "aria-hidden": "true" }),
      iconeEl(a.id),
      h("span.rotulo-aba", null, a.rotulo)
    ));
  }
  const circulo = desenhos.circuloDuplo();
  if (circulo) el.fundoCirculo.append(svg(circulo));

  addEventListener("scroll", marcarRolagem, { passive: true });
}

function marcarRolagem() {
  el.barra?.classList.toggle("rolou", window.scrollY > 4);
}

function pilulaDoLimite() {
  return h("button.pilula-limite", { type: "button", onclick: () => abrirLimite() },
    h("span.pilula-limite-icone", { "aria-hidden": "true" }, iconeEl("limite", { tamanho: 18 })),
    h("span", null, "Estou no limite")
  );
}

function iconeDoLimite() {
  return h("button.icone-botao.icone-limite", { type: "button", "aria-label": "Estou no limite", onclick: () => abrirLimite() },
    iconeEl("limite"));
}

function aplicarMoldura(m, { paginaEsquerda = false } = {}) {
  molduraAtual = m;
  const html = document.documentElement;
  const comAbas = Boolean(m.aba);
  el.app.classList.toggle("com-abas", comAbas);
  el.app.classList.toggle("sem-abas", !comAbas);
  el.app.classList.toggle("em-foco", Boolean(m.foco));
  html.classList.toggle("com-abas", comAbas);
  html.classList.toggle("em-foco", Boolean(m.foco));
  el.abas.hidden = !comAbas;
  for (const a of el.abas.querySelectorAll(".aba")) {
    if (a.dataset.aba === m.aba) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  desenharBarra(m);
  if (paginaEsquerda) desenharPaginaEsquerda();
  else marcarNavegacao();
}

function marcarNavegacao() {
  const atual = molduraAtual.navegacao ?? molduraAtual.aba;
  for (const a of el.esquerda?.querySelectorAll(".pe-item") ?? []) {
    if (a.dataset.item === atual) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

function desenharBarra(m) {
  limpar(el.barra);
  el.barra.className = `barra barra-${m.barra}`;
  el.barra.hidden = m.barra === "nenhuma";
  const esquerda = h("div.barra-esquerda");
  const centro = h("div.barra-centro");
  const direita = h("div.barra-direita");

  if (m.barra === "hoje") {
    esquerda.append(h("span.barra-marca", { role: "img", "aria-label": "Sintonia Interior" },
      svg(desenhos.lotusMarca({ tamanho: 28 }))));
  } else if (m.barra === "aba") {
    esquerda.append(h("p.titulo-barra", null, m.titulo));
  } else {
    if (m.esquerda) {
      const nome = m.rotuloEsquerda ?? (m.esquerda === "fechar" ? "Fechar" : "Voltar");
      esquerda.append(h("button.icone-botao.barra-voltar", {
        type: "button", "aria-label": nome, onclick: () => acaoDaEsquerda()
      }, iconeEl(m.esquerda === "fechar" ? "fechar" : "voltar")));
    }
    if (m.titulo) centro.append(h("p.rotulo.barra-titulo", null, m.titulo));
  }
  for (const a of m.acoes ?? []) {
    direita.append(h(a.rota ? "a.icone-botao" : "button.icone-botao", {
      href: a.rota, type: a.rota ? null : "button", "aria-label": a.rotulo, onclick: a.aoTocar
    }, iconeEl(a.icone)));
  }
  if (m.limite === "pilula") direita.append(pilulaDoLimite());
  else if (m.limite === "icone") direita.append(iconeDoLimite());
  el.barra.append(esquerda, centro, direita);
  marcarRolagem();
}

function acaoDaEsquerda() {
  if (typeof molduraAtual.aoEsquerda === "function") molduraAtual.aoEsquerda();
  else voltar();
}

let assinaturaDesenhada = null;
function assinaturaDaFlor() {
  const hoje = diaLogico();
  const f = flor(hoje);
  const doDia = estado.sessoes.filter((x) => x.conta && x.dia === hoje).length;
  return [hoje, f.estagio, f.descansa, f.cresceuHoje, legendaDaFlor(hoje), doDia].join("|");
}

function desenharPaginaEsquerda() {
  const pe = el.esquerda;
  if (!pe || !estado) return;
  assinaturaDesenhada = assinaturaDaFlor();
  limpar(pe);
  const hoje = diaLogico();
  const f = flor(hoje);
  const legenda = legendaDaFlor(hoje);
  const rotulo = textosDaFlor?.rotulo?.(f.estagio, f.descansa) ?? (desenhos.ROTULOS[f.estagio] + (f.descansa ? " · DESCANSANDO" : ""));
  const nomeAcessivel = desenhos.rotuloDaFlor({ estagio: f.estagio, descansa: f.descansa, cresceuHoje: f.cresceuHoje }) || "Sua flor";
  const atual = molduraAtual.navegacao ?? molduraAtual.aba;
  const itens = [...ABAS.map((a) => ({ id: a.id, rota: a.rota, nome: a.nome })), { id: "ajustes", rota: "#/ajustes", nome: "Ajustes" }];
  // A pílula do limite fica presa ao pé da página (fora da parte que rola), para estar sempre à
  // vista, mesmo num notebook de 768 px de altura (princípio 2). O h() já descarta o que é null.
  pe.append(
    h("div.pe-rola", null,
      h("div.pe-alto",
        h("p.nome", null, "Sintonia Interior"),
        h("p.rotulo.pe-dia", null, rotuloDoDia(hoje))
      ),
      h("button.pe-flor", { type: "button", "aria-label": nomeAcessivel, onclick: () => abrirSuaFlorDaPagina() },
        svg(desenhos.florSVG({ estagio: f.estagio, descansa: f.descansa, cresceuHoje: f.cresceuHoje, altura: 240 }))),
      h("p.rotulo.pe-rotulo", { "aria-hidden": "true" }, rotulo),
      legenda && textoDaLegenda(legenda) ? h("p.apoio.pe-legenda", null, textoDaLegenda(legenda)) : null,
      h("nav.pe-nav", { "aria-label": "Seções" },
        ...itens.map((i) => h("a.pe-item.titulo-barra", { href: i.rota, dataset: { item: i.id }, "aria-current": i.id === atual ? "page" : null },
          h("span.pe-ponto", { "aria-hidden": "true" }), i.nome))
      )
    ),
    h("div.pe-pe", null, pilulaDoLimite())
  );
}

let textosDaFlor = null;
function textoDaLegenda(chave) {
  return textosDaFlor?.legendas?.[chave] ?? "";
}

async function abrirSuaFlorDaPagina() {
  try {
    const m = await import("./telas/hoje.js");
    m.abrirSuaFlor?.();
  } catch (erro) {
    console.error(erro);
  }
}

function desenharFaixas() {
  limpar(el.faixas);
  const naHoje = rotaRenderizada === "hoje";
  if (naHoje && !podeGravar) {
    el.faixas.append(h("p.faixa-dados", { role: "status" },
      "Este navegador não está guardando seus dados agora, talvez por ser uma janela privada. O app funciona, mas o que você fizer some ao fechar."));
  }
  if (naHoje && esperando) {
    el.faixas.append(h("div.faixa-versao", { role: "status" },
      h("span", null, "Uma versão nova do app está pronta."),
      h("button.link", { type: "button", onclick: atualizarApp }, "Atualizar")));
  }
}

function desenharDemo() {
  el.demo.hidden = !emDemo;
  document.documentElement.classList.toggle("demo", emDemo);
}

// ---------------------------------------------------------------- aparência

const consultaMovimento = matchMedia("(prefers-reduced-motion: reduce)");
const consultaEscuro = matchMedia("(prefers-color-scheme: dark)");

/** Aplica tema, menos movimento e letra maior no <html> (4.1, 4.8, 4.11). */
export function aplicarAparencia() {
  const a = estado?.ajustes ?? {};
  const html = document.documentElement;
  const tema = ["claro", "noite", "auto"].includes(a.tema) ? a.tema : "claro";
  html.dataset.tema = tema;
  const menos = a.menosMovimento ?? consultaMovimento.matches;
  html.classList.toggle("menos-movimento", Boolean(menos));
  html.classList.toggle("letra-maior", Boolean(a.letraMaior));
  const escuro = tema === "noite" || (tema === "auto" && consultaEscuro.matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", escuro ? "#221912" : "#F0E9DD");
}

// ---------------------------------------------------------------- telas

const modulos = new Map();

function importarTela(caminho) {
  if (!modulos.has(caminho)) {
    const p = import(caminho).catch((erro) => { modulos.delete(caminho); throw erro; });
    modulos.set(caminho, p);
  }
  return modulos.get(caminho);
}

function resolverMoldura(mod, ctx) {
  const base = typeof mod.moldura === "function" ? mod.moldura(ctx) : (mod.moldura ?? {});
  const m = { ...MOLDURA_PADRAO, ...base };
  if (!m.aba && m.barra === "aba") m.barra = "interna";
  return m;
}

function telaQueNaoAbriu(erro) {
  console.error(erro);
  return {
    moldura: { barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/hoje" },
    montar(alvo) {
      alvo.append(h("div.coluna.tela-erro",
        h("h1.titulo", null, "Esta tela não abriu agora."),
        h("p", null, h("a.link", { href: "#/hoje" }, "Voltar para Hoje"))));
    }
  };
}

async function rotear({ forcar = false, mesmaEntrada = false } = {}) {
  const minha = ++ficha;
  if (!mesmaEntrada) marcarEntrada();
  else visitadas.splice(-1, 1, { n: telaN, caminho: lerEndereco().caminho });
  const { caminho, query } = lerEndereco();

  if (caminho === "" ) return navegar(estado.boasVindasEm ? "#/hoje" : "#/boas-vindas/1", { substituir: true });

  // #/limite, #/limite/respirar...: abre a camada por cima da tela de antes (ou de Hoje).
  if (caminho === "limite" || caminho.startsWith("limite/")) {
    const sub = caminho.split("/")[1] ?? null;
    const base = hashRenderizado ?? "#/hoje";
    history.replaceState({ tela: telaN }, "", base);
    visitadas.splice(-1, 1, { n: telaN, caminho: lerEndereco(base).caminho });
    if (!rotaRenderizada) await rotear({ forcar: true, mesmaEntrada: true });
    abrirLimite({ sub });
    return;
  }

  const achada = acharRota(caminho);
  if (!achada) return navegar("#/hoje", { substituir: true });
  if (!estado.boasVindasEm && !achada.def.livre) return navegar("#/boas-vindas/1", { substituir: true });
  if (estado.boasVindasEm && caminho.startsWith("boas-vindas")) return navegar("#/hoje", { substituir: true });

  const chave = `${caminho}?${new URLSearchParams(query)}`;
  if (!forcar && chave === rotaRenderizadaCompleta && instancia) return;

  let mod;
  try {
    mod = await importarTela(achada.def.modulo);
  } catch (erro) {
    mod = telaQueNaoAbriu(erro);
  }
  if (minha !== ficha) return;
  await mostrarTela(mod, achada, caminho, query, chave);
}

let rotaRenderizadaCompleta = null;
let hashRenderizado = null;

async function mostrarTela(mod, achada, caminho, query, chave) {
  controle?.abort();
  controle = new AbortController();
  const sinal = controle.signal;
  const dados = dadosDaProxima;
  dadosDaProxima = null;

  const ctx = {
    caminho,
    params: achada.params,
    query,
    dados,
    sinal,
    navegar,
    voltar,
    voltarPara,
    abrirLimite,
    /** Muda partes da moldura desta tela (por exemplo, a do tocador: { esquerda: "fechar", foco: true }). */
    moldura(parcial) {
      if (sinal.aborted) return;
      aplicarMoldura({ ...molduraAtual, ...parcial });
    },
    /** Troca o quadro desta tela por outro, com o movimento de troca de tela (4.8). */
    trocar(construir, opcoes) {
      return trocar(ctx.raiz, construir, opcoes);
    },
    raiz: null
  };

  const m = resolverMoldura(mod, ctx);
  rotaRenderizada = caminho;
  rotaRenderizadaCompleta = chave;
  hashRenderizado = location.hash;

  const montarAgora = async (quadro) => {
    try { instancia?.destruir?.(); } catch (erro) { console.error(erro); }
    instancia = null;
    aplicarMoldura(m, { paginaEsquerda: true });
    desenharFaixas();
    ctx.raiz = quadro;
    try {
      instancia = (await mod.montar(quadro, ctx)) ?? {};
    } catch (erro) {
      console.error(erro);
      limpar(quadro);
      telaQueNaoAbriu(erro).montar(quadro);
      instancia = {};
    }
  };

  const usarTransicao = !primeiraTela && "startViewTransition" in document && !algumModalAberto();
  primeiraTela = false;
  if (usarTransicao) {
    const quadro = h("div.quadro");
    const vt = document.startViewTransition(async () => {
      limpar(el.tela);
      el.tela.append(quadro);
      await montarAgora(quadro);
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    // Quando uma troca começa antes de a outra acabar, o navegador pula a transição de antes:
    // ready e finished rejeitam com AbortError, e isso não é erro.
    vt.ready.catch(() => {});
    vt.finished.catch(() => {});
    try { await vt.updateCallbackDone; } catch (erro) { console.error(erro); }
    focarTitulo(quadro);
  } else {
    await trocar(el.tela, montarAgora, { focar: true, rolar: true });
  }
}

/** Desenha de novo a tela atual (depois de ligar a demonstração ou trazer dados). */
export function redesenhar() {
  rotear({ forcar: true, mesmaEntrada: true });
}

// ---------------------------------------------------------------- Estou no limite

const ouvintesDoLimite = new Set();
let modLimite = null;

/** Quem precisa saber que o limite abriu (o tocador, para pausar): devolve a função de parar de ouvir. */
export function aoAbrirLimite(fn) {
  ouvintesDoLimite.add(fn);
  return () => ouvintesDoLimite.delete(fn);
}

/** Abre o Estou no limite por cima de qualquer tela, sem pedir nada (2.2, T19). */
export async function abrirLimite(opcoes = {}) {
  for (const fn of [...ouvintesDoLimite]) {
    try { fn(); } catch (erro) { console.error(erro); }
  }
  try {
    modLimite ??= await import("./telas/limite.js");
    await modLimite.abrirLimite(opcoes);
  } catch (erro) {
    console.error(erro);
    modLimite = null;
    abrirLimiteDeReserva();
  }
}

export function fecharLimite() {
  try { modLimite?.fecharLimite?.(); } catch (erro) { console.error(erro); }
}

// Só se js/telas/limite.js não abrir: a saída precisa existir em qualquer versão (princípio 2).
function abrirLimiteDeReserva() {
  const id = idUnico("limite-reserva");
  abrirCamada({
    classe: "camada-limite",
    idTitulo: id,
    conteudo(corpo) {
      corpo.append(
        h("div.limite-rola", h("h1.titulo", { id }, "Tudo bem parar aqui.")),
        h("aside.cartao-cvv", { "aria-label": "Falar com alguém agora" },
          h("a.botao-principal", { href: "tel:188", "aria-label": "Ligar para o CVV, 188" }, "Ligar para o 188"),
          h("p", null, h("a.link", { href: "https://cvv.org.br", target: "_blank", rel: "noopener noreferrer" }, "Abrir cvv.org.br")),
          h("p", null, h("a.link", { href: "tel:192", "aria-label": "Ligar para o SAMU, 192" }, "Ligar para o 192"))
        )
      );
    }
  });
}

// ---------------------------------------------------------------- instalar (T26 e o cartão de Hoje)

let pedido = null;

/** O pedido de instalação do navegador (Android e computador), ou null. */
export const pedidoDeInstalacao = () => pedido;

/** Chama o pedido de instalação do navegador. Devolve "accepted", "dismissed" ou null. */
export async function instalarApp() {
  if (!pedido) return null;
  const p = pedido;
  pedido = null;
  try {
    await p.prompt();
    const escolha = await p.userChoice;
    return escolha?.outcome ?? null;
  } catch {
    return null;
  }
}

/** true quando o app está aberto pelo ícone da tela de início. */
export const estaInstalado = () =>
  matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

/** true no iPhone e no iPad (inclusive o iPad que se apresenta como computador). */
export const eIphone = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

addEventListener("beforeinstallprompt", (ev) => {
  ev.preventDefault();
  pedido = ev;
});
addEventListener("appinstalled", () => {
  pedido = null;
  if (estado) alterar((e) => { e.cartoes.instalar = "dispensado"; });
});

// ---------------------------------------------------------------- versão nova (service worker)

let esperando = null;
let pediuAtualizar = false;

/** true quando há uma versão nova esperando (a barra aparece só em Hoje). */
export const versaoNovaPronta = () => Boolean(esperando);

/** "Atualizar": manda a versão nova assumir e recarrega quando ela assumir. */
export function atualizarApp() {
  if (!esperando) { location.reload(); return; }
  pediuAtualizar = true;
  esperando.postMessage({ tipo: "pular-espera" });
}

function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const marcar = (sw) => {
    esperando = sw;
    if (rotaRenderizada === "hoje") desenharFaixas();
  };
  navigator.serviceWorker.register("sw.js").then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) marcar(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const novo = reg.installing;
      novo?.addEventListener("statechange", () => {
        if (novo.state === "installed" && navigator.serviceWorker.controller) marcar(novo);
      });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reg.update().catch(() => {});
    });
  }).catch(() => { /* sem service worker: o app funciona com internet */ });
  let recarregando = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!pediuAtualizar || recarregando) return;
    recarregando = true;
    location.reload();
  });
}

// ---------------------------------------------------------------- teclado e toques

function aoTeclar(ev) {
  if (ev.key !== "Escape" || ev.isComposing) return;
  if (fecharTopo()) { ev.preventDefault(); return; }
  if (molduraAtual.esquerda && molduraAtual.barra !== "hoje" && molduraAtual.barra !== "aba") {
    ev.preventDefault();
    acaoDaEsquerda();
  }
}

function aoClicar(ev) {
  if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  const a = ev.target.closest?.("a[href^='#/']");
  if (!a || a.target) return;
  ev.preventDefault();
  navegar(a.getAttribute("href"));
}

// ---------------------------------------------------------------- início

async function iniciar() {
  iniciarEstado();
  aplicarAparencia();
  consultaMovimento.addEventListener?.("change", aplicarAparencia);
  consultaEscuro.addEventListener?.("change", aplicarAparencia);

  const [d, f, t] = await Promise.allSettled([import("./desenhos.js"), import("./flor.js"), import("./conteudo/textos.js")]);
  if (d.status === "rejected") console.error(d.reason);
  if (f.status === "rejected") console.error(f.reason);
  registrarDesenhos(d.value, f.value);
  textosDaFlor = t.value?.FLOR ?? null;

  montarEsqueleto();
  desenharDemo();

  aoMudar((motivo) => {
    if (motivo === "gravacao") { desenharFaixas(); return; }
    if (motivo === "alterar") {
      aplicarAparencia();
      // Uma sessão nova (o limite por 60 s, por exemplo) muda a flor: a página esquerda e a tela atual se redesenham.
      if (assinaturaDaFlor() !== assinaturaDesenhada) {
        desenharPaginaEsquerda();
        try { instancia?.aoMudarEstado?.("flor"); } catch (erro) { console.error(erro); }
      }
      return;
    }
    aplicarAparencia();
    desenharDemo();
    if (motivo === "troca") { redesenhar(); return; }
    desenharPaginaEsquerda();
    try { instancia?.aoMudarEstado?.(motivo); } catch (erro) { console.error(erro); }
  });

  addEventListener("hashchange", () => {
    if (temVoltaEmpilhada()) limparPilha();
    rotear();
  });
  document.addEventListener("keydown", aoTeclar);
  document.addEventListener("click", aoClicar);
  const acordarSom = () => { if (estado?.ajustes?.som) prepararSom(); };
  document.addEventListener("pointerdown", acordarSom, { capture: true, passive: true });
  document.addEventListener("keydown", acordarSom, { capture: true });

  const { query } = lerEndereco();
  if (query.trazida) {
    history.replaceState(history.state, "", "#/hoje");
    setTimeout(() => avisoCurto("Dados trazidos da cópia."), 600);
  }

  await rotear();
  document.documentElement.classList.add("pronto");

  registrarServiceWorker();
  // Deixa pronto o que precisa abrir rápido: o limite (em até 200 ms) e o caminho principal.
  setTimeout(() => {
    import("./telas/limite.js").then((m) => { modLimite = m; }).catch(() => {});
    for (const c of ["./telas/hoje.js", "./telas/tempo.js", "./telas/passo.js", "./telas/pratica.js"]) importarTela(c).catch(() => {});
  }, 400);
}

addEventListener("error", (ev) => console.error(ev.error ?? ev.message));
addEventListener("unhandledrejection", (ev) => console.error(ev.reason));

iniciar();
