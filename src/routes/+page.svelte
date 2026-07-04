<script lang="ts">
    // ================================================================
    //  Tela principal — Consulta de Insumo Químico (Client-side Fix)
    //  Aqui mora TODO o estado reativo da busca (runes do Svelte 5).
    // ================================================================
    import Cabecalho from '$lib/components/Cabecalho.svelte';
    import EstadoVazio from '$lib/components/EstadoVazio.svelte';
    import EstadoCarregando from '$lib/components/EstadoCarregando.svelte';
    import EstadoErro from '$lib/components/EstadoErro.svelte';
    import CartaoResultado from '$lib/components/CartaoResultado.svelte';
    import type { EstadoBusca, ResultadoConsulta, ErroConsulta } from '$lib/types';

    // ---- Estado reativo (runes) -----------------------------------
    let termo = $state(''); // o que está no campo de busca
    let termoConsultado = $state(''); // o termo realmente enviado à API
    let estado = $state<EstadoBusca>('vazio'); // vazio | carregando | resultado | erro
    let resultado = $state<ResultadoConsulta | null>(null);
    let erro = $state<ErroConsulta | null>(null);

    let mostrarBuscaNoCabecalho = $derived(estado !== 'vazio');
    let idBuscaAtual = 0;

    // ---- Ação principal: consultar a API DIRETO DO PUBCHEM ----------
    async function buscar() {
        const nome = termo.trim();
        if (!nome) return;

        const meuId = ++idBuscaAtual;
        termoConsultado = nome;
        estado = 'carregando';
        erro = null;
        resultado = null;

        try {
            // 1. Busca CID, Fórmula Molecular, Massa Molar e Nome IUPAC direto na API do PubChem
            const urlPubChem = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(nome)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
            const resposta = await fetch(urlPubChem);

            if (meuId !== idBuscaAtual) return;

            if (resposta.ok) {
                const dados = await resposta.json();
                const propriedade = dados.PropertyTable?.Properties?.[0];

                if (propriedade) {
                    // Mapeia os dados brutos da API para o formato que os seus componentes esperam
                    resultado = {
                        cid: propriedade.CID,
                        nome: nome,
                        nomeIupac: propriedade.IUPACName || 'Não disponível',
                        formula: propriedade.MolecularFormula,
                        massaMolar: `${propriedade.MolecularWeight} g/mol`,
                        // Gera automaticamente a URL da estrutura 2D baseada no CID encontrado
                        imagemUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${propriedade.CID}/PNG`
                    } as unknown as ResultadoConsulta;

                    estado = 'resultado';
                } else {
                    erro = { tipo: 'nao_encontrado', mensagem: 'Substância não encontrada na base do PubChem.' };
                    estado = 'erro';
                }
            } else {
                erro = {
                    tipo: resposta.status === 404 ? 'nao_encontrado' : 'falha',
                    mensagem: resposta.status === 404 ? 'Substância não encontrada.' : 'Erro ao consultar o PubChem.'
                };
                estado = 'erro';
            }
        } catch (e) {
            if (meuId !== idBuscaAtual) return;
            erro = { tipo: 'falha', mensagem: 'Sem conexão com a base do PubChem. Verifique a rede.' };
            estado = 'erro';
        }
    }

    function escolherExemplo(exemplo: string) {
        termo = ejemplo;
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
    />

    <div class="corpo">
        {#if estado === 'vazio'}
            <EstadoVazio bind:valor={termo} aoBuscar={buscar} aoEscolherExemplo={escolherExemplo} />
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