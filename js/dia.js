// O dia lógico, as semanas e as datas em português (seção 7.2 e 4.11).
// O dia vira às 04:00 no relógio do aparelho. Todas as datas "AAAA-MM-DD" daqui são dias lógicos.
// No modo de demonstração, o estado avisa o desvio do relógio por definirDesvio(ms).

let desvio = 0;

/** Chamado só por estado.js: o desvio do relógio da demonstração, em milissegundos. */
export function definirDesvio(ms) {
  desvio = Number(ms) || 0;
}

export function desvioDaDemonstracao() {
  return desvio;
}

// Código da seção 7.2, ao pé da letra.
export const agora = () => new Date(Date.now() + desvioDaDemonstracao());
export const diaLogico = (d = agora()) => new Date(d.getTime() - 4 * 3600e3).toLocaleDateString("sv-SE"); // "AAAA-MM-DD"
export const difDias = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5); // a e b em "AAAA-MM-DD"

/** Milissegundos do relógio do app (com o desvio da demonstração). */
export const agoraMs = () => Date.now() + desvioDaDemonstracao();

/** Dia lógico de um instante guardado em texto (ISO). */
export function diaDe(iso) {
  return diaLogico(new Date(iso));
}

/** "AAAA-MM-DD" mais n dias. */
export function somarDias(dia, n) {
  const [a, m, d] = dia.split("-").map(Number);
  const data = new Date(Date.UTC(a, m - 1, d + n));
  return data.toISOString().slice(0, 10);
}

/** 0 = segunda ... 6 = domingo, para um "AAAA-MM-DD". */
export function diaDaSemana(dia) {
  const [a, m, d] = dia.split("-").map(Number);
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
}

/** A segunda-feira (dia lógico) da semana de um dia (7.9). */
export function segundaDaSemana(dia = diaLogico()) {
  return somarDias(dia, -diaDaSemana(dia));
}

/** Os sete dias lógicos de uma semana, de segunda a domingo. */
export function diasDaSemana(segunda) {
  return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));
}

/** Instante em texto com o fuso do aparelho: "2026-11-05T14:02:11-03:00". */
export function isoLocal(d = agora()) {
  const p = (n) => String(Math.abs(Math.trunc(n))).padStart(2, "0");
  const fuso = -d.getTimezoneOffset();
  const sinal = fuso >= 0 ? "+" : "-";
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` +
    `${sinal}${p(fuso / 60)}:${p(fuso % 60)}`;
}

// Datas em português, sempre por Intl.DateTimeFormat("pt-BR") (4.11).
// Os dias lógicos são lidos ao meio-dia em UTC e formatados em UTC, para o fuso nunca trocar o dia.
const meioDia = (dia) => new Date(`${dia}T12:00:00Z`);
const formato = (opcoes) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", ...opcoes });
const fDiaSemana = formato({ weekday: "long" });
const fDiaMes = formato({ day: "numeric", month: "long" });
const fDiaMesAno = formato({ day: "numeric", month: "long", year: "numeric" });
const fMes = formato({ month: "long" });
const fMesCurto = formato({ month: "short" });
const fSemanaCurta = formato({ weekday: "short" });

/** "quinta-feira" */
export const nomeDoDiaDaSemana = (dia) => fDiaSemana.format(meioDia(dia));

/** "5 de novembro" */
export const diaEMes = (dia) => fDiaMes.format(meioDia(dia));

/** "1 de novembro de 2026" */
export const dataCompleta = (dia) => fDiaMesAno.format(meioDia(dia));

/** "QUINTA-FEIRA, 5 DE NOVEMBRO", o rótulo de Hoje (T05). */
export function rotuloDoDia(dia = diaLogico()) {
  return `${nomeDoDiaDaSemana(dia)}, ${diaEMes(dia)}`.toLocaleUpperCase("pt-BR");
}

/** "5 nov" (listas curtas: caderno, medições). */
export function diaCurto(dia) {
  const [, , d] = dia.split("-").map(Number);
  const mes = fMesCurto.format(meioDia(dia)).replace(".", "");
  return `${d} ${mes}`;
}

/** "3 NOV", para os rótulos ("FEITO EM 3 NOV"). */
export const diaCurtoRotulo = (dia) => diaCurto(dia).toLocaleUpperCase("pt-BR");

/** "seg, 3" (a lista da semana, 6.11). */
export function diaDaSemanaCurto(dia) {
  const [, , d] = dia.split("-").map(Number);
  const nome = fSemanaCurta.format(meioDia(dia)).replace(".", "");
  return `${nome}, ${d}`;
}

/** "3 a 9 de novembro" ou "27 de outubro a 2 de novembro" (6.11, 6.5). */
export function intervalo(inicio, fim) {
  const [, mi, di] = inicio.split("-").map(Number);
  const [, mf] = fim.split("-").map(Number);
  if (mi === mf) return `${di} a ${diaEMes(fim)}`;
  return `${diaEMes(inicio)} a ${diaEMes(fim)}`;
}

/** "novembro" */
export const nomeDoMes = (dia) => fMes.format(meioDia(dia));

/** A saudação de Hoje pela hora do relógio (T05). */
export function saudacao(d = agora()) {
  const h = d.getHours();
  if (h >= 4 && h < 12) return "Bom dia.";
  if (h >= 12 && h < 18) return "Boa tarde.";
  return "Boa noite.";
}

/** Minutos inteiros, arredondados para baixo, com mínimo de 1 quando houve algum tempo (7.9). */
export function minutosDe(segundos) {
  if (!segundos || segundos <= 0) return 0;
  return Math.max(1, Math.floor(segundos / 60));
}
