// T05 · Hoje: a flor e "como você está chegando", com um toque. Também a folha Sua flor (6.10),
// que a Semana e a página esquerda do computador abrem por abrirSuaFlor().

import { h, svg, limpar, iconeEl, desenhos, abrirFolha, avisoCurto, botaoSecundario, botaoLink, idUnico } from "../ui.js";
import { estado, alterar, emDemo, baixarCopia } from "../estado.js";
import { diaLogico, rotuloDoDia, saudacao, segundaDaSemana, somarDias, minutosDe } from "../dia.js";
import {
  flor, trilha, legendaDaFlor, registrarCheckin, checkinRecente, sessoesDoDia, semana, diasDeCuidado,
  cuidadoFeitoHoje, fizHoje
} from "../regras.js";
import { CHECKIN, TEMPO, FLOR } from "../conteudo/textos.js";
import { pratica as praticaPorId } from "../conteudo/praticas.js";
import { DIAS, diaDaTrilha, faseDoDia, fraseDoCuidado } from "../conteudo/trilha.js";
import { navegar, estaInstalado, eIphone, pedidoDeInstalacao, instalarApp } from "../app.js";

export const moldura = { aba: "hoje", barra: "hoje", esquerda: null, limite: "pilula" };

// O "Fiz hoje" vira "Feito hoje." e o cartão só some na próxima abertura de Hoje (T05).
let cuidadoMarcadoEm = null;

const NOMES = {
  DESC: "Descarregar a cabeça",
  EXP: "Experimento de 1 minuto",
  RESP: "Respirar comigo",
  LIMITE: "Estou no limite",
  CUIDADO: "Seu cuidado possível"
};

function tituloDaSessao(s) {
  if (NOMES[s.praticaId]) return NOMES[s.praticaId];
  if (/^T\d$/.test(s.praticaId)) return diaDaTrilha(s.praticaId)?.titulo ?? "";
  return praticaPorId(s.praticaId)?.titulo ?? "";
}

function linhaDaSessao(s) {
  const partes = [tituloDaSessao(s)];
  if (s.versao === "minima") partes.push("versão mínima");
  else if (s.versao === "completa") partes.push("versão completa");
  if (s.origem !== "cuidado" && s.segundos) partes.push(`${minutosDe(s.segundos)} min`);
  return partes.join(" · ");
}

function textoDoTempo(tempo) {
  const t = TEMPO.opcoes.find((o) => o.tempo === tempo)?.texto ?? "";
  return t ? t.charAt(0).toLocaleLowerCase("pt-BR") + t.slice(1) : "";
}

export function montar(el, ctx) {
  const pousar = Boolean(ctx.dados?.pousar);
  let jaDesenhou = false;
  const desenhar = ({ crescerAgora = false } = {}) => {
    limpar(el);
    el.append(telaDeHoje({ pousar: pousar && !jaDesenhou, crescerAgora }));
    jaDesenhou = true;
  };
  desenhar();
  return {
    aoMudarEstado() { desenhar(); },
    redesenhar: desenhar
  };

  function telaDeHoje({ pousar, crescerAgora }) {
    const hoje = diaLogico();
    const f = flor(hoje);
    const legenda = legendaDaFlor(hoje);
    const recente = checkinRecente();
    const doDia = sessoesDoDia(hoje);
    const raiz = h("div.coluna.hoje");

    // 2 a 5: o dia, a saudação, a flor e a legenda (no computador, ficam na página esquerda).
    const rotuloFlor = desenhos.rotuloDaFlor({ estagio: f.estagio, descansa: f.descansa, cresceuHoje: f.cresceuHoje }) || "Sua flor";
    const animacao = crescerAgora ? "crescer" : pousar && f.N === 0 ? "pousar" : null;
    raiz.append(h("div.hoje-alto",
      h("p.rotulo.hoje-dia.so-celular", null, rotuloDoDia(hoje)),
      h("p.saudacao.hoje-saudacao", null, f.voltou ? "Que bom te ver." : saudacao()),
      h("button.hoje-flor.so-celular", { type: "button", onclick: () => abrirSuaFlor() },
        svg(desenhos.florSVG({ estagio: f.estagio, descansa: f.descansa, cresceuHoje: f.cresceuHoje, animacao, altura: 168, rotulo: rotuloFlor }))),
      h("p.rotulo.hoje-rotulo-flor.so-celular", { "aria-hidden": "true" }, FLOR.rotulo(f.estagio, f.descansa)),
      legenda ? h("p.apoio.hoje-legenda.so-celular", null, FLOR.legendas[legenda]) : null
    ));

    // 6 e 7: a pergunta e os três estados, ou "Hoje já contou."
    if (doDia.length) {
      raiz.append(h("section.hoje-contou", { "aria-labelledby": "hoje-titulo" },
        h("h1.titulo.hoje-pergunta-titulo", { id: "hoje-titulo" }, "Hoje já contou."),
        h("ul.hoje-contou-feito", null, ...doDia.map((s) => h("li.hoje-feito",
          h("span.hoje-feito-lotus", { "aria-hidden": "true" }, iconeEl("lotus", { tamanho: 20 })),
          h("span", null, linhaDaSessao(s)),
          s.registro?.sinal ? sinalEl(s.registro.sinal) : null)))
      ));
      raiz.append(h("p.apoio.hoje-mais", null, "Se quiser mais um passo, diga como você está:"));
      raiz.append(estados({ menores: true, marcado: null }));
    } else {
      const secao = h("section.hoje-pergunta", { "aria-labelledby": "hoje-titulo" });
      if (recente) {
        const nome = CHECKIN.estados.find((e) => e.id === recente.estado)?.nome ?? "";
        const tempo = recente.tempo ? `, ${textoDoTempo(recente.tempo)}` : "";
        secao.append(h("div.hoje-ha-pouco",
          h("p", null, `Há pouco você disse: ${nome}${tempo}.`),
          botaoLink("Ver as duas opções", () => navegar(recente.tempo ? "#/hoje/passo" : "#/hoje/tempo"))));
      }
      secao.append(h("h1.titulo.hoje-pergunta-titulo", { id: "hoje-titulo" }, CHECKIN.pergunta));
      secao.append(estados({ menores: false, marcado: recente?.estado ?? null }));
      raiz.append(secao);
    }
    raiz.append(h("p.apoio.hoje-apoio", null, CHECKIN.apoio));
    raiz.append(h("p.hoje-lista", null, h("a.link", { href: "#/praticas" }, CHECKIN.link)));

    // 8: no máximo um cartão secundário.
    const cartao = cartaoSecundario(hoje, f);
    if (cartao) raiz.append(h("div.hoje-secundario", null, cartao));
    return raiz;
  }

  function sinalEl(id) {
    const nome = { leveza: "Leveza", calma: "Calma", alivio: "Alívio", igual: "Igual", peso: "Peso" }[id] ?? id;
    return h("span.hoje-feito-sinal", null, iconeEl(id, { tamanho: 18 }), h("span", null, nome));
  }

  function estados({ menores, marcado }) {
    const lista = h("div.hoje-estados", { class: menores ? "menores" : "" });
    for (const e of CHECKIN.estados) {
      lista.append(h("button.cartao-escolha", {
        type: "button",
        class: marcado === e.id ? "marcado" : "",
        "aria-label": `${e.nome}. ${e.descricao}`,
        onclick: () => {
          registrarCheckin(e.id);
          navegar("#/hoje/tempo");
        }
      },
      h("span.cartao-escolha-icone", { "aria-hidden": "true" }, iconeEl(e.icone, { tamanho: 32 })),
      h("span.cartao-escolha-texto", { "aria-hidden": "true" },
        h("span.cartao-escolha-nome", null, e.nome),
        h("span.cartao-escolha-desc", null, e.descricao))));
    }
    return lista;
  }

  // ------------------------------------------------------------ os cartões secundários (T05)
  function cartaoSecundario(hoje, f) {
    return cartaoDaTrilha(hoje)
      ?? cartaoDoCuidado(hoje)
      ?? cartaoDaSemana(hoje)
      ?? cartaoDoExperimento()
      ?? cartaoDeInstalar(f)
      ?? cartaoDaCopia(f);
  }

  function cartaoBase(rotulo, ...filhos) {
    return h("section.cartao.cartao-secundario", { "aria-label": rotulo }, h("p.rotulo", null, rotulo), ...filhos);
  }

  function cartaoDaTrilha(hoje) {
    const t = trilha(hoje);
    if (t.concluida) return null;
    if (!t.comecou) {
      return cartaoBase("TRILHA DE 7 DIAS",
        h("h2.titulo-cartao", null, "Voltar para mim"),
        h("p.texto", null, "Sete dias para perceber como você está, entender o que te ajuda e escolher um cuidado possível. Todo dia tem versão mínima."),
        h("div.cartao-secundario-acoes", null, botaoSecundario("Ver a trilha", () => navegar("#/trilha"))));
    }
    if (!t.disponivel) return null;
    const dia = diaDaTrilha(t.proximo);
    const fase = faseDoDia(t.proximo);
    const nos = h("div.fio-nos", { "aria-hidden": "true" });
    for (let n = 1; n <= 7; n++) {
      if (n > 1) nos.append(h("span.fio-traco"));
      const feito = Boolean(estado.trilha.dias[n]);
      nos.append(h("span.fio-no", { class: feito ? "feito" : n === t.proximo ? "disponivel" : "" }));
    }
    return cartaoBase(`VOLTAR PARA MIM · DIA ${t.proximo} DE 7`,
      h("h2.titulo-cartao", null, dia?.titulo ?? ""),
      h("p.apoio", null, `${fase?.nome ?? ""} · ${dia?.tempo ?? 5} min · mínima ${dia?.minimaMin ?? 1} min`),
      nos,
      t.esperaPorVoce ? h("p.texto", null, `A trilha está no Dia ${t.proximo}, esperando por você.`) : null,
      h("div.cartao-secundario-acoes", null, botaoSecundario(`Fazer o Dia ${t.proximo}`, () => navegar(`#/trilha/${t.proximo}`))));
  }

  function cartaoDoCuidado(hoje) {
    const cp = estado.cuidadoPossivel;
    if (!cp || !cp.gesto || cp.naTelaHoje === false) return null;
    const marcadoAgora = cuidadoMarcadoEm === hoje;
    if (cuidadoFeitoHoje(hoje) && !marcadoAgora) return null;
    const dia6 = DIAS[5];
    const passoDoGesto = (dia6?.completa ?? []).find((p) => p.chave === "gesto");
    const pastilhas = [...(passoDoGesto?.opcoes ?? []), ...(estado.fazBem.coisas ?? [])];
    const c = fraseDoCuidado(cp, { pastilhas });
    if (!c) return null;
    const acoes = h("div.cartao-secundario-acoes");
    if (marcadoAgora) {
      acoes.append(h("p.feito-hoje", { role: "status" }, iconeEl("lotus", { tamanho: 20 }), h("span", null, "Feito hoje.")));
    } else {
      acoes.append(
        botaoSecundario("Fiz hoje", () => {
          const r = fizHoje();
          cuidadoMarcadoEm = hoje;
          desenhar({ crescerAgora: r.cresceu });
        }),
        botaoLink("Mudar", () => navegar("#/pratica/T6?so=cuidado&de=hoje")));
    }
    return cartaoBase("SEU CUIDADO POSSÍVEL",
      h("p.frase-cuidado", null, c.frase),
      c.minima ? h("p.apoio", null, c.minima) : null,
      acoes);
  }

  function cartaoDaSemana(hoje) {
    const passada = somarDias(segundaDaSemana(hoje), -7);
    if (estado.cartoes.semanaVista === passada) return null;
    if (!semana(passada).diasComCuidado.length) return null;
    return cartaoBase("PEQUENO SE ACUMULA",
      h("h2.titulo-cartao", null, "Sua semana passada está pronta."),
      h("div.cartao-secundario-acoes", null, botaoSecundario("Ver", () => {
        alterar((e) => { e.cartoes.semanaVista = passada; });
        navegar(`#/semana/${passada}`);
      })));
  }

  function cartaoDoExperimento() {
    if (estado.cartoes.experimento !== "pendente") return null;
    return cartaoBase("PARA QUEM DUVIDA",
      h("h2.titulo-cartao", null, "Teste em 1 minuto."),
      h("p.texto", null, "Você mede a sua tensão de 0 a 10, faz um minuto de pausa e mede de novo. O resultado é seu."),
      h("div.cartao-secundario-acoes", null,
        botaoSecundario("Testar", () => navegar("#/experimento")),
        botaoLink("Agora não", () => alterar((e) => { e.cartoes.experimento = "dispensado"; }))));
  }

  function cartaoDeInstalar(f) {
    if (f.N < 2 || estaInstalado() || estado.cartoes.instalar !== "pendente") return null;
    const iphone = eIphone();
    const texto = iphone
      ? "Instale o Sintonia Interior na tela de início. No iPhone, o navegador pode apagar os dados de um site depois de alguns dias sem visita."
      : "Instale o Sintonia Interior na tela de início. Ele abre como um app e funciona sem internet.";
    const pedido = !iphone && pedidoDeInstalacao();
    return cartaoBase("PARA GUARDAR COM SEGURANÇA",
      h("p.texto", null, texto),
      h("div.cartao-secundario-acoes", null,
        pedido
          ? botaoSecundario("Instalar", async () => { await instalarApp(); desenhar(); })
          : botaoSecundario("Como instalar", () => navegar("#/ajustes/instalar")),
        botaoLink("Agora não", () => alterar((e) => { e.cartoes.instalar = "dispensado"; }))));
  }

  function cartaoDaCopia(f) {
    if (emDemo) return null;
    const desde = Math.max(estado.ultimaCopia?.diasDeCuidado ?? 0, estado.cartoes.copiaDispensadaEmN ?? 0);
    if (f.N - desde < 7) return null;
    return cartaoBase("SEUS DADOS",
      h("h2.titulo-cartao", null, "Quer guardar uma cópia?"),
      h("p.texto", null, "Seus registros ficam só neste aparelho. Uma cópia num lugar seu ajuda se você trocar de celular."),
      h("div.cartao-secundario-acoes", null,
        botaoSecundario("Guardar uma cópia", () => {
          if (baixarCopia()) avisoCurto("Cópia baixada. Guarde num lugar seu: quem abrir o arquivo lê os seus registros.");
        }),
        botaoLink("Agora não", () => alterar((e) => { e.cartoes.copiaDispensadaEmN = diasDeCuidado().length; }))));
  }
}

// ---------------------------------------------------------------- a folha Sua flor (6.10)

/** Abre a folha Sua flor. Usada por Hoje, pela página esquerda do computador e pela Semana. */
export function abrirSuaFlor() {
  const f = flor();
  const t = FLOR.folhaFlor;
  return abrirFolha({
    titulo: t.titulo(f.estagio),
    classe: "folha-sua-flor",
    conteudo(corpo) {
      const fileira = h("div.sua-flor-estagios", { "aria-hidden": "true" });
      for (let i = 0; i <= 7; i++) {
        fileira.append(h("span", null, svg(desenhos.miniaturaFlor(i, { atual: i === f.estagio }))));
      }
      const idLago = idUnico("lago");
      corpo.append(
        h("div.sua-flor-texto", null, ...t.textos.map((x) => h("p.texto", null, x))),
        fileira,
        h("div.sua-flor-lago", null,
          h("p.texto", { id: idLago }, t.lago(f.lago.length)),
          botaoLink(t.verLago, async () => {
            try {
              const m = await import("./semana.js");
              if (typeof m.abrirSeuLago === "function") { m.abrirSeuLago(); return; }
            } catch (erro) {
              console.error(erro);
            }
            navegar("#/semana");
          }))
      );
    }
  });
}
