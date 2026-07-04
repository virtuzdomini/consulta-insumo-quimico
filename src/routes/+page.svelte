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
        const nomeOriginal = termo.trim();
        if (!nomeOriginal) return;

        const meuId = ++idBuscaAtual;
        termoConsultado = nomeOriginal;
        estado = 'carregando';
        erro = null;
        resultado = null;

        try {
            // 1. Tenta buscar o CID (ID do Composto). O PubChem aceita alguns nomes em português 
            // no endpoint geral de busca, mas falha no endpoint de propriedades se não for em inglês.
            // Buscando pelo endpoint de 'search' resolvemos a tradução automática para a maioria dos casos!
            const urlCid = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(nomeOriginal)}/cids/JSON`;
            const respostaCid = await fetch(urlCid);
            
            if (meuId !== idBuscaAtual) return;

            if (!respostaCid.ok) {
                erro = { tipo: 'nao_encontrado', mensagem: 'Substância não encontrada na base do PubChem.' };
                estado = 'erro';
                return;
            }

            const dadosCid = await respostaCid.json();
            const cid = dadosCid.IdentifierList?.CID?.[0];

            if (!cid) {
                erro = { tipo: 'nao_encontrado', mensagem: 'Substância não encontrada.' };
                estado = 'erro';
                return;
            }

            // 2. Agora que temos o CID numérico seguro, fazemos requisições paralelas para buscar as propriedades
            const urlPropriedades = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
            const urlSinonimos = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;

            const [respProps, respSinos] = await Promise.all([
                fetch(urlPropriedades),
                fetch(urlSinonimos)
            ]);

            if (meuId !== idBuscaAtual) return;

            if (respProps.ok) {
                const dadosProps = await respProps.json();
                const dadosSinos = respSinos.ok ? await respSinos.json() : {};
                
                const propriedade = dadosProps.PropertyTable?.Properties?.[0];
                const listaSinonimos = dadosSinos.InformationList?.Information?.[0]?.Synonym || [];

                if (propriedade) {
                    // 3. Montando a lista de Propriedades no formato chave-valor que o CartaoResultado espera
                    const propriedadesFormatadas = [
                        { nome: 'Massa Molar', valor: propriedade.MolecularWeight ? `${propriedade.MolecularWeight} g/mol` : 'Não disponível' },
                        { nome: 'Fórmula Molecular', valor: propriedade.MolecularFormula || 'Não disponível' },
                        { nome: 'ID do Composto (CID)', valor: String(propriedade.CID) }
                    ];

                    // Pegamos os 5 primeiros sinônimos encontrados para não poluir a tela
                    const sinonimosFormatados = listaSinonimos.slice(0, 5);

                    resultado = {
                        cid: propriedade.CID,
                        nome: nomeOriginal.toUpperCase(),
                        nomeIupac: propriedade.IUPACName || 'Não disponível',
                        formula: propriedade.MolecularFormula || '',
                        massaMolar: propriedade.MolecularWeight ? `${propriedade.MolecularWeight} g/mol` : 'Não disponível',
                        imagemUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${propriedade.CID}/PNG`,
                        propriedades: propriedadesFormatadas, // Populado corretamente!
                        sinonimos: sinonimosFormatados // Populado corretamente!
                    };

                    estado = 'resultado';
                } else {
                    erro = { tipo: 'nao_encontrado', mensagem: 'Erro ao processar as propriedades da substância.' };
                    estado = 'erro';
                }
            } else {
                erro = { tipo: 'falha', mensagem: 'Erro ao obter dados do PubChem.' };
                estado = 'erro';
            }
        } catch (e) {
            if (meuId !== idBuscaAtual) return;
            erro = { tipo: 'falha', mensagem: 'Sem conexão com a base do PubChem. Verifique a rede.' };
            estado = 'erro';
        }
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