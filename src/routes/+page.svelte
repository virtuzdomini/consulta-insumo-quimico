<script lang="ts">
    // ================================================================
    //  Tela principal — Consulta de Insumo Químico (Pente Fino)
    //  Aqui mora TODO o estado reativo da busca (runes do Svelte 5).
    // ================================================================
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

    // ---- Ação principal: consulta via /api/consulta ----------------
    // Todo o trabalho pesado (resolver nome→CID, formatar fórmula em subscrito,
    // extrair CAS, curar sinônimos, respeitar o rate-limit) vive no servidor,
    // em $lib/pubchem.ts. Aqui só cuidamos de estado de tela e cache.
    async function buscar() {
        const nomeOriginal = termo.trim();
        if (!nomeOriginal) return;

        const meuId = ++idBuscaAtual;
        termoConsultado = nomeOriginal;
        sugestoes = [];
        erro = null;

        // 1. Cache: se já buscamos isso nas últimas 24h, entrega na hora.
        const emCache = lerCache(nomeOriginal);
        if (emCache) {
            resultado = emCache;
            estado = 'resultado';
            return;
        }

        estado = 'carregando';
        resultado = null;

        try {
            const resposta = await fetch(`/api/consulta?nome=${encodeURIComponent(nomeOriginal)}`);
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
            gravarCache(nomeOriginal, dados);
        } catch (e) {
            if (meuId !== idBuscaAtual) return;
            erro = { tipo: 'falha', mensagem: 'Sem conexão com o servidor. Verifique a rede.' };
            estado = 'erro';
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

<main class="moldura">
    <Cabecalho
        mostrarBusca={mostrarBuscaNoCabecalho}
        bind:valor={termo}
        aoBuscar={buscar}
        aoDigitar={aoDigitar}
        {sugestoes}
        aoSelecionar={escolherSugestao}
        aoFechar={fecharSugestoes}
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
            <EstadoErro {erro} termo={termoConsultado} aoTentarNovamente={buscar} />
        {/if}
    </div>
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
    @media (max-width: 720px) {
        .moldura {
            border-radius: 0;
            border: none;
            min-height: 100vh;
        }
    }
</style>