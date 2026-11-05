# Como as telas se ligam

Guia para quem constrói as telas do Sintonia Interior. Leia isto e o código de `js/app.js`, `js/ui.js`, `js/estado.js`, `js/regras.js` e `js/telas/pratica.js`. A especificação manda em tudo; aqui está só o encaixe.

Regras de sempre: módulos ES, sem build, sem biblioteca, sem rede; caminhos relativos; nenhum `<script>` dentro do HTML e nenhum atributo `on*=""` (use `addEventListener` ou o `h()` de `ui.js`); nenhum travessão em arquivo nenhum; texto da pessoa sempre por `textContent` (o `h()` já faz isso), nunca por `innerHTML`.

## 1. Arquivos e donos

| Parte | Arquivos |
|---|---|
| Fundação | `index.html`, `manifest.webmanifest`, `sw.js`, `css/app.css`, `js/app.js`, `ui.js`, `estado.js`, `dia.js`, `regras.js`, `som.js`, `tocador.js`, `respirar.js`, `telas/hoje.js`, `tempo.js`, `passo.js`, `pratica.js`, `ferramentas/regua.js` |
| Conteúdo | `js/conteudo/praticas.js`, `trilha.js`, `frases.js`, `textos.js` (o formato está no topo de cada um) |
| Desenhos | `js/flor.js`, `js/desenhos.js`, `css/desenhos.css`, `icons/` |
| Trilha e boas-vindas | `telas/boas-vindas.js`, `trilha.js`, `dia-da-trilha.js`, `caminho.js`, `js/imagem.js`, `ferramentas/mapa.js`, `ferramentas/caminho.js`, `css/trilha.css` |
| Dia pesado | `telas/limite.js`, `descarregar.js`, `experimento.js`, `ferramentas/descarregar.js`, `js/voz.js`, `js/foco.js`, `css/foco.css` |
| Biblioteca e casa | `telas/praticas.js`, `semana.js`, `caderno.js`, `ajustes.js`, `dados.js`, `sobre.js`, `aviso.js`, `instalar.js`, `demonstracao.js`, `js/casa.js`, `css/casa.css` |

Cada um só escreve nos próprios arquivos. Se precisar de algo da fundação, peça; não edite.

**Arquivo novo:** acrescente o caminho dele à lista `ARQUIVOS` do `sw.js` (é a única linha que todos podem tocar no `sw.js`), senão o app não abre sem internet. Os arquivos-semente já estão na lista.

## 2. A interface de um módulo de tela

```js
// js/telas/exemplo.js
import { h } from "../ui.js";

export const moldura = { aba: "semana", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/semana" };
// ou: export function moldura(ctx) { return {...}; }   (quando depende de ctx.params ou ctx.query)

export function montar(el, ctx) {          // pode ser async
  el.append(h("div.coluna", h("h1.titulo", null, "Seu caderno")));
  return {
    destruir() {},                          // opcional: chamado ao sair da tela
    aoMudarEstado(motivo) {}                // opcional: o estado mudou em outra aba
  };
}
```

- `el` é o quadro vazio da tela, já dentro da moldura. Toda tela tem um `<h1>` (o foco vai para ele ao abrir).
- Use a classe `coluna` no bloco principal (até 32,5 rem, centrado; no computador, a página direita).
- Ouça eventos com `{ signal: ctx.sinal }`: eles param sozinhos ao sair da tela.

### A moldura (o que cada tela declara)

| Campo | Valores | Para quê |
|---|---|---|
| `aba` | `"hoje"`, `"trilha"`, `"praticas"`, `"semana"` ou `null` | com valor, as abas aparecem com esta acesa; `null` some com elas (T06 a T12, T14, T15, T19 a T21) |
| `navegacao` | id de item | o item aceso na página esquerda do computador, se não for a aba (`"ajustes"` nas telas de Ajustes) |
| `barra` | `"hoje"`, `"aba"`, `"interna"`, `"nenhuma"` | `"aba"`: nome da tela em Fraunces à esquerda; `"interna"`: "‹" ou "×" à esquerda e rótulo no centro; `"nenhuma"`: boas-vindas |
| `titulo` | texto | o nome na barra (`"Trilha"`) ou o rótulo do centro, nas internas (opcional) |
| `esquerda` | `"voltar"`, `"fechar"` ou `null` | o botão da esquerda nas internas |
| `rotuloEsquerda` | texto | nome acessível (`"Voltar"`, `"Fechar"`, `"Encerrar"`) |
| `aoEsquerda` | função | o que o botão da esquerda (e o Esc sem nada aberto) faz; padrão: voltar uma tela |
| `limite` | `"pilula"`, `"icone"` ou `null` | a forma do Estou no limite no alto (2.2): pílula em Hoje, Tempo, Passo e no tocador; ícone no resto; `null` só nas boas-vindas |
| `acoes` | `[{ icone, rotulo, rota }]` | ícones antes do limite (Semana: Ajustes) |
| `foco` | `true` ou `false` | tela de foco: no computador, abre por cima do caderno, em tela inteira, até 640 px |
| `pai` | rota | para onde o "‹" vai quando não há tela anterior no app |

Mudar a moldura no meio da tela (um passo interno que vira foco, por exemplo): `ctx.moldura({ foco: true, esquerda: "fechar" })`.

### O `ctx`

| Campo | O que é |
|---|---|
| `ctx.caminho` | a rota sem `#/` e sem a busca (`#/praticas/P10?de=hoje` dá `"praticas/P10"`) |
| `ctx.params` | partes da rota (`#/trilha/3` dá `{ n: "3" }`) |
| `ctx.query` | o que vem depois de `?` (`#/pratica/P10?v=minima&de=hoje` dá `{ v: "minima", de: "hoje" }`) |
| `ctx.dados` | o objeto passado por quem navegou com `navegar(rota, { dados })`, ou `null` |
| `ctx.sinal` | `AbortSignal` que dispara ao sair da tela |
| `ctx.moldura(parcial)` | muda a moldura desta tela |
| `ctx.trocar(construir)` | troca o quadro por outro, com o movimento de 4.8 (para telas de vários passos, como as boas-vindas) |
| `ctx.navegar`, `ctx.voltar`, `ctx.voltarPara`, `ctx.abrirLimite` | os mesmos de `app.js` |

## 3. Rotas e navegação

As rotas de 2.3 já estão ligadas em `app.js` (lista `ROTAS`). Cada uma aponta para um arquivo de `js/telas/`.

| Rota | Arquivo |
|---|---|
| `#/boas-vindas/{1 a 4}` | `boas-vindas.js` |
| `#/hoje`, `#/hoje/tempo`, `#/hoje/passo` | `hoje.js`, `tempo.js`, `passo.js` |
| `#/pratica/{id}` e `#/praticas/{id}` | `pratica.js` (T08 a T12) |
| `#/trilha`, `#/trilha/{n}`, `#/trilha/caminho` | `trilha.js`, `dia-da-trilha.js`, `caminho.js` |
| `#/praticas` | `praticas.js` |
| `#/semana`, `#/semana/{AAAA-MM-DD}` | `semana.js` |
| `#/caderno`, `#/caderno/{lista}` | `caderno.js` |
| `#/descarregar`, `#/experimento` | `descarregar.js`, `experimento.js` |
| `#/ajustes`, `#/ajustes/dados`, `#/ajustes/instalar` | `ajustes.js`, `dados.js`, `instalar.js` |
| `#/sobre`, `#/aviso`, `#/demonstracao` | `sobre.js`, `aviso.js`, `demonstracao.js` |
| `#/limite`, `#/limite/{respirar, frase, desabafar}` | a camada de `limite.js`, por cima da tela de antes |

Antes de `boasVindasEm`, toda rota leva a `#/boas-vindas/1`, menos `#/limite`, `#/sobre` e `#/aviso`. Depois, `#/boas-vindas/*` leva a Hoje.

```js
import { navegar, voltar, voltarPara, abrirLimite } from "../app.js";
navegar("#/semana");                                  // cria uma entrada no histórico
navegar("#/hoje", { substituir: true });              // troca a entrada atual
navegar("#/hoje", { substituir: true, dados: { pousar: true } });  // Hoje faz a semente pousar (fim das boas-vindas)
voltar();                                             // o "‹": uma tela para trás (ou o pai)
voltarPara("#/trilha");                               // volta até a última Trilha do histórico (o "Concluir" do fecho)
```

Um `<a href="#/caderno">` comum também funciona (o app intercepta e chama `navegar`). Para o limite, sempre `abrirLimite()` ou um link `#/limite`: ele abre como camada, sem trocar de tela.

**Voltar do aparelho e Esc** (2.2): fecham primeiro a folha ou a camada de cima; sem nada aberto, o Esc faz o mesmo que o botão da esquerda da barra (nas telas internas). Para segurar o Voltar numa tela (como o tocador faz), use `empilharVolta` (seção 4).

## 4. Folha, aviso curto, camada e foco (`js/ui.js`)

```js
import { h, svg, abrirFolha, avisoCurto, abrirCamada, empilharVolta, botaoPrincipal, botaoSecundario, botaoLink,
         chave, seletor, porTom, textoRico, iconeEl } from "../ui.js";

const folha = abrirFolha({
  rotulo: "DIA 4 · COMPREENDER",          // opcional
  titulo: "O que me trava",               // o <h2>, recebe o foco
  conteudo(corpo, f) {
    corpo.append(h("p.texto", null, "Este dia abre amanhã. Se quiser, dá para fazer agora."),
      h("div.folha-botoes", null,
        botaoPrincipal("Fazer agora", () => { f.fechar(); navegar("#/trilha/4"); }),
        botaoSecundario("Esperar", () => f.fechar())));
  },
  aoFechar() {}
});
folha.fechar();          // também fecha tocando fora, arrastando para baixo, no "×", com Esc e com o Voltar
await folha.fechada;     // Promise

avisoCurto("Lista copiada.");             // 3 s, embaixo, role="status"

const camada = abrirCamada({ classe: "camada-limite", idTitulo: "t-limite", rotuloFechar: "Fechar",
  conteudo(corpo, c) { corpo.append(h("h1.titulo", { id: "t-limite" }, "Tudo bem parar aqui.")); },
  aoFechar() {} });       // tela inteira, fade de 200 ms, role="dialog", foco preso, foco no título

const tirar = empilharVolta((motivo) => { /* "voltar", "esc" ou "navegar" */ });
tirar();                  // quando a coisa fecha por outro caminho
```

Folhas e camadas já prendem o foco, deixam o resto da página `inert`, devolvem o foco a quem abriu e respondem ao Voltar e ao Esc. Não use `alert`, `confirm` nem `<dialog>` do navegador.

Componentes prontos: `chave({ rotulo, apoio, ligada, aoMudar })` (role="switch"), `seletor({ rotulo, opcoes: [{ valor, texto }], valor, aoMudar })` (radiogroup, setas do teclado), `botaoPrincipal`, `botaoSecundario`, `botaoLink`, `botaoIcone(nomeDoIcone, rotulo, aoTocar)`, `linkRota(texto, rota)`, `linkExterno(texto, url)` (aba nova, `noopener noreferrer`), `textoRico(texto)` (os `*itálicos*` de 7.8), `porTom(valor)` (escolhe `{ pratico, espiritual }` pelo tom), `juntar(lista)` ("a, b e c"), `plural(n, um, varios)`, `anunciar(texto)` (só para o leitor de tela), `menosMovimento()`, `trocar(alvo, construir)` e `montarSemente(el, { titulo })`.

**Texto com `{chaves}`:** use `preencher(modelo, valores)` de `conteudo/praticas.js` (não existe mais um em `ui.js`). Ele entende `{chave|minuscula}`, `{chave|inicial}` e caminhos com ponto (`{dia3.dimensao}`, `{fazBem.musica}`); `valores` é um objeto ou uma função `(chave) => valor`; lista vira "a, b e c"; se o valor já termina em ponto, o ponto do modelo não se repete. `chavesDe(modelo)` diz quais chaves um texto usa. Para o que o tocador mostra, isso já está feito.

Desenhos: importe de `../desenhos.js` e `../flor.js` e ponha no DOM com `svg(texto)`; ou use `desenhos.icone(...)`, `desenhos.florSVG(...)` de `ui.js`, que devolvem `""` se o módulo de desenhos falhar. `iconeEl(nome)` já devolve o elemento.

## 5. Estado e regras

```js
import { estado, alterar, aoMudar, emDemo } from "../estado.js";
estado.fazBem.coisas;                               // ler: sempre por "estado." (a ligação é viva)
alterar((e) => { e.cartoes.semanaVista = "2026-11-02"; });        // gravar (junta em 300 ms)
alterar((e) => { e.descargas.push(descarga); }, { agora: true }); // gravar na hora
```

- `estado.js`: `novoId("d")`, `estadoNovo()`, `gravarAgora()`, `aoMudar(fn)` (fn recebe "alterar", "troca", "outra-aba" ou "gravacao"), `copiaDosDados()`, `nomeDaCopia()`, `baixarCopia()`, `lerCopia(arquivo)`, `substituirPorCopia(dados)`, `apagarTudo()`, `espacoUsado()`, `pedirPersistencia()`, `podeGravar`, a demonstração (`ligarDemo`, `desligarDemo`, `demoAvancarUmDia`, `demoMostrarDescanso`, `demoLiberarTrilha`, `demoPreencherSemana`, `demoZerar`) e `emDemo`. Chaves de 7.1 em `CHAVE*`; `VERSAO` e `ESQUEMA`.
- `regras.js` (7.4 a 7.9, calculado na hora, nunca guardado): `flor(hoje)`, `diasDeCuidado()`, `cresceAgora(sessao)`, `legendaDaFlor()`, `trilha(hoje)`, `MATRIZ` e `passoDeAgora(estadoDoCheckin, tempo)`, `lembrarEscolha(celula, praticaId)`, `registrarCheckin(estadoDoCheckin)`, `escolherTempo(checkinId, tempo)`, `checkinRecente()`, `semana(segunda)`, `sessoesDoDia(dia)`, `contarMedicoes(sessoes)`, `sugestaoPorDimensao(dim, PRATICAS)`, `previaDaCopia(resultadoDeLerCopia)`, `registrarSessao(...)`, `atualizarSessao(id, mudancas)`, `gravarDiaDaTrilha(...)`, `refazerTrilha()`, `fizHoje()`, `cuidadoFeitoHoje()`.
- `dia.js`: `agora()`, `diaLogico()`, `difDias()`, `somarDias()`, `diaDe(data)`, `segundaDaSemana()`, `diasDaSemana(segunda)`, `isoLocal()`, `saudacao()`, `rotuloDoDia()` ("QUINTA-FEIRA, 5 DE NOVEMBRO"), `diaEMes()` ("5 de novembro"), `dataCompleta()`, `diaCurto()` ("5 nov"), `diaDaSemanaCurto()` ("seg, 3"), `nomeDoDiaDaSemana()`, `nomeDoMes()`, `intervalo(a, b)` ("3 a 9 de novembro"), `minutosDe(segundos)`. Use sempre `agora()`, nunca `new Date()`, para a demonstração andar junto.
- `app.js`, além da navegação: mudar `ajustes.tema`, `menosMovimento` ou `letraMaior` com `alterar` já reaplica a aparência no `<html>` (`aplicarAparencia()` existe, mas não precisa ser chamada); `redesenhar()` desenha de novo a tela atual (depois de trazer uma cópia ou ligar a demonstração); `pedidoDeInstalacao()`, `instalarApp()`, `estaInstalado()`, `eIphone()` (T26 e o cartão de Hoje); `versaoNovaPronta()` e `atualizarApp()`; `aoAbrirLimite(fn)` (quem precisa pausar quando o limite abre; devolve a função de parar de ouvir).

## 6. Começar uma prática e gravar uma sessão (7.4)

**Começar:** navegue para o fluxo da prática, que mostra a régua (se medir), o tocador, o registro e o fecho:

```js
navegar("#/pratica/P10?de=praticas");               // de: hoje | trilha | praticas | experimento | limite
navegar("#/pratica/T3?de=trilha&v=minima&medir=1"); // v=minima: versão mínima; medir=1 ou 0 decide a régua
navegar("#/praticas/P10");                          // T08, a abertura, vinda da lista de Práticas
```

Sem `de`, a abertura (T08) aparece antes (os links do fecho usam isso). Com `de`, ela é pulada. O "Concluir" do fecho volta à origem (`de`). Um dia da trilha sem `de` vai para `#/trilha/{n}` (T14). No Dia 1, sem `medir`, a pergunta "Quer medir a tensão antes e depois?" aparece antes do primeiro passo. A trilha (T14) manda `medir=1` ou `medir=0` quando já perguntou.

**Mudar sem contar como dia:** `#/pratica/T6?so=cuidado&de=hoje` refaz só os passos 3 a 5 do Dia 6 e troca o cuidado possível (o "Mudar" de Hoje); `#/pratica/T5?so=fazbem&de=...` refaz os passos 3 e 4 do Dia 5 e troca a lista do que faz bem, a música e a frase (para o caderno). Os dois abrem como tela de foco, com o que está guardado já marcado e escrito (um gesto escrito pela pessoa abre em "Outro", com o texto), e voltam para a origem sem registro nem fecho. Apagar um campo e tocar em "Seguir" esvazia o campo guardado; "Pular" deixa como estava.

**Gravar uma sessão** (telas com fluxo próprio: Descarregar, Experimento, Respirar comigo, o limite): chame `registrarSessao` no momento em que conta (antes do registro), e só quando conta:

```js
import { registrarSessao, atualizarSessao } from "../regras.js";
const r = registrarSessao({ praticaId: "DESC", origem: "praticas", versao: "completa",
  inicio: isoInicio, segundos: 95, respostas: {} , antes: null, depois: null });
// r = { sessao, cresceu, acordou, florAntes, florDepois }
```

Depois, para o registro leve e o fecho com a flor, use os do fluxo da prática:

```js
import { seguirParaRegistro, seguirParaFecho } from "./pratica.js";
seguirParaRegistro(ctx, { resultado: r, frase: "O que é para agora está separado.", destino: "#/hoje" });  // T11 e depois T12
seguirParaFecho(ctx, { resultado: r, destino: "#/praticas" });    // só T12 (Experimento, Respirar comigo)
// destino: para onde o "Concluir" volta; links: [{ texto, destino }] oferecidos no fecho (opcional)
```

O limite grava a própria sessão (`praticaId: "LIMITE"`, `origem: "limite"`) ao fechar, se ficou 60 s ou mais, e não mostra fecho.

## 7. As ferramentas de passo (`js/ferramentas/*.js`)

O tocador executa o passo `{ tipo: "ferramenta", nome }` importando `js/ferramentas/{nome}.js`:

```js
export function montar(el, ctx) {
  // el: a área do passo, vazia. ctx:
  //   ctx.passo          o passo do conteúdo ({ tipo: "ferramenta", nome, minima?, chave?, perguntasDe?, rotulos? })
  //   ctx.respostas      as respostas da prática até aqui (não mude; devolva as novas em concluir)
  //   ctx.tom            "pratico" | "espiritual"
  //   ctx.versao         "completa" | "minima"
  //   ctx.pratica        o objeto da prática ou do dia da trilha
  //   ctx.trilha         as respostas guardadas dos dias da trilha: { 1: {...}, 2: {...} }
  //   ctx.concluir(novas)  segue para o próximo passo, juntando "novas" às respostas
  //   ctx.voltar()       volta ao passo anterior
  //   ctx.pausado()      true enquanto o tocador está pausado
  //   ctx.mostrarRodape(sim)  mostra ou esconde o "Pausar" do tocador (padrão: escondido nas ferramentas)
  return { destruir() {} };
}
```

O tempo da ferramenta conta para a sessão (o relógio do tocador segue enquanto ela está aberta). Enquanto uma ferramenta for semente, ela mostra só "Próximo". A régua (`ferramentas/regua.js`) também exporta `criarRegua({ valor, fantasma, aoMudar })`, a mesma de T09, para o Experimento.

**O tocador e o conteúdo.** O tocador já trata todos os campos documentados no topo de `conteudo/praticas.js` e de `conteudo/trilha.js` (semSom, anel, seHouver, figura, proximoLiberado, deMarcadas, opcoesDe, valores, botoes, repete, preMarcar, vaiPara, marcar, linhas, cartao, cartoesDosDias, estimativa, duracaoReferencia, linksNoFecho com `se`, minimaMin). Uma ferramenta não precisa repetir isso: recebe o passo e as respostas e devolve as novas em `concluir`. Ao voltar a um passo de escolher ou de escrever (`ctx.voltar()`), o que a pessoa tinha respondido aparece marcado e escrito.

**O círculo de respiração (`js/respirar.js`)**, para o Respirar comigo, o Experimento e o que mais respirar fora do tocador:

```js
import { criarRespiracao } from "../respirar.js";
const r = criarRespiracao({ padrao: "simples", puxa: 4, solta: 6, ciclos: null, palavras: { puxa: "Inspire", solta: "Solte" } });
el.append(r.el);
r.tocar();            // relógio próprio; r.pausar(), r.continuar(), r.tempo() (ms respirados), r.destruir()
// ou, com relógio de fora: r.atualizar(ms)
```

Os três padrões leem `puxa`, `mais` e `solta` de quem chama: "simples", "duplo" (com "Mais um pouco") e "aperta" (P05: o anel se fecha em `puxa` s, "Aperte", e abre em `solta` s, "Solte"; no conteúdo, 5 s e 22 s, duas vezes). Com menos movimento, o anel não muda de tamanho: só a opacidade acompanha o ritmo, e as palavras continuam.

## 8. O Estou no limite

`js/telas/limite.js` exporta `abrirLimite(opcoes)` e `fecharLimite()`. Só `app.js` chama esses dois: as telas chamam `abrirLimite()` de `app.js`, que antes avisa o tocador (ele pausa e mostra o véu) e, se `limite.js` falhar, abre uma camada de reserva com os telefones. `opcoes.sub` traz `"respirar"`, `"frase"` ou `"desabafar"` quando a rota foi `#/limite/...`. A camada usa `abrirCamada({ classe: "camada-limite", ... })`; o cartão do CVV usa a classe `cartao-cvv` (com `cartao-cvv-texto`, `cartao-cvv-links`, `cartao-cvv-samu`) e fica fora da área que rola (`limite-rola`), preso ao pé.

O Respirar comigo também existe fora do limite, em Práticas: a rota é `#/praticas?respirar=1` (com `&de=semana`, o "Concluir" volta à Semana). Para usar a mesma vista do limite em outra tela, `limite.js` exporta `criarRespirarComigo({ idTitulo, aoJaEstaBom })`, que devolve `{ el, tempo, pausar, continuar, parar, destruir }` e não grava sessão. (Nota do LOOMB, 05/11/2026, com o que os construtores da fase B deixaram.)

## 9. Classes CSS da fundação (`css/app.css`)

- Tipografia (4.2): `rotulo`, `rotulo-aba`, `apoio`, `texto`, `lede`, `saudacao`, `titulo-barra`, `titulo-cartao`, `titulo-folha`, `abertura`, `lede-display`, `titulo`, `passo`, `frase`, `display`, `numero`, `nome-grande`, `nome`.
- Botões: `botao-principal` (52 px, até 22,5 rem; `largura-cheia` tira o limite), `botao-secundario` (48 px), `link` (cobre, sublinhado, 44 px de alvo; `link-texto` dentro de frase), `icone-botao` (44 px), `pilula-limite`.
- Cartões: `cartao` (papel, fio, raio 18 px), `cartao-escolha` (o cartão inteiro é o alvo; `marcado`, `aria-checked="true"` ou `aria-pressed="true"` marcam; `sem-ponto` tira o ponto), com `cartao-escolha-icone`, `cartao-escolha-texto`, `cartao-escolha-nome`, `cartao-escolha-desc`; `bloco-papel` (o bloco do "Por que funciona"; na página do caderno, que já é papel, ele troca sozinho para o creme do fundo); `linha-opcao` (a linha de 4 rem do limite, com `linha-opcao-nome` e `linha-opcao-desc`).
- Campos: `campo`, `campo-grande` (com pauta), `rotulo-campo`, `contador`; `pastilha` e `pastilhas` (marcada com `aria-pressed` ou `aria-checked`, com `pastilha-check`); `caixa-marcar` (label com input checkbox); `linha-chave` e `chave`; `seletor` e `seletor-opcao`.
- Abrir e fechar: `abre-fecha` + `aberto` (de 0fr a 1fr em 320 ms).
- Folha: `folha-botoes` (botões empilhados em largura cheia).
- Layout: `coluna`, `pilha`, `centro`, `secao`, `visivel-leitor`, `so-celular`, `so-computador`.
- Movimento: nada se mexe com `html.menos-movimento` além de opacidade em 200 ms. Use os tokens `--ease-padrao`, `--d-toque`, `--d-estado`, `--d-abrir`, `--d-tela`, `--d-traco`.
- Cores só pelos tokens de 4.1 (`--fundo`, `--papel`, `--painel`, `--tinta`, `--suave`, `--mudo`, `--cobre`, `--cobre-forte`, `--linha`, `--linha-forte`, `--cobre-claro`, `--kraft`, `--sobre-cobre`, `--berinjela`), nunca hex, para o tema Noite funcionar.

Os estilos de cada tela vão no CSS do dono (`trilha.css`, `foco.css`, `casa.css`), com prefixo de classe da tela (por exemplo `.trilha-no`, `.limite-opcao`, `.caderno-lista`).

## 10. Testar

`_teste-comum/servidor.py` serve a pasta SO; o app abre em `http://127.0.0.1:{porta}/app/`. Nos testes comuns, crie o contexto do Playwright com `service_workers="block"`. Para entrar direto em Hoje, grave antes no `localStorage["sintonia-interior"]` um estado com `boasVindasEm` preenchido (o formato está em 7.3 e em `estadoNovo()` de `estado.js`). Os ajudantes de `_teste-fundacao/base.py` (`estado_pronto(**mudancas)`, `semear(contexto, estado)`, `Registro(pagina).problemas()`, `capturar`) podem ser copiados para a sua pasta de testes.

- **Relógio do Playwright:** depois de `page.clock.install(time=...)`, o tempo continua andando sozinho (as esperas reais também contam). Para medir um instante exato (o anel da respiração, por exemplo), pare o relógio com `page.clock.pause_at(...)` e ande com `fast_forward(ms)`. As transições de CSS andam no tempo real: espere uns 300 ms antes de capturar.
- **Política de segurança:** ponha antes um ouvinte de `securitypolicyviolation` (`add_init_script`) e confira a lista no fim; `t04_regras.py` e `t08_conferencias.py` fazem isso.

## 11. Armadilhas (achadas na construção)

- **`append(null)` escreve "null" na tela.** O `append`, o `prepend` e o `replaceChildren` do DOM transformam `null` em texto. Monte com `h()` (ele descarta `null`, `false` e `""`) ou filtre a lista antes: `el.append(...[a, cond ? b : null].filter(Boolean))`.
- **Desfoque (`backdrop-filter`) dentro da tela não funciona no Chrome:** `#tela` tem `view-transition-name` e isso desliga o desfoque dos filhos. Para um véu por cima de um conteúdo, esconda o conteúdo de baixo (o véu de pausa do tocador faz assim, com a classe `pausado`).
- **Nenhuma animação que segure o fim (`both` ou `forwards`) no `.app` ou em quem contém a barra e as abas:** ela desliga o desfoque das duas. Para animação de entrada num elemento que fica na tela, use `backwards`.
- **A saída fica sempre à vista:** no computador, a pílula do limite mora no pé da página esquerda, fora da parte que rola (`pe-rola` rola, `pe-pe` não), e a flor diminui em janelas baixas. Não ponha nada que empurre a pílula para fora da tela.
- **Na página do caderno (computador), o fundo já é `--papel`:** um bloco sem borda com fundo `--papel` some. Use `cartao` (tem fio) ou `bloco-papel` (que troca sozinho de cor no caderno).
- **Passo grande:** `.passo` tem no máximo três linhas (4.2); o tocador escolhe o tamanho pelo número de letras (`passo-medio`, `passo-longo`) e desce um degrau em telas de 320 px.
