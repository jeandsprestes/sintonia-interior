// T20 · Descarregar a cabeça (tela de foco): despejar, separar, resultado, e depois o registro e o fecho.
// O miolo mora em js/ferramentas/descarregar.js (o mesmo da prática P09).
// Rota: #/descarregar (com ?de=hoje|trilha|praticas e ?v=minima). O "×", o Esc e o Voltar do aparelho
// abrem "Quer parar aqui?", como no tocador (T10). A sessão (DESC) conta ao concluir ou ao parar com 60 s
// ou mais (7.4); o tempo do Estou no limite aberto por cima não entra.

import { h, abrirFolha, botaoPrincipal, botaoSecundario, empilharVolta } from "../ui.js";
import { estado } from "../estado.js";
import { agora, isoLocal } from "../dia.js";
import { registrarSessao } from "../regras.js";
import { pratica } from "../conteudo/praticas.js";
import { criarDescarregar, guardarDescarga } from "../ferramentas/descarregar.js";
import { relogio, vigiarLimite } from "../foco.js";
import { seguirParaRegistro } from "./pratica.js";

const DESTINOS = { hoje: "#/hoje", trilha: "#/trilha", praticas: "#/praticas" };

export const moldura = { aba: null, navegacao: "praticas", barra: "interna", esquerda: "fechar", rotuloEsquerda: "Encerrar", limite: "icone", foco: true, pai: "#/praticas" };

export function montar(el, ctx) {
  const de = ctx.query.de;
  const destino = DESTINOS[de] ?? "#/hoje";
  const origem = DESTINOS[de] ? de : "praticas";
  const tom = estado.ajustes?.tom === "espiritual" ? "espiritual" : "pratico";
  let versao = ctx.query.v === "minima" ? "minima" : "completa";
  const inicio = isoLocal(agora());
  const tempo = relogio();
  tempo.iniciar();
  let terminou = false;
  let folha = null;
  let tirarVolta = null;

  // O tempo para enquanto o Estou no limite está aberto por cima.
  vigiarLimite({ sinal: ctx.sinal, aoAbrir: () => tempo.pausar(), aoFechar: () => { if (!terminou) tempo.continuar(); } });

  const soltarVolta = () => { const t = tirarVolta; tirarVolta = null; t?.(); };
  const segurarVolta = () => {
    if (tirarVolta || terminou) return;
    tirarVolta = empilharVolta((motivo) => { tirarVolta = null; if (motivo !== "navegar") abrirParar(); });
  };

  const fraseDeFecho = () => pratica("P09")?.tom?.[tom]?.fecha ?? null;

  function gravar(descarga, { versaoDaSessao, frase }) {
    if (terminou) return;
    terminou = true;
    tempo.pausar();
    soltarVolta();
    guardarDescarga(descarga);
    const resultado = registrarSessao({
      praticaId: "DESC", origem, versao: versaoDaSessao, inicio,
      segundos: tempo.ms() / 1000, respostas: {}
    });
    seguirParaRegistro(ctx, { resultado, frase, destino });
  }

  const caixa = h("div.coluna.desc-tela");
  el.append(caixa);
  const miolo = criarDescarregar(caixa, {
    minima: versao === "minima",
    tom,
    // Separou: a frase de fecho da prática (P09). Só pôs para fora: sem frase, porque nada foi separado.
    aoConcluir: (descarga) => gravar(descarga, { versaoDaSessao: versao, frase: fraseDeFecho() }),
    aoSoPorPraFora: (descarga) => gravar(descarga, { versaoDaSessao: versao, frase: null })
  });

  // "Quer parar aqui?" (T10): com menos de 1 minuto, nada é gravado; com 1 minuto ou mais, o que foi
  // feito conta e segue para o registro.
  function abrirParar() {
    if (folha || terminou) return;
    const segundos = tempo.ms() / 1000;
    const jaConta = segundos >= 60;
    const podeMinima = !jaConta && versao === "completa" && miolo.etapa() === "despejar" && miolo.itens().length <= 3;
    let decidiu = false;
    folha = abrirFolha({
      titulo: "Quer parar aqui?",
      conteudo(corpo, f) {
        corpo.append(h("p.texto", null, jaConta ? "O que você fez já conta." : "Tudo bem parar. Se quiser, a versão mínima leva 1 minuto."));
        const botoes = h("div.folha-botoes");
        botoes.append(botaoSecundario("Parar", () => {
          decidiu = true;
          f.fechar();
          if (jaConta) {
            gravar(miolo.descargaAtual(), { versaoDaSessao: "interrompida", frase: null });
          } else {
            terminou = true;
            ctx.voltarPara(destino);
          }
        }));
        if (podeMinima) {
          botoes.append(botaoSecundario("Fazer a mínima", () => {
            decidiu = true;
            f.fechar();
            versao = "minima";
            miolo.trocarParaMinima();
            segurarVolta();
          }));
        }
        botoes.append(botaoPrincipal("Continuar", () => f.fechar()));
        corpo.append(botoes);
      },
      aoFechar() {
        folha = null;
        if (!decidiu) segurarVolta();
      }
    });
  }

  ctx.moldura({ aoEsquerda: () => abrirParar() });
  segurarVolta();

  return {
    destruir() {
      terminou = true;
      soltarVolta();
      miolo.destruir();
    }
  };
}
