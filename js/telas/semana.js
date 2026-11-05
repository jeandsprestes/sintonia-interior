// T17 · Semana: "Pequeno se acumula" (6.11 e 7.9), a faixa dos sete dias, a flor, o lago e as linhas
// para Seu caderno, Ajustes e Sobre. Rotas: #/semana (a semana de hoje) e #/semana/{AAAA-MM-DD} (a segunda-feira).
// Tudo sai de regras.js (semana, flor) na hora; nada é guardado, menos cartoes.semanaVista quando a pessoa
// abre o resumo da semana passada (é o que tira o cartão "Sua semana passada está pronta." de Hoje).
// Nunca diz quantos dias a pessoa ficou fora, nunca compara semanas e nunca mostra o que faltou.
// Também exporta abrirSeuLago(): a folha Seu lago (6.10), que a folha Sua flor abre em "Ver o lago".

import { h, svg, iconeEl, idUnico, desenhos, abrirFolha, botaoSecundario } from "../ui.js";
import { estado, alterar } from "../estado.js";
import { diaLogico, diaDe, segundaDaSemana, somarDias, diaDaSemanaCurto, intervalo, diaEMes } from "../dia.js";
import { flor, semana } from "../regras.js";
import { SEMANA, FLOR, REGISTRO } from "../conteudo/textos.js";
import { navegar } from "../app.js";
import { tituloDaSessao, linhaDeIr, listaDeIr } from "../casa.js";

export const moldura = {
  aba: "semana", barra: "aba", titulo: "Semana", esquerda: null, limite: "icone",
  acoes: [{ icone: "ajustes", rotulo: "Ajustes", rota: "#/ajustes" }]
};

const LETRAS = ["S", "T", "Q", "Q", "S", "S", "D"];
const NOMES_DOS_DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const eDia = (t) => typeof t === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t));

/** A segunda-feira da primeira semana com o app (a seta "Semana anterior" para nela). */
function primeiraSegunda(hoje) {
  const dias = [hoje];
  if (estado.criadoEm) { try { dias.push(diaDe(estado.criadoEm)); } catch { /* sem data */ } }
  for (const s of estado.sessoes) if (eDia(s.dia)) dias.push(s.dia);
  for (const c of estado.checkins) if (eDia(c.dia)) dias.push(c.dia);
  return segundaDaSemana(dias.filter(eDia).sort()[0]);
}

export function montar(el, ctx) {
  let observador = null;
  const desenhar = () => {
    observador?.disconnect();
    el.replaceChildren();
    const r = telaDaSemana(ctx);
    observador = r.observador;
    el.append(r.raiz);
  };
  desenhar();
  if (ctx.dados?.focar) {
    setTimeout(() => el.querySelector(`[data-seta="${ctx.dados.focar}"]:not(:disabled)`)?.focus({ preventScroll: true }), 60);
  }
  return {
    aoMudarEstado() { desenhar(); },
    destruir() { observador?.disconnect(); }
  };
}

function telaDaSemana(ctx) {
  const hoje = diaLogico();
  const atual = segundaDaSemana(hoje);
  const primeira = primeiraSegunda(hoje);
  let segunda = atual;
  if (ctx.params.segunda && eDia(ctx.params.segunda)) segunda = segundaDaSemana(ctx.params.segunda);
  if (segunda > atual) segunda = atual;
  if (segunda < primeira) segunda = primeira;
  const eAtual = segunda === atual;

  // Abrir o resumo da semana passada tira o cartão dela de Hoje (7.3, semanaVista).
  if (segunda === somarDias(atual, -7) && estado.cartoes.semanaVista !== segunda) {
    alterar((e) => { e.cartoes.semanaVista = segunda; });
  }

  const s = semana(segunda);
  const f = flor(hoje);
  const raiz = h("div.coluna.semana");

  // 2. O rótulo, o título e as setas.
  const irPara = (outra, focar) => {
    const rota = outra === atual ? "#/semana" : `#/semana/${outra}`;
    navegar(rota, { substituir: true, dados: { focar } });
  };
  const anterior = h("button.icone-botao.semana-seta", {
    type: "button", "aria-label": "Semana anterior", dataset: { seta: "anterior" },
    disabled: segunda <= primeira, onclick: () => irPara(somarDias(segunda, -7), "anterior")
  }, iconeEl("voltar"));
  const proxima = h("button.icone-botao.semana-seta.semana-seta-proxima", {
    type: "button", "aria-label": "Próxima semana", dataset: { seta: "proxima" },
    disabled: eAtual, onclick: () => irPara(somarDias(segunda, 7), "proxima")
  }, iconeEl("voltar"));
  const datas = intervalo(segunda, s.fim);
  // Quando o rótulo não cabe numa linha, ele quebra depois do "·": as datas descem juntas.
  const rotulo = eAtual ? SEMANA.rotuloAtual(datas) : SEMANA.rotuloPassada(datas);
  const corte = rotulo.indexOf(" · ");
  raiz.append(h("header.semana-cabeca",
    h("div.semana-cabeca-linha",
      h("p.rotulo.semana-rotulo", null, corte === -1 ? rotulo : [
        h("span.semana-rotulo-parte", null, `${rotulo.slice(0, corte)} ·`), " ",
        h("span.semana-rotulo-datas", null, rotulo.slice(corte + 3))
      ]),
      h("div.semana-setas", null, anterior, proxima)),
    h("h1.titulo.semana-titulo", null, SEMANA.titulo)));

  // 3. A faixa da semana.
  raiz.append(faixa(s, hoje));

  // 4. A frase principal e os blocos de 6.11, só os que têm conteúdo.
  raiz.append(resumo(s, f, eAtual));

  // 5. Sua flor (no computador, a flor já está na página esquerda).
  raiz.append(blocoDaFlor(f));

  // 6. Seu lago.
  const lago = blocoDoLago(f);
  raiz.append(lago.el);

  // 7. Seu caderno, Ajustes e Sobre.
  raiz.append(h("nav.semana-mais", { "aria-label": "Mais" }, listaDeIr([
    linhaDeIr({ nome: "Seu caderno", rota: "#/caderno" }),
    linhaDeIr({ nome: "Ajustes", rota: "#/ajustes" }),
    linhaDeIr({ nome: "Sobre o Sintonia Interior", rota: "#/sobre" })
  ])));

  return { raiz, observador: lago.observador };
}

function faixa(s, hoje) {
  const comCuidado = new Set(s.diasComCuidado);
  return h("ol.semana-faixa", { "aria-label": "Os sete dias da semana" }, ...s.dias.map((dia, i) => {
    const cuidou = comCuidado.has(dia);
    return h("li.semana-dia", { class: [cuidou ? "semana-dia-cuidou" : "", dia === hoje ? "semana-dia-hoje" : ""].filter(Boolean).join(" ") },
      h("span.semana-dia-letra", { "aria-hidden": "true" }, LETRAS[i]),
      h("span.semana-dia-marca", { "aria-hidden": "true" },
        cuidou ? iconeEl("lotus", { tamanho: 22 }) : h("span.semana-dia-ponto")),
      h("span.visivel-leitor", null, `${NOMES_DOS_DIAS[i]}, ${cuidou ? "com cuidado" : "sem registro"}.`));
  }));
}

function bloco(rotulo, ...filhos) {
  const id = idUnico("bloco");
  return h("section.semana-bloco", { "aria-labelledby": id }, h("h2.rotulo", { id }, rotulo), ...filhos);
}

function resumo(s, f, eAtual) {
  const area = h("div.semana-resumo");
  if (f.N === 0) {
    area.append(h("p.lede-display.semana-frase", null, "Quando você fizer a primeira prática, ela aparece aqui."));
    return area;
  }
  if (!s.diasComCuidado.length) {
    if (eAtual) {
      area.append(
        h("p.lede-display.semana-frase", null, SEMANA.vaziaAtual),
        h("div.semana-respirar", null, botaoSecundario(SEMANA.respirarAgora, () => navegar("#/praticas?respirar=1&de=semana"))));
    } else {
      area.append(h("p.lede-display.semana-frase", null, SEMANA.vaziaPassada));
    }
    area.append(h("p.apoio.semana-desde", null, SEMANA.desdeOComeco(f.N, f.lago.length)));
    return area;
  }

  const minutos = s.soCuidadoPossivel || !s.minutos ? null : s.minutos;
  area.append(h("p.lede-display.semana-frase", null, SEMANA.comCuidado(s.diasComCuidado.length, minutos)));

  area.append(bloco(SEMANA.rotuloFez, h("ul.semana-feitos", null, ...s.sessoes.map((x) => h("li.semana-feito",
    h("span.semana-feito-lotus", { "aria-hidden": "true" }, iconeEl("lotus", { tamanho: 18 })),
    h("span", null, x.origem === "cuidado" || x.praticaId === "CUIDADO"
      ? SEMANA.itemCuidado(diaDaSemanaCurto(x.dia))
      : SEMANA.itemFez(diaDaSemanaCurto(x.dia), tituloDaSessao(x), x.versao)))))));

  if (s.sinais.length) {
    area.append(bloco(SEMANA.rotuloComoFicou, h("ul.semana-sinais", null, ...s.sinais.map((x) => {
      const nome = REGISTRO.sinais.find((y) => y.id === x.sinal)?.nome ?? x.sinal;
      return h("li.semana-sinal",
        h("span.semana-sinal-desenho", { "aria-hidden": "true" }, iconeEl(x.sinal, { tamanho: 20 })),
        h("span.semana-sinal-nome", null, nome));
    }))));
  }

  const medicoes = SEMANA.medicoes(s.medicoes);
  if (medicoes) area.append(bloco(SEMANA.rotuloMedicoes, h("p.texto", null, medicoes)));

  if (s.linhas.length) {
    area.append(bloco(SEMANA.rotuloLinhas, h("ul.semana-linhas", null, ...s.linhas.map((x) => h("li.semana-linha",
      h("p.semana-linha-texto", null, x.linha),
      h("p.semana-linha-dia", null, diaDaSemanaCurto(x.dia)))))));
  }

  const trilha = SEMANA.trilha({ dias: s.trilhaDias, terminou: s.trilhaConcluida });
  const extras = [trilha, s.descargas ? SEMANA.descargas(s.descargas) : null].filter(Boolean);
  if (extras.length) area.append(h("div.semana-extras", null, ...extras.map((t) => h("p.texto", null, t))));

  area.append(h("p.apoio.semana-desde", null, SEMANA.desdeOComeco(f.N, f.lago.length)));
  return area;
}

function blocoDaFlor(f) {
  const rotulo = desenhos.rotuloDaFlor({ estagio: f.estagio, descansa: f.descansa, cresceuHoje: f.cresceuHoje }) || "Sua flor";
  const abrir = async () => {
    try {
      const m = await import("./hoje.js");
      m.abrirSuaFlor?.();
    } catch (erro) {
      console.error(erro);
    }
  };
  const id = idUnico("flor");
  return h("section.semana-bloco.semana-flor.so-celular", { "aria-labelledby": id },
    h("h2.rotulo", { id }, "SUA FLOR"),
    h("div.semana-flor-linha",
      h("button.semana-flor-botao", { type: "button", "aria-label": rotulo, onclick: abrir },
        svg(desenhos.florSVG({ estagio: f.estagio, descansa: f.descansa, cresceuHoje: f.cresceuHoje, altura: 120 }))),
      h("div.semana-flor-texto",
        h("p.rotulo.semana-flor-estagio", { "aria-hidden": "true" }, FLOR.rotulo(f.estagio, f.descansa)),
        h("p.texto.semana-flor-lago", null, FLOR.folhaFlor.lago(f.lago.length)))));
}

function blocoDoLago(f) {
  const n = f.lago.length;
  const id = idUnico("lago");
  const desenho = h("span.semana-lago-desenho", { "aria-hidden": "true" }, svg(desenhos.lagoSVG(n, { largura: 360 })));
  const botao = h("button.semana-lago-botao", {
    type: "button", "aria-label": `Seu lago. ${FLOR.folhaFlor.lago(n)}`, onclick: () => abrirSeuLago()
  }, desenho);
  const el = h("section.semana-bloco.semana-lago", { "aria-labelledby": id },
    h("h2.rotulo", { id }, "SEU LAGO"),
    botao,
    n === 0
      ? h("p.apoio.semana-lago-texto", null, "O lago espera a primeira lótus.")
      : h("p.apoio.semana-lago-texto.so-computador", null, FLOR.folhaFlor.lago(n)));
  // O lago é desenhado na largura real (flor.js): ao mudar a largura, desenha de novo.
  let largura = 0;
  const observador = typeof ResizeObserver === "function" ? new ResizeObserver((entradas) => {
    const w = Math.round(entradas[0]?.contentRect?.width ?? 0);
    if (!w || Math.abs(w - largura) < 2) return;
    largura = w;
    desenho.replaceChildren(svg(desenhos.lagoSVG(n, { largura: w })));
  }) : null;
  observador?.observe(botao);
  return { el, observador };
}

// ---------------------------------------------------------------- a folha Seu lago (6.10)

/** Abre a folha Seu lago. A folha Sua flor (js/telas/hoje.js) chama esta função no link "Ver o lago". */
export function abrirSeuLago() {
  const f = flor();
  const t = FLOR.folhaLago;
  const n = f.lago.length;
  return abrirFolha({
    titulo: t.titulo,
    classe: "lago-folha",
    conteudo(corpo) {
      const desenho = h("div.lago-folha-desenho", { "aria-hidden": "true" }, svg(desenhos.lagoSVG(n, { largura: 360 })));
      corpo.append(desenho);
      if (!n) {
        corpo.append(h("p.texto", null, t.vazio));
      } else {
        corpo.append(
          h("p.texto", null, t.texto),
          h("ul.lago-folha-lista", null, ...[...f.lago].reverse().map((x) =>
            h("li.lago-folha-item",
              h("span.lago-folha-lotus", { "aria-hidden": "true" }, iconeEl("lotus", { tamanho: 20 })),
              h("span", null, t.item(diaEMes(x.abriuEm), diaEMes(x.comecou)))))));
      }
      // Desenha de novo na largura real da folha, assim que ela aparece.
      requestAnimationFrame(() => {
        const w = Math.round(desenho.clientWidth);
        if (w > 0 && Math.abs(w - 360) >= 2) desenho.replaceChildren(svg(desenhos.lagoSVG(n, { largura: w })));
      });
    }
  });
}
