<script lang="ts">
	// Estado inicial (antes de qualquer busca): título-herói, subtítulo,
	// barra de busca grande e chips de Favoritos.
	import BarraBusca from './BarraBusca.svelte';
	import ChipFavorito from './ChipFavorito.svelte';
	import { favoritos } from '$lib/stores/favorites.svelte';

	interface Props {
		valor?: string;
		aoBuscar?: () => void;
		aoEscolherExemplo?: (termo: string) => void;
		aoDigitar?: (texto: string) => void;
		sugestoes?: string[];
		aoSelecionar?: (termo: string) => void;
		aoFechar?: () => void;
	}
	let {
		valor = $bindable(''),
		aoBuscar,
		aoEscolherExemplo,
		aoDigitar,
		sugestoes = [],
		aoSelecionar,
		aoFechar
	}: Props = $props();
</script>

<div class="vazio">
	<h2 class="titulo">O que você quer<br />consultar hoje?</h2>
	<p class="subtitulo">Nome, sinônimo ou número CAS. A ficha técnica aparece em segundos.</p>

	<BarraBusca bind:valor {aoBuscar} {aoDigitar} {sugestoes} {aoSelecionar} {aoFechar} />

	{#if favoritos.itens.length > 0}
		<div class="favoritos">
			<span class="rotulo-favoritos">Favoritos:</span>
			{#each favoritos.itens as fav (fav.cid)}
				<ChipFavorito
					rotulo={fav.nome}
					aoEscolher={aoEscolherExemplo}
					aoRemover={() => favoritos.remove(fav.cid)}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.vazio {
		padding: 120px 90px 132px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.titulo {
		margin: 0 0 16px;
		font:
			800 40px var(--fonte-ui);
		color: var(--cor-texto);
		letter-spacing: -0.025em;
		line-height: 1.1;
	}
	.subtitulo {
		margin: 0 0 44px;
		font:
			500 16px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		max-width: 430px;
		line-height: 1.5;
	}
	.favoritos {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		margin-top: 24px;
		align-items: center;
	}
	.rotulo-favoritos {
		font:
			600 13px var(--fonte-ui);
		color: #727f87;
	}

	@media (max-width: 720px) {
		.vazio {
			padding: 72px 24px 84px;
		}
		.titulo {
			font-size: 30px;
		}
	}
</style>
