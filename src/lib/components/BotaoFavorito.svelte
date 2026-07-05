<script lang="ts">
	// Estrela de favoritar na ficha. Estado ativo/inativo derivado do store
	// (fonte única da verdade). Guarda só o mínimo {cid, nome, formula}.
	import { favoritos } from '$lib/stores/favorites.svelte';
	import type { ResultadoConsulta } from '$lib/types';

	interface Props {
		resultado: ResultadoConsulta;
	}
	let { resultado }: Props = $props();

	let ativo = $derived(favoritos.has(resultado.cid));

	function alternar() {
		favoritos.toggle({
			cid: resultado.cid,
			nome: resultado.nome,
			formula: resultado.formula
		});
	}
</script>

<button
	class="fav"
	class:ativo
	type="button"
	onclick={alternar}
	aria-pressed={ativo}
	aria-label={ativo
		? `Remover ${resultado.nome} dos favoritos`
		: `Adicionar ${resultado.nome} aos favoritos`}
	title={ativo ? 'Remover dos favoritos' : 'Favoritar'}
>
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill={ativo ? 'currentColor' : 'none'}
		stroke="currentColor"
		stroke-width="2"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="M12 3.2l2.7 5.5 6 .9-4.35 4.24 1.03 6-5.38-2.83-5.38 2.83 1.03-6L5.3 9.6l6-.9z" />
	</svg>
</button>

<style>
	.fav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: 1px solid var(--cor-borda);
		color: var(--cor-texto-secundario);
		background: var(--cor-painel);
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}
	.fav:hover {
		color: #e6a817;
		border-color: #e6a817;
	}
	.fav.ativo {
		color: #e6a817;
		border-color: #e6a817;
	}
</style>
