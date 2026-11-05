// O som (seção 4.9): o sino e o toque de passo, gerados no próprio aparelho com Web Audio,
// sem arquivo e sem rede. Desligado por padrão (ajustes.som). O contexto de áudio só nasce
// depois de um toque da pessoa: chame prepararSom() dentro de um clique (o app já faz isso
// em todo toque, ver app.js).
//
//   import { tocarSino, tocarToque } from "../som.js";
//   tocarSino(1)          // começo: uma batida (só toca se ajustes.som estiver ligado)
//   tocarSino(2)          // fim: duas batidas, com 1,4 s entre elas
//   tocarToque()          // troca de passo "sem tela"
//   tocarSino(1, { sempre: true })   // "Ouvir o sino" em Ajustes: toca mesmo com a chave desligada

import { estado } from "./estado.js";

let contexto = null;

/** Cria (ou acorda) o contexto de áudio. Só funciona dentro de um toque da pessoa. */
export function prepararSom() {
  try {
    if (!contexto) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      contexto = new Ctx();
    }
    if (contexto.state === "suspended") contexto.resume().catch(() => {});
  } catch {
    contexto = null;
  }
  return contexto;
}

function ligado(sempre) {
  return sempre || Boolean(estado?.ajustes?.som);
}

/** Uma batida do sino: quatro senoides, base 330 Hz, ataque de 8 ms, queda exponencial. */
function batida(ctx, quando) {
  const PICO = 0.22;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.value = 3200;
  filtro.connect(ctx.destination);
  const parciais = [
    { razao: 1, ganho: 1, queda: 4.2 },
    { razao: 2.0, ganho: 0.35, queda: 2.4 },
    { razao: 2.76, ganho: 0.2, queda: 2.4 },
    { razao: 5.4, ganho: 0.06, queda: 2.4 }
  ];
  for (const p of parciais) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 330 * p.razao;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, quando);
    g.gain.linearRampToValueAtTime(PICO * p.ganho, quando + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, quando + p.queda);
    osc.connect(g);
    g.connect(filtro);
    osc.start(quando);
    osc.stop(quando + p.queda + 0.05);
  }
}

/** O sino: 1 batida no começo, 2 no fim (1,4 s entre elas). */
export function tocarSino(batidas = 1, { sempre = false } = {}) {
  if (!ligado(sempre)) return;
  const ctx = prepararSom();
  if (!ctx) return;
  const t0 = ctx.currentTime + 0.03;
  for (let i = 0; i < batidas; i++) batida(ctx, t0 + i * 1.4);
}

/** O toque de passo: uma senoide de 660 Hz, ganho 0,08, queda de 0,8 s. */
export function tocarToque({ sempre = false } = {}) {
  if (!ligado(sempre)) return;
  const ctx = prepararSom();
  if (!ctx) return;
  const t = ctx.currentTime + 0.02;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 660;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.08, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.85);
}
