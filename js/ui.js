// Ajudantes de interface: montar elementos, folhas, camadas, aviso curto, foco preso,
// a pilha de voltas (Voltar do aparelho e Esc) e a troca de quadro com o movimento de 4.8.
// Nenhum texto de tela mora aqui, a não ser os nomes acessíveis comuns ("Fechar").

import { estado } from "./estado.js";

// ---------------------------------------------------------------- montar elementos

/**
 * h("button.botao-principal", { type: "button", onclick: fn }, "Começar")
 * - "tag.classe.outra" no primeiro argumento; atributos num objeto; filhos em texto, nós ou listas.
 * - on* com função vira addEventListener (nunca atributo: a política de segurança proíbe).
 * - html: só para texto de SVG gerado pelo próprio app (nunca texto da pessoa).
 */
export function h(seletor, atributos = null, ...filhos) {
  const [tag, ...classes] = String(seletor).split(".");
  const el = /^(svg|path|circle|g|line|ellipse|rect|polyline|text)$/.test(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag || "div");
  if (classes.length) el.setAttribute("class", classes.join(" "));
  if (atributos && (typeof atributos !== "object" || atributos instanceof Node || Array.isArray(atributos))) {
    filhos.unshift(atributos);
    atributos = null;
  }
  if (atributos) {
    for (const [k, v] of Object.entries(atributos)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class" || k === "classe") {
        el.setAttribute("class", [el.getAttribute("class"), v].filter(Boolean).join(" "));
      } else if (k === "html") {
        el.innerHTML = v;
      } else if (k === "texto") {
        el.textContent = v;
      } else if (k === "style" && typeof v === "object") {
        Object.assign(el.style, v);
      } else if (k === "dataset") {
        Object.assign(el.dataset, v);
      } else if (k.startsWith("on") && typeof v === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === "value" || k === "checked" || k === "selected") {
        el[k] = v;
      } else if (v === true) {
        el.setAttribute(k, "");
      } else {
        el.setAttribute(k, String(v));
      }
    }
  }
  anexar(el, filhos);
  return el;
}

function anexar(el, filhos) {
  for (const f of filhos.flat(Infinity)) {
    if (f === null || f === undefined || f === false || f === "") continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
}

/** Texto de SVG (dos desenhos) para um elemento. */
export function svg(texto) {
  if (!texto) return document.createTextNode("");
  const t = document.createElement("template");
  t.innerHTML = String(texto).trim();
  return t.content.firstElementChild ?? document.createTextNode("");
}

export function limpar(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

/** Texto com *trechos em itálico* (as frases ditas por dentro, 7.8), sem HTML. */
export function textoRico(texto) {
  const frag = document.createDocumentFragment();
  const partes = String(texto ?? "").split(/(\*[^*]+\*)/g);
  for (const p of partes) {
    if (!p) continue;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) frag.append(h("em", null, p.slice(1, -1)));
    else frag.append(document.createTextNode(p));
  }
  return frag;
}

/** Valor por tom: { pratico, espiritual } escolhe pelo tom; outro valor volta igual. */
export function porTom(valor, tom = estado?.ajustes?.tom ?? "pratico") {
  if (valor && typeof valor === "object" && !Array.isArray(valor) && ("pratico" in valor || "espiritual" in valor)) {
    return valor[tom] ?? valor.pratico ?? valor.espiritual;
  }
  return valor;
}

// Texto com {chaves}: use o preencher de conteudo/praticas.js (entende {chave|minuscula},
// {chave|inicial} e caminhos com ponto, como {dia3.dimensao} e {fazBem.musica}). Ele não mora
// aqui de propósito: ui.js não carrega o conteúdo, para o Estou no limite abrir mesmo se o
// conteúdo falhar.

/** ["a", "b", "c"] vira "a, b e c". */
export function juntar(lista) {
  const l = lista.filter((x) => x !== null && x !== undefined && x !== "");
  if (l.length <= 1) return l.join("");
  return `${l.slice(0, -1).join(", ")} e ${l.at(-1)}`;
}

/** plural(1, "dia", "dias") vira "1 dia". */
export function plural(n, um, varios) {
  return `${n} ${n === 1 ? um : varios}`;
}

let contadorDeIds = 0;
export function idUnico(prefixo = "u") {
  contadorDeIds += 1;
  return `${prefixo}-${contadorDeIds}`;
}

// ---------------------------------------------------------------- desenhos (com reserva)
// app.js carrega js/desenhos.js e js/flor.js e os registra aqui. Se um deles falhar, o app
// continua de pé, sem o desenho. As telas podem importar os módulos direto ou usar "desenhos".

let modDesenhos = null;
let modFlor = null;

export function registrarDesenhos(d, f) {
  modDesenhos = d ?? null;
  modFlor = f ?? null;
}

function chamar(mod, nome, args) {
  try {
    const fn = mod?.[nome];
    return typeof fn === "function" ? (fn(...args) ?? "") : "";
  } catch (erro) {
    console.error(`desenho ${nome}`, erro);
    return "";
  }
}

export const desenhos = {
  icone: (...a) => chamar(modDesenhos, "icone", a),
  figura: (...a) => chamar(modDesenhos, "figura", a),
  lotusMarca: (...a) => chamar(modDesenhos, "lotusMarca", a),
  lotusComOndas: (...a) => chamar(modDesenhos, "lotusComOndas", a),
  autoabraco: (...a) => chamar(modDesenhos, "autoabraco", a),
  mapaCuidado: (...a) => chamar(modDesenhos, "mapaCuidado", a),
  circuloDuplo: (...a) => chamar(modDesenhos, "circuloDuplo", a),
  florSVG: (...a) => chamar(modFlor, "florSVG", a),
  rotuloDaFlor: (...a) => chamar(modFlor, "rotuloDaFlor", a),
  miniaturaFlor: (...a) => chamar(modFlor, "miniaturaFlor", a),
  lagoSVG: (...a) => chamar(modFlor, "lagoSVG", a),
  get ROTULOS() { return modFlor?.ROTULOS ?? ["SEMENTE", "BROTO", "BROTO", "BOTÃO", "BOTÃO", "BOTÃO", "BOTÃO", "LÓTUS"]; }
};

/** Um ícone já como elemento (aria-hidden quando não tem rótulo). */
export function iconeEl(nome, opcoes = {}) {
  const el = svg(desenhos.icone(nome, opcoes));
  if (el instanceof Element) el.classList.add("icone");
  return el;
}

// ---------------------------------------------------------------- movimento

/** true quando o movimento reduzido vale (classe no <html>, aplicada por app.js). */
export function menosMovimento() {
  return document.documentElement.classList.contains("menos-movimento");
}

export const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Troca o conteúdo de "alvo" por um quadro novo, com o movimento de 4.8: o novo entra de
 * opacidade 0 a 1 subindo 8 px em 420 ms; o velho sai em 180 ms, só com opacidade.
 * construir(quadro) pode ser assíncrona. Devolve o quadro novo.
 */
export async function trocar(alvo, construir, { focar = true, rolar = true } = {}) {
  const novo = h("div.quadro");
  // O que estava solto no alvo (o primeiro desenho de uma tela) vira um quadro, para sair com o movimento.
  const soltos = [...alvo.childNodes].filter((c) => !(c instanceof Element && c.classList.contains("quadro")));
  if (soltos.some((c) => c instanceof Element || c.textContent.trim())) {
    const embrulho = h("div.quadro");
    alvo.insertBefore(embrulho, alvo.firstChild);
    embrulho.append(...soltos);
  } else {
    soltos.forEach((c) => c.remove());
  }
  await construir(novo);
  const velhos = [...alvo.children].filter((c) => c.classList.contains("quadro"));
  for (const v of velhos) {
    if (v.classList.contains("quadro-saindo")) { v.remove(); continue; }
    v.classList.add("quadro-saindo");
    v.setAttribute("aria-hidden", "true");
    v.inert = true;
    setTimeout(() => v.remove(), menosMovimento() ? 200 : 180);
  }
  alvo.append(novo);
  novo.classList.add("quadro-entrando");
  setTimeout(() => novo.classList.remove("quadro-entrando"), menosMovimento() ? 220 : 440);
  if (rolar) window.scrollTo({ top: 0, behavior: "instant" });
  if (focar) focarTitulo(novo);
  return novo;
}

/** Leva o foco ao primeiro título do bloco (para o leitor de tela anunciar a tela nova). */
export function focarTitulo(bloco) {
  const t = bloco.querySelector("h1, [data-foco-inicial]") ?? bloco.querySelector("h2");
  if (!t) return;
  if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
  try { t.focus({ preventScroll: true }); } catch { /* nada */ }
}

// ---------------------------------------------------------------- pilha de voltas

// Cada folha, camada ou tela que precisa segurar o Voltar do aparelho empilha uma volta.
// Ela cria uma entrada no histórico com o mesmo endereço; o Voltar do aparelho tira a de cima
// e chama a função dela. Esc faz o mesmo (app.js chama fecharTopo()).
const pilha = [];
let ignorar = 0;
let travessia = Promise.resolve();
let soltarTravessia = null;

function irNoHistorico(delta) {
  travessia = travessia.then(() => new Promise((resolver) => {
    ignorar += 1;
    soltarTravessia = resolver;
    history.go(delta);
    setTimeout(() => { if (soltarTravessia === resolver) { ignorar = Math.max(0, ignorar - 1); soltarTravessia = null; resolver(); } }, 600);
  }));
  return travessia;
}

addEventListener("popstate", () => {
  if (ignorar > 0) {
    ignorar -= 1;
    const r = soltarTravessia;
    soltarTravessia = null;
    r?.();
    return;
  }
  // Só é o Voltar de uma volta empilhada quando a entrada a que se chegou é da mesma tela.
  // Uma navegação nova (outro endereço) chega sem estado; essa fica com o roteador (app.js).
  const topo = pilha.at(-1);
  const st = history.state;
  if (!topo || !topo.empurrada || !st || st.tela !== topo.tela || st.volta === topo.id) return;
  pilha.pop();
  topo.empurrada = false;
  try { topo.fn("voltar"); } catch (erro) { console.error(erro); }
});

/**
 * Segura o próximo Voltar (do aparelho ou Esc): em vez de mudar de tela, chama fn.
 * Devolve tirar(), para quando a coisa fecha por outro caminho (o "×", por exemplo).
 */
export function empilharVolta(fn) {
  const item = { id: idUnico("v"), fn, empurrada: false };
  pilha.push(item);
  travessia = travessia.then(() => {
    if (!pilha.includes(item)) return;
    item.tela = history.state?.tela;
    history.pushState({ ...(history.state ?? {}), volta: item.id }, "", location.href);
    item.empurrada = true;
  });
  return function tirar() {
    const i = pilha.indexOf(item);
    if (i === -1) return travessia;
    const acima = pilha.splice(i);
    const empurradas = acima.filter((x) => x.empurrada).length;
    acima.forEach((x) => { x.empurrada = false; });
    if (empurradas > 0) return irNoHistorico(-empurradas);
    return travessia;
  };
}

/** Esc: fecha o que estiver por cima. Devolve false se a pilha estava vazia. */
export function fecharTopo() {
  const topo = pilha.at(-1);
  if (!topo) return false;
  pilha.pop();
  const estava = topo.empurrada;
  topo.empurrada = false;
  if (estava) irNoHistorico(-1);
  try { topo.fn("esc"); } catch (erro) { console.error(erro); }
  return true;
}

export const temVoltaEmpilhada = () => pilha.length > 0;

/** Desfaz todas as voltas (antes de navegar para outra tela com coisas abertas). */
export async function desempilharTudo() {
  if (!pilha.length) return travessia;
  const todas = pilha.splice(0);
  const empurradas = todas.filter((x) => x.empurrada).length;
  for (const x of todas.reverse()) {
    x.empurrada = false;
    try { x.fn("navegar"); } catch (erro) { console.error(erro); }
  }
  if (empurradas) await irNoHistorico(-empurradas);
  return travessia;
}

/** A tela mudou por outro caminho (um endereço digitado, por exemplo): fecha tudo sem mexer no histórico. */
export function limparPilha() {
  const todas = pilha.splice(0);
  for (const x of todas.reverse()) {
    x.empurrada = false;
    try { x.fn("navegar"); } catch (erro) { console.error(erro); }
  }
}

/** Espera o histórico ficar quieto (depois de fechar folhas, antes de navegar). */
export const historicoQuieto = () => travessia;

// ---------------------------------------------------------------- foco preso e modais

const modais = [];

function focaveis(el) {
  return [...el.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((x) => !x.closest("[inert]") && x.getClientRects().length > 0);
}

/** Prende o Tab dentro de el. Devolve a função que solta. */
export function prenderFoco(el) {
  const aoTeclar = (ev) => {
    if (ev.key !== "Tab") return;
    const lista = focaveis(el);
    if (!lista.length) { ev.preventDefault(); return; }
    const primeiro = lista[0];
    const ultimo = lista.at(-1);
    if (ev.shiftKey && (document.activeElement === primeiro || !el.contains(document.activeElement))) {
      ev.preventDefault();
      ultimo.focus();
    } else if (!ev.shiftKey && (document.activeElement === ultimo || !el.contains(document.activeElement))) {
      ev.preventDefault();
      primeiro.focus();
    }
  };
  el.addEventListener("keydown", aoTeclar);
  return () => el.removeEventListener("keydown", aoTeclar);
}

function aplicarInert() {
  const app = document.getElementById("app");
  const topo = modais.at(-1);
  if (app) app.inert = Boolean(topo);
  modais.forEach((m) => { m.inert = m !== topo; });
}

function abrirModal(el) {
  modais.push(el);
  aplicarInert();
}

function fecharModal(el) {
  const i = modais.indexOf(el);
  if (i !== -1) modais.splice(i, 1);
  aplicarInert();
}

export const algumModalAberto = () => modais.length > 0;

// ---------------------------------------------------------------- folha

/**
 * Abre uma folha que sobe de baixo (3.0).
 * abrirFolha({ titulo, rotulo, conteudo(corpo, folha), aoFechar, classe })
 * - titulo: texto do <h2> (Fraunces); rotulo: texto pequeno acima dele (opcional).
 * - conteudo recebe o corpo da folha e o objeto { fechar }.
 * Fecha tocando fora, arrastando para baixo, no "×", com Esc ou com o Voltar do aparelho.
 * Devolve { el, corpo, fechar(), fechada (Promise) }.
 */
export function abrirFolha({ titulo = "", rotulo = null, conteudo = null, aoFechar = null, classe = "" } = {}) {
  const camadas = document.getElementById("camadas");
  const quemAbriu = document.activeElement;
  const idTitulo = idUnico("folha-titulo");
  let fechada = false;
  let resolverFechada;
  const promessa = new Promise((r) => { resolverFechada = r; });

  const fundo = h("div.folha-fundo", { "aria-hidden": "true" });
  const corpo = h("div.folha-corpo");
  const botaoFechar = h("button.icone-botao.folha-fechar", { type: "button", "aria-label": "Fechar" }, iconeEl("fechar"));
  const folha = h("div.folha", { role: "dialog", "aria-modal": "true", "aria-labelledby": idTitulo, class: classe },
    h("div.folha-alca", { "aria-hidden": "true" }),
    botaoFechar,
    corpo
  );
  const cabeca = h("div.folha-cabeca",
    rotulo ? h("p.rotulo", null, rotulo) : null,
    h("h2.titulo-folha", { id: idTitulo, tabindex: "-1" }, titulo)
  );
  corpo.append(cabeca);
  const envoltorio = h("div.folha-envoltorio", null, fundo, folha);
  camadas.append(envoltorio);

  const api = { el: folha, corpo, fechar, fechada: promessa, titulo: cabeca.querySelector("h2") };
  if (conteudo) conteudo(corpo, api);

  const soltar = prenderFoco(folha);
  abrirModal(envoltorio);
  const tirar = empilharVolta(() => fechar({ jaSaiuDoHistorico: true }));
  requestAnimationFrame(() => {
    envoltorio.classList.add("aberta");
    try { api.titulo.focus({ preventScroll: true }); } catch { /* nada */ }
  });

  function fechar({ jaSaiuDoHistorico = false } = {}) {
    if (fechada) return promessa;
    fechada = true;
    soltar();
    if (!jaSaiuDoHistorico) tirar();
    envoltorio.classList.remove("aberta");
    envoltorio.classList.add("fechando");
    fecharModal(envoltorio);
    setTimeout(() => envoltorio.remove(), menosMovimento() ? 200 : 320);
    if (quemAbriu && document.contains(quemAbriu)) {
      try { quemAbriu.focus({ preventScroll: true }); } catch { /* nada */ }
    }
    try { aoFechar?.(); } catch (erro) { console.error(erro); }
    resolverFechada();
    return promessa;
  }

  fundo.addEventListener("click", () => fechar());
  botaoFechar.addEventListener("click", () => fechar());
  arrastarParaFechar(folha, () => fechar());
  return api;
}

function arrastarParaFechar(folha, fechar) {
  let inicioY = null;
  let dy = 0;
  let t0 = 0;
  folha.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    if (ev.target.closest("button, a, input, textarea, select, [role=slider], .regua")) return;
    const corpo = folha.querySelector(".folha-corpo");
    if (corpo && corpo.scrollTop > 0 && !ev.target.closest(".folha-alca")) return;
    inicioY = ev.clientY;
    dy = 0;
    t0 = performance.now();
    folha.setPointerCapture?.(ev.pointerId);
  });
  folha.addEventListener("pointermove", (ev) => {
    if (inicioY === null) return;
    dy = Math.max(0, ev.clientY - inicioY);
    if (dy > 4) {
      folha.style.transition = "none";
      folha.style.transform = `translateY(${dy}px)`;
    }
  });
  const soltar = () => {
    if (inicioY === null) return;
    const velocidade = dy / Math.max(1, performance.now() - t0);
    inicioY = null;
    folha.style.transition = "";
    folha.style.transform = "";
    if (dy > 96 || (dy > 32 && velocidade > 0.6)) fechar();
  };
  folha.addEventListener("pointerup", soltar);
  folha.addEventListener("pointercancel", soltar);
}

// ---------------------------------------------------------------- camada

/**
 * Abre uma camada de tela inteira por cima de tudo (o Estou no limite, 3.0 e T19).
 * abrirCamada({ classe, rotuloFechar, conteudo(corpo, camada), aoFechar, idTitulo })
 * - entra com fade de 200 ms e nada mais; role="dialog" e aria-modal; o "×" fica no alto à esquerda.
 * - idTitulo: o id do título que o conteúdo cria (aria-labelledby; recebe o foco ao abrir).
 * Devolve { el, corpo, fechar(), fechada }.
 */
export function abrirCamada({ classe = "", rotuloFechar = "Fechar", conteudo = null, aoFechar = null, idTitulo = null } = {}) {
  const camadas = document.getElementById("camadas");
  const quemAbriu = document.activeElement;
  let fechada = false;
  let resolverFechada;
  const promessa = new Promise((r) => { resolverFechada = r; });
  const idT = idTitulo ?? idUnico("camada-titulo");
  const botaoFechar = h("button.icone-botao.camada-fechar", { type: "button", "aria-label": rotuloFechar }, iconeEl("fechar"));
  const corpo = h("div.camada-corpo");
  const camada = h("div.camada", { role: "dialog", "aria-modal": "true", "aria-labelledby": idT, class: classe },
    h("div.camada-alto", null, botaoFechar),
    corpo
  );
  camadas.append(camada);
  const api = { el: camada, corpo, fechar, fechada: promessa, idTitulo: idT };
  if (conteudo) conteudo(corpo, api);
  const soltar = prenderFoco(camada);
  abrirModal(camada);
  const tirar = empilharVolta(() => fechar({ jaSaiuDoHistorico: true }));
  requestAnimationFrame(() => {
    camada.classList.add("aberta");
    const t = document.getElementById(idT) ?? camada.querySelector("h1, h2");
    if (t) {
      if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
      try { t.focus({ preventScroll: true }); } catch { /* nada */ }
    }
  });

  function fechar({ jaSaiuDoHistorico = false } = {}) {
    if (fechada) return promessa;
    fechada = true;
    soltar();
    if (!jaSaiuDoHistorico) tirar();
    camada.classList.remove("aberta");
    camada.classList.add("fechando");
    fecharModal(camada);
    setTimeout(() => camada.remove(), 200);
    if (quemAbriu && document.contains(quemAbriu)) {
      try { quemAbriu.focus({ preventScroll: true }); } catch { /* nada */ }
    }
    try { aoFechar?.(); } catch (erro) { console.error(erro); }
    resolverFechada();
    return promessa;
  }
  botaoFechar.addEventListener("click", () => fechar());
  return api;
}

// ---------------------------------------------------------------- aviso curto

let tempoDoAviso = null;

/** Aviso curto (toast): embaixo, acima das abas, por 3 s, role="status" (3.0). */
export function avisoCurto(texto) {
  const el = document.getElementById("aviso-curto");
  if (!el) return;
  clearTimeout(tempoDoAviso);
  el.textContent = "";
  el.classList.remove("visivel");
  requestAnimationFrame(() => {
    el.textContent = texto;
    el.classList.add("visivel");
  });
  tempoDoAviso = setTimeout(() => {
    el.classList.remove("visivel");
    setTimeout(() => { if (!el.classList.contains("visivel")) el.textContent = ""; }, 400);
  }, 3000);
}

// ---------------------------------------------------------------- anúncios

let regiaoDeAnuncio = null;

/** Anuncia um texto ao leitor de tela, sem mostrar nada. */
export function anunciar(texto) {
  if (!regiaoDeAnuncio) {
    regiaoDeAnuncio = h("div.visivel-leitor", { "aria-live": "polite" });
    document.body.append(regiaoDeAnuncio);
  }
  regiaoDeAnuncio.textContent = "";
  setTimeout(() => { regiaoDeAnuncio.textContent = texto; }, 60);
}

// ---------------------------------------------------------------- componentes

/** Botão principal (4.4). */
export function botaoPrincipal(texto, aoTocar, atributos = {}) {
  return h("button.botao-principal", { type: "button", onclick: aoTocar, ...atributos }, texto);
}

/** Botão secundário (4.4). */
export function botaoSecundario(texto, aoTocar, atributos = {}) {
  return h("button.botao-secundario", { type: "button", onclick: aoTocar, ...atributos }, texto);
}

/** Link com cara de link que age como botão (Mulish 600, cobre, sublinhado). */
export function botaoLink(texto, aoTocar, atributos = {}) {
  return h("button.link", { type: "button", onclick: aoTocar, ...atributos }, texto);
}

/** Link de navegação para uma rota ("#/semana"). */
export function linkRota(texto, rota, atributos = {}) {
  return h("a.link", { href: rota, ...atributos }, texto);
}

/** Botão só com ícone, 44 px, com nome acessível. */
export function botaoIcone(nomeDoIcone, rotulo, aoTocar, atributos = {}) {
  return h("button.icone-botao", { type: "button", "aria-label": rotulo, onclick: aoTocar, ...atributos }, iconeEl(nomeDoIcone));
}

/**
 * Chave (role="switch", 4.4) com o texto ao lado; o texto inteiro é alvo.
 * chave({ rotulo, apoio, ligada, aoMudar(ligada) }) devolve a linha; .definir(v) muda sem avisar.
 */
export function chave({ rotulo, apoio = null, ligada = false, aoMudar = null }) {
  const id = idUnico("chave");
  const botao = h("button.chave", { type: "button", role: "switch", id, "aria-checked": String(Boolean(ligada)) },
    h("span.chave-bolinha", { "aria-hidden": "true" }));
  const linha = h("div.linha-chave",
    h("label.linha-chave-texto", { for: id },
      h("span.linha-chave-rotulo", null, rotulo),
      apoio ? h("span.apoio", null, apoio) : null
    ),
    botao
  );
  botao.addEventListener("click", () => {
    const nova = botao.getAttribute("aria-checked") !== "true";
    botao.setAttribute("aria-checked", String(nova));
    aoMudar?.(nova);
  });
  linha.definir = (v) => botao.setAttribute("aria-checked", String(Boolean(v)));
  linha.botao = botao;
  return linha;
}

/**
 * Seletor de posições (radiogroup, 4.4): seletor({ rotulo, opcoes: [{ valor, texto }], valor, aoMudar }).
 * Setas do teclado trocam a posição.
 */
export function seletor({ rotulo, opcoes, valor, aoMudar = null, classe = "" }) {
  const grupo = h("div.seletor", { role: "radiogroup", "aria-label": rotulo, class: classe });
  const botoes = opcoes.map((o) => h("button.seletor-opcao", {
    type: "button", role: "radio", "aria-checked": String(o.valor === valor), tabindex: o.valor === valor ? "0" : "-1",
    dataset: { valor: String(o.valor) }
  }, o.texto));
  const marcar = (i, avisarMudanca = true) => {
    botoes.forEach((b, j) => {
      b.setAttribute("aria-checked", String(i === j));
      b.tabIndex = i === j ? 0 : -1;
    });
    if (avisarMudanca) aoMudar?.(opcoes[i].valor);
  };
  botoes.forEach((b, i) => {
    b.addEventListener("click", () => marcar(i));
    b.addEventListener("keydown", (ev) => {
      const passo = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0;
      if (!passo) return;
      ev.preventDefault();
      const j = (i + passo + botoes.length) % botoes.length;
      marcar(j);
      botoes[j].focus();
    });
  });
  if (!botoes.some((b) => b.getAttribute("aria-checked") === "true") && botoes[0]) botoes[0].tabIndex = 0;
  grupo.append(...botoes);
  grupo.definir = (v) => { const i = opcoes.findIndex((o) => o.valor === v); if (i !== -1) marcar(i, false); };
  return grupo;
}

/** Abre um link externo só pelo toque da pessoa, em aba nova, sem referência (6.12). */
export function linkExterno(texto, url, atributos = {}) {
  return h("a.link", { href: url, target: "_blank", rel: "noopener noreferrer", ...atributos }, texto);
}

// ---------------------------------------------------------------- sementes

/** O desenho das telas ainda em construção: o título e o rótulo "EM CONSTRUÇÃO". */
export function montarSemente(el, { titulo, extra = null } = {}) {
  el.append(h("div.coluna.semente-tela",
    h("p.rotulo", null, "EM CONSTRUÇÃO"),
    h("h1.titulo", null, titulo),
    extra
  ));
}

// ---------------------------------------------------------------- o cartão do CVV e do SAMU (6.6 e 6.12)

/**
 * O cartão "Falar com alguém agora", com os textos de CVV (textos.js):
 *   import { CVV } from "../conteudo/textos.js";  el.append(cartaoCVV(CVV));
 * Ligar e abrir o site só acontecem pelo toque da pessoa; o site abre em aba nova.
 * solto: true dá ao cartão as bordas de cartão (Sobre e Aviso); sem ele, é o cartão preso ao pé do limite.
 */
export function cartaoCVV(cvv, { solto = false } = {}) {
  const c = cvv.cartao;
  const id = idUnico("cvv");
  return h("aside.cartao-cvv", { class: solto ? "solto" : "", "aria-labelledby": id },
    h("div.cartao-cvv-dentro", null,
      h("p.rotulo", { id }, c.rotulo),
      h("p.cartao-cvv-texto", null, c.texto),
      h("a.botao-principal.largura-cheia", { href: cvv.href, "aria-label": `Ligar para o CVV, ${cvv.telefone}` }, c.ligar),
      h("div.cartao-cvv-links", null,
        h("a.link", { href: cvv.hrefSite, target: "_blank", rel: "noopener noreferrer" }, c.abrirSite)),
      h("p.cartao-cvv-samu", null,
        h("span", null, c.samu), " ",
        h("a.link.link-texto", { href: cvv.hrefSamu, "aria-label": `Ligar para o SAMU, ${cvv.samu}` }, c.ligarSamu))
    ));
}
