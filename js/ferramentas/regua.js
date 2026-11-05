// A régua de 0 a 10 (T09 e 4.4), a mesma do experimento (T21).
//
//   import { criarRegua } from "../ferramentas/regua.js";
//   const r = criarRegua({ valor: null, fantasma: null, aoMudar: (v) => {} });
//   el.append(r.el);  r.valor()  // null até o primeiro toque
//   r.definir(4)
//
// Sem valor, o polegar não aparece. O primeiro toque (ou a primeira seta) marca o valor.
// Por baixo há um input type="range" de 0 a 10, passo 1, com aria-valuetext "7 de 10";
// as setas do teclado mudam o valor. O toque é lido pela posição na régua (o Safari do iPhone
// não move o polegar ao tocar no trilho).
//
// Também é a ferramenta de passo "regua" (contrato em js/LEIA.md): montar(el, ctx).

import { h, idUnico } from "../ui.js";

export function criarRegua({ valor = null, fantasma = null, aoMudar = null, rotulo = "Tensão, de 0 a 10" } = {}) {
  let atual = Number.isInteger(valor) ? valor : null;
  const input = h("input.regua-input", {
    type: "range", min: "0", max: "10", step: "1", value: String(atual ?? 5),
    "aria-label": rotulo
  });
  const cheio = h("span.regua-cheio");
  const marcas = h("span.regua-marcas", { "aria-hidden": "true" },
    ...Array.from({ length: 11 }, (_, i) => h("span.regua-marca", { style: `left: ${i * 10}%` })));
  const trilho = h("span.regua-trilho", { "aria-hidden": "true" }, cheio, marcas);
  if (Number.isInteger(fantasma)) {
    trilho.append(h("span.regua-fantasma", { "aria-hidden": "true", style: `left: ${fantasma * 10}%` }));
  }
  const pista = h("div.regua-pista", null, trilho, input);
  const legendas = h("div.regua-legendas", { "aria-hidden": "true" },
    h("span", null, "0 · nenhuma"),
    h("span", null, "5"),
    h("span", null, "10 · muita"));
  const el = h("div.regua", { class: atual === null ? "sem-valor" : "" }, pista, legendas);

  function mostrar() {
    el.classList.toggle("sem-valor", atual === null);
    el.style.setProperty("--regua-p", `${(atual ?? 0) * 10}%`);
    input.setAttribute("aria-valuetext", atual === null ? "sem valor" : `${atual} de 10`);
    if (atual !== null) input.value = String(atual);
  }

  function definir(v, avisar = true) {
    const novo = Math.max(0, Math.min(10, Math.round(Number(v))));
    if (!Number.isFinite(novo)) return;
    const mudou = novo !== atual;
    atual = novo;
    mostrar();
    if (avisar && mudou) aoMudar?.(atual);
  }

  function valorNoPonto(x) {
    const r = trilho.getBoundingClientRect();
    return ((x - r.left) / Math.max(1, r.width)) * 10;
  }

  let arrastando = false;
  pista.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    arrastando = true;
    pista.setPointerCapture?.(ev.pointerId);
    definir(valorNoPonto(ev.clientX));
    try { input.focus({ preventScroll: true }); } catch { /* nada */ }
    ev.preventDefault();
  });
  pista.addEventListener("pointermove", (ev) => {
    if (arrastando) definir(valorNoPonto(ev.clientX));
  });
  const soltar = () => { arrastando = false; };
  pista.addEventListener("pointerup", soltar);
  pista.addEventListener("pointercancel", soltar);

  input.addEventListener("keydown", (ev) => {
    const teclas = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 2, PageDown: -2 };
    if (ev.key === "Home") { ev.preventDefault(); definir(0); return; }
    if (ev.key === "End") { ev.preventDefault(); definir(10); return; }
    if (!(ev.key in teclas)) return;
    ev.preventDefault();
    if (atual === null) definir(5);
    else definir(atual + teclas[ev.key]);
  });
  input.addEventListener("input", () => definir(input.value));

  mostrar();
  return { el, input, valor: () => atual, definir: (v) => definir(v, false) };
}

/** A ferramenta de passo "regua": a pergunta do passo, a régua e "Seguir". */
export function montar(el, ctx) {
  const p = ctx.passo ?? {};
  const idPergunta = idUnico("regua");
  let seguir;
  const regua = criarRegua({
    valor: null,
    aoMudar: () => { seguir.disabled = false; }
  });
  seguir = h("button.botao-principal", { type: "button", disabled: true, onclick: () => ctx.concluir({ [p.chave ?? "regua"]: regua.valor() }) }, "Seguir");
  el.append(h("div.regua-tela",
    h("p.passo", { id: idPergunta }, p.pergunta ?? "Quanta tensão você sente agora?"),
    regua.el,
    h("div.regua-acoes", null, seguir)
  ));
  regua.input.setAttribute("aria-labelledby", idPergunta);
  return { destruir() {} };
}
