// As regras do app (seções 7.4 a 7.9): o que conta, a flor, a trilha, o passo de agora e a semana.
// Programação comum, sempre igual, calculada na hora a partir das sessões; nada daqui é guardado.
// O código de 7.5, 7.6 e 7.7 está ao pé da letra; o único acréscimo é o parâmetro opcional "est"
// (o estado sobre o qual calcular), que por padrão é o estado em uso. Ele serve à prévia de uma cópia.

import { estado, alterar, novoId } from "./estado.js";
import { agora, diaLogico, difDias, isoLocal, segundaDaSemana, diasDaSemana, minutosDe } from "./dia.js";

// ---------------------------------------------------------------- 7.5 A flor

export const diasDeCuidado = (est = estado) =>
  [...new Set(est.sessoes.filter(s => s.conta).map(s => s.dia))].sort();

export function flor(hoje = diaLogico(), est = estado) {
  const dias = diasDeCuidado(est);
  const N = dias.length;
  const ultimo = dias.at(-1) ?? null;
  let estagio = N % 7;                                            // 0 a 6
  if (N > 0 && N % 7 === 0) estagio = (ultimo === hoje) ? 7 : 0;  // abre no dia; no dia seguinte, semente nova
  const flores = dias.filter((_, i) => (i + 1) % 7 === 0)
                     .map((abriuEm, k) => ({ comecou: dias[k * 7], abriuEm }));
  const lago = flores.filter(f => f.abriuEm < hoje);             // a de hoje vai para o lago amanhã
  const descansa = ultimo !== null && difDias(hoje, ultimo) >= 3;
  const cresceuHoje = ultimo === hoje;                           // os traços do estágio atual ficam em cobre
  const anterior = dias.filter(d => d < hoje).at(-1) ?? null;
  const voltou = anterior !== null && difDias(hoje, anterior) >= 3;   // saudação "Que bom te ver." o dia todo
  return { N, estagio, flores, lago, descansa, cresceuHoje, voltou };
}

// No fim de uma sessão que conta: a flor cresce (e T12 anima) só se este for o primeiro dia de cuidado de hoje.
export const cresceAgora = (sessao, est = estado) => sessao.conta && !diasDeCuidado(est).includes(sessao.dia);

/**
 * A legenda de Hoje (6.10), uma por vez, nesta ordem de prioridade. Devolve a chave de FLOR.legendas
 * (textos.js): "primeiraVez", "lotusHoje", "descanso", "sementeNova", ou null.
 */
export function legendaDaFlor(hoje = diaLogico(), est = estado) {
  const f = flor(hoje, est);
  if (f.N === 0) return "primeiraVez";
  if (f.estagio === 7) return "lotusHoje";
  if (f.descansa) return "descanso";
  if (f.estagio === 0 && f.flores.length > 0) return "sementeNova";
  return null;
}

// ---------------------------------------------------------------- 7.6 A trilha

export function trilha(hoje = diaLogico(), est = estado) {
  const demo = est.demo ?? {};
  const feitos = est.trilha.dias;                               // { "1": {...}, ... }
  const proximo = [1, 2, 3, 4, 5, 6, 7].find(n => !feitos[n]) ?? null;
  if (proximo === null) return { concluida: true, em: est.trilha.concluidaEm };
  const disponivel = proximo === 1 || feitos[proximo - 1].dia < hoje || demo.trilhaLivre;
  const ultima = Object.values(feitos).map(d => d.dia).sort().at(-1) ?? null;
  const esperaPorVoce = disponivel && ultima !== null && difDias(hoje, ultima) >= 3;
  return { proximo, disponivel, abreAmanha: !disponivel, esperaPorVoce, comecou: ultima !== null };
}

/**
 * Grava um dia da trilha feito (7.6): a palavra e as respostas de "guarda".
 * Se o dia já existia ("Fazer este dia de novo"), a versão antiga vai para trilha.anteriores.
 * fazBem (Dia 5) e cuidadoPossivel (Dia 6) chegam já montados por quem chama.
 */
export function gravarDiaDaTrilha({ n, sessao, versao, palavra = null, respostas = {}, fazBem = null, cuidadoPossivel = null }) {
  alterar((e) => {
    const t = e.trilha;
    const antigo = t.dias[n];
    if (antigo) {
      t.anteriores.push({ rodada: t.rodada, n, dia: antigo.dia, palavra: antigo.palavra ?? null, respostas: antigo.respostas ?? {} });
    }
    t.dias[n] = { dia: sessao.dia, em: sessao.fim, versao, sessaoId: sessao.id, palavra, respostas };
    if (Number(n) === 7 && !t.concluidaEm) t.concluidaEm = sessao.dia;
    if (fazBem) {
      if (Array.isArray(fazBem.coisas) && fazBem.coisas.length) e.fazBem.coisas = [...fazBem.coisas];
      if (fazBem.musica) e.fazBem.musica = fazBem.musica;
      if (fazBem.frase) e.fazBem.frase = fazBem.frase;
    }
    if (cuidadoPossivel && cuidadoPossivel.gesto) {
      e.cuidadoPossivel = {
        gesto: cuidadoPossivel.gesto,
        momento: cuidadoPossivel.momento ?? null,
        minima: cuidadoPossivel.minima ?? null,
        desde: sessao.dia,
        naTelaHoje: true
      };
    }
  }, { agora: true });
}

/** "Refazer a trilha": guarda a rodada em anteriores, zera os dias e soma 1 à rodada (7.6). */
export function refazerTrilha() {
  alterar((e) => {
    const t = e.trilha;
    t.anteriores.push({ rodada: t.rodada, dias: t.dias, concluidaEm: t.concluidaEm });
    t.dias = {};
    t.concluidaEm = null;
    t.rodada += 1;
  }, { agora: true });
}

// ---------------------------------------------------------------- 7.7 O passo de agora

export const MATRIZ = {                       // tabela de 6.4, na ordem da tabela
  "cansaco-2": ["P01", "P02"], "cansaco-5": ["P03", "P04"], "cansaco-10": ["P05", "P06"],
  "sobrecarga-2": ["P07", "P08"], "sobrecarga-5": ["P09", "P10"], "sobrecarga-10": ["P11", "P12"],
  "desconexao-2": ["P13", "P14"], "desconexao-5": ["P15", "P16"], "desconexao-10": ["P17", "P18"]
};

export function passoDeAgora(estadoDoCheckin, tempo, hoje = diaLogico(), est = estado) {
  const celula = `${estadoDoCheckin}-${tempo}`;
  const [a, b] = MATRIZ[celula];
  const [primeira, segunda] = est.escolhas[celula] === b ? [b, a] : [a, b];
  const t = trilha(hoje, est);
  if (!t.concluida && t.disponivel) {
    return { cartoes: [ { trilha: t.proximo, versao: tempo === 2 ? "minima" : "completa" },
                        { pratica: primeira } ],
             trocarPor: segunda };
  }
  return { cartoes: [ { pratica: primeira }, { pratica: segunda } ] };
}

/** Ao tocar em "Começar" num cartão da biblioteca, escolhas[celula] recebe aquela prática (7.7). */
export function lembrarEscolha(celula, praticaId) {
  alterar((e) => { e.escolhas[celula] = praticaId; });
}

// ---------------------------------------------------------------- check-in (6.2, 6.3)

/** Grava o check-in (estado e hora); o tempo entra depois, em T06. */
export function registrarCheckin(estadoDoCheckin) {
  const c = { id: novoId("c"), em: isoLocal(agora()), dia: diaLogico(), estado: estadoDoCheckin, tempo: null };
  alterar((e) => { e.checkins.push(c); });
  return c;
}

/** Grava o tempo (2, 5 ou 10) num check-in. */
export function escolherTempo(checkinId, tempo) {
  alterar((e) => {
    const c = e.checkins.find((x) => x.id === checkinId);
    if (c) c.tempo = tempo;
  });
}

/** O check-in de menos de 2 horas sem prática depois dele, ou null (T05, T06, T07). */
export function checkinRecente(est = estado) {
  const c = est.checkins.at(-1);
  if (!c) return null;
  const quando = Date.parse(c.em);
  if (agora().getTime() - quando >= 2 * 3600e3) return null;
  if (est.sessoes.some((s) => Date.parse(s.inicio) >= quando)) return null;
  return c;
}

// ---------------------------------------------------------------- 7.4 O que conta

/**
 * Grava uma sessão no momento em que a prática termina ou é encerrada (7.4), antes do registro.
 * Só chame quando ela conta: chegou ao fim (completa ou mínima), parou com 60 s ou mais,
 * experimento no resultado, limite com 60 s ou mais, Respirar comigo com 60 s ou mais, "Fiz hoje".
 * Devolve { sessao, cresceu, acordou, florAntes, florDepois } para o fecho (T12).
 */
export function registrarSessao({
  praticaId, origem, versao = null, inicio, fim = agora(), segundos = null,
  checkinId = null, antes = null, depois = null, respostas = {}, registro = null,
  tom = estado.ajustes.tom, conta = true
}) {
  const inicioIso = typeof inicio === "string" ? inicio : isoLocal(inicio ?? agora());
  const fimIso = typeof fim === "string" ? fim : isoLocal(fim);
  const sessao = {
    id: novoId("s"),
    inicio: inicioIso,
    fim: fimIso,
    dia: diaLogico(new Date(inicioIso)),              // uma prática que atravessa as 04:00 conta para o dia em que começou
    origem,
    praticaId,
    versao,
    tom,
    segundos: segundos === null ? null : Math.max(0, Math.round(segundos)),
    conta,
    checkinId,
    antes,
    depois,
    registro,
    respostas
  };
  const hoje = diaLogico();
  const florAntes = flor(hoje);
  const cresceu = cresceAgora(sessao);
  alterar((e) => {
    e.sessoes.push(sessao);
    if (praticaId === "EXP" && e.cartoes.experimento !== "feito") e.cartoes.experimento = "feito";
  }, { agora: true });
  const florDepois = flor(hoje);
  return { sessao, cresceu, acordou: cresceu && florAntes.descansa, florAntes, florDepois };
}

/** Atualiza uma sessão já gravada (o registro leve, a medida de depois). */
export function atualizarSessao(id, mudancas) {
  alterar((e) => {
    const s = e.sessoes.find((x) => x.id === id);
    if (s) Object.assign(s, mudancas);
  }, { agora: true });
}

/** "Fiz hoje" no cuidado possível: conta como dia de cuidado, sem minutos (7.4). */
export function fizHoje() {
  const instante = isoLocal(agora());
  return registrarSessao({ praticaId: "CUIDADO", origem: "cuidado", versao: null, inicio: instante, fim: instante, segundos: null });
}

export function cuidadoFeitoHoje(hoje = diaLogico(), est = estado) {
  return est.sessoes.some((s) => s.origem === "cuidado" && s.dia === hoje);
}

export function sessoesDoDia(dia = diaLogico(), est = estado) {
  return est.sessoes.filter((s) => s.conta && s.dia === dia);
}

/** "Uma prática de {dimensão} para um dia destes" (Dia 3): a primeira daquela dimensão ainda não feita. */
export function sugestaoPorDimensao(dimensao, praticas, est = estado) {
  const daDimensao = praticas.filter((p) => p.dimensao === dimensao).sort((a, b) => a.id.localeCompare(b.id));
  const feitas = new Set(est.sessoes.filter((s) => s.conta).map((s) => s.praticaId));
  return daDimensao.find((p) => !feitas.has(p.id)) ?? daDimensao[0] ?? null;
}

// ---------------------------------------------------------------- 7.9 A semana

/** Medições "antes e depois": { total, baixou, igual, subiu } (6.8, 6.11, T18). */
export function contarMedicoes(sessoes) {
  const r = { total: 0, baixou: 0, igual: 0, subiu: 0 };
  for (const s of sessoes) {
    if (s.antes == null || s.depois == null) continue;
    r.total += 1;
    if (s.depois < s.antes) r.baixou += 1;
    else if (s.depois > s.antes) r.subiu += 1;
    else r.igual += 1;
  }
  return r;
}

/**
 * Os números de uma semana (segunda a domingo, em dias lógicos), para 6.11 e para o cartão de Hoje.
 * Nada é guardado: tudo sai das sessões, das descargas e da trilha.
 */
export function semana(segunda = segundaDaSemana(), est = estado) {
  const dias = diasDaSemana(segunda);
  const fim = dias[6];
  const naSemana = (d) => d >= segunda && d <= fim;
  const sessoes = est.sessoes.filter((s) => s.conta && naSemana(s.dia))
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  const diasComCuidado = [...new Set(sessoes.map((s) => s.dia))].sort();
  const segundos = sessoes.filter((s) => s.origem !== "cuidado").reduce((t, s) => t + (s.segundos || 0), 0);
  const trilhaDias = Object.entries(est.trilha.dias)
    .filter(([, d]) => d && naSemana(d.dia)).map(([n]) => Number(n)).sort((a, b) => a - b);
  return {
    segunda,
    fim,
    dias,
    sessoes,
    diasComCuidado,
    minutos: minutosDe(segundos),
    soCuidadoPossivel: sessoes.length > 0 && sessoes.every((s) => s.origem === "cuidado"),
    sinais: sessoes.filter((s) => s.registro?.sinal).map((s) => ({ dia: s.dia, sinal: s.registro.sinal })),
    linhas: sessoes.filter((s) => s.registro?.linha).map((s) => ({ dia: s.dia, linha: s.registro.linha })),
    medicoes: contarMedicoes(sessoes),
    trilhaDias,
    trilhaConcluida: Boolean(est.trilha.concluidaEm && naSemana(est.trilha.concluidaEm)),
    descargas: est.descargas.filter((d) => naSemana(d.dia)).length
  };
}

// ---------------------------------------------------------------- prévia de uma cópia (7.10)

/** Para a folha de Trazer uma cópia: { dia, dias, lotus, trilha } calculados sobre os dados da cópia. */
export function previaDaCopia(resultadoDeLerCopia) {
  const { copia, dados } = resultadoDeLerCopia;
  const hoje = diaLogico();
  const f = flor(hoje, dados);
  const t = trilha(hoje, dados);
  let dia = null;
  try { dia = diaLogico(new Date(copia.exportadoEm)); } catch { dia = null; }
  return { dia, dias: f.N, lotus: f.lago.length, trilha: t };
}
