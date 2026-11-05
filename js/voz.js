// A gravação do Desabafar e o banco dos áudios (7.1, 8.2, critério 10).
// Nada sai do aparelho: não há envio, transcrição nem cópia. Os áudios moram só no IndexedDB, nunca no
// estado do localStorage, e por isso nunca entram na cópia exportada (estado.js copia só o estado).
//
// Banco "sintonia-interior", versão 1, loja "audios" (chave "id"): { id, em, dia, segundos, tipo, blob },
// com tipo "audio/mp4" (iPhone) ou "audio/webm" (Chrome e Android).
// No modo de demonstração, os áudios ficam só na memória (somem ao desligar), para o estado real não mudar.
//
// Para o caderno (T18, Áudios):
//   listarAudios()              os áudios guardados, sem o blob, do mais novo ao mais antigo
//   obterAudio(id)              um áudio com o blob, ou null
//   apagarAudio(id)             apaga de verdade; devolve true se apagou
//   baixarAudio(id)             baixa o arquivo no aparelho ("desabafo-2026-11-05-1432.webm"); devolve o nome ou null
//   nomeDoArquivo(audio)        o nome do arquivo para baixar
// Para gravar (T19, Desabafar):
//   gravacaoPossivel()          true se o navegador grava (MediaRecorder e microfone)
//   pedirMicrofone()            pede o microfone (só depois do toque na chave); devolve o MediaStream ou lança erro
//   criarGravador(stream)       { iniciar(), parar() -> Promise<{ blob, tipo, segundos }>, nivel() 0 a 1, descartar() }
//   guardarAudio({ blob, tipo, segundos })   guarda e devolve o registro sem o blob (lança "QuotaExceededError" sem espaço)

import { emDemo, novoId, aoMudar, BANCO_DE_AUDIOS } from "./estado.js";
import { agora, diaLogico, isoLocal } from "./dia.js";

const LOJA = "audios";
const TIPOS = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];

// Desligar a demonstração leva junto os áudios dela.
aoMudar((motivo) => { if (motivo === "troca" && !emDemo) naMemoria.clear(); });

// ---------------------------------------------------------------- banco

function abrir() {
  return new Promise((resolver, rejeitar) => {
    let pedido;
    try {
      pedido = indexedDB.open(BANCO_DE_AUDIOS, 1);
    } catch (erro) {
      rejeitar(erro);
      return;
    }
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains(LOJA)) db.createObjectStore(LOJA, { keyPath: "id" });
    };
    pedido.onsuccess = () => {
      const db = pedido.result;
      // Se outro pedido (apagar tudo) precisar do banco, esta conexão sai da frente.
      db.onversionchange = () => db.close();
      resolver(db);
    };
    pedido.onerror = () => rejeitar(pedido.error);
    pedido.onblocked = () => rejeitar(new Error("banco bloqueado"));
  });
}

/** Abre, faz uma transação e fecha (nenhuma conexão fica aberta, para "Apagar tudo" não esperar). */
async function comLoja(modo, fazer) {
  const db = await abrir();
  try {
    return await new Promise((resolver, rejeitar) => {
      const tx = db.transaction(LOJA, modo);
      const loja = tx.objectStore(LOJA);
      let resultado;
      const p = fazer(loja);
      if (p) {
        p.onsuccess = () => { resultado = p.result; };
        p.onerror = () => rejeitar(p.error);
      }
      tx.oncomplete = () => resolver(resultado);
      tx.onerror = () => rejeitar(tx.error);
      tx.onabort = () => rejeitar(tx.error ?? new Error("transação abortada"));
    });
  } finally {
    db.close();
  }
}

// No modo de demonstração: { id: registro com blob }.
const naMemoria = new Map();

const semBlob = ({ blob, ...resto }) => resto;
const maisNovoPrimeiro = (a, b) => String(b.em).localeCompare(String(a.em));

function comoBlob(registro) {
  if (!registro) return null;
  if (registro.blob instanceof Blob) return registro;
  // Guardado como ArrayBuffer (navegador que não aceitou o Blob no banco).
  if (registro.blob) return { ...registro, blob: new Blob([registro.blob], { type: registro.tipo }) };
  return registro;
}

/** Os áudios guardados, sem o blob, do mais novo ao mais antigo. */
export async function listarAudios() {
  if (emDemo) return [...naMemoria.values()].map(semBlob).sort(maisNovoPrimeiro);
  try {
    const todos = (await comLoja("readonly", (loja) => loja.getAll())) ?? [];
    return todos.map(semBlob).sort(maisNovoPrimeiro);
  } catch {
    return [];
  }
}

/** Um áudio guardado, com o blob, ou null. */
export async function obterAudio(id) {
  if (emDemo) return naMemoria.get(id) ?? null;
  try {
    return comoBlob(await comLoja("readonly", (loja) => loja.get(id))) ?? null;
  } catch {
    return null;
  }
}

/** Apaga um áudio de verdade. Devolve true se apagou. */
export async function apagarAudio(id) {
  if (emDemo) return naMemoria.delete(id);
  try {
    const existia = await comLoja("readonly", (loja) => loja.count(id));
    if (!existia) return false;
    await comLoja("readwrite", (loja) => loja.delete(id));
    return true;
  } catch {
    return false;
  }
}

/**
 * Guarda uma gravação neste aparelho. Devolve o registro sem o blob.
 * Sem espaço, lança um erro com name "QuotaExceededError" (a tela mostra o aviso de 3.28).
 */
export async function guardarAudio({ blob, tipo, segundos }) {
  const instante = agora();
  const registro = {
    id: novoId("a"),
    em: isoLocal(instante),
    dia: diaLogico(instante),
    segundos: Math.max(0, Math.round(Number(segundos) || 0)),
    tipo: tipoBase(tipo || blob?.type || ""),
    blob
  };
  if (emDemo) {
    naMemoria.set(registro.id, registro);
    return semBlob(registro);
  }
  try {
    await comLoja("readwrite", (loja) => loja.put(registro));
  } catch (erro) {
    if (ehFaltaDeEspaco(erro)) throw espacoCheio();
    // Alguns navegadores não guardam Blob no banco: guarda os bytes, com o mesmo tipo.
    try {
      const bytes = await blob.arrayBuffer();
      await comLoja("readwrite", (loja) => loja.put({ ...registro, blob: bytes }));
    } catch (erro2) {
      if (ehFaltaDeEspaco(erro2)) throw espacoCheio();
      throw erro2;
    }
  }
  return semBlob(registro);
}

function ehFaltaDeEspaco(erro) {
  return Boolean(erro) && (erro.name === "QuotaExceededError" || erro.code === 22 || /quota/i.test(String(erro.message)));
}

function espacoCheio() {
  const e = new Error("sem espaço");
  e.name = "QuotaExceededError";
  return e;
}

// ---------------------------------------------------------------- baixar

const tipoBase = (tipo) => String(tipo).split(";")[0].trim() || "audio/webm";

function extensao(tipo) {
  const t = tipoBase(tipo);
  if (t === "audio/mp4") return "m4a";
  if (t === "audio/ogg") return "ogg";
  return "webm";
}

/** "desabafo-2026-11-05-1432.webm" (o dia lógico e a hora em que foi gravado). */
export function nomeDoArquivo(audio) {
  const hora = /T(\d\d):(\d\d)/.exec(String(audio?.em ?? ""));
  return `desabafo-${audio?.dia ?? diaLogico()}${hora ? `-${hora[1]}${hora[2]}` : ""}.${extensao(audio?.tipo)}`;
}

/** Baixa um áudio no próprio aparelho (Blob e link com download, sem rede). Devolve o nome ou null. */
export async function baixarAudio(id) {
  const audio = await obterAudio(id);
  if (!audio?.blob) return null;
  const nome = nomeDoArquivo(audio);
  const url = URL.createObjectURL(audio.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return nome;
}

// ---------------------------------------------------------------- gravar

/** O primeiro tipo que o navegador grava: audio/mp4 (Safari) e depois audio/webm;codecs=opus. */
export function tipoDeGravacao() {
  try {
    if (typeof MediaRecorder === "undefined") return null;
    if (typeof MediaRecorder.isTypeSupported !== "function") return "";
    return TIPOS.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  } catch {
    return null;
  }
}

export function gravacaoPossivel() {
  return Boolean(navigator.mediaDevices?.getUserMedia) && tipoDeGravacao() !== null;
}

/** Pede o microfone. Só depois que a pessoa liga a chave (Anexo A). Lança erro se não houver acesso. */
export async function pedirMicrofone() {
  if (!gravacaoPossivel()) throw new Error("sem gravação neste navegador");
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: false
  });
}

/**
 * Um gravador para o microfone já liberado.
 * nivel(): o volume da voz agora, de 0 a 1 (para o anel acompanhar). descartar(): para tudo e joga fora.
 * contexto: um AudioContext criado no toque da pessoa (o iPhone só deixa assim); sem ele, nivel() fica em 0.
 */
export function criarGravador(stream, { contexto = null } = {}) {
  const tipo = tipoDeGravacao();
  let gravador;
  try {
    gravador = tipo ? new MediaRecorder(stream, { mimeType: tipo }) : new MediaRecorder(stream);
  } catch {
    gravador = new MediaRecorder(stream);
  }
  const pedacos = [];
  let inicio = 0;
  let fim = 0;
  let parando = null;

  gravador.addEventListener("dataavailable", (ev) => { if (ev.data && ev.data.size > 0) pedacos.push(ev.data); });

  // O volume, pela análise do próprio aparelho (Web Audio), sem enviar nada.
  let analisador = null;
  let fonte = null;
  let dados = null;
  try {
    if (contexto) {
      fonte = contexto.createMediaStreamSource(stream);
      analisador = contexto.createAnalyser();
      analisador.fftSize = 512;
      dados = new Uint8Array(analisador.fftSize);
      fonte.connect(analisador);
      if (contexto.state === "suspended") contexto.resume().catch(() => {});
    }
  } catch {
    analisador = null;
  }

  function soltarMicrofone() {
    try { fonte?.disconnect(); } catch { /* nada */ }
    try { contexto?.close?.(); } catch { /* nada */ }
    for (const faixa of stream.getTracks()) {
      try { faixa.stop(); } catch { /* nada */ }
    }
  }

  return {
    tipo: () => tipoBase(gravador.mimeType || tipo || "audio/webm"),
    iniciar() {
      inicio = Date.now();
      gravador.start(1000);
    },
    /** Para e devolve { blob, tipo, segundos }. */
    parar() {
      if (parando) return parando;
      parando = new Promise((resolver) => {
        const terminar = () => {
          fim = fim || Date.now();
          soltarMicrofone();
          const t = tipoBase(gravador.mimeType || tipo || "audio/webm");
          resolver({ blob: new Blob(pedacos, { type: t }), tipo: t, segundos: Math.round((fim - inicio) / 1000) });
        };
        fim = Date.now();
        if (gravador.state === "inactive") { terminar(); return; }
        gravador.addEventListener("stop", terminar, { once: true });
        try { gravador.stop(); } catch { terminar(); }
      });
      return parando;
    },
    segundos: () => Math.round(((fim || Date.now()) - inicio) / 1000),
    nivel() {
      if (!analisador || !dados) return 0;
      try {
        analisador.getByteTimeDomainData(dados);
        let soma = 0;
        for (let i = 0; i < dados.length; i++) {
          const v = (dados[i] - 128) / 128;
          soma += v * v;
        }
        return Math.min(1, Math.sqrt(soma / dados.length) * 4);
      } catch {
        return 0;
      }
    },
    descartar() {
      try { if (gravador.state !== "inactive") gravador.stop(); } catch { /* nada */ }
      pedacos.length = 0;
      soltarMicrofone();
    }
  };
}
