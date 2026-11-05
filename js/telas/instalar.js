// T26 · Instalar na tela de início (dentro de Ajustes e do cartão de Hoje): "Use como app", o passo a passo do
// iPhone, do Android (com o botão quando o navegador oferece a instalação) e do computador. O aparelho de
// quem lê vem primeiro. Com o app já instalado, só a linha que diz isso.

import { h, idUnico, botaoPrincipal } from "../ui.js";
import { INSTALAR } from "../conteudo/textos.js";
import { pedidoDeInstalacao, instalarApp, estaInstalado, eIphone } from "../app.js";

export const moldura = { aba: "semana", navegacao: "ajustes", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/ajustes" };

const eAndroid = () => /android/i.test(navigator.userAgent);

export function montar(el, ctx) {
  const desenhar = () => {
    const t = INSTALAR;
    const raiz = h("div.coluna.instalar-tela",
      h("h1.titulo.instalar-titulo", null, t.titulo),
      h("p.texto.instalar-texto", null, t.texto));
    if (estaInstalado()) {
      raiz.append(h("p.lede.instalar-instalado", null, t.instalado));
      el.replaceChildren(raiz);
      return;
    }
    const pedido = pedidoDeInstalacao();
    const botaoInstalar = () => h("div.instalar-acao", null, botaoPrincipal(t.android.botao, async () => {
      await instalarApp();
      desenhar();
    }));
    const secao = (rotulo, ...conteudo) => {
      const id = idUnico("instalar");
      return h("section.instalar-secao", { "aria-labelledby": id }, h("h2.rotulo", { id }, rotulo), ...conteudo);
    };
    const iphone = secao("IPHONE", h("p.texto", null, t.iphone));
    const android = secao("ANDROID", pedido && !eIphone() && eAndroid() ? botaoInstalar() : h("p.texto", null, t.android.semPedido));
    const computador = secao("COMPUTADOR", h("p.texto", null, t.computador), pedido && !eAndroid() && !eIphone() ? botaoInstalar() : null);
    const ordem = eIphone() ? [iphone, android, computador] : eAndroid() ? [android, iphone, computador] : [computador, iphone, android];
    raiz.append(h("div.instalar-secoes", null, ...ordem));
    el.replaceChildren(raiz);
  };
  desenhar();
  const aoInstalar = () => desenhar();
  addEventListener("appinstalled", aoInstalar, { signal: ctx.sinal });
  return {};
}
