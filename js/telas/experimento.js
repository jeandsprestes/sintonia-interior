// T21 · Experimento de 1 minuto (tela de foco): Começo, Antes, Escolha, O minuto, Depois e Resultado (6.8).
// A régua é a de T09 (criarRegua de ferramentas/regua.js). O resultado usa sempre os números que a pessoa
// marcou: sem média, sem arredondar e sem chamar nenhum resultado de bom ou ruim (resultadoDaMedicao).
// A sessão (EXP) é gravada quando o resultado aparece e conta como cuidado; "Concluir" segue para o fecho
// com a flor, sem o registro leve (o número já é o registro).
// Rota: #/experimento (com ?de=hoje|trilha|praticas). Se o Estou no limite abrir no meio do minuto, o minuto
// pausa e o véu de pausa espera a pessoa, como no tocador.

import { h, svg, idUnico, iconeEl, desenhos, botaoPrincipal, botaoSecundario, empilharVolta } from "../ui.js";
import { estado, alterar } from "../estado.js";
import { agora, isoLocal, diaCurto } from "../dia.js";
import { registrarSessao } from "../regras.js";
import { criarRespiracao } from "../respirar.js";
import { tocarSino } from "../som.js";
import { EXPERIMENTO, resultadoDaMedicao } from "../conteudo/textos.js";
import { criarRegua } from "../ferramentas/regua.js";
import { anelDeTempo, relogio, vigiarLimite, manterTelaLigada, seta, veuDePausa } from "../foco.js";
import { seguirParaFecho, desenharPar } from "./pratica.js";

const DESTINOS = { hoje: "#/hoje", trilha: "#/trilha", praticas: "#/praticas" };
const ICONES = { respirar: "mente", janela: "hoje" };

export const moldura = { aba: null, navegacao: "hoje", barra: "interna", esquerda: "fechar", rotuloEsquerda: "Encerrar", limite: "icone", foco: true, pai: "#/hoje" };

export function montar(el, ctx) {
  const E = EXPERIMENTO;
  const destino = DESTINOS[ctx.query.de] ?? "#/hoje";
  const primeiraVez = !estado.sessoes.some((s) => s.praticaId === "EXP");
  const tempo = relogio();
  let inicio = null;
  let antes = null;
  let depois = null;
  let escolhida = null;
  let resultado = null;
  let saiu = false;
  let tirarVolta = null;
  let pararMinuto = null;      // o que desligar ao sair do minuto
  let pausarMinuto = null;     // o que fazer quando o limite abre no meio do minuto

  const soltarVolta = () => { const t = tirarVolta; tirarVolta = null; t?.(); };
  const segurarVolta = () => {
    if (tirarVolta || saiu) return;
    tirarVolta = empilharVolta((motivo) => { tirarVolta = null; if (motivo !== "navegar") sair(); });
  };

  function sair() {
    if (saiu) return;
    saiu = true;
    soltarVolta();
    pararMinuto?.();
    ctx.voltarPara(destino);
  }

  ctx.moldura({ aoEsquerda: () => sair() });
  segurarVolta();

  vigiarLimite({
    sinal: ctx.sinal,
    aoAbrir: () => { tempo.pausar(); pausarMinuto?.(); },
    aoFechar: () => { if (!pausarMinuto) tempo.continuar(); }
  });

  // ------------------------------------------------ 1. Começo
  function comeco() {
    ctx.trocar((q) => {
      q.append(h("div.coluna.exp-comeco",
        h("p.rotulo", null, E.comeco.rotulo),
        h("h1.titulo", null, E.comeco.titulo),
        h("p.lede.exp-comeco-texto", null, E.comeco.texto),
        h("p.apoio.exp-comeco-apoio", null, E.comeco.apoio),
        h("div.exp-acao", null, botaoPrincipal(E.comeco.botao, () => {
          inicio = isoLocal(agora());
          tempo.iniciar();
          reguaAntes();
        }))
      ));
    });
  }

  // ------------------------------------------------ 2. Antes (a régua de T09, começando sem valor)
  function reguaAntes() {
    ctx.trocar((q) => {
      const numero = h("p.numero.regua-numero", { "aria-hidden": "true" }, "·");
      const apoio = h("p.apoio.regua-apoio", null, "Toque na régua");
      let seguir;
      const regua = criarRegua({
        valor: null,
        aoMudar: (v) => { numero.textContent = String(v); apoio.textContent = ""; seguir.disabled = false; }
      });
      const idPergunta = idUnico("exp-antes");
      seguir = botaoPrincipal("Seguir", () => { antes = regua.valor(); escolha(); }, { disabled: true });
      q.append(h("div.coluna.regua-tela.exp-regua",
        h("p.rotulo", null, "ANTES"),
        h("h1.titulo", { id: idPergunta }, E.antes.pergunta),
        numero, apoio, regua.el,
        h("div.regua-acoes", null, seguir)));
      regua.input.setAttribute("aria-labelledby", idPergunta);
    });
  }

  // ------------------------------------------------ 3. Escolha
  function escolha() {
    ctx.trocar((q) => {
      q.append(h("div.coluna.exp-escolha",
        h("h1.titulo", null, E.escolha.pergunta),
        h("div.exp-opcoes", null, ...E.escolha.opcoes.map((o) => h("button.cartao-escolha.sem-ponto.exp-opcao", {
          type: "button", dataset: { minuto: o.id }, onclick: () => minuto(o.id)
        },
          h("span.cartao-escolha-icone", { "aria-hidden": "true" }, iconeEl(ICONES[o.id] ?? "mente", { tamanho: 32 })),
          h("span.cartao-escolha-texto", null,
            h("span.cartao-escolha-nome", null, o.nome),
            h("span.cartao-escolha-desc", null, o.descricao)))))
      ));
    });
  }

  // ------------------------------------------------ 4. O minuto
  function minuto(id) {
    escolhida = id;
    const tela = manterTelaLigada();
    let quadro = 0;
    let acabou = false;
    let veu = null;
    let caixa = null;
    let relogioDoMinuto = null;
    let resp = null;
    let anel = null;
    let apoio = null;
    let metade = false;

    const duracao = id === "respirar" ? null : E.minuto.janela.segundos * 1000;
    const passou = () => (resp ? resp.tempo() : relogioDoMinuto.ms());
    const total = () => (resp ? resp.duracao : duracao);

    const desligar = () => {
      acabou = true;
      cancelAnimationFrame(quadro);
      document.removeEventListener("visibilitychange", aoVoltar);
      tela.soltar();
      resp?.destruir();
      resp = null;
      veu?.el.remove();
      veu = null;
      pararMinuto = null;
      pausarMinuto = null;
    };

    const terminar = () => {
      if (acabou) return;
      desligar();
      tocarSino(2);
      reguaDepois();
    };

    const laco = () => {
      if (acabou) return;
      const ms = passou();
      if (anel) anel.definir(ms / duracao);
      if (apoio && !metade && ms >= E.minuto.janela.metadeSegundos * 1000) {
        metade = true;
        apoio.textContent = E.minuto.janela.apoioDaMetade;
        apoio.classList.add("aparece");
      }
      if (ms >= total()) { terminar(); return; }
      quadro = requestAnimationFrame(laco);
    };
    const aoVoltar = () => { if (document.visibilityState === "visible" && !acabou) { cancelAnimationFrame(quadro); laco(); } };

    pararMinuto = desligar;
    pausarMinuto = () => {
      if (acabou) return;
      resp?.pausar();
      relogioDoMinuto?.pausar();
      if (veu) return;
      caixa?.classList.add("pausado");
      veu = veuDePausa({
        aoContinuar: () => {
          veu?.esconder();
          veu = null;
          caixa?.classList.remove("pausado");
          tempo.continuar();
          resp?.continuar();
          relogioDoMinuto?.continuar();
        },
        aoLimite: () => ctx.abrirLimite(),
        aoEncerrar: () => sair()
      });
      veu.mostrar(caixa);
    };

    ctx.trocar((q) => {
      if (id === "respirar") {
        const c = E.minuto.respirar;
        resp = criarRespiracao({ padrao: "simples", puxa: c.puxa, solta: c.solta, ciclos: c.ciclos });
        caixa = h("div.coluna.exp-minuto.exp-minuto-respirar",
          h("h1.visivel-leitor", null, E.escolha.opcoes.find((o) => o.id === "respirar")?.nome ?? ""),
          h("div.exp-minuto-figura", null, resp.el));
        q.append(caixa);
        resp.tocar();
      } else {
        const j = E.minuto.janela;
        relogioDoMinuto = relogio();
        anel = anelDeTempo({ tamanho: 200, figura: svg(desenhos.figura(j.figura, { tamanho: 140 })), classe: "exp-anel" });
        apoio = h("p.texto.exp-minuto-apoio", { "aria-live": "polite" });
        caixa = h("div.coluna.exp-minuto.exp-minuto-janela",
          h("div.exp-minuto-figura", null, anel.el),
          h("h1.passo.exp-minuto-texto", null, j.texto),
          apoio);
        q.append(caixa);
        relogioDoMinuto.iniciar();
      }
    });
    tocarSino(1);
    document.addEventListener("visibilitychange", aoVoltar);
    quadro = requestAnimationFrame(laco);
  }

  // ------------------------------------------------ 5. Depois (a régua começa no valor de antes)
  function reguaDepois() {
    ctx.trocar((q) => {
      const numero = h("p.numero.regua-numero", { "aria-hidden": "true" }, String(antes));
      const apoio = h("p.apoio.regua-apoio", null, `antes: ${antes}`);
      const regua = criarRegua({ valor: antes, fantasma: antes, aoMudar: (v) => { numero.textContent = String(v); } });
      const idPergunta = idUnico("exp-depois");
      q.append(h("div.coluna.regua-tela.exp-regua",
        h("p.rotulo", null, "DEPOIS"),
        h("h1.titulo", { id: idPergunta }, E.depois.pergunta),
        numero, apoio, regua.el,
        h("div.regua-acoes", null, botaoPrincipal("Ver resultado", () => { depois = regua.valor(); mostrarResultado(); }))));
      regua.input.setAttribute("aria-labelledby", idPergunta);
    });
  }

  // ------------------------------------------------ 6. Resultado
  function mostrarResultado() {
    tempo.pausar();
    // O experimento que chega ao resultado conta como cuidado (7.4).
    if (!resultado) {
      resultado = registrarSessao({
        praticaId: "EXP", origem: "experimento", versao: null, inicio,
        segundos: tempo.ms() / 1000, antes, depois, respostas: { minuto: escolhida }
      });
    }
    const r = resultadoDaMedicao(antes, depois);
    const testes = estado.sessoes
      .filter((s) => s.praticaId === "EXP" && s.antes != null && s.depois != null)
      .sort((a, b) => Date.parse(b.inicio) - Date.parse(a.inicio));
    const perguntarMedir = primeiraVez && !estado.ajustes.medir;

    ctx.trocar((q) => {
      const blocoMedir = perguntarMedir ? h("section.exp-medir", { "aria-labelledby": "exp-medir-pergunta" },
        h("p.texto.exp-medir-pergunta", { id: "exp-medir-pergunta" }, E.resultado.perguntaMedir),
        h("div.exp-medir-botoes", null,
          botaoSecundario(E.resultado.sim, () => responderMedir(true)),
          botaoSecundario(E.resultado.nao, () => responderMedir(false)))) : null;
      const responderMedir = (sim) => {
        alterar((e) => { e.ajustes.medir = sim; });
        blocoMedir.classList.add("respondido");
        blocoMedir.inert = true;
        setTimeout(() => blocoMedir.remove(), 320);
        try { concluir.focus({ preventScroll: true }); } catch { /* nada */ }
      };
      const concluir = botaoPrincipal(E.resultado.concluir, () => {
        saiu = true;
        soltarVolta();
        seguirParaFecho(ctx, { resultado, destino });
      });
      const lista = testes.length >= 2 ? h("section.exp-testes", { "aria-labelledby": "exp-testes-rotulo" },
        h("p.rotulo", { id: "exp-testes-rotulo" }, E.resultado.rotuloDosTestes),
        h("ul.exp-testes-lista", null, ...testes.map((s) => h("li.exp-teste", { "aria-label": `${diaCurto(s.dia)}, de ${s.antes} para ${s.depois}` },
          h("span.exp-teste-dia", { "aria-hidden": "true" }, diaCurto(s.dia)),
          h("span.exp-teste-par", { "aria-hidden": "true" }, String(s.antes), seta(), String(s.depois)))))) : null;
      // Os números da pessoa em cima dos pontos (o de antes em anel, o de depois cheio), nas mesmas posições.
      const pos = (v) => `calc(6px + (100% - 12px) * ${v / 10})`;
      const valores = antes === depois
        ? [h("span.exp-par-valor", { style: `left: ${pos(depois)}` }, String(depois))]
        : [h("span.exp-par-valor.exp-par-valor-antes", { style: `left: ${pos(antes)}` }, String(antes)),
           h("span.exp-par-valor", { style: `left: ${pos(depois)}` }, String(depois))];
      q.append(h("div.coluna.exp-resultado", ...[
        h("div.exp-par", { "aria-hidden": "true" },
          h("div.exp-par-valores", null, ...valores),
          h("div.regua-par", null, ...desenharPar(antes, depois)),
          h("div.exp-par-numeros", null, h("span", null, "0"), h("span", null, "10"))),
        h("h1.lede-display.exp-resultado-texto", null, r.texto),
        r.apoio ? h("p.texto.exp-resultado-apoio", null, r.apoio) : null,
        lista,
        blocoMedir,
        h("div.exp-acao", null, concluir)
      ].filter(Boolean)));
    });
  }

  comeco();

  return {
    destruir() {
      saiu = true;
      soltarVolta();
      pararMinuto?.();
    }
  };
}
