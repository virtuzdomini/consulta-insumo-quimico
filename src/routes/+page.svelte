<script lang="ts">
    // ================================================================
    //  Tela principal — Consulta de Insumo Químico (Pente Fino)
    //  Aqui mora TODO o estado reativo da busca (runes do Svelte 5).
    // ================================================================
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import Cabecalho from '$lib/components/Cabecalho.svelte';
    import EstadoVazio from '$lib/components/EstadoVazio.svelte';
    import EstadoCarregando from '$lib/components/EstadoCarregando.svelte';
    import EstadoErro from '$lib/components/EstadoErro.svelte';
    import CartaoResultado from '$lib/components/CartaoResultado.svelte';
    import { lerCache, gravarCache } from '$lib/cache';
    import { debounce } from '$lib/debounce';
    import type { EstadoBusca, ResultadoConsulta, ErroConsulta } from '$lib/types';

    // ---- Estado reativo (runes) -----------------------------------
    let termo = $state(''); // o que está no campo de busca
    let termoConsultado = $state(''); // o termo realmente enviado à API
    let estado = $state<EstadoBusca>('vazio'); // vazio | carregando | resultado | erro
    let resultado = $state<ResultadoConsulta | null>(null);
    let erro = $state<ErroConsulta | null>(null);
    let sugestoes = $state<string[]>([]); // autocomplete

    let mostrarBuscaNoCabecalho = $derived(estado !== 'vazio');
    let idBuscaAtual = 0;

    // ---- Sincronização com a URL (?q=) ----------------------------
    // A URL é a fonte da verdade: submeter uma busca só ESCREVE `?q=termo`
    // (via `buscar`), e este $effect reage à mudança da URL disparando a
    // consulta. Assim deep-link, reload e Voltar/Avançar do navegador
    // funcionam pelo mesmo caminho, sem lógica duplicada.
    $effect(() => {
        const q = page.url.searchParams.get('q')?.trim() ?? '';

        if (!q) {
            // Home / estado inicial. Não mexemos em `termo` para não atrapalhar
            // quem está digitando; zeramos `termoConsultado` para permitir
            // rebuscar o mesmo termo depois de um reset.
            termoConsultado = '';
            resultado = null;
            erro = null;
            estado = 'vazio';
            return;
        }

        if (q === termoConsultado) return; // já estamos nesse termo
        termo = q; // reflete o termo do deep-link no campo
        executarConsulta(q);
    });

    // ---- Submeter uma busca: apenas reflete o termo na URL ----------
    // `keepFocus` evita o input perder o foco a cada tecla durante o
    // autocomplete; `noScroll` mantém a posição de rolagem.
    function buscar() {
        const nome = termo.trim();
        if (!nome) return;
        sugestoes = [];
        // PUSH (replaceState: false) para cada busca confirmada, para que
        // Voltar/Avançar do navegador percorra o histórico de buscas.
        // `keepFocus` evita o input perder o foco; `noScroll` mantém a rolagem.
        goto(`/?q=${encodeURIComponent(nome)}`, {
            replaceState: false,
            keepFocus: true,
            noScroll: true
        });
    }

    // ---- Consulta de fato via /api/consulta ------------------------
    // Todo o trabalho pesado (resolver nome→CID, formatar fórmula em subscrito,
    // extrair CAS, curar sinônimos, respeitar o rate-limit) vive no servidor,
    // em $lib/pubchem.ts. Aqui só cuidamos de estado de tela e cache.
    async function executarConsulta(nome: string) {
        const meuId = ++idBuscaAtual;
        termoConsultado = nome;
        sugestoes = [];
        erro = null;

        // 1. Cache: se já buscamos isso nas últimas 24h, entrega na hora.
        const emCache = lerCache(nome);
        if (emCache) {
            resultado = emCache;
            estado = 'resultado';
            return;
        }

        estado = 'carregando';
        resultado = null;

        try {
            const resposta = await fetch(`/api/consulta?nome=${encodeURIComponent(nome)}`);
            if (meuId !== idBuscaAtual) return; // uma busca mais nova já assumiu

            if (!resposta.ok) {
                // O endpoint devolve { message } via error() do SvelteKit.
                const corpo = await resposta.json().catch(() => null);
                const mensagem = corpo?.message ?? 'Não foi possível concluir a consulta.';
                erro = {
                    tipo: resposta.status === 404 ? 'nao_encontrado' : 'falha',
                    mensagem
                };
                estado = 'erro';
                return;
            }

            const dados = (await resposta.json()) as ResultadoConsulta;
            if (meuId !== idBuscaAtual) return;

            resultado = dados;
            estado = 'resultado';
            gravarCache(nome, dados);
        } catch (e) {
            if (meuId !== idBuscaAtual) return;
            erro = { tipo: 'falha', mensagem: 'Sem conexão com o servidor. Verifique a rede.' };
            estado = 'erro';
        }
    }

    // Refaz a última consulta (botão "Tentar novamente" nos erros de rede).
    // Vai direto ao fetch — a URL já está em `?q=termoConsultado`.
    function tentarNovamente() {
        if (termoConsultado) executarConsulta(termoConsultado);
    }

    // ---- Reset ao estado inicial (logo e botão "Nova busca") --------
    function resetar() {
        termo = '';
        sugestoes = [];
        // Volta para "/"; o $effect vê `q` vazio e restaura o estado inicial.
        goto('/', { keepFocus: true, noScroll: true });
    }

    // ---- Atalhos de teclado ---------------------------------------
    function focarBusca() {
        const el = document.querySelector<HTMLInputElement>('[data-campo-busca]');
        el?.focus();
        el?.select();
    }

    function aoTeclar(evento: KeyboardEvent) {
        const alvo = evento.target as HTMLElement | null;
        const digitando =
            !!alvo &&
            (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);

        // "/" foca a busca — mas não quando o usuário já está digitando algo.
        if (evento.key === '/' && !digitando) {
            evento.preventDefault();
            focarBusca();
            return;
        }

        // Esc funciona mesmo dentro do input: fecha sugestões ou volta ao início.
        if (evento.key === 'Escape') {
            if (sugestoes.length > 0) {
                sugestoes = [];
                return;
            }
            resetar();
        }
    }

    // ---- Autocomplete ---------------------------------------------
    // Debounce de 300 ms: só consulta as sugestões quando o usuário para de
    // digitar, evitando uma requisição por tecla.
    const buscarSugestoes = debounce(async (texto: string) => {
        const t = texto.trim();
        if (t.length < 2) {
            sugestoes = [];
            return;
        }
        try {
            const resp = await fetch(`/api/autocomplete?termo=${encodeURIComponent(t)}`);
            sugestoes = resp.ok ? await resp.json() : [];
        } catch {
            sugestoes = []; // autocomplete é opcional; falha em silêncio
        }
    }, 300);

    function aoDigitar(texto: string) {
        buscarSugestoes(texto);
    }

    function escolherSugestao(sugestao: string) {
        termo = sugestao;
        buscar();
    }

    // Fecha o dropdown ao sair do campo (pequeno atraso deixa o clique numa
    // sugestão registrar antes de a lista sumir).
    function fecharSugestoes() {
        setTimeout(() => (sugestoes = []), 120);
    }

    function escolherExemplo(exemplo: string) {
        termo = exemplo;
        buscar();
    }
</script>

<svelte:head>
    <title>Consulta de Insumo Químico</title>
    <meta
        name="description"
        content="Consulte a ficha técnica de insumos químicos: fórmula, massa molar, estrutura 2D e propriedades físico-químicas."
    />
</svelte:head>

<!-- Atalhos globais: "/" foca a busca, Esc limpa/volta ao início. -->
<svelte:window onkeydown={aoTeclar} />

<main class="moldura">
    <Cabecalho
        mostrarBusca={mostrarBuscaNoCabecalho}
        bind:valor={termo}
        aoBuscar={buscar}
        aoDigitar={aoDigitar}
        {sugestoes}
        aoSelecionar={escolherSugestao}
        aoFechar={fecharSugestoes}
        aoResetar={resetar}
    />

    <div class="corpo">
        {#if estado === 'vazio'}
            <EstadoVazio
                bind:valor={termo}
                aoBuscar={buscar}
                aoEscolherExemplo={escolherExemplo}
                aoDigitar={aoDigitar}
                {sugestoes}
                aoSelecionar={escolherSugestao}
                aoFechar={fecharSugestoes}
            />
        {:else if estado === 'carregando'}
            <EstadoCarregando termo={termoConsultado} />
        {:else if estado === 'resultado' && resultado}
            <CartaoResultado {resultado} />
        {:else if estado === 'erro' && erro}
            <EstadoErro {erro} termo={termoConsultado} aoTentarNovamente={tentarNovamente} />
        {/if}
    </div>

    <footer class="rodape">
        <span>
            Dados via
            <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubChem</a>
        </span>
        <a href="/sobre">Sobre</a>
    </footer>
</main>

<style>
    .moldura {
        width: 100%;
        max-width: 1120px;
        background: var(--cor-fundo);
        border: 1px solid var(--cor-borda);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: var(--sombra-cartao);
        display: flex;
        flex-direction: column;
    }
    .corpo {
        flex: 1;
    }
    .rodape {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 30px;
        border-top: 1px solid var(--cor-borda-sutil);
        background: var(--cor-cabecalho);
        font:
            500 12px var(--fonte-mono);
        color: var(--cor-texto-terciario);
    }
    .rodape a {
        color: var(--cor-texto-secundario);
        text-decoration: none;
    }
    .rodape a:hover {
        color: var(--cor-acento);
    }
    @media (max-width: 720px) {
        .moldura {
            border-radius: 0;
            border: none;
            min-height: 100vh;
        }
    }
</style>