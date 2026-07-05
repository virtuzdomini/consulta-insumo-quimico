<script lang="ts">
	// Cartão de resultado completo. É só composição: monta o grid de duas
	// colunas (estrutura à esquerda, informações à direita) reunindo os
	// subcomponentes. Recebe o resultado já pronto da página.
	import VisorEstrutura from './VisorEstrutura.svelte';
	import CabecalhoResultado from './CabecalhoResultado.svelte';
	import GradePropriedades from './GradePropriedades.svelte';
	import BlocoGhs from './BlocoGhs.svelte';
	import ListaSinonimos from './ListaSinonimos.svelte';
	import type { ResultadoConsulta } from '$lib/types';

	interface Props {
		resultado: ResultadoConsulta;
	}
	let { resultado }: Props = $props();
</script>

<div class="envelope">
	<div class="cartao">
		<VisorEstrutura
			imagemUrl={resultado.imagemUrl}
			nome={resultado.nome}
			formula={resultado.formula}
		/>
		<div class="info">
			<CabecalhoResultado {resultado} />
			<GradePropriedades propriedades={resultado.propriedades} />
			<BlocoGhs cid={resultado.cid} />
			<ListaSinonimos sinonimos={resultado.sinonimos} />
		</div>
	</div>
</div>

<style>
	.envelope {
		padding: 30px;
	}
	.cartao {
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-cartao);
		overflow: hidden;
		background: var(--cor-painel);
		display: grid;
		grid-template-columns: 400px 1fr;
	}
	.info {
		padding: 28px 30px;
	}
	/* Empilha estrutura e informações em telas estreitas. */
	@media (max-width: 860px) {
		.cartao {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 720px) {
		.envelope {
			padding: 16px;
		}
		.info {
			padding: 22px 20px;
		}
	}
</style>
