<script lang="ts">
	// Lista de sinônimos em chips que quebram linha.
	import RotuloSecao from './RotuloSecao.svelte';
	import ChipSinonimo from './ChipSinonimo.svelte';

	interface Props {
		sinonimos: string[];
	}
	let { sinonimos }: Props = $props();
</script>

<RotuloSecao texto="Sinônimos" />
{#if sinonimos.length > 0}
	<div class="lista">
		{#each sinonimos as sinonimo (sinonimo)}
			<ChipSinonimo texto={sinonimo} />
		{/each}
	</div>
{:else}
	<p class="vazio">Nenhum sinônimo disponível.</p>
{/if}

<style>
	.lista {
		display: flex;
		flex-wrap: wrap;
		gap: 9px;
	}
	.vazio {
		margin: 0;
		font:
			400 13px var(--fonte-ui);
		color: var(--cor-texto-fraco);
	}
</style>
