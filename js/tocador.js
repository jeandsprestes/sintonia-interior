// O tocador da prática (T10): um passo por vez, com pouca tela, pelo relógio.
// Executa todos os tipos de passo de 7.8 (texto, respirar, escrever, escolher, mostrar, esperar e
// ferramenta), do mesmo jeito para as práticas (P01 a P18) e para os dias da trilha (T1 a T7).
//
// O tempo é sempre por marcas de relógio (Date.now()), nunca somando intervalos: cada passo guarda o
// instante em que começou. Se a pessoa sai para outro aplicativo ou bloqueia a tela, ao voltar o tocador
// calcula o passo certo e o progresso; os passos que esperam a pessoa ficam onde estavam.
//
//   const t = criarTocador({ pratica, versao, aoTerminar, aoEncerrar, aoLimite });
//   el.append(t.el); t.iniciar();
//   t.pausar(); t.continuar(); t.estaPausado(); t.segundos(); t.parar(); t.trocarParaMinima(); t.destruir();
// aoTerminar({ segundos, respostas }) é chamado quando o último passo acaba.

import { h, svg, limpar, textoRico, porTom, iconeEl, desenhos, juntar, idUnico } from "./ui.js";
import { estado } from "./estado.js";
import { diaEMes } from "./dia.js";
import { criarRespiracao } from "./respirar.js";
import { tocarSino, tocarToque } from "./som.js";
import { sugestaoPorDimensao } from "./regras.js";
import { PRATICAS, preencher, chavesDe, idDaDimensao } from "./conteudo/praticas.js";
import { diaDaTrilha, fraseDoCuidado } from "./conteudo/trilha.js";

const TIPOS_QUE_AVANCAM = new Set(["texto", "respirar", "mostrar", "abertura"]);
const DIMENSOES_DO_MAPA = [["corpo", "Corpo"], ["emocoes", "Emoções"], ["mente", "Mente"], ["espirito", "Espírito"]];

const temValor = (v) => (Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== "");
const comoTexto = (v) => (Array.isArray(v) ? juntar(v) : String(v ?? ""));

/** O tamanho do texto do passo, para caber em até três linhas (estilo passo, 4.2). */
function classeDoTamanho(texto) {
  const n = String(texto ?? "").length;
  if (n > 92) return "passo passo-longo";
  if (n > 58) return "passo passo-medio";
  return "passo";
}

export function criarTocador({
  pratica,
  versao = "completa",
  passoAberto = null,      // { texto, botao }: o passo aberto do fim (dia da trilha com 10 minutos ou mais)
  semAbertura = false,     // pula o passo 0 (ao trocar para a mínima)
  respostasIniciais = {},
  aoTerminar = () => {},
  aoEncerrar = () => {},   // "Encerrar" no véu de pausa
  aoLimite = () => {},     // "Estou no limite" no véu de pausa
  aoPausa = () => {}       // (pausado: boolean)
} = {}) {
  const tom = estado.ajustes.tom === "espiritual" ? "espiritual" : "pratico";
  const ehTrilha = /^T\d$/.test(pratica.id);
  const respostas = { ...respostasIniciais };

  // ------------------------------------------------------------ os passos
  const doConteudo = (pratica[versao] ?? pratica.completa ?? []).map((p) => ({ ...p }));
  const passos = [];
  if (!semAbertura) passos.push({ tipo: "abertura", seg: versao === "minima" ? 2 : 3 });
  passos.push(...doConteudo);
  if (passoAberto) passos.push({ tipo: "esperar", texto: passoAberto.texto, botao: passoAberto.botao, final: true });

  // ------------------------------------------------------------ o relógio
  const relogio = { inicio: null, pausadoDesde: null, pausas: 0 };
  const rodando = () => (relogio.inicio === null ? 0 : (relogio.pausadoDesde ?? Date.now()) - relogio.inicio - relogio.pausas);

  let atual = 0;
  let inicioDoPasso = 0;
  let marcaFinal = null;
  let terminado = false;
  let quadro = 0;
  let trava = null;

  // ------------------------------------------------------------ o desenho
  const cheio = h("span.tocador-progresso-cheio");
  const progresso = h("div.tocador-progresso", { "aria-hidden": "true" }, cheio);
  const centro = h("div.tocador-centro");
  const pe = h("div.tocador-pe");
  const anuncio = h("p.visivel-leitor", { "aria-live": "polite" });
  // Toda tela tem um h1: no tocador ele fica só para o leitor de tela, com o nome da prática.
  const tituloLeitor = h("h1.visivel-leitor", null, pratica.titulo);
  const raiz = h("div.tocador", { tabindex: "-1", "aria-label": pratica.titulo }, tituloLeitor, progresso, centro, pe, anuncio);
  let veu = null;
  let resp = null;           // o círculo de respiração do passo atual
  let anel = null;           // o anel que se fecha no tempo do passo
  let ferramenta = null;     // a ferramenta montada no passo atual
  let rodapeVisivel = true;

  // ------------------------------------------------------------ valores das chaves
  function pegar(obj, caminho) {
    return caminho.reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
  }

  function sugestao() {
    const nome = respostas.dimensao;
    const id = idDaDimensao(nome) ?? nome;
    return id ? sugestaoPorDimensao(id, PRATICAS) : null;
  }

  function buscar(caminho) {
    if (Object.prototype.hasOwnProperty.call(respostas, caminho)) return respostas[caminho];
    if (caminho === "pratica") return sugestao()?.titulo;
    if (caminho === "praticaId") return sugestao()?.id;
    const partes = caminho.split(".");
    const dia = /^dia(\d)$/.exec(partes[0]);
    if (dia) return pegar(estado.trilha.dias[dia[1]]?.respostas, partes.slice(1));
    if (partes[0] === "fazBem" || partes[0] === "cuidadoPossivel") return pegar(estado[partes[0]], partes.slice(1));
    return pegar(respostas, partes);
  }

  const encher = (modelo) => preencher(porTom(modelo, tom), buscar);

  function textoDoPasso(p) {
    if (p.semSom && !estado.ajustes.som) return porTom(p.semSom, tom);
    return encher(p.texto);
  }

  function apoioDoPasso(p) {
    if (p.seHouver && temValor(buscar(p.seHouver.chave))) return encher(p.seHouver.apoio);
    return p.apoio ? encher(p.apoio) : null;
  }

  // ------------------------------------------------------------ opções de um passo de escolher
  function opcoesDe(p) {
    if (p.deMarcadas) {
      const v = respostas[p.deMarcadas];
      return Array.isArray(v) ? [...v] : temValor(v) ? [v] : [];
    }
    let lista = [...(p.opcoes ?? [])];
    if (p.opcoesDe) {
      let extra = [];
      if (p.opcoesDe.chave) {
        const v = respostas[p.opcoesDe.chave];
        if (Array.isArray(v)) extra = v;
        else if (temValor(v)) {
          extra = p.opcoesDe.separarPor
            ? String(v).split(p.opcoesDe.separarPor).map((s) => s.trim()).filter(Boolean).map((s) => (/[.!?…]$/.test(s) ? s : `${s}.`))
            : [String(v)];
        }
      } else if (p.opcoesDe.estado) {
        const v = pegar(estado, p.opcoesDe.estado.split("."));
        extra = Array.isArray(v) ? v : temValor(v) ? [v] : [];
      }
      lista = p.opcoesDe.posicao === "antes" ? [...extra, ...lista] : [...lista, ...extra];
    }
    return [...new Set(lista.map((x) => String(x)))];
  }

  // ------------------------------------------------------------ passos que somem
  const linhaTemValor = (modelo) => chavesDe(modelo).every((k) => temValor(buscar(k)));

  function conteudoDoMostrar(p) {
    if (p.cartoesDosDias || p.figura) return true;
    if (p.cartao === "cuidado") return temValor(buscar("gesto"));
    if (p.linhas) return p.linhas.some((l) => linhaTemValor(l.modelo));
    if (p.respostasPorOpcao) return temValor(respostas[p.chave]);
    if (p.modelo) {
      const chaves = chavesDe(p.modelo);
      return chaves.length === 0 || chaves.some((k) => temValor(buscar(k)));
    }
    return Boolean(p.texto);
  }

  /** true se o passo deve aparecer; se não, aplica o que ele faria (deMarcadas com uma só). */
  function preparar(p) {
    if (p.tipo === "escolher" && p.deMarcadas) {
      const ops = opcoesDe(p);
      if (ops.length <= 1) {
        if (ops.length === 1) respostas[p.chave] = ops[0];
        return false;
      }
    }
    if (p.tipo === "mostrar" && !conteudoDoMostrar(p)) return false;
    return true;
  }

  // ------------------------------------------------------------ tempo de cada passo
  function duracao(p) {
    if (p.tipo === "abertura") return p.seg * 1000;
    if (p.tipo === "texto") return (p.seg ?? 20) * 1000;
    if (p.tipo === "mostrar") return p.seg ? p.seg * 1000 : null;
    if (p.tipo === "respirar") {
      if (p.seg) return p.seg * 1000;
      const ciclo = (p.puxa ?? 4) + (p.padrao === "duplo" ? (p.mais ?? 1) : 0) + (p.solta ?? 6);
      return ciclo * (p.ciclos ?? 1) * 1000;
    }
    return null;
  }

  function peso(p) {
    const d = duracao(p);
    if (d) return d;
    if (p.estimativa) return p.estimativa * 1000;
    if (p.tipo === "escrever") return (p.longo ? 90 : 40) * 1000;
    if (p.tipo === "escolher") return (p.botoes ? 10 : 20) * 1000;
    if (p.tipo === "mostrar") return 30e3;
    if (p.tipo === "ferramenta") return p.nome === "descarregar" ? (p.minima ? 60e3 : 300e3) : 120e3;
    if (p.tipo === "esperar") {
      if (pratica.duracaoReferencia && !p.final) {
        const outros = passos.filter((x) => x !== p && x.tipo !== "esperar").reduce((t, x) => t + (duracao(x) ?? 20e3), 0);
        return Math.max(60e3, pratica.duracaoReferencia * 1000 - outros);
      }
      return 60e3;
    }
    return 20e3;
  }

  let pesoTotal = passos.reduce((t, p) => t + peso(p), 0);
  let pesoFeito = 0;

  function desenharProgresso() {
    const p = passos[atual];
    const parte = p ? Math.min(1, (rodando() - inicioDoPasso) / peso(p)) * peso(p) : 0;
    const fracao = terminado ? 1 : Math.min(1, (pesoFeito + Math.max(0, parte)) / pesoTotal);
    cheio.style.transform = `scaleX(${fracao.toFixed(4)})`;
  }

  // ------------------------------------------------------------ o laço
  function laco() {
    sincronizar();
    if (terminado) return;
    desenharProgresso();
    const passou = rodando() - inicioDoPasso;
    resp?.atualizar(passou);
    if (anel) {
      const d = duracao(passos[atual]) || 1;
      anel.style.strokeDashoffset = String(anel.comprimento * (1 - Math.min(1, passou / d)));
    }
    quadro = requestAnimationFrame(laco);
  }

  function sincronizar() {
    if (terminado || relogio.pausadoDesde !== null || relogio.inicio === null) return;
    let mudou = false;
    for (let guarda = 0; guarda < 500; guarda++) {
      const p = passos[atual];
      const d = duracao(p);
      if (d === null || rodando() - inicioDoPasso < d) break;
      const fim = inicioDoPasso + d;
      if (!irParaProximo(fim)) return;
      mudou = true;
    }
    if (mudou) mostrarPasso();
  }

  /** Passa ao próximo passo que deve aparecer, começando no instante "quando". false se acabou. */
  function irParaProximo(quando = rodando(), { para = null } = {}) {
    pesoFeito += peso(passos[atual]);
    let i = para ?? atual + 1;
    while (i < passos.length && !preparar(passos[i])) i += 1;
    inicioDoPasso = quando;
    if (i >= passos.length) {
      terminar(quando);
      return false;
    }
    const antes = passos[atual];
    atual = i;
    if ((antes?.semTela || passos[atual].semTela) && antes?.tipo !== "abertura") tocarToque();
    return true;
  }

  /** "Próximo", "Seguir", "Pular" e os botões próprios: segue já. */
  function seguir(novas = null, { para = null } = {}) {
    if (terminado) return;
    if (novas) Object.assign(respostas, novas);
    if (para !== null) {
      const alvo = passos.findIndex((x) => x.id === para);
      if (alvo !== -1) {
        // "Ouvir mais uma": volta ao passo marcado; a linha de progresso ganha o tempo de novo.
        pesoTotal += passos.slice(alvo, atual + 1).reduce((t, x) => t + peso(x), 0);
        if (!irParaProximo(rodando(), { para: alvo })) return;
        mostrarPasso();
        return;
      }
    }
    if (irParaProximo(rodando())) mostrarPasso();
  }

  function voltarUmPasso() {
    let i = atual - 1;
    while (i > 0 && !preparar(passos[i])) i -= 1;
    if (i < 0) return;
    pesoFeito = Math.max(0, pesoFeito - peso(passos[i]));
    atual = i;
    inicioDoPasso = rodando();
    mostrarPasso();
  }

  // ------------------------------------------------------------ desenhar o passo
  function limparPasso() {
    try { ferramenta?.destruir?.(); } catch (erro) { console.error(erro); }
    ferramenta = null;
    resp?.destruir();
    resp = null;
    anel = null;
  }

  function mostrarPasso() {
    limparPasso();
    const p = passos[atual];
    // "entra": sobe 8 px e aparece; com menos movimento, o CSS deixa só a opacidade, em 200 ms.
    const bloco = h("div.tocador-passo.entra");
    let falar = "";
    rodapeVisivel = true;
    try {
      falar = desenharPasso(p, bloco) ?? "";
    } catch (erro) {
      console.error(erro);
      bloco.append(h("p.passo", null, ""));
    }
    limpar(centro);
    centro.append(bloco);
    desenharRodape(p);
    if (falar) {
      anuncio.textContent = "";
      setTimeout(() => { anuncio.textContent = falar.replace(/\*/g, ""); }, 80);
    }
    try { raiz.focus({ preventScroll: true }); } catch { /* nada */ }
    desenharProgresso();
  }

  function figuraEl(nome, tamanho = 200) {
    if (nome === "mapa") return svg(desenhos.mapaCuidado(respostas, { tamanho }));
    return svg(desenhos.figura(nome, { tamanho }));
  }

  function textoEl(texto, extra = "") {
    return h(`p.${classeDoTamanho(texto).split(" ").join(".")}${extra}`, null, textoRico(texto));
  }

  function desenharPasso(p, bloco) {
    switch (p.tipo) {
      case "abertura": {
        const abre = pratica.tom?.[tom]?.abre ?? "";
        bloco.append(
          h("p.rotulo.tocador-abertura-rotulo", null, pratica.titulo),
          h("p.abertura.tocador-abertura", null, abre)
        );
        tocarSino(1);
        return `${pratica.titulo}. ${abre}`;
      }
      case "texto": {
        const texto = textoDoPasso(p);
        const apoio = apoioDoPasso(p);
        const fig = h("div.tocador-figura");
        if (p.figura) fig.append(figuraEl(p.figura));
        else if (p.anel) fig.append(anelDoPasso());
        bloco.append(fig, textoEl(texto, ".tocador-texto"));
        if (apoio) bloco.append(h("p.texto.tocador-apoio", null, textoRico(apoio)));
        return texto;
      }
      case "respirar": {
        const texto = encher(p.texto);
        const apoio = apoioDoPasso(p);
        resp = criarRespiracao({ padrao: p.padrao, puxa: p.puxa, mais: p.mais, solta: p.solta, ciclos: p.ciclos });
        bloco.append(textoEl(texto, ".tocador-texto-respirar"), h("div.tocador-figura.tem-respiracao", null, resp.el));
        if (apoio) bloco.append(h("p.texto.tocador-apoio", null, textoRico(apoio)));
        resp.atualizar(0);
        return texto;
      }
      case "escrever": return desenharEscrever(p, bloco);
      case "escolher": return desenharEscolher(p, bloco);
      case "mostrar": return desenharMostrar(p, bloco);
      case "esperar": {
        const texto = encher(p.texto);
        bloco.append(h("div.tocador-figura"), textoEl(texto, ".tocador-texto"));
        if (p.botao && p.botao !== "Próximo") {
          bloco.append(h("div.tocador-acao-botoes", null,
            h("button.botao-principal", { type: "button", onclick: () => seguir() }, p.botao)));
        }
        return texto;
      }
      case "ferramenta": return desenharFerramenta(p, bloco);
      default:
        bloco.append(textoEl(encher(p.texto ?? "")));
        return "";
    }
  }

  function anelDoPasso() {
    const ns = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 200 200");
    s.setAttribute("aria-hidden", "true");
    const base = document.createElementNS(ns, "circle");
    base.setAttribute("class", "respiracao-fora");
    const linha = document.createElementNS(ns, "circle");
    linha.setAttribute("class", "respiracao-anel");
    for (const c of [base, linha]) {
      c.setAttribute("cx", "100");
      c.setAttribute("cy", "100");
      c.setAttribute("r", "90");
    }
    const comprimento = 2 * Math.PI * 90;
    linha.setAttribute("transform", "rotate(-90 100 100)");
    linha.style.strokeDasharray = String(comprimento);
    linha.style.strokeDashoffset = String(comprimento);
    linha.comprimento = comprimento;
    s.append(base, linha);
    anel = linha;
    return s;
  }

  // ------------------------------------------------------------ escrever
  function desenharEscrever(p, bloco) {
    const pergunta = p.pergunta ? encher(p.pergunta) : "";
    const campos = p.campos ?? [{ chave: p.chave, pergunta: null, exemplo: p.exemplo }];
    const entradas = [];
    const acao = h("div.tocador-acao");
    if (pergunta) bloco.append(textoEl(pergunta, ".tocador-texto"));
    const apoio = apoioDoPasso(p);
    if (apoio) bloco.append(h("p.texto.tocador-apoio", null, apoio));
    let botaoSeguir;
    const conferir = () => {
      const algum = entradas.some((e) => e.value.trim() !== "");
      botaoSeguir.disabled = !(algum || p.opcional);
    };
    for (const c of campos) {
      const id = idUnico("campo");
      const grande = p.longo && campos.length === 1;
      const atributos = {
        id, class: grande ? "campo campo-grande" : "campo",
        placeholder: c.exemplo ? encher(c.exemplo) : "",
        value: temValor(respostas[c.chave]) ? String(respostas[c.chave]) : "",
        autocomplete: "off", spellcheck: "true"
      };
      if (!c.pergunta && pergunta) atributos["aria-label"] = pergunta.replace(/\*/g, "");
      const entrada = grande ? h("textarea", { ...atributos, rows: "5" }) : h("input", { ...atributos, type: "text", enterkeyhint: "next" });
      entrada.dataset.chave = c.chave;
      entrada.addEventListener("input", conferir);
      if (!grande) {
        entrada.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" && !ev.isComposing) { ev.preventDefault(); if (!botaoSeguir.disabled) botaoSeguir.click(); }
        });
      }
      entradas.push(entrada);
      acao.append(h("div.grupo-campo", null,
        c.pergunta ? h("label.rotulo-campo", { for: id }, encher(c.pergunta)) : null,
        entrada));
    }
    let caixa = null;
    if (p.marcar) {
      caixa = h("input", { type: "checkbox", checked: Boolean(p.marcar.marcada) });
      acao.append(h("label.caixa-marcar", null, caixa, h("span", null, p.marcar.texto)));
    }
    botaoSeguir = h("button.botao-principal", {
      type: "button",
      onclick: () => {
        const novas = {};
        for (const e of entradas) {
          const v = e.value.trim();
          if (v) novas[e.dataset.chave] = v;
          else if (temValor(respostas[e.dataset.chave])) novas[e.dataset.chave] = null;  // apagou o que havia
        }
        if (caixa) novas[p.marcar.chave] = caixa.checked;
        seguir(novas);
      }
    }, "Seguir");
    acao.append(h("div.tocador-acao-botoes", null, botaoSeguir,
      h("button.link", { type: "button", onclick: () => seguir(caixa ? { [p.marcar.chave]: false } : null) }, "Pular")));
    bloco.append(acao);
    conferir();
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setTimeout(() => { try { entradas[0]?.focus({ preventScroll: true }); } catch { /* nada */ } }, 120);
    }
    rodapeVisivel = false;
    return pergunta || campos.map((c) => c.pergunta).filter(Boolean).join(" ");
  }

  // ------------------------------------------------------------ escolher
  function desenharEscolher(p, bloco) {
    const pergunta = encher(p.pergunta ?? "");
    const nome = pergunta.replace(/\*/g, "");
    const opcoes = opcoesDe(p);
    const unico = p.max === 1;
    const limite = unico ? 1 : p.max ?? Infinity;
    const valorDe = (texto) => {
      if (!p.valores) return texto;
      const i = (p.opcoes ?? []).indexOf(texto);
      return i === -1 ? texto : p.valores[i];
    };
    bloco.append(textoEl(pergunta, ".tocador-texto"));
    const apoio = apoioDoPasso(p);
    if (apoio) bloco.append(h("p.texto.tocador-apoio", null, apoio));
    const acao = h("div.tocador-acao");
    rodapeVisivel = false;

    // "Mais uma?" (P06): as opções são botões e respondem no toque.
    if (p.botoes) {
      const lista = h("div.tocador-acao-botoes");
      opcoes.forEach((o, i) => {
        lista.append(h(i === opcoes.length - 1 ? "button.botao-principal" : "button.botao-secundario", {
          type: "button",
          onclick: () => seguir({ [p.chave]: valorDe(o) }, { para: p.repete?.[o] ?? null })
        }, o));
      });
      acao.append(lista);
      bloco.append(acao);
      return pergunta;
    }

    const marcadas = new Set();      // textos marcados (das opções e os escritos com "Adicionar")
    const escritos = [];             // o que a pessoa acrescentou com outraRepete
    let outraAberta = false;
    const anterior = respostas[p.chave];
    if (p.preMarcar === "menosEspaco" && !temValor(anterior)) {
      let menor = null;
      for (const [chave, nomeDim] of DIMENSOES_DO_MAPA) {
        const v = Number(respostas[chave]);
        if (respostas[chave] === undefined || !Number.isFinite(v)) continue;
        if (menor === null || v < menor.v) menor = { v, nome: nomeDim };
      }
      if (menor && opcoes.includes(menor.nome)) marcadas.add(menor.nome);
    }
    const grupo = h("div.pastilhas", { role: unico ? "radiogroup" : "group", "aria-label": nome });
    const campoOutra = h("input.campo", { type: "text", placeholder: p.outraDica ?? "", "aria-label": p.outra ?? "", autocomplete: "off" });
    const grupoOutra = h("div.grupo-campo.campo-outra", { hidden: true }, campoOutra);
    let botaoSeguir = null;
    let pastilhaOutra = null;

    const contagem = () => marcadas.size + (outraAberta && !p.outraRepete ? 1 : 0);

    function pastilha(texto, { outra = false } = {}) {
      const b = h("button.pastilha", {
        type: "button",
        role: unico ? "radio" : null,
        dataset: { opcao: texto }
      }, h("span.pastilha-check", { "aria-hidden": "true" }, iconeEl("check", { tamanho: 12 })), h("span", null, texto));
      b.addEventListener("click", () => (outra ? alternarOutra() : alternar(texto, b)));
      return b;
    }

    function alternar(texto, botao) {
      if (unico) {
        marcadas.clear();
        marcadas.add(texto);
        outraAberta = false;
      } else if (marcadas.has(texto)) {
        marcadas.delete(texto);
        const i = escritos.indexOf(texto);
        if (i !== -1) {
          escritos.splice(i, 1);
          botao?.remove();
        }
      } else if (contagem() < limite) {
        marcadas.add(texto);
      }
      desenharMarcas();
    }

    function alternarOutra() {
      if (unico) {
        marcadas.clear();
        outraAberta = true;
      } else if (outraAberta) {
        outraAberta = false;
      } else if (p.outraRepete || contagem() < limite) {
        outraAberta = true;
      }
      desenharMarcas();
      if (outraAberta) setTimeout(() => { try { campoOutra.focus({ preventScroll: true }); } catch { /* nada */ } }, 60);
    }

    function desenharMarcas() {
      const cheio = !unico && contagem() >= limite;
      for (const b of grupo.querySelectorAll(".pastilha")) {
        const ehOutra = b === pastilhaOutra;
        const ligado = ehOutra ? outraAberta : marcadas.has(b.dataset.opcao);
        if (unico) {
          b.setAttribute("aria-checked", String(ligado));
        } else {
          b.setAttribute("aria-pressed", String(ligado));
          b.disabled = cheio && !ligado && !(ehOutra && p.outraRepete);
        }
      }
      if (unico) {
        const foco = grupo.querySelector('[aria-checked="true"]') ?? grupo.querySelector(".pastilha");
        for (const b of grupo.querySelectorAll(".pastilha")) b.tabIndex = b === foco ? 0 : -1;
      }
      grupoOutra.hidden = !outraAberta;
      conferir();
    }

    function resposta() {
      const lista = [];
      for (const o of opcoes) if (marcadas.has(o)) lista.push(valorDe(o));
      for (const e of escritos) if (marcadas.has(e)) lista.push(e);
      const escrito = campoOutra.value.trim();
      if (outraAberta && !p.outraRepete && escrito) lista.push(escrito);
      return lista;
    }

    function conferir() {
      if (botaoSeguir) botaoSeguir.disabled = !(resposta().length > 0 || p.opcional);
    }

    grupo.append(...opcoes.map((o) => pastilha(o)));
    if (p.outra) {
      pastilhaOutra = pastilha(p.outra, { outra: true });
      grupo.append(pastilhaOutra);
    }
    // O que já foi respondido (ao voltar um passo, ou no "Mudar" e no "Editar") vem marcado.
    if (temValor(anterior)) {
      for (const v of Array.isArray(anterior) ? anterior : [anterior]) {
        const i = p.valores ? p.valores.indexOf(v) : -1;
        const texto = i !== -1 ? String((p.opcoes ?? [])[i]) : String(v);
        if (opcoes.includes(texto)) {
          if (unico) marcadas.clear();
          marcadas.add(texto);
        } else if (p.outra && p.outraRepete) {
          if (!escritos.includes(texto)) {
            escritos.push(texto);
            marcadas.add(texto);
            grupo.insertBefore(pastilha(texto), pastilhaOutra);
          }
        } else if (p.outra) {
          if (unico) marcadas.clear();
          outraAberta = true;
          campoOutra.value = texto;
        }
      }
    }
    if (unico) {
      grupo.addEventListener("keydown", (ev) => {
        const passo = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0;
        if (!passo) return;
        const todas = [...grupo.querySelectorAll(".pastilha")];
        const i = todas.indexOf(document.activeElement);
        if (i === -1) return;
        ev.preventDefault();
        const j = (i + passo + todas.length) % todas.length;
        todas[j].focus();
        todas[j].click();
      });
    }
    campoOutra.addEventListener("input", conferir);
    if (p.outraRepete) {
      const adicionar = h("button.botao-secundario", {
        type: "button",
        onclick: () => {
          const v = campoOutra.value.trim();
          if (!v || opcoes.includes(v) || escritos.includes(v) || contagem() >= limite) return;
          escritos.push(v);
          marcadas.add(v);
          grupo.insertBefore(pastilha(v), pastilhaOutra);
          campoOutra.value = "";
          desenharMarcas();
          try { campoOutra.focus({ preventScroll: true }); } catch { /* nada */ }
        }
      }, "Adicionar");
      grupoOutra.classList.add("campo-outra-repete");
      grupoOutra.append(adicionar);
      campoOutra.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.isComposing) { ev.preventDefault(); adicionar.click(); } });
    } else {
      campoOutra.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && !ev.isComposing && botaoSeguir && !botaoSeguir.disabled) { ev.preventDefault(); botaoSeguir.click(); }
      });
    }
    botaoSeguir = h("button.botao-principal", {
      type: "button",
      onclick: () => {
        const r = resposta();
        const valor = unico ? (r[0] ?? null) : r;
        // Desmarcou o que vinha marcado (num passo opcional): a resposta fica vazia.
        seguir(temValor(valor) ? { [p.chave]: valor } : temValor(anterior) ? { [p.chave]: null } : null);
      }
    }, "Seguir");
    acao.append(grupo, grupoOutra, h("div.tocador-acao-botoes", null, botaoSeguir,
      p.opcional ? h("button.link", { type: "button", onclick: () => seguir() }, "Pular") : null));
    bloco.append(acao);
    desenharMarcas();
    return pergunta;
  }

  // ------------------------------------------------------------ mostrar
  function desenharMostrar(p, bloco) {
    const fig = h("div.tocador-figura");
    if (p.figura) fig.append(figuraEl(p.figura));
    if (p.icone) {
      const nome = respostas[p.icone];
      const id = idDaDimensao(nome) ?? nome;
      if (id) fig.append(h("span.tocador-icone-dimensao", null, iconeEl(id, { tamanho: 64 })));
    }
    bloco.append(fig);
    let falar = "";
    const texto = p.texto ? encher(p.texto) : "";
    const apoio = apoioDoPasso(p);

    if (p.cartoesDosDias) {
      bloco.append(textoEl(texto, ".tocador-texto"), cartoesDosDias(p));
      bloco.classList.add("tocador-passo-lista");
      if (apoio) bloco.append(h("p.texto.tocador-apoio", null, apoio));
      return texto;
    }
    if (p.cartao === "cuidado") {
      const dia6 = diaDaTrilha(6);
      const passoDoGesto = (dia6?.completa ?? []).find((x) => x.chave === "gesto");
      const pastilhas = [...(passoDoGesto?.opcoes ?? []), ...(estado.fazBem.coisas ?? [])];
      const cartao = fraseDoCuidado({ gesto: respostas.gesto, momento: respostas.momento, minima: respostas.minima }, { pastilhas });
      if (cartao) {
        bloco.append(h("p.tocador-mostrar-grande.tocador-texto", null, cartao.frase));
        if (cartao.minima) bloco.append(h("p.lede.tocador-apoio", null, cartao.minima));
        falar = `${cartao.frase} ${cartao.minima ?? ""}`;
      }
      return falar;
    }
    if (texto) {
      bloco.append(textoEl(texto, ".tocador-texto"));
      falar = texto;
    }
    if (p.respostasPorOpcao) {
      const v = respostas[p.chave];
      const lista = Array.isArray(v) ? v : temValor(v) ? [v] : [];
      const textos = lista.map((o) => p.respostasPorOpcao[o] ?? p.respostasPorOpcao[p.outra ?? "Outra coisa"] ?? null)
        .filter(Boolean).map((t) => porTom(t, tom));
      const textosUnicos = [...new Set(textos)];
      if (textosUnicos.length === 1 && !texto) {
        bloco.append(textoEl(textosUnicos[0], ".tocador-texto"));
      } else {
        bloco.append(h("div.tocador-mostrar", null, ...textosUnicos.map((t) => h("p.lede", null, t))));
      }
      falar = `${falar} ${textosUnicos.join(" ")}`.trim();
    }
    if (p.linhas) {
      // "Pede mais cuidado: {dia3.dimensao}": o nome da linha em --suave e a resposta em --tinta.
      const linhas = p.linhas.filter((l) => linhaTemValor(l.modelo)).map((l) => {
        const t = encher(l.modelo);
        const partes = /^([^{}]*?:)\s*(\{[\s\S]+)$/.exec(porTom(l.modelo, tom) ?? "");
        return { t, nome: partes ? partes[1] : null, valor: partes ? encher(partes[2]) : null };
      });
      bloco.append(h("ul.tocador-mostrar.tocador-linhas", null, ...linhas.map((x) => (x.nome
        ? h("li.lede", null, h("span.tocador-linha-nome", null, x.nome), " ", h("span.tocador-linha-valor", null, x.valor))
        : h("li.lede", null, x.t)))));
      falar = `${falar} ${linhas.map((x) => x.t).join(". ")}`.trim();
    }
    if (p.modelo) {
      const t = encher(p.modelo);
      if (!texto && !p.respostasPorOpcao) {
        bloco.append(p.grande ? h("p.tocador-mostrar-grande.tocador-texto", null, t) : textoEl(t, ".tocador-texto"));
      } else {
        bloco.append(h(p.grande ? "p.tocador-mostrar-grande.tocador-mostrar" : "p.lede.tocador-mostrar.tocador-escrito", null, t));
      }
      falar = `${falar} ${t}`.trim();
    }
    if (apoio) bloco.append(h("p.texto.tocador-apoio", null, textoRico(apoio)));
    if (!fig.childNodes.length) fig.remove();
    return falar;
  }

  function cartoesDosDias(p) {
    const cfg = diaDaTrilha(7)?.cartoes ?? { porDia: {} };
    const lista = h("ul.tocador-lista.dias-cartoes", { class: p.semAnimacao ? "sem-animacao" : "" });
    for (let n = 1; n <= 6; n++) {
      const feito = estado.trilha.dias[n];
      if (!feito) continue;
      const r = feito.respostas ?? {};
      const dia = diaDaTrilha(n);
      const corpo = [];
      for (const item of cfg.porDia?.[n] ?? []) {
        if (Array.isArray(item)) {
          const k = item.find((x) => temValor(r[x]));
          if (k) corpo.push(h("p.texto", null, comoTexto(r[k])));
        } else if (item === "medicao") {
          if (temValor(r.antes) && temValor(r.depois)) corpo.push(h("p.texto", null, preencher(cfg.medicao, r)));
        } else if (item === "mapa") {
          if (DIMENSOES_DO_MAPA.some(([k]) => temValor(r[k]))) corpo.push(h("div.dias-cartao-mapa", null, svg(desenhos.mapaCuidado(r, { tamanho: 120 }))));
        } else if (item === "cuidado") {
          const dia6 = diaDaTrilha(6);
          const passoDoGesto = (dia6?.completa ?? []).find((x) => x.chave === "gesto");
          const c = fraseDoCuidado({ gesto: r.gesto, momento: r.momento, minima: r.minima },
            { pastilhas: [...(passoDoGesto?.opcoes ?? []), ...(estado.fazBem.coisas ?? [])] });
          if (c) corpo.push(h("p.dias-cartao-cuidado", null, c.frase), c.minima ? h("p.apoio", null, c.minima) : null);
        } else if (temValor(r[item])) {
          corpo.push(h("p.texto", null, comoTexto(r[item])));
        }
      }
      if (!corpo.length) corpo.push(h("p.texto", null, preencher(cfg.semResposta ?? "", { data: diaEMes(feito.dia) })));
      lista.append(h("li.cartao.dias-cartao", null,
        h("p.rotulo", null, `DIA ${n} · ${String(dia?.titulo ?? "").toLocaleUpperCase("pt-BR")}`),
        ...corpo));
    }
    return lista;
  }

  // ------------------------------------------------------------ ferramenta
  function desenharFerramenta(p, bloco) {
    rodapeVisivel = false;
    const area = h("div.tocador-ferramenta");
    const montarAgora = async () => {
      limpar(area);
      try {
        const mod = await import(`./ferramentas/${p.nome}.js`);
        if (passos[atual] !== p || terminado) return;
        ferramenta = await mod.montar(area, {
          passo: p,
          respostas: { ...respostas },
          tom,
          versao,
          pratica,
          trilha: Object.fromEntries(Object.entries(estado.trilha.dias).map(([n, d]) => [n, d?.respostas ?? {}])),
          concluir: (novas) => { if (passos[atual] === p) seguir(novas ?? null); },
          voltar: () => voltarUmPasso(),
          pausado: () => relogio.pausadoDesde !== null,
          mostrarRodape: (sim) => { rodapeVisivel = Boolean(sim); desenharRodape(passos[atual]); }
        }) ?? null;
      } catch (erro) {
        console.error(erro);
        area.append(h("div.tocador-semente", null,
          h("button.botao-principal", { type: "button", onclick: () => seguir() }, "Próximo")));
      }
    };
    if (p.opcional && p.link) {
      area.append(h("div.tocador-acao-botoes", null,
        h("button.link", { type: "button", onclick: () => { rodapeVisivel = false; desenharRodape(p); montarAgora(); } }, p.link)));
      rodapeVisivel = true;
      bloco.append(area);
      return p.link;
    }
    bloco.append(area);
    montarAgora();
    return "";
  }

  // ------------------------------------------------------------ o pé: Pausar e Próximo
  function desenharRodape(p) {
    limpar(pe);
    if (!rodapeVisivel && p.tipo !== "ferramenta") {
      pe.append(botaoPausar());
      return;
    }
    if (!rodapeVisivel) return;
    pe.append(botaoPausar());
    const avanca = TIPOS_QUE_AVANCAM.has(p.tipo) || (p.tipo === "esperar" && (!p.botao || p.botao === "Próximo")) || (p.tipo === "ferramenta" && p.opcional);
    if (avanca && p.tipo !== "abertura") {
      pe.append(h("button.botao-secundario.seguir", { type: "button", onclick: () => seguir() },
        h("span", null, "Próximo"), iconeEl("seguir", { tamanho: 18 })));
    }
  }

  function botaoPausar() {
    return h("button.botao-secundario.pausar", { type: "button", onclick: () => pausar() },
      iconeEl("pausar", { tamanho: 18 }), h("span", null, "Pausar"));
  }

  // ------------------------------------------------------------ pausa
  /** Para o tempo. semVeu: sem o véu de pausa (enquanto a folha "Quer parar aqui?" está aberta). */
  function pausar({ semVeu = false } = {}) {
    if (terminado || relogio.inicio === null) return;
    if (relogio.pausadoDesde === null) {
      relogio.pausadoDesde = Date.now();
      aoPausa(true);
    }
    if (!semVeu) mostrarVeu();
  }

  function continuar() {
    if (relogio.pausadoDesde === null) return;
    relogio.pausas += Date.now() - relogio.pausadoDesde;
    relogio.pausadoDesde = null;
    esconderVeu();
    aoPausa(false);
  }

  function mostrarVeu() {
    if (veu) return;
    const botao = h("button.botao-principal", { type: "button", onclick: () => continuar() }, "Continuar");
    veu = h("div.veu-pausa", { role: "group", "aria-label": "Pausado." },
      h("p.titulo", { role: "status" }, "Pausado."),
      botao,
      h("button.link", { type: "button", onclick: () => aoLimite() }, "Estou no limite"),
      h("button.link", { type: "button", onclick: () => aoEncerrar() }, "Encerrar"));
    raiz.append(veu);
    raiz.classList.add("pausado");
    requestAnimationFrame(() => veu?.classList.add("visivel"));
    setTimeout(() => { try { botao.focus({ preventScroll: true }); } catch { /* nada */ } }, 30);
  }

  function esconderVeu() {
    const v = veu;
    veu = null;
    if (!v) return;
    raiz.classList.remove("pausado");
    v.classList.remove("visivel");
    setTimeout(() => v.remove(), 200);
    try { raiz.focus({ preventScroll: true }); } catch { /* nada */ }
  }

  // ------------------------------------------------------------ tela ligada
  async function pedirTelaLigada() {
    try {
      if (!("wakeLock" in navigator) || trava || terminado) return;
      trava = await navigator.wakeLock.request("screen");
      trava.addEventListener?.("release", () => { trava = null; });
    } catch {
      trava = null;
    }
  }

  function soltarTela() {
    try { trava?.release?.(); } catch { /* nada */ }
    trava = null;
  }

  const aoVoltarAoApp = () => {
    if (document.visibilityState !== "visible" || terminado) return;
    pedirTelaLigada();
    sincronizar();
    desenharProgresso();
  };

  const aoTeclar = (ev) => {
    if (ev.key !== " " && ev.code !== "Space") return;
    const alvo = ev.target;
    if (alvo.closest?.("input, textarea, select, button, a, [contenteditable]")) return;
    if (document.querySelector(".folha-envoltorio, .camada")) return;
    ev.preventDefault();
    if (relogio.pausadoDesde !== null) continuar();
    else pausar();
  };

  // ------------------------------------------------------------ fim
  function terminar(quando = rodando()) {
    if (terminado) return;
    terminado = true;
    marcaFinal = quando;
    cancelAnimationFrame(quadro);
    cheio.style.transform = "scaleX(1)";
    limparPasso();
    soltarTela();
    tocarSino(2);
    aoTerminar({ segundos: Math.round(marcaFinal / 1000), respostas: { ...respostas } });
  }

  // ------------------------------------------------------------ a interface
  return {
    el: raiz,
    iniciar() {
      relogio.inicio = Date.now();
      atual = 0;
      while (atual < passos.length && !preparar(passos[atual])) atual += 1;
      inicioDoPasso = 0;
      document.addEventListener("visibilitychange", aoVoltarAoApp);
      document.addEventListener("keydown", aoTeclar);
      pedirTelaLigada();
      mostrarPasso();
      quadro = requestAnimationFrame(laco);
    },
    pausar,
    continuar,
    estaPausado: () => relogio.pausadoDesde !== null,
    segundos: () => Math.round(rodando() / 1000),
    respostas: () => ({ ...respostas }),
    /** Encerra sem chamar aoTerminar; devolve { segundos, respostas }. */
    parar() {
      const s = Math.round(rodando() / 1000);
      terminado = true;
      cancelAnimationFrame(quadro);
      limparPasso();
      soltarTela();
      return { segundos: s, respostas: { ...respostas } };
    },
    destruir() {
      terminado = true;
      cancelAnimationFrame(quadro);
      limparPasso();
      soltarTela();
      document.removeEventListener("visibilitychange", aoVoltarAoApp);
      document.removeEventListener("keydown", aoTeclar);
      veu?.remove();
    }
  };
}
