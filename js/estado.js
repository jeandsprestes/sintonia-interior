// O estado no navegador: ler, gravar, copiar, trazer, apagar, migrar e o modo de demonstração
// (seções 7.1, 7.3, 7.10 e 7.11). Tudo o que pode ser calculado mora em regras.js e nunca é guardado.
//
// Como usar (em qualquer tela):
//   import { estado, alterar } from "../estado.js";
//   estado.ajustes.tom                      // ler: sempre pelo objeto vivo "estado"
//   alterar((e) => { e.ajustes.som = true; });   // gravar: muda dentro da função; o app grava em até 300 ms
//   alterar((e) => { ... }, { agora: true });    // grava na hora (sessões, por exemplo)
//   aoMudar((motivo) => { ... })            // avisa quando o estado muda; devolve a função de parar de ouvir
//
// "estado" é uma ligação viva: depois de trazer uma cópia ou ligar a demonstração, ela aponta para o
// objeto novo. Por isso, nunca guarde "estado" numa variável sua; leia sempre "estado.alguma.coisa".

import { agora, diaLogico, isoLocal, definirDesvio, difDias, somarDias } from "./dia.js";

export const APP = "sintonia-interior";
export const CHAVE = "sintonia-interior";
export const CHAVE_DEMO = "sintonia-interior:demo";
export const CHAVE_ANTES_DA_MIGRACAO = "sintonia-interior:antes-da-migracao";
export const CHAVE_ANTES_DA_IMPORTACAO = "sintonia-interior:antes-da-importacao";
export const BANCO_DE_AUDIOS = "sintonia-interior";
export const ESQUEMA = 1;
export const VERSAO = "0.1.0";

/** O estado em uso (o real ou o da demonstração). Ligação viva: leia sempre por aqui. */
export let estado = null;
/** true quando o modo de demonstração está ligado (lendo e gravando só em CHAVE_DEMO). */
export let emDemo = false;
/** false quando o navegador recusou gravar (a faixa de dados não guardados aparece em Hoje). */
export let podeGravar = true;

const ouvintes = new Set();
let espera = null;

// ---------------------------------------------------------------- armazenamento

function ler(chave) {
  try { return localStorage.getItem(chave); } catch { return null; }
}

function escrever(chave, texto) {
  try { localStorage.setItem(chave, texto); return true; } catch { return false; }
}

function remover(chave) {
  try { localStorage.removeItem(chave); } catch { /* nada a fazer */ }
}

function chaveAtual() {
  return emDemo ? CHAVE_DEMO : CHAVE;
}

// ---------------------------------------------------------------- ids e estado novo

/** Id curto e único: prefixo, o tempo em base 36 e 2 caracteres ao acaso (7.3). */
export function novoId(prefixo) {
  const acaso = Math.random().toString(36).slice(2, 4).padEnd(2, "0");
  return `${prefixo}_${Date.now().toString(36)}${acaso}`;
}

/** O estado de quem nunca abriu o app (7.3). */
export function estadoNovo() {
  return {
    app: APP,
    esquema: ESQUEMA,
    criadoEm: isoLocal(agora()),
    boasVindasEm: null,
    ajustes: {
      tom: "pratico",
      som: false,
      medir: false,
      tema: "claro",
      menosMovimento: null,
      letraMaior: false,
      praticasPor: "estado"
    },
    checkins: [],
    sessoes: [],
    trilha: { rodada: 1, dias: {}, concluidaEm: null, anteriores: [] },
    fazBem: { coisas: [], musica: null, frase: null, frasesGuardadas: [] },
    cuidadoPossivel: null,
    descargas: [],
    escritos: [],
    escolhas: {},
    cartoes: { experimento: "pendente", instalar: "pendente", semanaVista: null, copiaDispensadaEmN: 0 },
    ultimaCopia: { em: null, diasDeCuidado: 0 }
  };
}

/** Completa campos que faltem (estado antigo ou cópia parcial), sem apagar nada do que existe. */
function completar(e) {
  const base = estadoNovo();
  for (const [k, v] of Object.entries(base)) {
    if (e[k] === undefined) e[k] = v;
  }
  for (const k of ["ajustes", "trilha", "fazBem", "cartoes", "ultimaCopia"]) {
    if (!e[k] || typeof e[k] !== "object") e[k] = base[k];
    for (const [kk, vv] of Object.entries(base[k])) {
      if (e[k][kk] === undefined) e[k][kk] = vv;
    }
  }
  for (const k of ["checkins", "sessoes", "descargas", "escritos"]) {
    if (!Array.isArray(e[k])) e[k] = [];
  }
  if (!e.trilha.dias || typeof e.trilha.dias !== "object") e.trilha.dias = {};
  if (!Array.isArray(e.trilha.anteriores)) e.trilha.anteriores = [];
  for (const k of ["coisas", "frasesGuardadas"]) {
    if (!Array.isArray(e.fazBem[k])) e.fazBem[k] = [];
  }
  if (!e.escolhas || typeof e.escolhas !== "object") e.escolhas = {};
  return e;
}

// ---------------------------------------------------------------- migração (7.10)

// Cada função recebe o estado do esquema n e devolve o do esquema n + 1, sem apagar dado nenhum.
// Exemplo para o futuro: 1: function migrar1para2(e) { e.novoCampo = ...; return e; }
const MIGRACOES = {};

function migrar(e) {
  if (typeof e.esquema !== "number") e.esquema = 1;
  while (e.esquema < ESQUEMA) {
    const passo = MIGRACOES[e.esquema];
    if (!passo) break;
    e = passo(e);
    e.esquema += 1;
  }
  return e;
}

// ---------------------------------------------------------------- abrir

function aplicarDesvio() {
  const dias = emDemo ? Number(estado?.demo?.desvioDias) || 0 : 0;
  definirDesvio(dias * 864e5);
}

function lerEstadoReal() {
  const texto = ler(CHAVE);
  if (!texto) {
    const novo = estadoNovo();
    return novo;
  }
  let e;
  try {
    e = JSON.parse(texto);
  } catch {
    // Texto ilegível: guarda o original antes de seguir com um estado novo, para nada se perder.
    escrever(CHAVE_ANTES_DA_MIGRACAO, texto);
    return estadoNovo();
  }
  if (!e || typeof e !== "object") return estadoNovo();
  if ((Number(e.esquema) || 1) < ESQUEMA) {
    escrever(CHAVE_ANTES_DA_MIGRACAO, texto);
    e = migrar(e);
  }
  return completar(e);
}

/** Chamado uma vez por app.js, antes de desenhar qualquer tela. */
export function iniciarEstado() {
  emDemo = false;
  const textoDemo = ler(CHAVE_DEMO);
  if (textoDemo) {
    try {
      const d = JSON.parse(textoDemo);
      if (d && d.app === APP) {
        estado = completar(migrar(d));
        if (!estado.demo) estado.demo = { desvioDias: 0, trilhaLivre: false };
        emDemo = true;
      }
    } catch { /* demonstração ilegível: segue com o estado real */ }
  }
  if (!emDemo) estado = lerEstadoReal();
  aplicarDesvio();
  gravarAgora();

  addEventListener("storage", (ev) => {
    if (ev.key !== null && !String(ev.key).startsWith(APP)) return;
    if (ev.key === CHAVE_ANTES_DA_MIGRACAO || ev.key === CHAVE_ANTES_DA_IMPORTACAO) return;
    clearTimeout(espera);
    espera = null;
    recarregarDoArmazenamento();
    avisar("outra-aba");
  });
  addEventListener("pagehide", () => { if (espera) gravarAgora(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && espera) gravarAgora();
  });
}

function recarregarDoArmazenamento() {
  emDemo = false;
  const textoDemo = ler(CHAVE_DEMO);
  if (textoDemo) {
    try {
      const d = JSON.parse(textoDemo);
      if (d && d.app === APP) {
        estado = completar(migrar(d));
        if (!estado.demo) estado.demo = { desvioDias: 0, trilhaLivre: false };
        emDemo = true;
      }
    } catch { /* segue com o real */ }
  }
  if (!emDemo) estado = lerEstadoReal();
  aplicarDesvio();
}

// ---------------------------------------------------------------- gravar (7.10)

/** Muda o estado dentro de fn(estado) e grava (juntando mudanças seguidas em até 300 ms). */
export function alterar(fn, { agora: naHora = false, motivo = "alterar" } = {}) {
  const resultado = fn(estado);
  if (naHora) gravarAgora();
  else agendar();
  avisar(motivo);
  return resultado;
}

function agendar() {
  clearTimeout(espera);
  espera = setTimeout(gravarAgora, 300);
}

/** Grava o estado inteiro na hora. Devolve true se o navegador aceitou. */
export function gravarAgora() {
  clearTimeout(espera);
  espera = null;
  if (!estado) return false;
  let ok = false;
  try {
    ok = escrever(chaveAtual(), JSON.stringify(estado));
  } catch {
    ok = false;
  }
  if (ok !== podeGravar) {
    podeGravar = ok;
    avisar("gravacao");
  }
  return ok;
}

/** Ouve as mudanças do estado. fn(motivo): "alterar", "troca", "outra-aba" ou "gravacao". */
export function aoMudar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function avisar(motivo) {
  if (motivo === "troca" || motivo === "outra-aba") aplicarDesvio();
  for (const fn of [...ouvintes]) {
    try { fn(motivo); } catch (erro) { console.error(erro); }
  }
}

// ---------------------------------------------------------------- persistência e espaço

/** Pede ao navegador armazenamento persistente, sem perguntar nada à pessoa (T04). */
export function pedirPersistencia() {
  try { navigator.storage?.persist?.().catch(() => {}); } catch { /* sem suporte */ }
}

/** Bytes usados pelo app, quando o navegador informa; senão null. */
export async function espacoUsado() {
  try {
    const r = await navigator.storage?.estimate?.();
    return typeof r?.usage === "number" ? r.usage : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- cópia (7.10)

function contarDiasDeCuidado(e) {
  return new Set((e.sessoes || []).filter((s) => s.conta).map((s) => s.dia)).size;
}

/** O conteúdo do arquivo de cópia: { app, esquema, exportadoEm, dados }, sem áudios. */
export function copiaDosDados() {
  return { app: APP, esquema: ESQUEMA, exportadoEm: isoLocal(agora()), dados: estado };
}

/** Nome do arquivo: "sintonia-interior-2026-11-05.json". */
export function nomeDaCopia() {
  return `sintonia-interior-${diaLogico()}.json`;
}

/**
 * Baixa a cópia por Blob e um link com download, sem rede, e atualiza ultimaCopia.
 * Devolve o nome do arquivo, ou null no modo de demonstração (lá a cópia fica desativada).
 * Quem chama mostra o aviso curto de 3.28 ("Cópia baixada. ...").
 */
export function baixarCopia() {
  if (emDemo) return null;
  const nome = nomeDaCopia();
  const texto = JSON.stringify(copiaDosDados(), null, 2);
  const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  alterar((e) => {
    e.ultimaCopia = { em: isoLocal(agora()), diasDeCuidado: contarDiasDeCuidado(e) };
  }, { agora: true });
  return nome;
}

/**
 * Lê um arquivo escolhido pela pessoa e confere se é uma cópia válida (7.10).
 * Devolve { ok: true, copia, dados } ou { ok: false, erro: "invalido" | "nova" }.
 * Para a prévia (data, dias, lótus, dia da trilha), use previaDaCopia(dados) de regras.js.
 */
export async function lerCopia(arquivo) {
  let texto;
  try { texto = await arquivo.text(); } catch { return { ok: false, erro: "invalido" }; }
  let obj;
  try { obj = JSON.parse(texto); } catch { return { ok: false, erro: "invalido" }; }
  if (!obj || typeof obj !== "object" || obj.app !== APP) return { ok: false, erro: "invalido" };
  const esquema = Number(obj.esquema);
  if (!Number.isFinite(esquema)) return { ok: false, erro: "invalido" };
  if (esquema > ESQUEMA) return { ok: false, erro: "nova" };
  const dados = obj.dados;
  if (!dados || typeof dados !== "object" || !Array.isArray(dados.sessoes)) return { ok: false, erro: "invalido" };
  let copia;
  try { copia = structuredClone(dados); } catch { return { ok: false, erro: "invalido" }; }
  if (typeof copia.esquema !== "number") copia.esquema = esquema;
  copia = completar(migrar(copia));
  copia.app = APP;
  return { ok: true, copia: obj, dados: copia };
}

/** Substitui o estado real pela cópia: guarda o atual antes, grava o novo e recarrega. Nunca mistura. */
export function substituirPorCopia(dados) {
  if (emDemo) return false;
  gravarAgora();
  const atual = ler(CHAVE);
  if (atual) escrever(CHAVE_ANTES_DA_IMPORTACAO, atual);
  const novo = completar(structuredClone(dados));
  delete novo.demo;
  if (!escrever(CHAVE, JSON.stringify(novo))) return false;
  // O aviso "Dados trazidos da cópia." vem pelo endereço, sem guardar nada fora do que diz 7.1.
  location.hash = "#/hoje?trazida=1";
  location.reload();
  return true;
}

// ---------------------------------------------------------------- apagar tudo (7.10)

/** Remove todas as chaves sintonia-interior* e o banco de áudios; não toca no cache do app. */
export async function apagarTudo() {
  clearTimeout(espera);
  espera = null;
  try {
    const chaves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(APP)) chaves.push(k);
    }
    chaves.forEach(remover);
  } catch { /* armazenamento bloqueado */ }
  await new Promise((resolver) => {
    try {
      const pedido = indexedDB.deleteDatabase(BANCO_DE_AUDIOS);
      pedido.onsuccess = pedido.onerror = pedido.onblocked = () => resolver();
      setTimeout(resolver, 1500);
    } catch {
      resolver();
    }
  });
  estado = null;
  // replaceState não dispara hashchange: sem ele, o roteador lia o estado já apagado antes de recarregar.
  history.replaceState(null, "", "#/boas-vindas/1");
  location.reload();
}

// ---------------------------------------------------------------- modo de demonstração (7.11)

/** Liga a demonstração: copia o estado real para CHAVE_DEMO e passa a ler e gravar só ali. */
export function ligarDemo() {
  if (emDemo) return;
  gravarAgora();
  const copia = structuredClone(estado);
  copia.demo = { desvioDias: 0, trilhaLivre: false };
  if (!escrever(CHAVE_DEMO, JSON.stringify(copia))) {
    // Sem gravar, a demonstração ainda funciona em memória.
  }
  estado = copia;
  emDemo = true;
  avisar("troca");
}

/** Desliga: apaga CHAVE_DEMO e volta ao estado real, intacto. */
export function desligarDemo() {
  if (!emDemo) return;
  clearTimeout(espera);
  espera = null;
  remover(CHAVE_DEMO);
  emDemo = false;
  estado = lerEstadoReal();
  avisar("troca");
}

function alterarDemo(fn) {
  if (!emDemo) return;
  alterar((e) => {
    if (!e.demo) e.demo = { desvioDias: 0, trilhaLivre: false };
    fn(e);
  }, { agora: true, motivo: "troca" });
}

/** "Avançar um dia": desvioDias += 1. */
export function demoAvancarUmDia() {
  alterarDemo((e) => { e.demo.desvioDias += 1; });
}

/** "Mostrar a flor descansando": o relógio vai para 3 dias lógicos depois do último dia de cuidado. */
export function demoMostrarDescanso() {
  alterarDemo((e) => {
    const dias = [...new Set(e.sessoes.filter((s) => s.conta).map((s) => s.dia))].sort();
    const ultimo = dias.at(-1);
    if (!ultimo) return;
    definirDesvio(0);
    const real = diaLogico();
    e.demo.desvioDias = difDias(somarDias(ultimo, 3), real);
  });
}

/** "Liberar todos os dias da trilha": trilhaLivre = true. */
export function demoLiberarTrilha() {
  alterarDemo((e) => { e.demo.trilhaLivre = true; });
}

/**
 * "Preencher uma semana de exemplo": nos últimos 7 dias lógicos, 5 sessões que contam (práticas
 * diferentes, duas na mínima), com check-ins, três sinais, duas linhas e uma medição de 7 para 4.
 */
export function demoPreencherSemana() {
  alterarDemo((e) => {
    const hoje = diaLogico();
    const modelos = [
      { atras: 6, praticaId: "P10", estado: "sobrecarga", tempo: 5, versao: "minima", segundos: 64, antes: 7, depois: 4, sinal: "calma", linha: "Respirei melhor." },
      { atras: 5, praticaId: "P01", estado: "cansaco", tempo: 2, versao: "completa", segundos: 122, sinal: "leveza", linha: null },
      { atras: 3, praticaId: "P13", estado: "desconexao", tempo: 2, versao: "minima", segundos: 61, sinal: null, linha: null },
      { atras: 2, praticaId: "P04", estado: "cansaco", tempo: 5, versao: "completa", segundos: 302, sinal: "alivio", linha: "Dez minutos só meus." },
      { atras: 1, praticaId: "P16", estado: "desconexao", tempo: 5, versao: "completa", segundos: 288, sinal: null, linha: null }
    ];
    for (const m of modelos) {
      const dia = somarDias(hoje, -m.atras);
      const inicio = new Date(`${dia}T19:30:00`);
      const fim = new Date(inicio.getTime() + m.segundos * 1000);
      const checkin = { id: novoId("c"), em: isoLocal(new Date(inicio.getTime() - 60e3)), dia, estado: m.estado, tempo: m.tempo };
      e.checkins.push(checkin);
      e.sessoes.push({
        id: novoId("s"),
        inicio: isoLocal(inicio),
        fim: isoLocal(fim),
        dia,
        origem: "hoje",
        praticaId: m.praticaId,
        versao: m.versao,
        tom: e.ajustes.tom,
        segundos: m.segundos,
        conta: true,
        checkinId: checkin.id,
        antes: m.antes ?? null,
        depois: m.depois ?? null,
        registro: m.sinal || m.linha ? { sinal: m.sinal, linha: m.linha } : null,
        respostas: {}
      });
    }
    e.sessoes.sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
    e.checkins.sort((a, b) => Date.parse(a.em) - Date.parse(b.em));
  });
}

/** "Zerar a demonstração": um estado novo, com boasVindasEm preenchido, para ver a flor desde a semente. */
export function demoZerar() {
  if (!emDemo) return;
  const ajustes = structuredClone(estado.ajustes);
  definirDesvio(0);
  const novo = estadoNovo();
  novo.ajustes = { ...novo.ajustes, ...ajustes };
  novo.boasVindasEm = isoLocal(agora());
  novo.demo = { desvioDias: 0, trilhaLivre: false };
  estado = novo;
  gravarAgora();
  avisar("troca");
}
