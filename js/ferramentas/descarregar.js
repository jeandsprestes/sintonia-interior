// Descarregar a cabeça (6.7): despejar, separar e o resultado. A pessoa despeja e ela mesma separa;
// o app não lê, não sugere e não organiza nada sozinho: só guarda e mostra.
//
// Este arquivo tem duas portas:
//   montar(el, ctx)                    a ferramenta de passo "descarregar" da prática P09 (contrato do LEIA.md, seção 7)
//   criarDescarregar(el, opcoes)       o miolo, que a tela T20 (js/telas/descarregar.js) também usa
//   guardarDescarga(descarga)          grava a descarga em estado.descargas (7.3), na hora
//
// Regras: nada disto aparece em Hoje e o app não lembra a pessoa de nada depois. "Soltar" apaga os itens
// de verdade (fica só a contagem em "soltos"). Os itens nunca vão para as respostas da sessão, para o
// "Soltar" não deixar cópia em lugar nenhum.

import { h, idUnico, iconeEl, botaoPrincipal, botaoSecundario, botaoLink, avisoCurto, anunciar, porTom, menosMovimento } from "../ui.js";
import { estado, alterar, novoId } from "../estado.js";
import { agora, isoLocal, diaLogico } from "../dia.js";
import { DESCARREGAR } from "../conteudo/textos.js";
import { palco, focarEm, ondaQueSeDesenha, copiarTexto } from "../foco.js";

const T = DESCARREGAR;
const GRUPOS = T.separar.grupos.map((g) => g.id);   // ["fazer", "esperar", "naoMeu"]

/** Grava a descarga em estado.descargas (na hora). Uma descarga sem itens e sem soltos não é gravada. */
export function guardarDescarga(descarga) {
  if (!descarga || (!descarga.itens?.length && !descarga.soltos)) return false;
  alterar((e) => {
    if (!Array.isArray(e.descargas)) e.descargas = [];
    const i = e.descargas.findIndex((d) => d.id === descarga.id);
    const copia = structuredClone(descarga);
    if (i === -1) e.descargas.push(copia);
    else e.descargas[i] = copia;
  }, { agora: true });
  return true;
}

/**
 * O miolo de Descarregar a cabeça.
 * opcoes: { minima, tom, aoConcluir(descarga, { separou }), aoSoPorPraFora(descarga) }
 * Devolve { etapa(), itens(), descargaAtual(), trocarParaMinima(), destruir() }.
 */
export function criarDescarregar(el, { minima = false, tom = "pratico", aoConcluir = null, aoSoPorPraFora = null } = {}) {
  const instante = agora();
  const descarga = { id: novoId("d"), em: isoLocal(instante), dia: diaLogico(instante), soltos: 0, itens: [] };
  let etapa = "despejar";
  let ehMinima = Boolean(minima);
  let destruido = false;
  const limpezas = [];
  const raiz = h("div.desc");
  el.append(raiz);
  const p = palco(raiz);

  const limite = () => (ehMinima ? T.despejar.limiteMinima : Infinity);
  const copiaDaDescarga = () => structuredClone(descarga);

  // ------------------------------------------------ 1. Despejar
  let dica = 0;
  function despejar({ primeira = false } = {}) {
    etapa = "despejar";
    const d = T.despejar;
    p.trocar((v) => {
      v.classList.add("desc-despejar");
      const idCampo = idUnico("desc-campo");
      const titulo = h("h1.titulo.desc-titulo", { tabindex: "-1" }, ehMinima ? d.tituloMinima : d.titulo);
      const lista = h("ul.desc-itens", { "aria-label": ehMinima ? d.tituloMinima : d.titulo });
      const campo = h("input.campo.desc-campo", {
        id: idCampo, type: "text", autocomplete: "off", spellcheck: "true", enterkeyhint: "enter",
        placeholder: d.dicas[dica % d.dicas.length], "aria-label": ehMinima ? d.tituloMinima : d.titulo
      });
      const adicionar = botaoSecundario(d.adicionar, () => { acrescentar(campo.value); campo.focus(); }, { class: "desc-adicionar", disabled: true });
      const linhaDoCampo = h("div.desc-campo-linha", null, campo, adicionar);
      const contador = h("p.desc-contador", { "aria-live": "polite" });
      const parado = h("p.apoio.desc-parado", { "aria-live": "polite" });
      const separar = botaoPrincipal(d.separar, () => irParaSeparar(), { disabled: true });
      const soPorPraFora = botaoLink(d.soPorPraFora, () => terminarSemSeparar(), { disabled: true });

      function desenharItem(item, { entrando = false } = {}) {
        const li = h("li.desc-item", { class: entrando ? "entrando" : "", dataset: { id: item.id } },
          h("span.desc-item-texto", null, item.texto),
          h("button.icone-botao.desc-tirar", { type: "button", "aria-label": `Tirar ${item.texto}`, onclick: () => tirar(item, li) }, iconeEl("fechar", { tamanho: 20 })));
        return li;
      }

      function atualizar() {
        const n = descarga.itens.length;
        contador.textContent = n ? d.contador(n) : "";
        separar.disabled = n === 0;
        soPorPraFora.disabled = n === 0;
        const cheio = n >= limite();
        linhaDoCampo.hidden = cheio;
        if (n >= 3) parado.textContent = "";
        adicionar.disabled = !campo.value.trim();
      }

      function acrescentar(texto, { varios = false } = {}) {
        const linhas = varios ? String(texto).split(/\r?\n/) : [String(texto)];
        let entrou = 0;
        for (const linha of linhas) {
          const t = linha.trim();
          if (!t) continue;
          if (descarga.itens.length >= limite()) break;
          const item = { id: novoId("i"), texto: t, grupo: null, proximo: false, gesto: null, feito: false };
          descarga.itens.push(item);
          lista.append(desenharItem(item, { entrando: true }));
          entrou += 1;
        }
        if (!entrou) return;
        campo.value = "";
        dica += 1;
        campo.placeholder = d.dicas[dica % d.dicas.length];
        atualizar();
        reiniciarParado();
        if (descarga.itens.length >= limite()) {
          try { separar.focus({ preventScroll: true }); } catch { /* nada */ }
        } else {
          linhaDoCampo.scrollIntoView?.({ block: "nearest", behavior: menosMovimento() ? "auto" : "smooth" });
        }
      }

      function tirar(item, li) {
        const i = descarga.itens.indexOf(item);
        if (i === -1) return;
        descarga.itens.splice(i, 1);
        const proximo = li.nextElementSibling?.querySelector("button") ?? li.previousElementSibling?.querySelector("button") ?? campo;
        li.classList.add("saindo");
        li.inert = true;
        setTimeout(() => li.remove(), menosMovimento() ? 200 : 220);
        atualizar();
        reiniciarParado();
        setTimeout(() => { try { (linhaDoCampo.hidden && proximo === campo ? separar : proximo).focus({ preventScroll: true }); } catch { /* nada */ } }, 30);
      }

      // "Coisa pequena também vale.": depois de 20 s parado, com menos de 3 itens.
      let tempoParado = null;
      function reiniciarParado() {
        clearTimeout(tempoParado);
        if (descarga.itens.length >= 3) return;
        tempoParado = setTimeout(() => {
          if (destruido || etapa !== "despejar" || descarga.itens.length >= 3) return;
          parado.textContent = d.apoioParado;
        }, d.apoioParadoSegundos * 1000);
      }
      limpezas.push(() => clearTimeout(tempoParado));

      campo.addEventListener("input", () => { adicionar.disabled = !campo.value.trim(); reiniciarParado(); });
      campo.addEventListener("keydown", (ev) => {
        if (ev.key !== "Enter" || ev.isComposing) return;
        ev.preventDefault();
        acrescentar(campo.value);
      });
      // Texto colado com várias linhas vira um item por linha; linha vazia não vira item.
      campo.addEventListener("paste", (ev) => {
        const colado = ev.clipboardData?.getData("text") ?? "";
        if (!/\r?\n/.test(colado.trim())) return;
        ev.preventDefault();
        const antes = campo.value.slice(0, campo.selectionStart ?? campo.value.length);
        const depois = campo.value.slice(campo.selectionEnd ?? campo.value.length);
        acrescentar(antes + colado + depois, { varios: true });
      });

      for (const item of descarga.itens) lista.append(desenharItem(item));
      v.append(
        h("p.rotulo.desc-rotulo", null, d.rotulo),
        titulo,
        h("p.texto.desc-linha", null, d.linha),
        lista,
        linhaDoCampo,
        h("div.desc-apoios", null, contador, parado),
        h("div.foco-botoes.desc-acoes", null, separar, soPorPraFora)
      );
      atualizar();
      reiniciarParado();
    }, { focar: !primeira, primeira });
    rolarAoTopo();
  }

  // ------------------------------------------------ 2. Separar
  let atual = 0;
  const historico = [];
  let tirarTeclas = null;

  function irParaSeparar() {
    if (!descarga.itens.length) return;
    descarga.itens.forEach((i) => { i.grupo = null; });
    historico.length = 0;
    atual = 0;
    separar();
  }

  function separar() {
    etapa = "separar";
    const s = T.separar;
    let cartao, contador, voltar;
    const total = () => descarga.itens.length;
    p.trocar((v) => {
      v.classList.add("desc-separar");
      contador = h("p.rotulo.desc-separar-contador", { "aria-hidden": "true" });
      const texto = h("h1.titulo-cartao.desc-separar-item", { tabindex: "-1" });
      cartao = h("div.desc-cartao", null, contador, texto);
      const anuncio = h("p.visivel-leitor", { "aria-live": "polite" });
      const botoes = s.grupos.map((g, i) => h("button.cartao-escolha.sem-ponto.desc-grupo", {
        type: "button", dataset: { grupo: g.id }, onclick: () => escolher(g.id)
      },
        h("span.cartao-escolha-texto", null,
          h("span.cartao-escolha-nome", null, g.nome),
          h("span.cartao-escolha-desc", null, g.descricao)),
        h("span.desc-tecla.so-computador", { "aria-hidden": "true" }, String(i + 1))));
      voltar = botaoLink(s.voltar, () => voltarAoAnterior(), { class: "desc-voltar" });
      v.append(
        h("p.rotulo.desc-rotulo", null, T.despejar.rotulo),
        cartao,
        h("div.desc-grupos", { role: "group", "aria-label": s.grupos.map((g) => g.nome).join(", ") }, ...botoes),
        h("div.desc-voltar-linha", null, voltar),
        anuncio
      );
      // O item atual é anunciado com o contador ("3 de 7"), ao abrir (foco no título) e a cada troca.
      cartao.mostrar = (anunciarAgora) => {
        const item = descarga.itens[atual];
        const fala = `${s.contador(atual + 1, total())}. ${item?.texto ?? ""}`;
        texto.textContent = item?.texto ?? "";
        texto.setAttribute("aria-label", fala);
        contador.textContent = s.contador(atual + 1, total());
        voltar.hidden = historico.length === 0;
        cartao.classList.remove("troca");
        void cartao.offsetWidth;
        cartao.classList.add("troca");
        if (anunciarAgora) anuncio.textContent = fala;
      };
      cartao.mostrar(false);
    });
    rolarAoTopo();

    // No computador, as teclas 1, 2 e 3 escolhem o grupo.
    const aoTeclar = (ev) => {
      if (etapa !== "separar" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const i = ["1", "2", "3"].indexOf(ev.key);
      if (i === -1) return;
      if (ev.target.closest?.("input, textarea, [contenteditable]")) return;
      if (document.querySelector(".folha-envoltorio, .camada")) return;
      ev.preventDefault();
      escolher(GRUPOS[i]);
    };
    tirarTeclas?.();
    document.addEventListener("keydown", aoTeclar);
    tirarTeclas = () => { document.removeEventListener("keydown", aoTeclar); tirarTeclas = null; };
    limpezas.push(() => tirarTeclas?.());

    function escolher(grupo) {
      const item = descarga.itens[atual];
      if (!item) return;
      item.grupo = grupo;
      historico.push(atual);
      if (atual + 1 >= total()) {
        tirarTeclas?.();
        resultado();
        return;
      }
      atual += 1;
      cartao.mostrar(true);
    }

    function voltarAoAnterior() {
      if (!historico.length) return;
      atual = historico.pop();
      descarga.itens[atual].grupo = null;
      cartao.mostrar(true);
      if (!historico.length) {
        try { cartao.querySelector("h1").focus({ preventScroll: true }); } catch { /* nada */ }
      }
    }
  }

  // ------------------------------------------------ 3. Resultado
  function resultado() {
    etapa = "resultado";
    const r = T.resultado;
    const nome = Object.fromEntries(T.separar.grupos.map((g) => [g.id, g.nome]));
    const doGrupo = (g) => descarga.itens.filter((i) => i.grupo === g);
    p.trocar((v) => {
      v.classList.add("desc-resultado");
      const secoes = [];

      const fazer = doGrupo("fazer");
      if (fazer.length) {
        const idTitulo = idUnico("desc-fazer");
        const idGesto = idUnico("desc-gesto");
        const campoGesto = h("input.campo.desc-gesto", { id: idGesto, type: "text", autocomplete: "off", enterkeyhint: "done" });
        const caixaGesto = h("div.desc-gesto-caixa.abre-fecha", null,
          h("div", null, h("div.desc-gesto-dentro", null,
            h("label.rotulo-campo", { for: idGesto }, r.fazer.gesto),
            campoGesto)));
        const linhas = fazer.map((item) => {
          const botao = h("button.cartao-escolha.sem-ponto.desc-fazer-item", {
            type: "button", role: "radio", "aria-checked": String(Boolean(item.proximo)), dataset: { id: item.id }
          },
            h("span.cartao-escolha-texto", null,
              h("span.rotulo.desc-proximo-rotulo", { "aria-hidden": item.proximo ? null : "true" }, r.fazer.proximo),
              h("span.desc-fazer-texto", null, item.texto)),
            h("span.desc-marca", { "aria-hidden": "true" }, iconeEl("lotus", { tamanho: 22 })));
          botao.addEventListener("click", () => marcar(item));
          return h("li", null, botao);
        });
        const lista = h("ul.desc-fazer-lista", { role: "radiogroup", "aria-labelledby": idTitulo }, ...linhas);
        // Um só "Seu próximo passo": tocar marca; tocar de novo desmarca.
        const marcar = (item) => {
          const vaiMarcar = !item.proximo;
          for (const i of fazer) if (i !== item) { i.proximo = false; i.gesto = null; }
          item.proximo = vaiMarcar;
          if (!vaiMarcar) item.gesto = null;
          for (const b of lista.querySelectorAll(".desc-fazer-item")) {
            const marcado = b.dataset.id === item.id && item.proximo;
            b.setAttribute("aria-checked", String(marcado));
            const rotulo = b.querySelector(".desc-proximo-rotulo");
            if (marcado) rotulo.removeAttribute("aria-hidden");
            else rotulo.setAttribute("aria-hidden", "true");
          }
          campoGesto.value = item.proximo ? (item.gesto ?? "") : "";
          caixaGesto.classList.toggle("aberto", item.proximo);
        };
        campoGesto.addEventListener("input", () => {
          const escolhido = fazer.find((i) => i.proximo);
          if (escolhido) escolhido.gesto = campoGesto.value.trim() || null;
        });
        campoGesto.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.isComposing) { ev.preventDefault(); campoGesto.blur(); } });
        if (fazer.some((i) => i.proximo)) { caixaGesto.classList.add("aberto"); campoGesto.value = fazer.find((i) => i.proximo).gesto ?? ""; }
        secoes.push(h("section.desc-grupo-resultado.desc-grupo-fazer", { "aria-labelledby": idTitulo },
          h("h2.titulo-cartao.desc-grupo-titulo", { id: idTitulo }, r.grupo(nome.fazer, fazer.length)),
          lista,
          h("p.apoio.desc-grupo-apoio", null, r.fazer.apoio),
          caixaGesto));
      }

      const esperar = doGrupo("esperar");
      if (esperar.length) {
        const idTitulo = idUnico("desc-esperar");
        secoes.push(h("section.desc-grupo-resultado", { "aria-labelledby": idTitulo },
          h("h2.titulo-cartao.desc-grupo-titulo", { id: idTitulo }, r.grupo(nome.esperar, esperar.length)),
          h("ul.desc-lista", null, ...esperar.map((i) => h("li", null, i.texto))),
          h("p.apoio.desc-grupo-apoio", null, r.esperar.apoio)));
      }

      const naoMeu = doGrupo("naoMeu");
      if (naoMeu.length) {
        const idTitulo = idUnico("desc-naomeu");
        const titulo = h("h2.titulo-cartao.desc-grupo-titulo", { id: idTitulo }, r.grupo(nome.naoMeu, naoMeu.length));
        // A onda se desenha embaixo da lista enquanto os itens descem e somem (4.8, 1.000 ms); depois a
        // lista vazia se fecha devagar e a onda sobe com ela, e a frase aparece no lugar do botão.
        const lista = h("ul.desc-lista.desc-lista-soltar", null, ...naoMeu.map((i) => h("li", null, i.texto)));
        const onda = ondaQueSeDesenha({ largura: 320, dur: 1000, classe: "desc-onda" });
        onda.el.style.visibility = "hidden";
        const caixaDaLista = h("div.desc-soltar-lista", null, lista, onda.el);
        const depois = h("p.desc-solto-frase", { tabindex: "-1", "aria-live": "polite" });
        const apoio = h("p.apoio.desc-grupo-apoio", null, r.naoMeu.apoio);
        let soltando = false;
        let caixa = null;
        const soltar = botaoSecundario(porTom(r.naoMeu.soltar, tom), () => {
          if (soltando) return;
          soltando = true;
          const n = naoMeu.length;
          soltar.disabled = true;
          caixa.classList.add("soltando");
          onda.el.style.visibility = "";
          onda.desenhar();
          setTimeout(() => {
            // Apaga de verdade: os itens saem da descarga e da página; fica só a contagem.
            descarga.itens = descarga.itens.filter((i) => i.grupo !== "naoMeu");
            descarga.soltos += n;
            titulo.textContent = r.grupo(nome.naoMeu, T.soltos(descarga.soltos));
            acoes.inert = true;
            acoes.setAttribute("aria-hidden", "true");
            const fechar = () => {
              lista.remove();
              caixaDaLista.classList.add("vazia");
              caixaDaLista.style.height = "";
              caixaDaLista.style.transition = "";
            };
            if (menosMovimento()) {
              fechar();
            } else {
              caixaDaLista.style.height = `${caixaDaLista.offsetHeight}px`;
              requestAnimationFrame(() => {
                caixaDaLista.style.transition = "height 320ms cubic-bezier(.2,.7,.2,1)";
                caixaDaLista.style.height = "8px";
                setTimeout(fechar, 340);
              });
            }
            depois.textContent = porTom(r.naoMeu.depois, tom);
            depois.classList.add("aparece");
            try { depois.focus({ preventScroll: true }); } catch { /* nada */ }
          }, menosMovimento() ? 250 : 1050);
        }, { class: "desc-soltar" });
        const acoes = h("div.desc-soltar-acoes", null, soltar, apoio);
        caixa = h("div.desc-soltar-caixa", null, caixaDaLista, h("div.desc-soltar-palco", null, acoes, depois));
        secoes.push(h("section.desc-grupo-resultado.desc-grupo-naomeu", { "aria-labelledby": idTitulo }, titulo, caixa));
      }

      const temLista = fazer.length || esperar.length;
      const copiar = temLista ? botaoLink(r.copiar, async () => {
        const ok = await copiarTexto(textoDaLista());
        if (ok) avisoCurto(r.copiada);
      }, { class: "desc-copiar" }) : null;

      v.append(
        h("h1.titulo.desc-titulo", { tabindex: "-1" }, r.titulo),
        ...secoes,
        h("div.foco-botoes.desc-concluir", null,
          ...[copiar, botaoPrincipal(r.concluir, () => concluir())].filter(Boolean))
      );
    });
    rolarAoTopo();
  }

  /** "Dá para fazer" e "Pode esperar" em texto simples, com o próximo passo marcado. */
  function textoDaLista() {
    const r = T.resultado;
    const nome = Object.fromEntries(T.separar.grupos.map((g) => [g.id, g.nome]));
    const partes = [];
    for (const g of ["fazer", "esperar"]) {
      const itens = descarga.itens.filter((i) => i.grupo === g);
      if (!itens.length) continue;
      partes.push([nome[g], ...itens.map((i) => `• ${i.texto}${i.proximo ? ` ${r.marcaDoProximo}` : ""}`)].join("\n"));
    }
    return partes.join("\n\n");
  }

  function concluir() {
    if (destruido) return;
    aoConcluir?.(copiaDaDescarga(), { separou: true });
  }

  function terminarSemSeparar() {
    if (destruido || !descarga.itens.length) return;
    descarga.itens.forEach((i) => { i.grupo = null; i.proximo = false; });
    aoSoPorPraFora?.(copiaDaDescarga());
  }

  function rolarAoTopo() {
    try { window.scrollTo({ top: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); }
  }

  despejar({ primeira: true });

  return {
    etapa: () => etapa,
    itens: () => descarga.itens.slice(),
    descargaAtual: () => copiaDaDescarga(),
    /** "Fazer a mínima" (Quer parar aqui?): o título da mínima e o limite de três itens. */
    trocarParaMinima() {
      ehMinima = true;
      if (etapa === "despejar") despejar();
    },
    destruir() {
      destruido = true;
      limpezas.forEach((fn) => { try { fn(); } catch { /* nada */ } });
    }
  };
}

// ---------------------------------------------------------------- a ferramenta de passo (P09)

/**
 * Dentro do tocador: a ferramenta inteira (completa) ou com o limite de três itens (mínima).
 * "Concluir" e "Só queria pôr para fora" guardam a descarga e seguem (o tocador grava a sessão e abre
 * o registro e o fecho). Se a pessoa encerra com 60 s ou mais ("Parar", que conta), o que ela escreveu
 * fica guardado também.
 */
export function montar(el, ctx) {
  const inicio = agora().getTime();
  let concluiu = false;
  const terminar = (descarga) => {
    if (concluiu) return;
    concluiu = true;
    guardarDescarga(descarga);
    ctx.concluir({});
  };
  const miolo = criarDescarregar(el, {
    minima: Boolean(ctx.passo?.minima) || ctx.versao === "minima",
    tom: ctx.tom,
    aoConcluir: (d) => terminar(d),
    aoSoPorPraFora: (d) => terminar(d)
  });
  return {
    destruir() {
      if (!concluiu && miolo.itens().length) {
        // O tocador grava a sessão interrompida logo depois de desmontar a ferramenta ("Parar" com 60 s
        // ou mais). Só nesse caso a descarga fica; sem sessão (menos de 60 s, ou saiu por outro caminho), nada.
        const d = miolo.descargaAtual();
        const id = ctx.pratica?.id;
        setTimeout(() => {
          const s = estado.sessoes.at(-1);
          if (s && s.praticaId === id && s.versao === "interrompida" && Date.parse(s.fim) >= inicio - 1000) guardarDescarga(d);
        }, 0);
      }
      miolo.destruir();
    }
  };
}
