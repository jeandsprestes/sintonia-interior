// T24 · Sobre o Sintonia Interior (dentro de Ajustes): o logo, o nome, a linha, o que o app é, o texto do Aviso
// importante, o cartão "Falar com alguém agora" (o mesmo do Estou no limite) e as licenças das fontes.
// O logo (4.6): no Claro, o logo plano (img/logo-plano.jpg), com o fundo sumindo no papel; no Noite, nenhum
// JPEG aparece, e entra a lótus com as ondas desenhada em código. Abre também antes das boas-vindas.

import { h, svg, idUnico, desenhos, cartaoCVV } from "../ui.js";
import { estado } from "../estado.js";
import { SOBRE, CVV } from "../conteudo/textos.js";

export function moldura() {
  if (!estado?.boasVindasEm) return { aba: null, barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/boas-vindas/1" };
  return { aba: "semana", navegacao: "ajustes", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/ajustes" };
}

export function montar(el) {
  const s = SOBRE;
  const idAviso = idUnico("aviso");
  const idLicencas = idUnico("licencas");
  const licencas = h("div.abre-fecha.sobre-licencas", { id: idLicencas },
    h("div", null, h("ul.sobre-licencas-lista", null, ...s.rodape.arquivosDasLicencas.map((arquivo) => {
      const nome = { "OFL-fraunces.txt": "Fraunces", "OFL-mulish.txt": "Mulish", "OFL-josefinsans.txt": "Josefin Sans" }[arquivo.split("/").pop()] ?? arquivo;
      return h("li", null, h("a.link", { href: arquivo, target: "_blank", rel: "noopener noreferrer" }, nome));
    }))));
  licencas.inert = true;
  const verLicencas = h("button.link.sobre-ver-licencas", { type: "button", "aria-expanded": "false", "aria-controls": idLicencas }, s.rodape.licencas);
  verLicencas.addEventListener("click", () => {
    const aberto = verLicencas.getAttribute("aria-expanded") !== "true";
    verLicencas.setAttribute("aria-expanded", String(aberto));
    licencas.classList.toggle("aberto", aberto);
    licencas.inert = !aberto;
  });

  el.append(h("div.coluna.sobre-tela",
    h("div.sobre-marca", { "aria-hidden": "true" },
      // O CSS mostra um ou outro, pelo tema (também no "Igual ao aparelho").
      h("div.sobre-logo-claro", null,
        h("img.sobre-logo", { src: "img/logo-plano.jpg", alt: "", width: "720", height: "672", decoding: "async" })),
      h("div.sobre-logo-noite", null, svg(desenhos.lotusComOndas({ largura: 160 })))),
    h("h1.titulo.sobre-nome", null, s.nome),
    h("p.sobre-linha", null, s.linha),
    h("div.sobre-textos", null, ...s.paragrafos.map((p) => h("p.texto", null, p))),
    h("section.sobre-aviso", { "aria-labelledby": idAviso },
      h("h2.rotulo", { id: idAviso }, "AVISO IMPORTANTE"),
      ...s.aviso.blocos.map((b) => h("p.texto", null, b.texto))),
    h("div.sobre-cvv", null, cartaoCVV(CVV, { solto: true })),
    h("footer.sobre-pe", null,
      h("p.apoio", null, s.rodape.fontes),
      h("p.sobre-pe-licencas", null, verLicencas),
      licencas,
      h("p.apoio.sobre-versao", null, s.rodape.versao))
  ));
  return {};
}
