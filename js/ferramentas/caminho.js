// A ferramenta de passo "caminho": Olhar o caminho (T15) dentro do Dia 7, antes do fecho.
// Contrato das ferramentas (js/LEIA.md): montar(el, ctx) devolve { destruir() }.
// O desenho e os botões moram em js/telas/caminho.js (a mesma T15 da rota #/trilha/caminho).
// O Dia 7 ainda não está gravado quando este passo aparece: a palavra dele vem das respostas do
// próprio dia (a chave "palavra", do passo anterior), e o fim do intervalo de datas é hoje.
// "Seguir" segue para o próximo passo (e, no fim, para o fecho do Dia 7).

import { estado } from "../estado.js";
import { diaLogico } from "../dia.js";
import { montarCaminho, palavrasDaTrilha, intervaloDaTrilha } from "../telas/caminho.js";

export function montar(el, ctx) {
  const dias = estado.trilha.dias;
  const chave = ctx.pratica?.palavra ?? "palavra";
  const dia7 = ctx.respostas?.[chave] ?? null;
  const hoje = diaLogico();
  const datas = intervaloDaTrilha({ dias: Object.fromEntries(Object.entries(dias).filter(([n]) => n !== "7")), fim: hoje });
  const api = montarCaminho(el, {
    palavras: palavrasDaTrilha({ dias, dia7 }),
    inicio: datas.inicio,
    fim: datas.fim,
    aoSeguir: () => ctx.concluir({}),
    focar: true
  });
  return { destruir() { api.destruir(); } };
}
