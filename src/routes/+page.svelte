<script lang="ts">
	// ================================================================
	//  Tela principal — Consulta de Insumo Químico
	//  Aqui mora TODO o estado reativo da busca (runes do Svelte 5).
	//  Os componentes filhos são "burros": só recebem props e desenham.
	// ================================================================
	import Cabecalho from '$lib/components/Cabecalho.svelte';
	import EstadoVazio from '$lib/components/EstadoVazio.svelte';
	import EstadoCarregando from '$lib/components/EstadoCarregando.svelte';
	import EstadoErro from '$lib/components/EstadoErro.svelte';
	import CartaoResultado from '$lib/components/CartaoResultado.svelte';
	import type { EstadoBusca, ResultadoConsulta, ErroConsulta } from '$lib/types';

	// ---- Estado reativo (runes) -----------------------------------
	// `$state` cria variáveis que, ao mudarem, re-renderizam a tela.
	let termo = $state(''); // o que está no campo de busca (duas vias)
	let termoConsultado = $state(''); // o termo realmente enviado à API
	let estado = $state<EstadoBusca>('vazio'); // vazio | carregando | resultado | erro
	let resultado = $state<ResultadoConsulta | null>(null);
	let erro = $state<ErroConsulta | null>(null);

	// `$derived` = valor calculado que se atualiza sozinho quando a
	// dependência muda. Saímos do estado vazio → o cabeçalho mostra a busca.
	let mostrarBuscaNoCabecalho = $derived(estado !== 'vazio');

	// Contador para descartar respostas "atrasadas": se o usuário buscar de
	// novo antes da primeira responder, ignoramos a resposta antiga.
	let idBuscaAtual = 0;

	// ---- Ação principal: consultar a API --------------------------
	async function buscar() {
		const nome = termo.trim();
		if (!nome) return; // nada a fazer com campo vazio

		const meuId = ++idBuscaAtual;
		termoConsultado = nome;
		estado = 'carregando';
		erro = null;
		resultado = null;

		try {
			const resposta = await fetch(`/api/consulta?nome=${encodeURIComponent(nome)}`);

			// Se outra busca começou depois desta, abandona esta resposta.
			if (meuId !== idBuscaAtual) return;

			if (resposta.ok) {
				resultado = (await resposta.json()) as ResultadoConsulta;
				estado = 'resultado';
			} else {
				// O endpoint devolve 404 (não encontrado) ou 502 (falha upstream).
				// O corpo de erro do SvelteKit tem o formato { message }.
				const corpo = await resposta.json().catch(() => ({}));
				erro = {
					tipo: resposta.status === 404 ? 'nao_encontrado' : 'falha',
					mensagem: corpo?.message ?? 'Erro ao consultar a base.'
				};
				estado = 'erro';
			}
		} catch {
			// Falha de rede (sem internet, DNS, etc.) cai aqui.
			if (meuId !== idBuscaAtual) return;
			erro = { tipo: 'falha', mensagem: 'Sem conexão com a base. Verifique a rede.' };
			estado = 'erro';
		}
	}

	// Clique num chip "Recentes": preenche o campo e já busca.
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

<!-- Painel principal (a "moldura" flutuante da direção 1b). -->
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
