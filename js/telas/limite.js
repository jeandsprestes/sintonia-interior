// T19 · Estou no limite: a camada por cima de qualquer tela (6.6). Abre na hora, sem pedir nada,
// com o cartão do CVV e do SAMU preso ao pé. Dentro dela: Respirar comigo, Uma frase para agora,
// Desabafar (falar, com a gravação opcional, ou escrever) e "Como está agora?".
//
// Interface (js/LEIA.md, seção 8): abrirLimite(opcoes) e fecharLimite(), que só js/app.js chama.
//   opcoes.sub: "respirar" | "frase" | "desabafar" quando a rota foi #/limite/...
// Também exporta criarRespirarComigo({ idTitulo, aoJaEstaBom }): a vista do Respirar comigo (o círculo,
// o apoio dos 10 s e, a cada minuto, "Mais um minuto" e "Já está bom"), para quem quiser a mesma tela
// fora do limite (RESP, 6.4). Ela não grava sessão nenhuma: quem usa decide o que conta.
//
// Regra de 7.4: 60 s ou mais na camada (do abrir ao fechar) contam como dia de cuidado, sem festa e sem
// tela de flor. A sessão (praticaId "LIMITE", origem "limite") é gravada aos 60 s, com a camada ainda
// aberta (fechar o app depois disso não perde o cuidado), e atualizada ao fechar.
// Nada liga nem abre site sozinho: só o toque da pessoa nos links tel:188, tel:192 e https://cvv.org.br.
// A gravação (js/voz.js) só é carregada quando a pessoa liga a chave de gravar.

import {
  h, svg, abrirCamada, idUnico, desenhos, cartaoCVV, botaoPrincipal, botaoSecundario, botaoLink, chave,
  avisoCurto, anunciar, menosMovimento, iconeEl
} from "../ui.js";
import { estado, alterar, novoId } from "../estado.js";
import { agora, isoLocal, diaLogico } from "../dia.js";
import { registrarSessao, atualizarSessao } from "../regras.js";
import { criarRespiracao } from "../respirar.js";
import { tocarSino } from "../som.js";
import { LIMITE, CVV, RESP } from "../conteudo/textos.js";
import { FRASES } from "../conteudo/frases.js";
import { palco, focarEm, ondaQueSeDesenha, anelDeTempo, manterTelaLigada, minutosESegundos } from "../foco.js";

// Textos de 3.28 que esta tela usa (as mensagens ficam com as telas, seção 3).
const SEM_MICROFONE = "Sem acesso ao microfone agora. Você pode falar sem gravar, ou escrever. Para gravar, libere o microfone nos ajustes do navegador.";
const ESPACO_CHEIO = "O espaço do app neste aparelho acabou. Apague áudios antigos em Seu caderno.";
const NAO_TOCA = "Este navegador não conseguiu tocar esta gravação.";
// A faixa de 3.0, para quando o navegador não aceita guardar a gravação (janela privada, por exemplo).
const NAO_GUARDA = "Este navegador não está guardando seus dados agora, talvez por ser uma janela privada. O app funciona, mas o que você fizer some ao fechar.";
// O par do "Guardada só neste aparelho, em Seu caderno, Áudios." (6.6) para o que foi escrito.
const ESCRITO_GUARDADO = "Guardado só neste aparelho, em Seu caderno, Escritos.";

const SEGUNDOS_QUE_CONTAM = 60;

/** append sem escrever "null" na tela (Armadilhas do LEIA.md). */
const anexar = (alvo, ...filhos) => alvo.append(...filhos.filter(Boolean));

let aberta = null;
// A explicação da gravação aparece na primeira vez que a chave é ligada (nesta abertura do app).
let gravacaoExplicada = false;

// ---------------------------------------------------------------- as frases (embaralhadas, sem repetir)

const filas = { pratico: [], espiritual: [] };
let ultimaFrase = null;

function embaralhar(lista) {
  const l = [...lista];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

function proximaFrase(tom) {
  const t = tom === "espiritual" ? "espiritual" : "pratico";
  if (!filas[t].length) {
    let nova = embaralhar(FRASES[t] ?? []);
    // Uma volta nova não começa pela frase que acabou de sair.
    if (nova.length > 1 && nova[0] === ultimaFrase) nova = [...nova.slice(1), nova[0]];
    filas[t] = nova;
  }
  ultimaFrase = filas[t].shift() ?? "";
  return ultimaFrase;
}

// ---------------------------------------------------------------- Respirar comigo (a vista)

/**
 * O círculo de 4 e 6 s, o apoio nos primeiros 10 s e, a cada minuto, "Mais um minuto" e "Já está bom".
 * Devolve { el, tempo(), pausar(), continuar(), parar(), destruir() }. aoJaEstaBom(ms) é chamado no toque.
 * Com o som ligado, o sino toca no começo e no "Já está bom". Mantém a tela ligada enquanto respira.
 */
export function criarRespirarComigo({ idTitulo = idUnico("respirar"), aoJaEstaBom = null } = {}) {
  const r = criarRespiracao({ padrao: "simples", puxa: RESP.puxa, solta: RESP.solta, palavras: RESP.palavras });
  const apoio = h("p.apoio.limite-respirar-apoio", null, RESP.apoio);
  let proximoMinuto = RESP.segundos * 1000;
  let mostrando = false;
  let quadro = 0;
  let parado = false;
  const titulo = h("h1.visivel-leitor", { id: idTitulo }, RESP.titulo);

  const mais = botaoPrincipal(RESP.maisUmMinuto, () => {
    proximoMinuto = Math.max(r.tempo(), proximoMinuto) + RESP.segundos * 1000;
    esconderEscolhas();
    focarEm(el);
  });
  const jaEstaBom = botaoLink(RESP.jaEstaBom, () => {
    parar();
    tocarSino(2);
    aoJaEstaBom?.(r.tempo());
  });
  const escolhas = h("div.limite-respirar-escolhas", { "aria-live": "polite" }, mais, jaEstaBom);
  escolhas.inert = true;

  function mostrarEscolhas() {
    mostrando = true;
    escolhas.inert = false;
    escolhas.classList.add("visivel");
    apoio.classList.add("sumiu");
  }
  function esconderEscolhas() {
    mostrando = false;
    escolhas.inert = true;
    escolhas.classList.remove("visivel");
  }

  const vigiar = () => {
    if (parado) return;
    const t = r.tempo();
    if (t > RESP.apoioSegundos * 1000) apoio.classList.add("sumiu");
    if (t >= proximoMinuto && !mostrando) mostrarEscolhas();
    quadro = requestAnimationFrame(vigiar);
  };

  const el = h("div.limite-respirar", null,
    titulo,
    h("div.limite-respirar-circulo", null, r.el),
    h("div.limite-respirar-pe", null, apoio, escolhas));

  const tela = manterTelaLigada();
  r.tocar();
  tocarSino(1);
  quadro = requestAnimationFrame(vigiar);

  function parar() {
    if (parado) return;
    parado = true;
    cancelAnimationFrame(quadro);
    tela.soltar();
    r.pausar();
  }

  return {
    el,
    tempo: () => r.tempo(),
    pausar() { r.pausar(); },
    continuar() { if (!parado) r.continuar(); },
    parar,
    destruir() { parar(); r.destruir(); }
  };
}

// ---------------------------------------------------------------- a camada

export function abrirLimite(opcoes = {}) {
  if (aberta) return aberta.camada;

  const inicioMs = Date.now();
  const inicioIso = isoLocal(agora());
  const usadas = new Set();
  const idTitulo = idUnico("limite-titulo");
  let depois = null;
  let sessaoId = null;
  let limparVista = null;      // o que parar ao trocar de vista (respiração, gravação, som)
  let rola = null;
  let p = null;
  let fechada = false;
  let tempo60 = null;

  const respostas = () => {
    const r = { opcoes: [...usadas] };
    if (depois) r.depois = depois;
    return r;
  };

  // ------------------------------------------------ a sessão de 60 s (7.4)
  const conferir60 = () => {
    if (sessaoId) return;
    const segundos = (Date.now() - inicioMs) / 1000;
    if (segundos < SEGUNDOS_QUE_CONTAM) return;
    try {
      const r = registrarSessao({
        praticaId: "LIMITE", origem: "limite", versao: null, inicio: inicioIso,
        segundos, respostas: respostas()
      });
      sessaoId = r.sessao.id;
    } catch (erro) {
      console.error(erro);
    }
  };
  const atualizarAoSair = () => {
    if (!sessaoId) { conferir60(); return; }
    try {
      atualizarSessao(sessaoId, {
        fim: isoLocal(agora()),
        segundos: Math.round((Date.now() - inicioMs) / 1000),
        respostas: respostas()
      });
    } catch (erro) {
      console.error(erro);
    }
  };
  const aoEsconder = () => { if (document.visibilityState === "hidden") atualizarAoSair(); };
  tempo60 = setTimeout(conferir60, SEGUNDOS_QUE_CONTAM * 1000 + 50);
  document.addEventListener("visibilitychange", aoEsconder);
  addEventListener("pagehide", atualizarAoSair);

  // ------------------------------------------------ trocar de vista
  const trocarPara = (construir, { primeira = false } = {}) => {
    try { limparVista?.(); } catch (erro) { console.error(erro); }
    limparVista = null;
    try {
      p.trocar((v) => construir(v), { focar: !primeira, rolar: rola, primeira });
    } catch (erro) {
      // A saída nunca fica sem nada: volta à entrada simples (o cartão do CVV já está no pé).
      console.error(erro);
      p.trocar((v) => v.append(h("h1.titulo", { id: idTitulo }, LIMITE.entrada.titulo), listaDeOpcoes()), { rolar: rola });
    }
  };

  const titulo = (texto, classe = "titulo") => h(`h1.${classe}`, { id: idTitulo, tabindex: "-1" }, texto);

  // ------------------------------------------------ entrada
  function listaDeOpcoes() {
    const acoes = { respirar: () => respirar(), frase: () => frase(), desabafar: () => desabafar() };
    return h("ul.limite-opcoes", null,
      ...LIMITE.entrada.opcoes.map((o) => h("li", null,
        h("button.linha-opcao", { type: "button", onclick: acoes[o.id], dataset: { opcao: o.id } },
          h("span.linha-opcao-nome", null, o.nome),
          h("span.linha-opcao-desc", null, o.descricao)))));
  }

  function blocoFazBem() {
    const fb = estado.fazBem ?? {};
    const t = LIMITE.entrada.fazBem;
    // O bloco existe quando existe a lista (do Dia 5 ou montada no caderno); a música e a frase vêm junto, se houver.
    const coisas = (Array.isArray(fb.coisas) ? fb.coisas : []).filter((c) => String(c ?? "").trim()).slice(0, t.maxItens);
    if (!coisas.length) return null;
    const idRotulo = idUnico("faz-bem");
    return h("section.limite-faz-bem", { "aria-labelledby": idRotulo },
      h("p.rotulo", { id: idRotulo }, t.rotulo),
      h("p.limite-faz-bem-texto", null, t.texto),
      h("ul.limite-faz-bem-lista", null, ...coisas.map((c) => h("li", null, c))),
      fb.musica ? h("p.limite-faz-bem-linha", null, t.musica(fb.musica)) : null,
      fb.frase ? h("p.limite-faz-bem-linha", null, t.frase(fb.frase)) : null);
  }

  function entrada({ primeira = false } = {}) {
    trocarPara((v) => {
      const t = LIMITE.entrada;
      v.classList.add("limite-entrada");
      anexar(v,
        h("div.limite-abraco", { "aria-hidden": "true" }, svg(desenhos.autoabraco({ tamanho: 56 }))),
        titulo(t.titulo),
        h("p.texto.limite-linha", null, t.linha),
        listaDeOpcoes(),
        blocoFazBem(),
        h("p.apoio.limite-aviso", null, t.aviso)
      );
    }, { primeira });
  }

  // ------------------------------------------------ Respirar comigo
  function respirar({ primeira = false } = {}) {
    usadas.add("respirar");
    trocarPara((v) => {
      v.classList.add("limite-vista-respirar");
      const resp = criarRespirarComigo({ idTitulo, aoJaEstaBom: () => comoEsta() });
      v.append(resp.el);
      limparVista = () => resp.destruir();
    }, { primeira });
  }

  // ------------------------------------------------ Uma frase para agora
  function frase({ primeira = false } = {}) {
    usadas.add("frase");
    const tom = estado.ajustes?.tom === "espiritual" ? "espiritual" : "pratico";
    const sua = String(estado.fazBem?.frase ?? "").trim();
    let mostrouSua = false;
    trocarPara((v) => {
      v.classList.add("limite-vista-frase");
      const t = LIMITE.frase;
      const rotulo = h("p.rotulo.limite-frase-rotulo");
      const texto = titulo("", "frase");
      texto.classList.add("limite-frase-texto");
      const caixa = h("div.limite-frase", { "aria-live": "polite" }, rotulo, texto);
      const guardar = h("div.limite-frase-guardar");
      const mostrar = (f, { daPessoa = false } = {}) => {
        rotulo.textContent = daPessoa ? t.rotuloDaSua : "";
        rotulo.hidden = !daPessoa;
        texto.textContent = f;
        caixa.classList.remove("entra");
        void caixa.offsetWidth;
        caixa.classList.add("entra");
        guardar.replaceChildren(...[daPessoa ? null : botaoOuGuardada(f)].filter(Boolean));
      };
      const guardada = (focar = false) => h("p.limite-frase-guardada", { tabindex: focar ? "-1" : null },
        h("span.limite-frase-check", { "aria-hidden": "true" }, iconeEl("check", { tamanho: 14 })), t.guardada);
      const botaoOuGuardada = (f) => {
        const ja = (estado.fazBem?.frasesGuardadas ?? []).includes(f);
        if (ja) return guardada();
        return botaoLink(t.guardar, () => {
          alterar((e) => {
            if (!Array.isArray(e.fazBem.frasesGuardadas)) e.fazBem.frasesGuardadas = [];
            if (!e.fazBem.frasesGuardadas.includes(f)) e.fazBem.frasesGuardadas.push(f);
          }, { agora: true });
          guardar.replaceChildren(guardada(true));
          try { guardar.firstChild.focus({ preventScroll: true }); } catch { /* nada */ }
        }, { class: "link-pequeno" });
      };
      const outra = () => mostrar(proximaFrase(tom));
      v.append(
        caixa,
        h("div.limite-frase-acoes", null,
          botaoPrincipal(t.outra, outra),
          botaoLink(t.jaEstaBom, () => comoEsta()),
          guardar)
      );
      if (sua && !mostrouSua) { mostrouSua = true; mostrar(sua, { daPessoa: true }); }
      else outra();
    }, { primeira });
  }

  // ------------------------------------------------ Desabafar
  function desabafar({ primeira = false } = {}) {
    usadas.add("desabafar");
    const t = LIMITE.desabafar;
    trocarPara((v) => {
      v.classList.add("limite-vista-desabafar");
      v.append(
        titulo(t.titulo),
        h("p.texto.limite-linha", null, t.linha),
        h("div.limite-desabafar-opcoes", null,
          h("button.linha-opcao.limite-desabafar-opcao", { type: "button", onclick: () => falar() },
            h("span.linha-opcao-nome", null, t.falar.botao)),
          h("button.linha-opcao.limite-desabafar-opcao", { type: "button", onclick: () => escrever() },
            h("span.linha-opcao-nome", null, t.escrever.botao)))
      );
    }, { primeira });
  }

  // Falar: o padrão é não gravar. Com a chave ligada, a gravação fica só no aparelho e para em 5 minutos.
  function falar() {
    const t = LIMITE.desabafar.falar;
    trocarPara((v) => {
      v.classList.add("limite-vista-falar");
      const anel = anelDeTempo({ tamanho: 168, duplo: true, ondas: true, classe: "limite-falar-anel" });
      const tela = manterTelaLigada();
      const inicio = Date.now();
      let quadro = 0;
      let gravador = null;
      let gravacao = null;          // { blob, tipo, segundos } depois de parar
      let urlDaGravacao = null;
      let tocador = null;
      let fimDaGravacao = null;
      let avisoDado = false;
      let inicioDaGravacao = 0;
      let nivelSuave = 0;
      let encerrado = false;

      const texto = h("p.lede.limite-falar-texto", null, t.texto);
      const status = h("div.limite-falar-status", { hidden: true },
        h("p.limite-falar-gravando", null, h("span.limite-falar-ponto", { "aria-hidden": "true" }), t.gravando),
        h("p.limite-falar-tempo", { role: "timer", "aria-live": "off" }, "0:00"));
      const aviso = h("p.apoio.limite-falar-aviso", { "aria-live": "polite" });
      const mensagem = h("p.limite-falar-mensagem", { "aria-live": "polite", hidden: true });
      const explicacao = h("div.limite-falar-explicacao", { hidden: true, "aria-live": "polite" },
        h("p.texto", null, t.primeiraVez.texto),
        botaoSecundario(t.primeiraVez.botao, () => comecarGravacao()));
      const terminei = botaoPrincipal(t.terminei, () => { encerrar(); comoEsta(); });
      const parar = botaoPrincipal(t.parar, () => pararGravacao());
      parar.hidden = true;
      const linhaChave = chave({
        rotulo: t.chave, ligada: false,
        aoMudar: (ligada) => {
          mensagem.hidden = true;
          if (!ligada) { explicacao.hidden = true; return; }
          if (!gravacaoExplicada) {
            explicacao.hidden = false;
            setTimeout(() => explicacao.scrollIntoView({ block: "nearest", behavior: menosMovimento() ? "auto" : "smooth" }), 60);
            return;
          }
          comecarGravacao();
        }
      });
      linhaChave.classList.add("limite-falar-chave");
      const controles = h("div.limite-falar-controles", null, terminei, parar);
      const depoisDeGravar = h("div.limite-falar-depois", { hidden: true });

      v.append(
        h("h1.visivel-leitor", { id: idTitulo, tabindex: "-1" }, LIMITE.desabafar.titulo),
        h("div.limite-falar-figura", null, anel.el),
        texto, status, aviso, controles, linhaChave, explicacao, mensagem, depoisDeGravar
      );

      // O anel se enche em 2 minutos (Falar sem gravar); gravando, acompanha o volume da voz.
      const laco = () => {
        if (encerrado) return;
        if (gravador) {
          const n = gravador.nivel();
          nivelSuave += (n - nivelSuave) * 0.18;
          v.style.setProperty("--voz", nivelSuave.toFixed(3));
          const s = (Date.now() - inicioDaGravacao) / 1000;
          status.lastChild.textContent = minutosESegundos(Math.min(s, t.limiteSegundos));
          if (!avisoDado && s >= t.avisoSegundos) { avisoDado = true; aviso.textContent = t.avisoDoLimite; }
          if (s >= t.limiteSegundos) pararGravacao();
        } else if (!gravacao) {
          anel.definir((Date.now() - inicio) / 1000 / t.segundosDoAnel);
        }
        quadro = requestAnimationFrame(laco);
      };
      quadro = requestAnimationFrame(laco);

      async function comecarGravacao() {
        gravacaoExplicada = true;
        explicacao.hidden = true;
        mensagem.hidden = true;
        // O contexto de áudio nasce aqui, dentro do toque (o iPhone só deixa assim).
        let contexto = null;
        try {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) contexto = new Ctx();
        } catch { contexto = null; }
        let voz;
        try {
          voz = await import("../voz.js");
          const stream = await voz.pedirMicrofone();
          if (encerrado) { stream.getTracks().forEach((f) => f.stop()); try { contexto?.close(); } catch { /* nada */ } return; }
          gravador = voz.criarGravador(stream, { contexto });
          gravador.iniciar();
        } catch (erro) {
          console.warn(erro);
          try { contexto?.close(); } catch { /* nada */ }
          gravador = null;
          linhaChave.definir(false);
          mensagem.textContent = SEM_MICROFONE;
          mensagem.hidden = false;
          return;
        }
        inicioDaGravacao = Date.now();
        fimDaGravacao = setTimeout(() => pararGravacao(), t.limiteSegundos * 1000 + 100);
        v.classList.add("gravando");
        anel.definir(1);
        anel.anel.style.opacity = "";
        texto.hidden = true;
        status.hidden = false;
        terminei.hidden = true;
        parar.hidden = false;
        linhaChave.hidden = true;
        try { parar.focus({ preventScroll: true }); } catch { /* nada */ }
        anunciar(t.gravando);
      }

      async function pararGravacao() {
        if (!gravador) return;
        const g = gravador;
        gravador = null;
        clearTimeout(fimDaGravacao);
        v.classList.remove("gravando");
        v.style.removeProperty("--voz");
        try {
          gravacao = await g.parar();
        } catch (erro) {
          console.error(erro);
          gravacao = null;
        }
        if (encerrado) { gravacao = null; return; }
        status.hidden = true;
        aviso.textContent = "";
        parar.hidden = true;
        mostrarEscolhaDaGravacao();
      }

      function mostrarEscolhaDaGravacao() {
        const d = t.depois;
        const ouvir = botaoLink(d.ouvir, () => alternarOuvir(ouvir));
        controles.hidden = true;
        depoisDeGravar.hidden = false;
        depoisDeGravar.replaceChildren(
          h("h2.lede-display.limite-falar-pergunta", { tabindex: "-1" }, d.pergunta),
          h("div.limite-botoes", null,
            botaoPrincipal(d.apagar, () => {
              descartarGravacao();
              encerrar();
              comoEsta({ mensagem: t.apagada });
            }),
            botaoSecundario(d.guardar, () => guardarGravacao()),
            ouvir)
        );
        focarEm(depoisDeGravar);
      }

      function alternarOuvir(link) {
        if (!gravacao?.blob) { avisoCurto(NAO_TOCA); return; }
        if (tocador && !tocador.paused) {
          tocador.pause();
          link.textContent = LIMITE.desabafar.falar.depois.ouvir;
          return;
        }
        try {
          urlDaGravacao ??= URL.createObjectURL(gravacao.blob);
          tocador ??= new Audio();
          if (tocador.src !== urlDaGravacao) tocador.src = urlDaGravacao;
          tocador.onended = () => { link.textContent = LIMITE.desabafar.falar.depois.ouvir; };
          tocador.onerror = () => { link.textContent = LIMITE.desabafar.falar.depois.ouvir; avisoCurto(NAO_TOCA); };
          const pr = tocador.play();
          link.textContent = "Pausar";
          pr?.catch?.(() => { link.textContent = LIMITE.desabafar.falar.depois.ouvir; avisoCurto(NAO_TOCA); });
        } catch {
          avisoCurto(NAO_TOCA);
        }
      }

      async function guardarGravacao() {
        if (!gravacao?.blob) { encerrar(); comoEsta(); return; }
        try {
          const voz = await import("../voz.js");
          await voz.guardarAudio(gravacao);
        } catch (erro) {
          console.error(erro);
          avisoCurto(erro?.name === "QuotaExceededError" ? ESPACO_CHEIO : NAO_GUARDA);
          return;
        }
        descartarGravacao();
        encerrar();
        comoEsta({ mensagem: t.guardada });
      }

      function descartarGravacao() {
        try { tocador?.pause(); } catch { /* nada */ }
        if (tocador) { tocador.removeAttribute("src"); try { tocador.load(); } catch { /* nada */ } }
        if (urlDaGravacao) URL.revokeObjectURL(urlDaGravacao);
        urlDaGravacao = null;
        tocador = null;
        gravacao = null;
      }

      function encerrar() {
        if (encerrado) return;
        encerrado = true;
        cancelAnimationFrame(quadro);
        clearTimeout(fimDaGravacao);
        tela.soltar();
        // Fechar no meio: a gravação não guardada vai embora (o padrão é não guardar).
        try { gravador?.descartar(); } catch { /* nada */ }
        gravador = null;
        descartarGravacao();
      }
      limparVista = encerrar;
    });
  }

  // Escrever: campo grande; "Deixar ir" apaga de verdade, e o texto desce e some sobre uma onda.
  function escrever() {
    const t = LIMITE.desabafar.escrever;
    trocarPara((v) => {
      v.classList.add("limite-vista-escrever");
      const id = idUnico("desabafo");
      const campo = h("textarea.campo.campo-grande.limite-escrever-campo", {
        id, rows: "6", placeholder: t.dica, spellcheck: "true", autocomplete: "off",
        "aria-label": t.dica, "data-foco-inicial": ""
      });
      const terminei = botaoPrincipal(t.terminei, () => {
        const texto = campo.value.trim();
        if (!texto) { comoEsta(); return; }
        escolherDestino(texto);
      });
      v.append(
        h("h1.visivel-leitor", { id: idTitulo, tabindex: "-1" }, LIMITE.desabafar.titulo),
        campo,
        h("div.limite-botoes", null, terminei)
      );
      campo.addEventListener("focus", () => {
        setTimeout(() => campo.scrollIntoView({ block: "nearest", behavior: menosMovimento() ? "auto" : "smooth" }), 250);
      });
    });

    function escolherDestino(texto) {
      trocarPara((v) => {
        v.classList.add("limite-vista-escrito");
        const bloco = h("div.limite-escrito", null, h("p", null, texto));
        const onda = ondaQueSeDesenha({ largura: 320, dur: 1000, classe: "limite-escrito-onda" });
        onda.el.style.visibility = "hidden";
        let indo = false;
        const deixarIr = botaoPrincipal(t.deixarIr, () => {
          if (indo) return;
          indo = true;
          v.classList.add("deixando");
          onda.el.style.visibility = "";
          onda.desenhar();
          bloco.classList.add("descendo");
          // Apaga de verdade: o texto não foi guardado em lugar nenhum e sai da página.
          setTimeout(() => {
            bloco.remove();
            comoEsta({ mensagem: t.foi });
          }, menosMovimento() ? 450 : 1150);
        });
        const guardar = botaoSecundario(t.guardar, () => {
          if (indo) return;
          indo = true;
          const instante = agora();
          alterar((e) => {
            e.escritos.push({ id: novoId("w"), em: isoLocal(instante), dia: diaLogico(instante), origem: "desabafo", texto });
          }, { agora: true });
          comoEsta({ mensagem: ESCRITO_GUARDADO });
        });
        v.append(
          h("div.limite-escrito-caixa", null, bloco, onda.el),
          h("h1.lede-display.limite-escrito-pergunta", { id: idTitulo, tabindex: "-1" }, t.pergunta),
          h("div.limite-botoes", null, deixarIr, guardar)
        );
        // Texto longo: só a ponta aparece, apagando embaixo.
        requestAnimationFrame(() => { if (bloco.scrollHeight > bloco.clientHeight + 2) bloco.classList.add("longo"); });
      });
    }
  }

  // ------------------------------------------------ Como está agora?
  function comoEsta({ mensagem = null } = {}) {
    const c = LIMITE.comoEsta;
    trocarPara((v) => {
      v.classList.add("limite-vista-como");
      anexar(v,
        mensagem ? h("p.limite-como-mensagem", null, mensagem) : null,
        titulo(c.pergunta),
        h("ul.limite-opcoes", null,
          ...c.opcoes.map((o) => h("li", null,
            h("button.linha-opcao.limite-como-opcao", { type: "button", onclick: () => responder(o), dataset: { resposta: o.id } },
              h("span.linha-opcao-nome", null, o.texto)))))
      );
    });
  }

  function responder(o) {
    depois = o.id;
    if (sessaoId) atualizarAoSair();
    trocarPara((v) => {
      v.classList.add("limite-vista-resposta", `limite-resposta-${o.id}`);
      v.append(titulo(o.resposta, "lede-display"));
      if (o.id === "melhor") {
        v.append(h("div.limite-botoes", null,
          botaoPrincipal(o.botoes[0], () => aberta?.fechar()),
          botaoSecundario(o.botoes[1], () => respirar())));
      } else if (o.id === "igual") {
        v.append(listaDeOpcoes());
      } else {
        v.append(h("div.limite-botoes", null,
          h("a.botao-principal", { href: CVV.href }, o.botao),
          h("a.link", { href: CVV.hrefSite, target: "_blank", rel: "noopener noreferrer" }, o.links[0]),
          botaoLink(o.links[1], () => entrada())));
      }
    });
  }

  // ------------------------------------------------ a camada em si
  const camada = abrirCamada({
    classe: "camada-limite",
    idTitulo,
    rotuloFechar: "Fechar",
    conteudo(corpo) {
      rola = h("div.limite-rola");
      p = palco(rola);
      corpo.append(rola, cartaoCVV(CVV));
      const sub = opcoes.sub;
      if (sub === "respirar") respirar({ primeira: true });
      else if (sub === "frase") frase({ primeira: true });
      else if (sub === "desabafar") desabafar({ primeira: true });
      else entrada({ primeira: true });
    },
    aoFechar() {
      if (fechada) return;
      fechada = true;
      clearTimeout(tempo60);
      document.removeEventListener("visibilitychange", aoEsconder);
      removeEventListener("pagehide", atualizarAoSair);
      try { limparVista?.(); } catch (erro) { console.error(erro); }
      limparVista = null;
      atualizarAoSair();
      aberta = null;
      // Se quem abriu sumiu da página (a tela se redesenhou embaixo), o foco volta para o título da tela.
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          const alvo = document.querySelector("#tela h1") ?? document.getElementById("tela");
          try { alvo?.focus({ preventScroll: true }); } catch { /* nada */ }
        }
      }, 30);
    }
  });
  aberta = { camada, fechar: () => camada.fechar() };
  return camada;
}

export function fecharLimite() {
  aberta?.fechar();
}
