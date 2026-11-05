// O círculo de respiração (4.8, T10 e 6.6): dois anéis, o de fora parado em --linha, o de dentro em
// --cobre, que vai da escala 0,62 a 1 ao inspirar e volta ao soltar, com a curva senoidal de --ease-respiro.
// Com menos movimento, o tamanho não muda: a opacidade do anel de dentro vai de 0,35 a 0,9, e as
// palavras continuam. As palavras trocam com fade de 300 ms e são as únicas coisas anunciadas.
//
// Dois jeitos de usar:
//   const r = criarRespiracao({ padrao: "simples", puxa: 4, solta: 6, ciclos: 6 });
//   el.append(r.el);
//   r.atualizar(ms)            // quem tem o próprio relógio (o tocador) diz quantos ms passaram
// ou, sozinho, com o próprio relógio (o Respirar comigo do limite, o experimento):
//   r.tocar(); r.pausar(); r.continuar(); r.tempo()   // ms respirados, sem as pausas
//   r.destruir()
// Padrões: "simples" (puxa e solta), "duplo" (puxa, mais e solta: "Inspire", "Mais um pouco",
// "Solte devagar") e "aperta" (P05: o anel se fecha em puxa s, "Aperte", e abre em solta s, "Solte").
// Os três leem puxa, mais e solta do próprio passo; na P05, apertar 5 s e soltar 22 s, duas vezes.

import { h, menosMovimento } from "./ui.js";

const MENOR = 0.62;
const suave = (p) => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, p)))) / 2;

/** As fases de um ciclo: [{ ms, de, para, palavra }]. Cada fase anda no tempo dela, do começo ao fim. */
export function fasesDoCiclo({ padrao = "simples", puxa = 4, mais = 0, solta = 6, palavras = null } = {}) {
  const w = { puxa: "Inspire", solta: "Solte", ...(palavras ?? {}) };
  if (padrao === "duplo") {
    return [
      { ms: puxa * 1000, de: MENOR, para: 0.9, palavra: w.puxa },
      { ms: (mais || 1) * 1000, de: 0.9, para: 1, palavra: "Mais um pouco" },
      { ms: solta * 1000, de: 1, para: MENOR, palavra: "Solte devagar" }
    ];
  }
  if (padrao === "aperta") {
    return [
      { ms: puxa * 1000, de: 1, para: MENOR, palavra: "Aperte" },
      { ms: solta * 1000, de: MENOR, para: 1, palavra: w.solta }
    ];
  }
  return [
    { ms: puxa * 1000, de: MENOR, para: 1, palavra: w.puxa },
    { ms: solta * 1000, de: 1, para: MENOR, palavra: w.solta }
  ];
}

export function criarRespiracao({ padrao = "simples", puxa = 4, mais = 0, solta = 6, ciclos = null, palavras = null, classe = "" } = {}) {
  const fases = fasesDoCiclo({ padrao, puxa, mais, solta, palavras });
  const ciclo = fases.reduce((t, f) => t + f.ms, 0);
  const duracao = ciclos ? ciclos * ciclo : Infinity;

  const ns = "http://www.w3.org/2000/svg";
  const desenho = document.createElementNS(ns, "svg");
  desenho.setAttribute("viewBox", "0 0 200 200");
  desenho.setAttribute("aria-hidden", "true");
  const fora = document.createElementNS(ns, "circle");
  fora.setAttribute("class", "respiracao-fora");
  const dentro = document.createElementNS(ns, "circle");
  dentro.setAttribute("class", "respiracao-dentro");
  for (const c of [fora, dentro]) {
    c.setAttribute("cx", "100");
    c.setAttribute("cy", "100");
    c.setAttribute("r", "96");
  }
  desenho.append(fora, dentro);
  const palavra = h("p.respiracao-palavra", { "aria-live": "polite" });
  const el = h("div.respiracao", { class: classe }, h("div.respiracao-circulo", null, desenho, palavra));

  let palavraAtual = null;
  let trocaPendente = null;

  function trocarPalavra(nova) {
    if (nova === palavraAtual) return;
    palavraAtual = nova;
    clearTimeout(trocaPendente);
    if (!palavra.textContent) { palavra.textContent = nova; return; }
    palavra.classList.add("trocando");
    trocaPendente = setTimeout(() => {
      palavra.textContent = nova;
      palavra.classList.remove("trocando");
    }, 150);
  }

  /** Mostra o círculo no instante ms (desde o começo da respiração). */
  function atualizar(ms) {
    let t = Math.max(0, ms);
    let escala;
    let fase;
    if (t >= duracao) {
      fase = fases.at(-1);
      escala = fase.para;
    } else {
      t %= ciclo;
      let inicio = 0;
      fase = fases[0];
      for (const f of fases) {
        if (t < inicio + f.ms) { fase = f; break; }
        inicio += f.ms;
      }
      const passou = t - inicio;
      const p = passou / fase.ms;
      escala = fase.de + (fase.para - fase.de) * suave(p);
    }
    if (menosMovimento()) {
      // Parado num tamanho só, um pouco menor que o anel de fora, para os dois anéis aparecerem.
      dentro.style.transform = "scale(0.8)";
      const cheio = (escala - MENOR) / (1 - MENOR);
      dentro.style.opacity = String(0.35 + cheio * 0.55);
    } else {
      dentro.style.opacity = "";
      dentro.style.transform = `scale(${escala.toFixed(4)})`;
    }
    trocarPalavra(fase.palavra);
  }

  // Relógio próprio (para quem não tem um).
  let inicioMs = null;
  let pausadoDesde = null;
  let pausas = 0;
  let quadro = 0;
  const tempo = () => (inicioMs === null ? 0 : (pausadoDesde ?? Date.now()) - inicioMs - pausas);
  const laco = () => {
    atualizar(tempo());
    quadro = requestAnimationFrame(laco);
  };

  atualizar(0);

  return {
    el,
    duracao,
    ciclo,
    atualizar,
    tempo,
    tocar() {
      inicioMs = Date.now();
      pausadoDesde = null;
      pausas = 0;
      cancelAnimationFrame(quadro);
      laco();
    },
    pausar() {
      if (pausadoDesde === null && inicioMs !== null) pausadoDesde = Date.now();
    },
    continuar() {
      if (pausadoDesde !== null) {
        pausas += Date.now() - pausadoDesde;
        pausadoDesde = null;
      }
    },
    destruir() {
      cancelAnimationFrame(quadro);
      clearTimeout(trocaPendente);
      el.remove();
    }
  };
}
