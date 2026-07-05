# Consulta de Insumo Químico

Ferramenta web para laboratório de indústria de tintas. O usuário digita o nome
de uma substância e recebe uma ficha técnica com **fórmula molecular**, **massa
molar**, **estrutura 2D**, **propriedades físico-químicas** (logP, TPSA, doadores
e aceptores de hidrogênio) e **sinônimos**.

![demo](docs/demo.gif)

Implementa a direção visual **1b — Painel laboratorial** do bundle do Claude
Design: base grafite escura, acento em ciano científico, tipografia Manrope +
IBM Plex Mono, bastante respiro.

Os dados vêm da **PubChem PUG-REST**, consultada **no servidor** (num endpoint
SvelteKit), nunca direto do navegador.

## Funcionalidades

- **Busca** de substâncias por nome (pt-BR/inglês) com **autocomplete** (dropdown
  de sugestões, _debounce_ de 300 ms).
- **Ficha técnica** com fórmula (subscritos), massa molar, CAS, nome IUPAC,
  estrutura 2D (ampliar/baixar), 4 propriedades físico-químicas e sinônimos curados.
- **Link "Ver no PubChem"** e página **Sobre** (fonte dos dados e limitações).
- **Estado na URL** (`?q=`): deep-link, reload e Voltar/Avançar do navegador.
- **Atalhos de teclado**: `/` foca a busca, `Esc` limpa/volta ao início.
- **Dark/light mode** com preferência persistida e respeito ao `prefers-color-scheme`.
- **Cache local** (localStorage, 24 h) e **rate-limit** de 5 req/s no servidor.
- **Acessibilidade** como norte (WCAG 2.1 AA): foco visível, navegação por teclado,
  `aria-label` em botões de ícone e `alt` descritivo na estrutura.

---

## Stack

- **SvelteKit** + **Svelte 5** (com _runes_: `$state`, `$derived`, `$props`, `$bindable`)
- **TypeScript**
- **adapter-netlify** (o endpoint vira uma Netlify Function)
- Sem dependências de UI — só CSS puro com _design tokens_ em variáveis CSS

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
```

Outros comandos:

```bash
npm run build    # build de produção (gera a pasta build/ para a Netlify)
npm run preview  # pré-visualiza o build de produção
npm run check    # type-check (svelte-check)
```

> **Rede:** a consulta real precisa de acesso de saída a
> `pubchem.ncbi.nlm.nih.gov`. Em ambientes com allowlist de rede (ex.: certas
> configurações do Claude Code na web) o host pode estar bloqueado
> (`host_not_allowed`) — nesse caso a UI mostra o estado de erro, mas o código
> está correto e funciona em `npm run dev` local e no deploy.

## Estrutura de pastas

```
src/
├── app.html                    # shell HTML; carrega as fontes (Manrope, IBM Plex Mono)
├── app.css                     # reset + design tokens (cores/fontes/raios em :root)
├── app.d.ts                    # tipos globais do SvelteKit
│
├── lib/
│   ├── types.ts                # tipos compartilhados (ResultadoConsulta, EstadoBusca…)
│   ├── pubchem.ts              # camada server-side: consulta a PUG-REST + rate limit 5 req/s + autocomplete
│   ├── cache.ts                # cache de consultas no localStorage (TTL 24 h)
│   ├── debounce.ts             # utilitário de debounce (usado no autocomplete)
│   └── components/
│       ├── Cabecalho.svelte           # barra de topo (logo + busca/indicador + tema)
│       ├── AlternarTema.svelte        # toggle dark/light (persiste no localStorage)
│       ├── SugestoesBusca.svelte      # dropdown de autocomplete (compartilhado pelas barras)
│       ├── Logotipo.svelte            # marca "Ci" + nome + linha de contexto
│       ├── IndicadorBase.svelte       # "base online" (estado vazio)
│       ├── IconeBusca.svelte          # ícone de lupa reutilizável
│       ├── BarraBusca.svelte          # busca grande em pílula (estado vazio)
│       ├── BarraBuscaCompacta.svelte  # busca no cabeçalho (demais estados)
│       ├── ChipExemplo.svelte         # chip clicável de "Recentes"
│       ├── EstadoVazio.svelte         # herói + busca + recentes
│       ├── EstadoCarregando.svelte    # skeleton animado enquanto consulta
│       ├── EstadoErro.svelte          # não encontrado / falha de rede
│       ├── CartaoResultado.svelte     # orquestra o cartão (grid estrutura + info)
│       ├── VisorEstrutura.svelte      # imagem 2D (PNG do PubChem) + Ampliar/Baixar
│       ├── CabecalhoResultado.svelte  # nome + fórmula · massa · CAS + selo
│       ├── SeloIdentificado.svelte    # selo "Identificado"
│       ├── RotuloSecao.svelte         # rótulo mono em caixa alta (reutilizável)
│       ├── GradePropriedades.svelte   # grade 4-colunas de propriedades
│       ├── CartaoPropriedade.svelte   # célula individual de propriedade
│       ├── ListaSinonimos.svelte      # chips de sinônimos
│       └── ChipSinonimo.svelte        # chip individual de sinônimo
│
└── routes/
    ├── +layout.svelte              # importa o CSS global; centraliza o painel
    ├── +page.svelte                # TELA PRINCIPAL: runes + estado na URL (?q=) + orquestração
    ├── sobre/+page.svelte          # página "Sobre" (fonte dos dados e limitações)
    ├── api/consulta/+server.ts     # endpoint GET /api/consulta?nome=…
    └── api/autocomplete/+server.ts # endpoint GET /api/autocomplete?termo=… (sugestões)
```

## Como a consulta funciona

Uma busca encadeia 3 chamadas à PUG-REST, todas em `src/lib/pubchem.ts`:

1. **nome → CID** — `…/compound/name/{nome}/cids/JSON` resolve o identificador.
2. **CID → propriedades** —
   `…/compound/cid/{cid}/property/MolecularFormula,MolecularWeight,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,IUPACName/JSON`.
3. **CID → sinônimos** — `…/compound/cid/{cid}/synonyms/JSON` (de onde também
   extraímos o número CAS).

A **imagem 2D** é só uma URL (`…/compound/cid/{cid}/PNG`) usada num `<img>` — por
ser imagem, não sofre bloqueio de CORS.

**Rate limit:** a PubChem pede no máximo ~5 req/s. O módulo aplica um limitador
por _espaçamento_ (1 requisição a cada 200 ms), global a todas as buscas.

**Por que no servidor?** A PUG-REST não envia cabeçalhos CORS, então não dá para
chamá-la direto do navegador. O endpoint `+server.ts` faz a ponte e devolve um
JSON limpo (`ResultadoConsulta`) — ou um erro tipado (`404` não encontrado /
`502` falha upstream).

## Estados da tela (`+page.svelte`)

O estado da busca é modelado com _runes_ e alterna entre quatro telas:

| Estado       | O que aparece                                              |
| ------------ | ---------------------------------------------------------- |
| `vazio`      | Herói "O que você quer consultar hoje?" + busca + recentes |
| `carregando` | Skeleton do cartão + spinner                               |
| `resultado`  | Cartão completo com estrutura, propriedades e sinônimos    |
| `erro`       | "Nada encontrado" (404) ou "falha de rede" com _retry_     |

Um contador de busca descarta respostas atrasadas (se o usuário busca de novo
antes da anterior responder).

## Decisões de arquitetura

- **Rate-limit de 5 req/s** — a PUG-REST pede no máximo ~5 requisições por segundo.
  `pubchem.ts` centraliza um limitador por espaçamento (200 ms entre chamadas),
  válido para todas as buscas (inclusive autocomplete).
- **Cache de 24 h no `localStorage`** — repetir a mesma busca no mesmo dia entrega
  o resultado na hora, sem tocar a rede. Best-effort: degrada em silêncio se o
  `localStorage` estiver indisponível.
- **Guarda contra corrida** — um contador de busca (`idBuscaAtual`) descarta
  respostas atrasadas quando o usuário busca de novo antes da anterior responder.
- **Formatação pt-BR** — números com vírgula decimal e fórmula com subscritos
  Unicode (`C₉H₈O₄`) feitos no servidor, junto da extração de CAS e da curadoria
  de sinônimos.
- **Estado na URL (`?q=`)** — a URL é a fonte da verdade: submeter uma busca só
  escreve `?q=termo` e um `$effect` reage disparando a consulta. Deep-link, reload
  e histórico do navegador funcionam pelo mesmo caminho.
- **Tema sem "flash"** — um script inline no `app.html` aplica o tema (do
  `localStorage` ou do `prefers-color-scheme`) antes da 1ª pintura; o resto é só
  override de _custom properties_ de cor, sem duplicar CSS de componente.

## Deploy (Netlify)

O `netlify.toml` já define `command = "npm run build"` e `publish = "build"`. Com
o `adapter-netlify`, o `+server.ts` é publicado como Netlify Function
automaticamente. Basta conectar o repositório na Netlify.

## Origem do design

Este projeto foi gerado a partir de um _handoff bundle_ do
[Claude Design](https://claude.ai/design). Os arquivos originais do protótipo
(HTML/CSS) e o transcript da conversa ficam preservados em `project/` e `chats/`
para referência.
