// O service worker do Sintonia Interior (Anexo A): guarda os arquivos do app para funcionar sem internet.
// Cache com nome versionado; na instalação, guarda todos os arquivos da lista (um arquivo que falte não
// impede a instalação); nas requisições GET da própria origem, responde do cache e cai para a rede;
// a navegação devolve o index.html do cache; na ativação, apaga os caches de versões antigas.
// A versão nova fica esperando: a página mostra a barra de versão nova em Hoje, e "Atualizar" manda
// a mensagem "pular-espera".
//
// ARQUIVO NOVO NO APP: acrescente o caminho dele em ARQUIVOS, abaixo (e troque a VERSAO ao publicar).

const VERSAO = "sintonia-v0.1.0";

const ARQUIVOS = [
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "css/desenhos.css",
  "css/trilha.css",
  "css/foco.css",
  "css/casa.css",
  "fonts/fontes.css",
  "fonts/Fraunces-normal.woff2",
  "fonts/Fraunces-italic.woff2",
  "fonts/Mulish-normal.woff2",
  "fonts/Mulish-italic.woff2",
  "fonts/JosefinSans-normal.woff2",
  "fonts/OFL-fraunces.txt",
  "fonts/OFL-mulish.txt",
  "fonts/OFL-josefinsans.txt",
  "img/logo-plano.jpg",
  "icons/icone.svg",
  "icons/icone-180.png",
  "icons/icone-192.png",
  "icons/icone-512.png",
  "icons/icone-512-maskable.png",
  "js/app.js",
  "js/ui.js",
  "js/estado.js",
  "js/dia.js",
  "js/regras.js",
  "js/som.js",
  "js/tocador.js",
  "js/respirar.js",
  "js/flor.js",
  "js/desenhos.js",
  "js/voz.js",
  "js/imagem.js",
  "js/casa.js",
  "js/foco.js",
  "js/conteudo/praticas.js",
  "js/conteudo/trilha.js",
  "js/conteudo/frases.js",
  "js/conteudo/textos.js",
  "js/ferramentas/regua.js",
  "js/ferramentas/mapa.js",
  "js/ferramentas/caminho.js",
  "js/ferramentas/descarregar.js",
  "js/telas/hoje.js",
  "js/telas/tempo.js",
  "js/telas/passo.js",
  "js/telas/pratica.js",
  "js/telas/boas-vindas.js",
  "js/telas/trilha.js",
  "js/telas/dia-da-trilha.js",
  "js/telas/caminho.js",
  "js/telas/praticas.js",
  "js/telas/semana.js",
  "js/telas/caderno.js",
  "js/telas/limite.js",
  "js/telas/descarregar.js",
  "js/telas/experimento.js",
  "js/telas/ajustes.js",
  "js/telas/dados.js",
  "js/telas/sobre.js",
  "js/telas/aviso.js",
  "js/telas/instalar.js",
  "js/telas/demonstracao.js"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    await Promise.all(ARQUIVOS.map(async (arquivo) => {
      try {
        const resposta = await fetch(new Request(arquivo, { cache: "reload" }));
        if (resposta.ok) await cache.put(arquivo, resposta);
      } catch {
        // Sem esse arquivo agora; os outros continuam guardados.
      }
    }));
  })());
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((n) => n.startsWith("sintonia-") && n !== VERSAO).map((n) => caches.delete(n)));
  })());
});

self.addEventListener("message", (evento) => {
  if (evento.data && evento.data.tipo === "pular-espera") self.skipWaiting();
});

const raiz = new URL("./", self.location.href).pathname;

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return;

  const ehPaginaDoApp = pedido.mode === "navigate" && (url.pathname === raiz || url.pathname === `${raiz}index.html`);
  evento.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    const doCache = ehPaginaDoApp
      ? await cache.match("index.html")
      : await cache.match(pedido, { ignoreSearch: true });
    if (doCache) return doCache;
    try {
      return await fetch(pedido);
    } catch {
      if (pedido.mode === "navigate") {
        const pagina = await cache.match("index.html");
        if (pagina) return pagina;
      }
      return Response.error();
    }
  })());
});
