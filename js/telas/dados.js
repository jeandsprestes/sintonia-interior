// T23 · Seus dados (dentro de Ajustes): o espaço usado, Guardar uma cópia, Trazer uma cópia (com a prévia e os
// textos de erro de 3.28), Apagar tudo (duas confirmações; o cache do app fica, para ele abrir sem internet),
// a nota do iPhone e o pedido de armazenamento persistente. No modo de demonstração, guardar e trazer ficam
// desativados (7.11), e Apagar tudo também some, porque apagaria o estado real, que a demonstração nunca toca.
// Exporta trazerCopia(), que as boas-vindas (T01, "Já usei antes: trazer meus dados") também usam.

import { h, abrirFolha, avisoCurto, botaoPrincipal, botaoSecundario, linkRota } from "../ui.js";
import { estado, emDemo, baixarCopia, lerCopia, substituirPorCopia, apagarTudo, espacoUsado, pedirPersistencia } from "../estado.js";
import { diaDe, diaEMes, dataCompleta } from "../dia.js";
import { previaDaCopia } from "../regras.js";
import { DADOS } from "../conteudo/textos.js";
import { eIphone, estaInstalado } from "../app.js";
import { tamanhoEmTexto } from "../casa.js";

export const moldura = { aba: "semana", navegacao: "ajustes", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/ajustes" };

const TEXTO_COPIA_BAIXADA = "Cópia baixada. Guarde num lugar seu: quem abrir o arquivo lê os seus registros.";
const TEXTO_ARQUIVO_INVALIDO = "Este arquivo não parece ser uma cópia do Sintonia Interior. Nada foi mudado.";
const TEXTO_VERSAO_NOVA = "Esta cópia é de uma versão mais nova do app. Atualize o app e tente de novo.";

const eDia = (t) => typeof t === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t));

function dataDaUltimaCopia() {
  const em = estado.ultimaCopia?.em;
  if (!em) return null;
  try {
    const d = diaDe(em);
    return eDia(d) ? diaEMes(d) : null;
  } catch {
    return null;
  }
}

/** Guarda a cópia e mostra o aviso curto de 3.28. Devolve true se baixou. */
function guardarCopia() {
  const nome = baixarCopia();
  if (nome) avisoCurto(TEXTO_COPIA_BAIXADA);
  return Boolean(nome);
}

export async function montar(el, ctx) {
  const t = DADOS;
  const bytes = await Promise.race([espacoUsado(), new Promise((r) => setTimeout(() => r(null), 400))]);
  if (ctx.sinal.aborted) return {};

  const ultima = h("p.apoio.dados-ultima", null, t.guardar.ultima(dataDaUltimaCopia()));
  const blocos = [];
  if (emDemo) {
    blocos.push(h("p.dados-demo", null, t.demonstracao));
  } else {
    blocos.push(
      h("section.dados-bloco", { "aria-label": t.guardar.botao },
        botaoSecundario(t.guardar.botao, () => {
          if (guardarCopia()) ultima.textContent = t.guardar.ultima(dataDaUltimaCopia());
        }),
        h("p.apoio.dados-apoio", null, t.guardar.apoio),
        ultima),
      h("section.dados-bloco", { "aria-label": t.trazer.botao },
        botaoSecundario(t.trazer.botao, () => trazerCopia()),
        h("p.apoio.dados-apoio", null, t.trazer.apoio)));
  }
  if (eIphone() && !estaInstalado()) {
    blocos.push(h("p.apoio.dados-iphone", null, t.iphone.texto, " ", linkRota(t.iphone.link, "#/ajustes/instalar", { class: "link-texto" })));
  }

  el.append(h("div.coluna.dados-tela",
    h("h1.titulo.dados-titulo", null, t.titulo),
    h("p.texto.dados-texto", null, t.texto),
    typeof bytes === "number" ? h("p.apoio.dados-espaco", null, t.espaco(tamanhoEmTexto(bytes))) : null,
    h("div.dados-blocos", null, ...blocos),
    emDemo ? null : h("div.dados-apagar", null,
      h("button.dados-apagar-botao", { type: "button", onclick: () => fluxoDeApagar() }, t.apagar.botao))
  ));

  // Armazenamento persistente (7.10): pedido sem perguntar nada, só se ainda não foi dado.
  try {
    const ja = await navigator.storage?.persisted?.();
    if (ja === false) pedirPersistencia();
  } catch { /* sem suporte */ }
  return {};
}

// ---------------------------------------------------------------- Trazer uma cópia (7.10)

/** Uma folha com texto e botões. botoes: [{ texto, valor, principal }]. Devolve o valor escolhido (ou null). */
function folhaDeEscolha({ titulo, texto, botoes }) {
  return new Promise((resolver) => {
    let escolha = null;
    abrirFolha({
      titulo,
      classe: "dados-folha",
      conteudo(corpo, folha) {
        if (texto) corpo.append(h("p.texto", null, texto));
        corpo.append(h("div.folha-botoes", null, ...botoes.map((b) => (b.principal ? botaoPrincipal : botaoSecundario)(b.texto, () => {
          if (b.acao) { b.acao(); return; }
          escolha = b.valor;
          folha.fechar();
        }))));
      },
      aoFechar() { resolver(escolha); }
    });
  });
}

function textoDaPrevia(resultado) {
  const p = previaDaCopia(resultado);
  const data = eDia(p.dia) ? dataCompleta(p.dia) : null;
  const t = p.trilha ?? {};
  const texto = DADOS.trazer.previa({
    data: data ?? "",
    dias: Number(p.dias) || 0,
    lotus: Number(p.lotus) || 0,
    diaDaTrilha: t.concluida ? null : t.proximo ?? 1
  });
  // Sem a data de quando foi guardada (uma cópia mexida à mão), a frase da data sai inteira.
  return data ? texto : texto.replace(/^Esta cópia é de \.\s*/, "");
}

/**
 * Trazer uma cópia (7.10): abre o seletor de arquivo, confere o arquivo, mostra a prévia numa folha e, em
 * "Substituir", troca os dados (o app recarrega em Hoje, com o aviso "Dados trazidos da cópia.").
 * Arquivo inválido ou de versão mais nova: a folha com o texto de 3.28, e nada muda.
 * As boas-vindas (T01) também chamam esta função. Devolve true se a cópia foi trazida, senão false.
 */
export function trazerCopia() {
  return new Promise((resolver) => {
    if (emDemo) { resolver(false); return; }
    let resolvido = false;
    let escolheu = false;
    const terminar = (v) => {
      if (resolvido) return;
      resolvido = true;
      removeEventListener("focus", aoVoltar);
      resolver(v);
    };
    const input = h("input.visivel-leitor", { type: "file", accept: ".json,application/json", tabindex: "-1", "aria-hidden": "true" });
    // Sem o evento "cancel" (navegadores antigos), a volta do foco depois de fechar o seletor encerra a espera.
    const aoVoltar = () => setTimeout(() => { if (!escolheu) { input.remove(); terminar(false); } }, 2500);
    input.addEventListener("cancel", () => { input.remove(); terminar(false); });
    input.addEventListener("change", async () => {
      escolheu = true;
      const arquivo = input.files?.[0];
      input.remove();
      if (!arquivo) { terminar(false); return; }
      const r = await lerCopia(arquivo);
      if (!r.ok) {
        await folhaDeEscolha({
          titulo: DADOS.trazer.botao,
          texto: r.erro === "nova" ? TEXTO_VERSAO_NOVA : TEXTO_ARQUIVO_INVALIDO,
          botoes: [{ texto: "Entendi", valor: "ok", principal: true }]
        });
        terminar(false);
        return;
      }
      const escolha = await folhaDeEscolha({
        titulo: DADOS.trazer.botao,
        texto: textoDaPrevia(r),
        botoes: [
          { texto: DADOS.trazer.substituir, valor: "substituir", principal: true },
          { texto: DADOS.trazer.cancelar, valor: "cancelar" }
        ]
      });
      if (escolha !== "substituir") { terminar(false); return; }
      const ok = substituirPorCopia(r.dados);
      terminar(Boolean(ok));
    });
    document.body.append(input);
    addEventListener("focus", aoVoltar, { once: true });
    input.click();
  });
}

// ---------------------------------------------------------------- Apagar tudo (7.10)

async function fluxoDeApagar() {
  const t = DADOS.apagar;
  const primeira = await folhaDeEscolha({
    titulo: t.folha1.titulo,
    texto: t.folha1.texto,
    botoes: [
      { texto: t.folha1.guardarAntes, principal: true, acao: () => guardarCopia() },
      { texto: t.folha1.continuar, valor: "continuar" }
    ]
  });
  if (primeira !== "continuar") return;
  const segunda = await folhaDeEscolha({
    titulo: t.folha2.titulo,
    texto: t.folha2.texto,
    botoes: [
      { texto: t.folha2.apagar, valor: "apagar", principal: true },
      { texto: t.folha2.cancelar, valor: "cancelar" }
    ]
  });
  if (segunda !== "apagar") return;
  await apagarTudo();
}
