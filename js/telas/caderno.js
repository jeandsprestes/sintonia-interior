// T18 · Seu caderno e as listas dele (dentro de Semana). Rotas: #/caderno e #/caderno/{lista}, com as listas
// registros, medicoes, descargas, audios, escritos, bem, cuidado e trilha. O detalhe de um registro é
// #/caderno/registros?s={id da sessão}. Listas em <ul>; cada exclusão pede confirmação numa folha.
// Apagar qualquer coisa daqui nunca muda a flor (critério 24): "Apagar o sinal e a linha" tira só o registro
// leve da sessão, que continua contando; descargas, escritos e áudios não são sessões.
// Os áudios moram em js/voz.js (do dia pesado), importado na hora do uso; se ele falhar, a lista só fica vazia.

import { h, svg, iconeEl, idUnico, desenhos, botaoSecundario, botaoLink, linkRota, avisoCurto, porTom, juntar, plural } from "../ui.js";
import { estado, alterar } from "../estado.js";
import { diaEMes, diaCurto, rotuloDoDia, diaDe } from "../dia.js";
import { atualizarSessao, contarMedicoes } from "../regras.js";
import { pratica as praticaPorId, preencher } from "../conteudo/praticas.js";
import { DIAS, diaDaTrilha, fraseDoCuidado } from "../conteudo/trilha.js";
import { REGISTRO, DESCARREGAR } from "../conteudo/textos.js";
import { navegar } from "../app.js";
import { tituloDaSessao, textoDaVersao, linhaDeIr, listaDeIr, seta, confirmar } from "../casa.js";

const LISTAS = {
  registros: { nome: "Registros", montar: listaDosRegistros },
  medicoes: { nome: "Medições", montar: listaDasMedicoes },
  descargas: { nome: "Descargas", montar: listaDasDescargas },
  audios: { nome: "Áudios", montar: listaDosAudios },
  escritos: { nome: "Escritos", montar: listaDosEscritos },
  bem: { nome: "O que te faz bem", montar: listaDoQueFazBem },
  cuidado: { nome: "Seu cuidado possível", montar: listaDoCuidado },
  trilha: { nome: "Sua trilha", montar: listaDaTrilha }
};

const DIMENSOES_DO_MAPA = ["corpo", "emocoes", "mente", "espirito"];

export function moldura(ctx) {
  const lista = LISTAS[ctx.params.lista] ? ctx.params.lista : null;
  if (!lista) return { aba: "semana", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/semana" };
  const detalhe = lista === "registros" && Boolean(ctx.query.s);
  return {
    aba: "semana", barra: "interna", titulo: detalhe ? "REGISTROS" : "SEU CADERNO",
    esquerda: "voltar", limite: "icone", pai: detalhe ? "#/caderno/registros" : "#/caderno"
  };
}

export async function montar(el, ctx) {
  // Uma lista que não existe mostra o índice ali mesmo: navegar durante a montagem pularia a troca de tela.
  const lista = LISTAS[ctx.params.lista] ? ctx.params.lista : null;
  const tocador = { atual: null };
  // Desenha de novo depois de uma mudança. focar: um seletor para devolver o foco (o h1, por padrão).
  const desenhar = async ({ focar = null } = {}) => {
    const quadro = h("div.coluna.caderno-tela");
    if (!lista) await indice(quadro);
    else if (lista === "registros" && ctx.query.s) detalheDoRegistro(quadro, ctx, desenhar);
    else await LISTAS[lista].montar(quadro, { ctx, desenhar, tocador });
    if (ctx.sinal.aborted) return;
    el.replaceChildren(quadro);
    if (focar) {
      const alvo = quadro.querySelector(focar) ?? quadro.querySelector("h1");
      if (alvo) {
        if (alvo.tagName === "H1") alvo.setAttribute("tabindex", "-1");
        alvo.focus({ preventScroll: true });
      }
    }
  };
  await desenhar();
  return {
    aoMudarEstado() { desenhar(); },
    destruir() { pararAudio(tocador); }
  };
}

// ---------------------------------------------------------------- ajudantes

const porInicio = (a, b) => (Date.parse(b.inicio) || 0) - (Date.parse(a.inicio) || 0);
const porEm = (a, b) => (Date.parse(b.em) || 0) - (Date.parse(a.em) || 0);

function sessoesQueContam() {
  return estado.sessoes.filter((s) => s.conta).sort(porInicio);
}

// O append do DOM escreveria "null" (LEIA.md, Armadilhas): as listas saem sem os que faltam.
function cabeca(titulo, linha = null) {
  return [
    h("h1.titulo.caderno-titulo", null, titulo),
    linha ? h("p.texto.caderno-linha", null, linha) : null
  ].filter(Boolean);
}

function vazio(texto, ...extra) {
  return h("div.caderno-vazio", null, h("p.texto", null, texto), ...extra);
}

function nomeDoSinal(id) {
  return REGISTRO.sinais.find((x) => x.id === id)?.nome ?? null;
}

function sinalEl(id, tamanho = 16) {
  const nome = nomeDoSinal(id);
  if (!nome) return null;
  return h("span.caderno-sinal", null, h("span.caderno-sinal-icone", { "aria-hidden": "true" }, iconeEl(id, { tamanho })), h("span", null, nome));
}

async function audiosGuardados() {
  try {
    const voz = await import("../voz.js");
    const lista = await Promise.race([
      Promise.resolve(voz.listarAudios?.()).catch(() => []),
      new Promise((resolver) => setTimeout(() => resolver([]), 900))
    ]);
    return { voz, lista: Array.isArray(lista) ? lista : [] };
  } catch (erro) {
    console.error(erro);
    return { voz: null, lista: [] };
  }
}

/** Um valor de resposta em texto: texto, lista de textos ou a escala do Dia 3 (0 a 3 vira "Algum"). */
function valorLegivel(v, passo) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") {
    if (Array.isArray(passo.valores) && Array.isArray(passo.opcoes)) {
      const i = passo.valores.indexOf(v);
      return i >= 0 ? String(passo.opcoes[i]) : "";
    }
    return "";
  }
  if (Array.isArray(v)) return juntar(v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()));
  return "";
}

/**
 * As respostas escritas ou escolhidas de uma prática ou de um dia da trilha, com a pergunta de cada uma,
 * na ordem dos passos da versão feita. pular: chaves que a tela mostra de outro jeito.
 */
function respostasLegiveis(conteudo, respostas, { versao = "completa", pular = [], tom = null } = {}) {
  if (!conteudo || !respostas || typeof respostas !== "object") return [];
  const ordem = versao === "minima" ? ["minima", "completa"] : ["completa", "minima"];
  const passos = ordem.flatMap((v) => conteudo[v] ?? []);
  const vistos = new Set(pular);
  const itens = [];
  for (const p of passos) {
    if (p.tipo !== "escolher" && p.tipo !== "escrever") continue;
    const entradas = Array.isArray(p.campos) && p.campos.length ? p.campos : [{ chave: p.chave, pergunta: p.pergunta }];
    for (const e of entradas) {
      if (!e.chave || vistos.has(e.chave)) continue;
      const resposta = valorLegivel(respostas[e.chave], p);
      if (!resposta) continue;
      vistos.add(e.chave);
      const pergunta = porTom(e.pergunta ?? p.pergunta ?? "", tom ?? estado.ajustes.tom);
      itens.push({ pergunta: typeof pergunta === "string" ? preencher(pergunta, respostas) : "", resposta });
    }
  }
  return itens;
}

function listaDeRespostas(itens) {
  return h("dl.caderno-respostas", null, ...itens.flatMap((x) => [
    h("dt.caderno-pergunta", null, x.pergunta),
    h("dd.caderno-resposta", null, x.resposta)
  ]));
}

function conteudoDaSessao(s) {
  const id = s?.praticaId ?? "";
  if (/^T[1-7]$/.test(id)) return diaDaTrilha(id);
  return praticaPorId(id);
}

function pastilhasDoGesto() {
  const passo = (DIAS[5]?.completa ?? []).find((p) => p.chave === "gesto");
  return [...(passo?.opcoes ?? []), ...(estado.fazBem?.coisas ?? [])];
}

// ---------------------------------------------------------------- o índice

async function indice(q) {
  const { lista: audios } = await audiosGuardados();
  const sessoes = sessoesQueContam();
  const medicoes = sessoes.filter((s) => s.antes != null && s.depois != null);
  const fb = estado.fazBem ?? {};
  const coisas = (fb.coisas ?? []).filter(Boolean);
  const cuidado = estado.cuidadoPossivel?.gesto ? fraseDoCuidado(estado.cuidadoPossivel, { pastilhas: pastilhasDoGesto() }) : null;
  const t = estado.trilha;
  const feitos = [1, 2, 3, 4, 5, 6, 7].filter((n) => t.dias?.[n]).length;
  const rodadas = (t.anteriores ?? []).filter((r) => r && r.dias && typeof r.dias === "object").length;

  const previaDaTrilha = t.concluidaEm
    ? `Terminada em ${diaCurto(t.concluidaEm)}`
    : feitos ? `${feitos} de 7 dias`
      : rodadas ? "A trilha nova começa no Dia 1." : "Começa no Dia 1.";

  q.append(...cabeca("Seu caderno", "Tudo o que você guardou, só neste aparelho."), listaDeIr([
    linhaDeIr({ nome: "Registros", rota: "#/caderno/registros",
      previa: sessoes.length ? `${diaCurto(sessoes[0].dia)} · ${tituloDaSessao(sessoes[0])}` : "Aparecem depois da primeira prática." }),
    linhaDeIr({ nome: "Medições", rota: "#/caderno/medicoes",
      previa: medicoes.length ? plural(medicoes.length, "medição", "medições") : "Aparecem quando você medir a tensão." }),
    linhaDeIr({ nome: "Descargas", rota: "#/caderno/descargas",
      previa: estado.descargas.length ? plural(estado.descargas.length, "descarga", "descargas") : "Quando a cabeça encher, ficam aqui." }),
    audios.length ? linhaDeIr({ nome: "Áudios", rota: "#/caderno/audios", previa: plural(audios.length, "áudio", "áudios") }) : null,
    estado.escritos.length ? linhaDeIr({ nome: "Escritos", rota: "#/caderno/escritos", previa: plural(estado.escritos.length, "escrito", "escritos") }) : null,
    linhaDeIr({ nome: "O que te faz bem", rota: "#/caderno/bem",
      previa: coisas.length ? juntar(coisas) : fb.musica || fb.frase || "Você monta no Dia 5 da trilha, ou agora." }),
    linhaDeIr({ nome: "Seu cuidado possível", rota: "#/caderno/cuidado",
      previa: cuidado ? cuidado.frase : "Você escolhe no Dia 6 da trilha." }),
    linhaDeIr({ nome: "Sua trilha", rota: "#/caderno/trilha", previa: previaDaTrilha })
  ], "caderno-indice"));
}

// ---------------------------------------------------------------- Registros

function listaDosRegistros(q) {
  const sessoes = sessoesQueContam();
  q.append(...cabeca("Registros"));
  if (!sessoes.length) {
    q.append(vazio("Seus registros aparecem aqui depois da primeira prática."));
    return;
  }
  const dias = [];
  for (const s of sessoes) {
    const ultimo = dias.at(-1);
    if (ultimo && ultimo.dia === s.dia) ultimo.sessoes.push(s);
    else dias.push({ dia: s.dia, sessoes: [s] });
  }
  q.append(h("div.caderno-dias-registros", null, ...dias.map((d) => {
    const id = idUnico("dia");
    return h("section.caderno-grupo", { "aria-labelledby": id },
      h("h2.rotulo.caderno-grupo-rotulo", { id }, rotuloDoDia(d.dia)),
      h("ul.caderno-cartoes", null, ...d.sessoes.map((s) => h("li", null, linhaDoRegistro(s)))));
  })));
}

function linhaDoRegistro(s) {
  const versao = textoDaVersao(s.versao);
  const sinal = s.registro?.sinal ? sinalEl(s.registro.sinal) : null;
  return h("a.cartao.caderno-registro", { href: `#/caderno/registros?s=${encodeURIComponent(s.id)}` },
    h("span.caderno-registro-corpo", null,
      h("span.caderno-registro-titulo", null, tituloDaSessao(s)),
      versao || sinal ? h("span.caderno-registro-meta", null, versao ? h("span", null, versao) : null, sinal) : null,
      s.registro?.linha ? h("span.caderno-registro-linha", null, s.registro.linha) : null),
    h("span.casa-linha-seta", { "aria-hidden": "true" }, iconeEl("voltar", { tamanho: 18 })));
}

function detalheDoRegistro(q, ctx, desenhar) {
  const s = estado.sessoes.find((x) => x.id === ctx.query.s);
  if (!s) {
    // Um registro que não está mais aqui: a lista aparece no lugar dele.
    listaDosRegistros(q);
    return;
  }
  const versao = textoDaVersao(s.versao);
  const temRegistro = Boolean(s.registro && (s.registro.sinal || s.registro.linha));
  const respostas = respostasLegiveis(conteudoDaSessao(s), s.respostas, { versao: s.versao, tom: s.tom });
  q.append(...[
    h("p.rotulo.caderno-detalhe-dia", null, rotuloDoDia(s.dia)),
    h("h1.titulo.caderno-titulo", null, tituloDaSessao(s)),
    versao ? h("p.apoio.caderno-detalhe-versao", null, versao) : null
  ].filter(Boolean));
  if (temRegistro) {
    q.append(h("div.cartao.caderno-detalhe-registro", null,
      s.registro.sinal ? sinalEl(s.registro.sinal, 20) : null,
      s.registro.linha ? h("p.caderno-detalhe-linha", null, s.registro.linha) : null));
  }
  if (respostas.length) {
    const id = idUnico("respostas");
    q.append(h("section.caderno-secao", { "aria-labelledby": id },
      h("h2.rotulo", { id }, "SUAS RESPOSTAS"), listaDeRespostas(respostas)));
  }
  if (temRegistro) {
    q.append(h("p.caderno-acao-final", null, botaoLink("Apagar o sinal e a linha", async () => {
      const sim = await confirmar({
        titulo: "Apagar o sinal e a linha deste registro?",
        texto: "A prática continua contando para a sua flor.",
        sim: "Apagar", nao: "Cancelar"
      });
      if (!sim) return;
      atualizarSessao(s.id, { registro: null });
      desenhar({ focar: "h1" });
    })));
  }
}

// ---------------------------------------------------------------- Medições

function resumoDasMedicoes({ total, baixou, igual, subiu }) {
  if (total === 1) return `Em 1 medição: ${baixou ? "baixou" : igual ? "ficou igual" : "subiu"}.`;
  const partes = [];
  if (baixou) partes.push(`baixou em ${baixou}`);
  if (igual) partes.push(`ficou igual em ${igual}`);
  if (subiu) partes.push(`subiu em ${subiu}`);
  return `Em ${total} medições: ${partes.join(", ")}.`;
}

/** A régua mínima de 0 a 10: o antes em anel, o depois em ponto cheio, ligados por um traço (classes de app.css). */
function reguaDoPar(antes, depois) {
  const pos = (v) => `calc(6px + (100% - 12px) * ${v / 10})`;
  const menor = Math.min(antes, depois);
  const maior = Math.max(antes, depois);
  return h("div.regua-par.caderno-regua", { "aria-hidden": "true" },
    h("span.regua-par-linha"),
    h("span.caderno-regua-marca", { style: `left: ${pos(0)}` }),
    h("span.caderno-regua-marca", { style: `left: ${pos(5)}` }),
    h("span.caderno-regua-marca", { style: `left: ${pos(10)}` }),
    h("span.regua-par-liga", { style: `left: ${pos(menor)}; width: calc((100% - 12px) * ${(maior - menor) / 10})` }),
    h("span.regua-par-antes", { style: `left: ${pos(antes)}` }),
    h("span.regua-par-depois", { style: `left: ${pos(depois)}` }));
}

function listaDasMedicoes(q) {
  const lista = sessoesQueContam().filter((s) => Number.isFinite(s.antes) && Number.isFinite(s.depois));
  q.append(...cabeca("Medições"));
  if (!lista.length) {
    q.append(vazio("Quando você medir a tensão antes e depois de uma prática, os números aparecem aqui.",
      h("p.caderno-vazio-link", null, linkRota("Fazer o experimento de 1 minuto", "#/experimento"))));
    return;
  }
  q.append(
    h("p.texto.caderno-linha", null, "Cada linha vai do antes ao depois. Os números são seus."),
    h("p.lede-display.caderno-resumo", null, resumoDasMedicoes(contarMedicoes(lista))),
    h("ul.caderno-medicoes", null, ...lista.map((s) => h("li.caderno-medicao",
      h("p.caderno-medicao-linha", null,
        h("span.caderno-medicao-nome", null, `${diaCurto(s.dia)} · ${tituloDaSessao(s)}`),
        h("span.caderno-medicao-par", null,
          h("span.visivel-leitor", null, ", de "), h("span", null, String(s.antes)),
          seta(),
          h("span.visivel-leitor", null, " para "), h("span", null, String(s.depois)))),
      reguaDoPar(s.antes, s.depois))))
  );
}

// ---------------------------------------------------------------- Descargas

function listaDasDescargas(q, { desenhar }) {
  const lista = [...estado.descargas].sort(porEm);
  q.append(...cabeca("Descargas"));
  if (!lista.length) {
    q.append(vazio("Nada por aqui ainda. Quando a cabeça encher, Descarregar a cabeça ajuda a separar."));
    return;
  }
  q.append(h("ul.caderno-cartoes.caderno-descargas", null, ...lista.map((d) => h("li", null, cartaoDaDescarga(d, desenhar)))));
}

function cartaoDaDescarga(d, desenhar) {
  const id = idUnico("descarga");
  const itens = Array.isArray(d.itens) ? d.itens : [];
  const semGrupo = itens.filter((i) => !i.grupo);
  const partes = [];
  if (semGrupo.length) partes.push(h("ul.caderno-itens", null, ...semGrupo.map((i) => h("li.caderno-item", null, i.texto))));
  for (const g of DESCARREGAR.separar.grupos) {
    const doGrupo = itens.filter((i) => i.grupo === g.id);
    if (!doGrupo.length) continue;
    const idGrupo = idUnico("grupo");
    partes.push(h("div.caderno-descarga-grupo", { role: "group", "aria-labelledby": idGrupo },
      h("h3.caderno-descarga-grupo-nome", { id: idGrupo }, DESCARREGAR.resultado.grupo(g.nome, doGrupo.length)),
      g.id === "fazer"
        ? h("ul.caderno-itens.caderno-itens-fazer", null, ...doGrupo.map((i) => itemDeFazer(d, i)))
        : h("ul.caderno-itens", null, ...doGrupo.map((i) => h("li.caderno-item", null, i.texto)))));
  }
  if (Number(d.soltos) > 0) partes.push(h("p.apoio.caderno-soltos", null, DESCARREGAR.soltos(Number(d.soltos))));
  return h("article.cartao.caderno-descarga", { "aria-labelledby": id },
    h("h2.rotulo.caderno-descarga-dia", { id }, rotuloDoDia(d.dia || diaDe(d.em))),
    ...partes,
    h("div.caderno-descarga-pe", null, botaoLink("Apagar esta descarga", async () => {
      const sim = await confirmar({ titulo: "Apagar esta descarga?", sim: "Apagar", nao: "Cancelar" });
      if (!sim) return;
      alterar((e) => { e.descargas = e.descargas.filter((x) => x.id !== d.id); }, { agora: true });
      desenhar({ focar: "h1" });
    })));
}

function itemDeFazer(d, item) {
  const caixa = h("input", { type: "checkbox", checked: Boolean(item.feito) });
  const linha = h("li.caderno-item.caderno-item-fazer", { class: item.feito ? "feito" : "" },
    h("label.caixa-marcar.caderno-marcar", null, caixa, h("span.caderno-item-texto", null, item.texto)));
  caixa.addEventListener("change", () => {
    linha.classList.toggle("feito", caixa.checked);
    alterar((e) => {
      const it = e.descargas.find((x) => x.id === d.id)?.itens?.find((x) => x.id === item.id);
      if (it) it.feito = caixa.checked;
    });
  });
  if (item.proximo) {
    linha.classList.add("proximo");
    linha.append(h("p.caderno-proximo", null,
      h("span.caderno-proximo-lotus", { "aria-hidden": "true" }, iconeEl("lotus", { tamanho: 16 })),
      h("span", null, DESCARREGAR.resultado.fazer.proximo)));
    if (item.gesto) linha.append(h("p.caderno-gesto", null, item.gesto));
  }
  return linha;
}

// ---------------------------------------------------------------- Áudios

function pararAudio(tocador) {
  const t = tocador?.atual;
  if (!t) return;
  tocador.atual = null;
  try { t.audio.pause(); } catch { /* nada */ }
  URL.revokeObjectURL(t.url);
  if (t.botao?.isConnected) t.botao.textContent = "Ouvir";
}

function duracaoEmTexto(segundos) {
  const s = Math.max(0, Math.round(Number(segundos) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return { curto: `${m}:${String(r).padStart(2, "0")}`, longo: m ? `${plural(m, "minuto", "minutos")}${r ? ` e ${plural(r, "segundo", "segundos")}` : ""}` : plural(r, "segundo", "segundos") };
}

function baixarArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: nome, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function listaDosAudios(q, { desenhar, tocador }) {
  const { voz, lista } = await audiosGuardados();
  q.append(...cabeca("Áudios", "Estes áudios estão só neste aparelho."));
  if (!voz || !lista.length) return;
  const naoTocou = () => avisoCurto("Este navegador não conseguiu tocar esta gravação.");
  q.append(h("ul.caderno-cartoes.caderno-audios", null, ...[...lista].sort(porEm).map((a) => {
    const dur = duracaoEmTexto(a.segundos);
    const quando = a.em ? new Date(a.em) : null;
    const hora = quando && !Number.isNaN(quando.getTime())
      ? quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;
    const ouvir = botaoSecundario("Ouvir", async () => {
      if (tocador.atual?.id === a.id) { pararAudio(tocador); return; }
      pararAudio(tocador);
      try {
        const completo = await voz.obterAudio(a.id);
        if (!completo?.blob) throw new Error("sem gravação");
        const url = URL.createObjectURL(completo.blob);
        const audio = new Audio(url);
        tocador.atual = { id: a.id, audio, url, botao: ouvir };
        ouvir.textContent = "Parar";
        audio.addEventListener("ended", () => pararAudio(tocador));
        audio.addEventListener("error", () => { pararAudio(tocador); naoTocou(); });
        await audio.play();
      } catch (erro) {
        console.error(erro);
        pararAudio(tocador);
        naoTocou();
      }
    }, { "aria-label": `Ouvir o áudio de ${diaEMes(a.dia || diaDe(a.em))}` });
    const baixar = botaoSecundario("Baixar", async () => {
      try {
        // O nome do arquivo é o de voz.js ("desabafo-2026-11-05-1432.webm"), quando ele oferece.
        if (typeof voz.baixarAudio === "function") {
          if (!(await voz.baixarAudio(a.id))) throw new Error("sem gravação");
          return;
        }
        const completo = await voz.obterAudio(a.id);
        if (!completo?.blob) throw new Error("sem gravação");
        const tipo = String(completo.tipo || completo.blob.type || "");
        const ext = /mp4|m4a|aac/.test(tipo) ? "m4a" : "webm";
        const dia = a.dia || diaDe(a.em);
        const minuto = hora ? `-${hora.replace(":", "")}` : "";
        baixarArquivo(completo.blob, `desabafo-${dia}${minuto}.${ext}`);
      } catch (erro) {
        console.error(erro);
      }
    });
    const apagar = botaoLink("Apagar", async () => {
      const sim = await confirmar({ titulo: "Apagar este áudio?", sim: "Apagar", nao: "Cancelar" });
      if (!sim) return;
      if (tocador.atual?.id === a.id) pararAudio(tocador);
      try { await voz.apagarAudio(a.id); } catch (erro) { console.error(erro); }
      desenhar({ focar: "h1" });
    });
    return h("li", null, h("article.cartao.caderno-audio", null,
      h("p.caderno-audio-quando", null,
        h("span.caderno-audio-dia", null, diaEMes(a.dia || diaDe(a.em))),
        hora ? h("span.apoio", null, ` · ${hora}`) : null),
      h("p.apoio.caderno-audio-duracao", null, h("span", { "aria-hidden": "true" }, dur.curto), h("span.visivel-leitor", null, dur.longo)),
      h("div.caderno-audio-acoes", null, ouvir, baixar, apagar)));
  })));
}

// ---------------------------------------------------------------- Escritos

function listaDosEscritos(q, { desenhar }) {
  const lista = [...estado.escritos].sort(porEm);
  q.append(...cabeca("Escritos"));
  if (!lista.length) {
    q.append(vazio("Os escritos que você guardar no Desabafar aparecem aqui."));
    return;
  }
  q.append(h("ul.caderno-cartoes.caderno-escritos", null, ...lista.map((w) => {
    const id = idUnico("escrito");
    return h("li", null, h("article.cartao.caderno-escrito", { "aria-labelledby": id },
      h("h2.rotulo.caderno-escrito-dia", { id }, rotuloDoDia(w.dia || diaDe(w.em))),
      h("p.caderno-escrito-texto", null, w.texto),
      h("div.caderno-escrito-pe", null, botaoLink("Apagar", async () => {
        const sim = await confirmar({ titulo: "Apagar este escrito?", sim: "Apagar", nao: "Cancelar" });
        if (!sim) return;
        alterar((e) => { e.escritos = e.escritos.filter((x) => x.id !== w.id); }, { agora: true });
        desenhar({ focar: "h1" });
      }, { "aria-label": `Apagar o escrito de ${diaEMes(w.dia || diaDe(w.em))}` }))));
  })));
}

// ---------------------------------------------------------------- O que te faz bem

function listaDoQueFazBem(q) {
  const fb = estado.fazBem ?? {};
  const coisas = (fb.coisas ?? []).filter((x) => typeof x === "string" && x.trim());
  const tem = coisas.length || fb.musica || fb.frase;
  const editar = () => navegar("#/pratica/T5?so=fazbem");
  q.append(...cabeca("O que te faz bem"));
  if (tem) {
    if (coisas.length) q.append(h("ul.caderno-etiquetas", null, ...coisas.map((c) => h("li.caderno-etiqueta", null, c))));
    const campos = [];
    if (fb.musica) campos.push(h("div.caderno-campo", null, h("dt.caderno-campo-nome", null, "Sua música"), h("dd.caderno-campo-valor", null, fb.musica)));
    if (fb.frase) campos.push(h("div.caderno-campo", null, h("dt.caderno-campo-nome", null, "Sua frase"), h("dd.caderno-campo-valor.caderno-frase", null, fb.frase)));
    if (campos.length) q.append(h("dl.caderno-campos", null, ...campos));
    q.append(h("div.caderno-acoes", null, botaoSecundario("Editar", editar)));
  } else {
    q.append(vazio("Você monta esta lista no Dia 5 da trilha, ou agora mesmo."),
      h("div.caderno-acoes", null, botaoSecundario("Montar agora", editar)));
  }
  const guardadas = (fb.frasesGuardadas ?? [])
    .map((x) => (typeof x === "string" ? x : x?.texto))
    .filter((x) => typeof x === "string" && x.trim());
  if (guardadas.length) {
    const id = idUnico("frases");
    q.append(h("section.caderno-secao", { "aria-labelledby": id },
      h("h2.rotulo", { id }, "FRASES GUARDADAS"),
      h("ul.caderno-frases", null, ...guardadas.map((f) => h("li.caderno-frase-guardada", null, f)))));
  }
}

// ---------------------------------------------------------------- Seu cuidado possível

function listaDoCuidado(q, { desenhar }) {
  const cp = estado.cuidadoPossivel;
  const c = cp?.gesto ? fraseDoCuidado(cp, { pastilhas: pastilhasDoGesto() }) : null;
  q.append(...cabeca("Seu cuidado possível"));
  if (!c) {
    q.append(vazio("Você escolhe o seu cuidado possível no Dia 6 da trilha."));
    return;
  }
  const naTela = cp.naTelaHoje !== false;
  q.append(
    h("div.cartao.caderno-cuidado", null,
      h("p.caderno-cuidado-frase", null, c.frase),
      c.minima ? h("p.apoio.caderno-cuidado-minima", null, c.minima) : null),
    h("div.caderno-acoes", null,
      botaoSecundario("Editar", () => navegar("#/pratica/T6?so=cuidado&de=caderno")),
      botaoSecundario(naTela ? "Tirar da tela Hoje" : "Pôr na tela Hoje", () => {
        alterar((e) => { if (e.cuidadoPossivel) e.cuidadoPossivel.naTelaHoje = !naTela; });
        desenhar({ focar: ".caderno-alternar" });
      }, { class: "caderno-alternar" })));
}

// ---------------------------------------------------------------- Sua trilha

function cartaoDoDia(n, d) {
  const dia = diaDaTrilha(n);
  const r = d?.respostas ?? {};
  const corpo = [];
  if (Number.isFinite(r.antes) && Number.isFinite(r.depois)) {
    corpo.push(h("p.texto.caderno-dia-medicao", null, preencher(DIAS[6]?.cartoes?.medicao ?? "", r)));
  }
  if (n === 3 && DIMENSOES_DO_MAPA.some((k) => Number.isFinite(r[k]))) {
    corpo.push(h("div.caderno-dia-mapa", { "aria-hidden": "true" }, svg(desenhos.mapaCuidado(r, { tamanho: 120 }))));
  }
  if (n === 6 && r.gesto) {
    const c = fraseDoCuidado({ gesto: r.gesto, momento: r.momento, minima: r.minima }, { pastilhas: pastilhasDoGesto() });
    if (c) corpo.push(h("p.caderno-dia-cuidado", null, c.frase), c.minima ? h("p.apoio", null, c.minima) : null);
  }
  const pular = ["antes", "depois", "mapa2", ...(n === 3 ? DIMENSOES_DO_MAPA : []), ...(n === 6 ? ["gesto", "momento", "minima"] : [])];
  const itens = respostasLegiveis(dia, r, { versao: d?.versao, pular });
  if (itens.length) corpo.push(listaDeRespostas(itens));
  const quando = d?.dia ? `Feito em ${diaEMes(d.dia)}${d.versao === "minima" ? ", na versão mínima" : ""}.` : null;
  return h("li", null, h("article.cartao.caderno-dia", null,
    h("h3.rotulo.caderno-dia-rotulo", null, `DIA ${n} · ${String(dia?.titulo ?? "").toLocaleUpperCase("pt-BR")}`),
    quando ? h("p.apoio.caderno-dia-quando", null, quando) : null,
    ...corpo.filter(Boolean)));
}

function diasDaRodada(dias) {
  const feitos = [1, 2, 3, 4, 5, 6, 7].filter((n) => dias?.[n]);
  return h("ul.caderno-cartoes.caderno-dias", null, ...feitos.map((n) => cartaoDoDia(n, dias[n])));
}

function listaDaTrilha(q) {
  const t = estado.trilha;
  const feitos = [1, 2, 3, 4, 5, 6, 7].filter((n) => t.dias?.[n]);
  q.append(...cabeca("Sua trilha"));
  if (t.concluidaEm) q.append(h("p.texto.caderno-linha", null, `Você terminou a trilha em ${diaEMes(t.concluidaEm)}.`));
  if (feitos.length) {
    q.append(diasDaRodada(t.dias));
  } else {
    q.append(vazio("Sua trilha aparece aqui depois do Dia 1.", h("p.caderno-vazio-link", null, linkRota("Ver a trilha", "#/trilha"))));
  }
  const rodadas = (t.anteriores ?? []).filter((r) => r && r.dias && typeof r.dias === "object")
    .sort((a, b) => (b.rodada ?? 0) - (a.rodada ?? 0));
  if (!rodadas.length) return;
  const id = idUnico("rodadas");
  q.append(h("section.caderno-secao.caderno-rodadas", { "aria-labelledby": id },
    h("h2.rotulo", { id }, "RODADAS ANTERIORES"),
    h("ul.caderno-rodadas-lista", null, ...rodadas.map((r) => {
      const idPainel = idUnico("rodada");
      const painel = h("div.abre-fecha.caderno-rodada-painel", { id: idPainel }, h("div", null, diasDaRodada(r.dias)));
      painel.inert = true;
      const botao = h("button.caderno-rodada", { type: "button", "aria-expanded": "false", "aria-controls": idPainel },
        h("span.casa-linha-texto", null,
          h("span.casa-linha-nome", null, `Rodada ${r.rodada ?? ""}`.trim()),
          r.concluidaEm ? h("span.casa-linha-previa", null, `Terminou em ${diaEMes(r.concluidaEm)}`) : null),
        h("span.caderno-rodada-seta", { "aria-hidden": "true" }, iconeEl("voltar", { tamanho: 18 })));
      botao.addEventListener("click", () => {
        const aberto = botao.getAttribute("aria-expanded") !== "true";
        botao.setAttribute("aria-expanded", String(aberto));
        painel.classList.toggle("aberto", aberto);
        painel.inert = !aberto;
      });
      return h("li.caderno-rodada-item", null, botao, painel);
    }))));
}
