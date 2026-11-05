// Ajudantes das telas do dia pesado (T19 a T21): Estou no limite, Descarregar a cabeça e Experimento.
// Nenhum texto de tela mora aqui. Movimento de 4.8; com html.menos-movimento, só opacidade em 200 ms.
//
//   palco(el)                       troca de vista com o movimento de 4.8, sem nada pular (as vistas
//                                   ficam empilhadas na mesma célula de grade enquanto uma sai e a outra entra)
//   ondaQueSeDesenha({ largura })   uma onda de traço que se desenha da esquerda para a direita
//   anelDeTempo({ tamanho })        um anel que se fecha (ou se enche) com .definir(fração)
//   relogio()                       tempo pelo relógio (Date.now()), sem as pausas
//   vigiarLimite({ aoAbrir, aoFechar, sinal })   avisa quando o Estou no limite abre e quando fecha
//   manterTelaLigada()              pede navigator.wakeLock e solta com .soltar()
//   copiarTexto(texto)              copia para a área de transferência; devolve true ou false
//   minutosESegundos(segundos)      "1:05"
//   seta()                          a seta do par antes e depois ("7", seta, "4"), em SVG, porque a seta não está nas fontes
//   veuDePausa({ aoContinuar, aoLimite, aoEncerrar })   o véu "Pausado." do tocador (T10), para fora dele

import { h, menosMovimento } from "./ui.js";
import { aoAbrirLimite } from "./app.js";

const NS = "http://www.w3.org/2000/svg";

function el(tag, atributos = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(atributos)) e.setAttribute(k, String(v));
  return e;
}

// ---------------------------------------------------------------- palco (troca de vista)

/**
 * Um palco para trocar de vista dentro de uma tela ou da camada do limite.
 * const p = palco(alvo); p.trocar((vista) => { vista.append(...) }, { focar: true, rolar: elementoQueRola })
 * A vista nova entra de opacidade 0 a 1, subindo 8 px, em 420 ms; a velha sai em 180 ms, só com opacidade.
 */
export function palco(alvo) {
  alvo.classList.add("foco-palco");
  let atual = null;
  return {
    get vista() { return atual; },
    trocar(construir, { focar = true, rolar = null, primeira = false } = {}) {
      const nova = h("div.foco-vista");
      construir(nova);
      const velha = atual;
      if (velha) {
        velha.classList.remove("entrando");
        velha.classList.add("saindo");
        velha.setAttribute("aria-hidden", "true");
        velha.inert = true;
        // O id do título passa para a vista nova (aria-labelledby da camada).
        for (const t of velha.querySelectorAll("[id]")) t.removeAttribute("id");
        setTimeout(() => velha.remove(), menosMovimento() ? 200 : 180);
      }
      alvo.append(nova);
      if (!primeira) {
        nova.classList.add("entrando");
        setTimeout(() => nova.classList.remove("entrando"), menosMovimento() ? 220 : 440);
      }
      atual = nova;
      if (rolar) rolar.scrollTop = 0;
      if (focar) focarEm(nova);
      return nova;
    }
  };
}

/** Leva o foco ao primeiro [data-foco-inicial] ou ao primeiro título da vista. */
export function focarEm(bloco) {
  const t = bloco.querySelector("[data-foco-inicial]") ?? bloco.querySelector("h1, h2");
  if (!t) return;
  if (!t.hasAttribute("tabindex") && !/^(INPUT|TEXTAREA|BUTTON|A)$/.test(t.tagName)) t.setAttribute("tabindex", "-1");
  try { t.focus({ preventScroll: true }); } catch { /* nada */ }
}

// ---------------------------------------------------------------- a onda que se desenha

/** O caminho de uma onda de traço, de x 0 a "largura", num quadro de altura 24 (linha de base em 12). */
function caminhoDaOnda(largura, meia = 46, altura = 5.5) {
  let d = `M2 12`;
  let x = 2;
  let sobe = true;
  while (x < largura - 2) {
    const passo = Math.min(meia, largura - 2 - x);
    const y = sobe ? 12 - altura : 12 + altura;
    const c1 = x + passo * 0.36;
    const c2 = x + passo * 0.64;
    d += ` C${c1.toFixed(1)} ${y} ${c2.toFixed(1)} ${y} ${(x + passo).toFixed(1)} 12`;
    x += passo;
    sobe = !sobe;
  }
  return d;
}

/**
 * Uma onda (o motivo das ondas, 4.6) em --cobre-claro, que se desenha em "dur" ms.
 * Com menos movimento, aparece pronta (só opacidade, 200 ms). Decorativa.
 */
export function ondaQueSeDesenha({ largura = 320, dur = 1000, classe = "" } = {}) {
  const s = el("svg", { viewBox: `0 0 ${largura} 24`, class: `foco-onda ${classe}`.trim(), "aria-hidden": "true", focusable: "false" });
  const p = el("path", { d: caminhoDaOnda(largura), class: "foco-onda-traco" });
  s.append(p);
  const desenhar = () => {
    if (menosMovimento()) {
      s.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "linear", fill: "backwards" });
      return;
    }
    let L = 0;
    try { L = p.getTotalLength(); } catch { L = largura * 1.2; }
    p.style.strokeDasharray = `${L} ${L}`;
    p.style.strokeDashoffset = String(L);
    const a = p.animate?.([{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
      { duration: dur, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" });
    if (a) a.onfinish = () => { p.style.strokeDashoffset = "0"; p.style.strokeDasharray = ""; };
    else p.style.strokeDashoffset = "0";
  };
  return { el: s, desenhar };
}

// ---------------------------------------------------------------- o anel de tempo

/**
 * Um anel num quadro de 200 x 200: o de fora parado em --linha e o anel de --cobre que se fecha conforme a
 * fração (0 a 1). Com menos movimento, o anel fica inteiro e só a opacidade acompanha a fração.
 * figura: um elemento (o horizonte, por exemplo) posto no centro. duplo: o círculo duplo (Desabafar).
 */
export function anelDeTempo({ tamanho = 200, figura = null, duplo = false, ondas = false, classe = "" } = {}) {
  const s = el("svg", { viewBox: "0 0 200 200", class: "foco-anel-svg", "aria-hidden": "true", focusable: "false" });
  const fora = el("circle", { cx: 100, cy: 100, r: 96, class: "foco-anel-fora" });
  s.append(fora);
  if (duplo) s.append(el("circle", { cx: 100, cy: 100, r: 88, class: "foco-anel-fora" }));
  if (ondas) {
    const g = el("g", { class: "foco-anel-ondas" });
    const linhas = [
      "M46 128 C60 121 72 121 86 128 S112 135 126 128 S142 121 154 126",
      "M58 141 C70 135 80 135 92 141 S114 147 126 141 S136 137 142 139",
      "M74 153 C82 149 90 149 98 153 S114 157 122 153"
    ];
    linhas.forEach((d, i) => g.append(el("path", { d, class: `foco-anel-onda foco-anel-onda-${i + 1}` })));
    s.append(g);
  }
  // pathLength 100 e traço sem vector-effect: o tracejado fica certo em qualquer tamanho (com
  // non-scaling-stroke, o Chromium mede o tracejado em pixels da tela). A largura vem do CSS (--anel).
  const anel = el("circle", { cx: 100, cy: 100, r: 96, pathLength: 100, class: "foco-anel-cheio", transform: "rotate(-90 100 100)" });
  anel.style.strokeDasharray = "100 100";
  anel.style.strokeDashoffset = "100";
  s.append(anel);
  // O tamanho em px fica em --anel-padrao; cada tela pode trocar --anel no CSS (por largura e altura).
  const caixa = h("div.foco-anel", { class: classe }, s);
  caixa.style.setProperty("--anel-padrao", String(tamanho));
  if (figura) caixa.append(h("div.foco-anel-figura", null, figura));
  let fracao = 0;
  function definir(f) {
    fracao = Math.max(0, Math.min(1, f));
    if (menosMovimento()) {
      anel.style.strokeDashoffset = "0";
      anel.style.opacity = String(0.25 + 0.75 * fracao);
    } else {
      anel.style.opacity = "";
      anel.style.strokeDashoffset = String(100 * (1 - fracao));
    }
  }
  definir(0);
  return { el: caixa, anel, definir, fracao: () => fracao };
}

// ---------------------------------------------------------------- relógio com pausas

/** Tempo pelo relógio (Date.now()), sem as pausas (Anexo A: nunca somando intervalos). */
export function relogio() {
  let inicio = null;
  let pausadoDesde = null;
  let pausas = 0;
  return {
    iniciar() { inicio = Date.now(); pausadoDesde = null; pausas = 0; },
    pausar() { if (inicio !== null && pausadoDesde === null) pausadoDesde = Date.now(); },
    continuar() { if (pausadoDesde !== null) { pausas += Date.now() - pausadoDesde; pausadoDesde = null; } },
    pausado: () => pausadoDesde !== null,
    comecou: () => inicio !== null,
    ms: () => (inicio === null ? 0 : (pausadoDesde ?? Date.now()) - inicio - pausas)
  };
}

// ---------------------------------------------------------------- o limite abrindo e fechando

/**
 * Avisa quando o Estou no limite abre (antes de aparecer) e quando a camada dele sai da tela.
 * Funciona também com a camada de reserva de app.js. Para sozinho quando "sinal" dispara.
 */
export function vigiarLimite({ aoAbrir = null, aoFechar = null, sinal = null } = {}) {
  let aberto = false;
  let observador = null;
  const camadas = document.getElementById("camadas");
  const temLimite = () => Boolean(camadas?.querySelector(".camada-limite:not(.fechando)"));
  const conferir = () => {
    if (aberto && !temLimite()) {
      aberto = false;
      observador?.disconnect();
      observador = null;
      try { aoFechar?.(); } catch (erro) { console.error(erro); }
    }
  };
  const parar = aoAbrirLimite(() => {
    if (aberto) return;
    aberto = true;
    try { aoAbrir?.(); } catch (erro) { console.error(erro); }
    if (camadas && !observador) {
      observador = new MutationObserver(() => conferir());
      observador.observe(camadas, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
      // Se o limite não chegou a abrir (um erro), o aviso de fechar vem mesmo assim.
      setTimeout(() => { if (aberto && !camadas.querySelector(".camada-limite")) conferir(); }, 1500);
    }
  });
  const desligar = () => { parar(); observador?.disconnect(); observador = null; };
  sinal?.addEventListener("abort", desligar, { once: true });
  return { desligar, aberto: () => aberto };
}

// ---------------------------------------------------------------- tela ligada

/** Mantém a tela ligada enquanto a pessoa respira ou fala (como o tocador, T10). Sem wakeLock, nada muda. */
export function manterTelaLigada() {
  let trava = null;
  let ativa = true;
  const pedir = async () => {
    try {
      if (!ativa || trava || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
      trava = await navigator.wakeLock.request("screen");
      trava.addEventListener?.("release", () => { trava = null; });
      if (!ativa) { trava.release?.(); trava = null; }
    } catch {
      trava = null;
    }
  };
  const aoVoltar = () => { if (document.visibilityState === "visible") pedir(); };
  document.addEventListener("visibilitychange", aoVoltar);
  pedir();
  return {
    soltar() {
      ativa = false;
      document.removeEventListener("visibilitychange", aoVoltar);
      try { trava?.release?.(); } catch { /* nada */ }
      trava = null;
    }
  };
}

// ---------------------------------------------------------------- copiar

export async function copiarTexto(texto) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch { /* tenta o outro jeito */ }
  try {
    const area = h("textarea", { readonly: true, "aria-hidden": "true", style: { position: "fixed", top: "-200px", opacity: "0" } });
    area.value = texto;
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- pequenos

/** 65 vira "1:05". */
export function minutosESegundos(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** A seta do par antes e depois (de 7 para 4), em traço, na cor do texto. Decorativa. */
export function seta() {
  const s = el("svg", { viewBox: "0 0 20 12", class: "foco-seta", "aria-hidden": "true", focusable: "false" });
  s.append(el("path", { d: "M2 6H17M12.5 1.75L17 6L12.5 10.25" }));
  return s;
}

/**
 * O véu de pausa do tocador (T10), para as telas que respiram fora dele: "Pausado.", "Continuar" e os
 * links "Estou no limite" e "Encerrar". Usa as classes de app.css (veu-pausa).
 */
export function veuDePausa({ aoContinuar, aoLimite, aoEncerrar }) {
  const botao = h("button.botao-principal", { type: "button", onclick: () => aoContinuar?.() }, "Continuar");
  const veu = h("div.veu-pausa", { role: "group", "aria-label": "Pausado." },
    h("p.titulo", { role: "status" }, "Pausado."),
    botao,
    h("button.link", { type: "button", onclick: () => aoLimite?.() }, "Estou no limite"),
    h("button.link", { type: "button", onclick: () => aoEncerrar?.() }, "Encerrar"));
  return {
    el: veu,
    mostrar(pai) {
      pai.append(veu);
      requestAnimationFrame(() => veu.classList.add("visivel"));
      setTimeout(() => { try { botao.focus({ preventScroll: true }); } catch { /* nada */ } }, 30);
    },
    esconder() {
      veu.classList.remove("visivel");
      setTimeout(() => veu.remove(), 200);
    }
  };
}
