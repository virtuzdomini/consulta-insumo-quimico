# # Consulta de Insumo Químico

_Started 2026-07-04 16:57 UTC_

---

## User

Crie a identidade visual e a tela principal de uma ferramenta web chamada "Consulta de Insumo Químico", usada num laboratório de indústria de tintas. O usuário digita o nome de uma substância e recebe um cartão com: fórmula molecular, massa molar, imagem 2D da estrutura, propriedades (logP, TPSA, doadores/aceptores de hidrogênio) e sinônimos.
Estilo: limpo, técnico e confiável, com cara de instrumento de laboratório (nada infantil). Base escura grafite com um acento em verde-petróleo/ciano científico, tipografia sans-serif legível, bastante respiro. Barra de busca central em destaque; resultado num cartão dividido em seções.
Me mostre o estado vazio (antes da busca) e o estado com resultado, usando ácido acetilsalicílico (aspirina) como exemplo. Gere 2 direções visuais diferentes pra eu escolher.

## Assistant

This is well-specified — dark graphite lab instrument, teal/cyan accent, two directions, empty + result states with aspirin. I'll build it as a single canvas-mode Design Component with both directions side by side. No clarifying questions needed given the detailed art direction.

_[tool: dc_write]_

_[tool: ready_for_verification]_

Pronto — duas direções lado a lado, cada uma com estado vazio e resultado (aspirina):

**1a — Console de instrumento:** grafite profundo, acento verde-petróleo, dados em monoespaçada, estrutura à esquerda e propriedades em grade 2×2. Cara mais de terminal/leitura de instrumento.

**1b — Painel laboratorial:** grafite elevado com painéis mais arejados, acento ciano, busca em pílula com botão sólido, estrutura em coluna dedicada e propriedades numa fileira de 4. Tom mais amigável mantendo o rigor técnico.

A imagem 2D está como placeholder (frame tracejado + símbolo de anel) pronto para receber a renderização real do RDKit. Me diga qual direção seguir (ou uma mistura) que eu refino a escolhida.

