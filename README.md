# Sintonia Interior

Autocuidado possível, no seu ritmo. Um app de práticas curtas de autocuidado que roda no navegador: pergunta como você chega e quanto tempo tem, e sugere um passo do tamanho do seu dia.

Esta é a versão 0.1, um protótipo. Para usar, abra https://jeandsprestes.github.io/sintonia-interior/ no celular ou no computador; no celular, dá para adicionar à tela de início.

## Como abrir no computador

O app é feito só de HTML, CSS e JavaScript, sem etapa de montagem. Basta servir a pasta com qualquer servidor estático. Por exemplo, com Python, na pasta deste repositório:

```
python -m http.server 8000
```

e abrir `http://localhost:8000/` no navegador. Abrir o `index.html` direto do disco não funciona, porque os módulos de JavaScript pedem um servidor.

## Seus dados

Tudo o que você registra fica guardado só no navegador, neste aparelho. Não há conta, servidor, anúncios ou análise de uso, e a própria página bloqueia conexões para fora. Em Ajustes, Seus dados, dá para guardar uma cópia num arquivo, trazer uma cópia de volta ou apagar tudo.

Depois da primeira visita, o app funciona sem internet.

## Aviso

O Sintonia Interior é um apoio para o dia a dia. Ele não é terapia e não substitui acompanhamento psicológico, consulta médica nem atendimento de emergência.

Se estiver em sofrimento intenso, fale com alguém agora: o CVV (Centro de Valorização da Vida) atende de graça, 24 horas, pelo telefone 188 e pelo site cvv.org.br. Em risco imediato à vida, ligue 192 (SAMU).

## Licenças

As fontes Fraunces, Mulish e Josefin Sans estão em `fonts/`, sob a licença SIL Open Font License 1.1 (arquivos `OFL-*.txt`).
