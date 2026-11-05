// O PNG de Olhar o caminho (T15, Anexo A), feito no próprio aparelho, sem rede.
// Canvas 2D, porque um SVG dentro de <img> não enxerga as fontes da página. 1080 x 1350, fundo creme do
// tema Claro (em qualquer tema), traço café, a pétala do centro em cobre, as palavras perto das pontas (o
// mesmo arranjo da tela, de js/telas/caminho.js), "Voltar para mim" em Fraunces itálico, o intervalo de
// datas e o nome "Sintonia Interior" em berinjela. Saída por toBlob e download.
//
//   salvarImagemDoCaminho({ palavras, inicio, fim })
//     palavras: { 1: "Pausa", 2: "Tristeza", ..., 7: "Leveza" } (dia sem palavra: null; a pétala fica sem texto)
//     inicio, fim: "AAAA-MM-DD" (o primeiro e o último dia da trilha)
//   Baixa voltar-para-mim-{fim}.png e devolve true; devolve false se o navegador não deixou.

import { PETALAS } from "./desenhos.js";
import { diaEMes, intervalo } from "./dia.js";
import { PETALA_DO_DIA, disporPalavras, encurtar } from "./telas/caminho.js";
import { TRILHA } from "./conteudo/trilha.js";

const LARGURA = 1080;
const ALTURA = 1350;

// As cores do tema Claro (4.1): a imagem sai igual em qualquer tema.
const COR = {
  fundo: "#F0E9DD",
  tinta: "#443021",
  suave: "#6B5545",
  cobre: "#7C5B39",
  berinjela: "#43313A",
  linha: "#C2AD95"
};

const FONTE_ROTULO = "\"Josefin Sans\", \"Segoe UI\", system-ui, sans-serif";
const FONTE_DISPLAY = "Fraunces, Georgia, serif";

/** Mede e escreve letra por letra, com o espaçamento do rótulo (o mesmo cálculo nos dois). */
function larguraComEspaco(ctx, texto, espacoPx) {
  const letras = [...texto];
  return letras.reduce((t, l) => t + ctx.measureText(l).width, 0) + Math.max(0, letras.length - 1) * espacoPx;
}

function escreverComEspaco(ctx, texto, x, y, espacoPx, alinhar) {
  const w = larguraComEspaco(ctx, texto, espacoPx);
  let cx = alinhar === "fim" ? x - w : alinhar === "centro" ? x - w / 2 : x;
  ctx.textAlign = "left";
  for (const l of texto) {
    ctx.fillText(l, cx, y);
    cx += ctx.measureText(l).width + espacoPx;
  }
}

/** O grão de papel (4.3), bem leve, para a imagem ter a mesma textura do app. */
function grao(ctx) {
  const lado = 256;
  const tela = document.createElement("canvas");
  tela.width = lado;
  tela.height = lado;
  const c = tela.getContext("2d");
  const img = c.createImageData(lado, lado);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random();
    img.data[i] = 68; img.data[i + 1] = 48; img.data[i + 2] = 33;
    img.data[i + 3] = Math.round(v * 255);
  }
  c.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = ctx.createPattern(tela, "repeat");
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  ctx.restore();
}

export async function salvarImagemDoCaminho({ palavras = {}, inicio = null, fim = null } = {}) {
  try {
    await Promise.all([
      document.fonts.load(`600 22px "Josefin Sans"`),
      document.fonts.load(`600 25px "Josefin Sans"`),
      document.fonts.load("italic 300 48px Fraunces"),
      document.fonts.load("400 34px Fraunces")
    ]);
  } catch { /* segue com as fontes de reserva */ }

  const tela = document.createElement("canvas");
  tela.width = LARGURA;
  tela.height = ALTURA;
  const ctx = tela.getContext("2d");
  if (!ctx) return false;

  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
  grao(ctx);

  // As palavras: o mesmo arranjo da tela, em escala de impressão.
  const tamanho = 25;
  const espacoEm = 0.16;
  ctx.font = `600 ${tamanho}px ${FONTE_ROTULO}`;
  const medir = (texto, esp) => larguraComEspaco(ctx, texto, esp * tamanho);
  const lista = [1, 2, 3, 4, 5, 6, 7].map((n) => {
    const p = palavras[n] ?? palavras[String(n)] ?? null;
    return { n, texto: p ? encurtar(p).toLocaleUpperCase("pt-BR") : null };
  });
  const margem = 84;
  const largura = LARGURA - 2 * margem;
  const lotusLargura = 700;
  const alturaLinha = 35;
  const arranjo = disporPalavras({
    largura, lotusLargura, palavras: lista, medir, alturaLinha, espaco: espacoEm, espacoMenor: 0.08,
    folga: 16, margemPetala: 10, respiro: 0
  });

  // O bloco (a lótus com as palavras, "Voltar para mim" e as datas) fica centrado acima do nome, no pé.
  const fioDoNome = ALTURA - 168;
  const alturaDoBloco = arranjo.altura + 120 + 66;
  const ox = margem;
  const oy = Math.max(110, Math.round((fioDoNome - 40 - alturaDoBloco) / 2));

  // As pétalas: Path2D com os caminhos de 4.7, na escala do arranjo.
  const { s, x: lx, y: ly } = arranjo.lotus;
  ctx.save();
  ctx.translate(ox + lx, oy + ly);
  ctx.scale(s, s);
  ctx.lineWidth = 3.4 / s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const n of [1, 2, 3, 4, 5, 6, 7]) {
    ctx.strokeStyle = n === 7 ? COR.cobre : COR.tinta;
    ctx.stroke(new Path2D(PETALAS[PETALA_DO_DIA[n]]));
  }
  ctx.restore();

  // As palavras, perto das pontas, em rótulo (o centro em cobre).
  ctx.font = `600 ${tamanho}px ${FONTE_ROTULO}`;
  ctx.textBaseline = "alphabetic";
  const altura = ctx.measureText("H").actualBoundingBoxAscent || tamanho * 0.7;
  for (const r of arranjo.rotulos) {
    ctx.fillStyle = r.n === 7 ? COR.cobre : COR.tinta;
    r.linhas.forEach((linha, i) => {
      const y = oy + r.y + i * alturaLinha + (alturaLinha + altura) / 2;
      const x = ox + (r.alinhar === "fim" ? r.x + r.w : r.alinhar === "centro" ? r.x + r.w / 2 : r.x);
      escreverComEspaco(ctx, linha, x, y, r.espaco * tamanho, r.alinhar);
    });
  }

  // "Voltar para mim", o intervalo de datas e o nome.
  const baseTexto = oy + arranjo.altura + 120;
  ctx.fillStyle = COR.tinta;
  ctx.font = `italic 300 64px ${FONTE_DISPLAY}`;
  ctx.textAlign = "center";
  ctx.fillText(TRILHA.nome, LARGURA / 2, baseTexto);

  const datas = inicio && fim ? (inicio === fim ? diaEMes(fim) : intervalo(inicio, fim)) : "";
  if (datas) {
    ctx.fillStyle = COR.cobre;
    ctx.font = `600 22px ${FONTE_ROTULO}`;
    escreverComEspaco(ctx, datas.toLocaleUpperCase("pt-BR"), LARGURA / 2, baseTexto + 66, 0.2 * 22, "centro");
  }

  ctx.strokeStyle = COR.linha;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(LARGURA / 2 - 36, fioDoNome);
  ctx.lineTo(LARGURA / 2 + 36, fioDoNome);
  ctx.stroke();

  ctx.fillStyle = COR.berinjela;
  ctx.font = `400 34px ${FONTE_DISPLAY}`;
  ctx.textAlign = "center";
  ctx.fillText("Sintonia Interior", LARGURA / 2, ALTURA - 106);

  const blob = await new Promise((resolver) => {
    try { tela.toBlob((b) => resolver(b), "image/png"); } catch { resolver(null); }
  });
  if (!blob) return false;
  const nome = `voltar-para-mim-${fim ?? "caminho"}.png`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
