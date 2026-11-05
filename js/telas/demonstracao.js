// T27 · Para testar o protótipo (o modo de demonstração, 6.13 e 7.11). Acesso escondido: cinco toques na linha
// da versão, no pé de Ajustes, ou o endereço #/demonstracao. Ligado, lê e grava só em sintonia-interior:demo
// (a partir de uma cópia do estado real); desligar apaga a chave da demonstração e volta ao estado real
// intacto. Tudo isso mora em estado.js; esta tela só oferece a chave e os botões.

import { h, chave, botaoSecundario } from "../ui.js";
import {
  emDemo, ligarDemo, desligarDemo, demoAvancarUmDia, demoMostrarDescanso, demoLiberarTrilha, demoPreencherSemana, demoZerar
} from "../estado.js";
import { diaLogico, nomeDoDiaDaSemana, diaEMes } from "../dia.js";
import { DEMONSTRACAO } from "../conteudo/textos.js";

export const moldura = { aba: "semana", navegacao: "ajustes", barra: "interna", esquerda: "voltar", limite: "icone", pai: "#/ajustes" };

export function montar(el) {
  const t = DEMONSTRACAO;
  const hoje = diaLogico();
  const interruptor = chave({
    rotulo: t.chave,
    ligada: emDemo,
    // Ligar e desligar trocam o estado inteiro; o app desenha a tela de novo sozinho (motivo "troca").
    aoMudar: (v) => (v ? ligarDemo() : desligarDemo())
  });
  const botoes = [
    [t.botoes.avancar, demoAvancarUmDia],
    [t.botoes.descansar, demoMostrarDescanso],
    [t.botoes.liberar, demoLiberarTrilha],
    [t.botoes.preencher, demoPreencherSemana],
    [t.botoes.zerar, demoZerar]
  ];
  el.append(h("div.coluna.demo-tela",
    h("h1.titulo.demo-titulo", null, t.titulo),
    h("p.texto.demo-texto", null, t.texto),
    h("div.demo-chave", null, interruptor),
    emDemo ? h("div.demo-controles", null,
      h("p.demo-relogio", { role: "status" }, t.relogio(`${nomeDoDiaDaSemana(hoje)}, ${diaEMes(hoje)}`)),
      h("div.demo-botoes", null, ...botoes.map(([texto, fazer]) => botaoSecundario(texto, () => fazer())))) : null
  ));
  return {};
}
