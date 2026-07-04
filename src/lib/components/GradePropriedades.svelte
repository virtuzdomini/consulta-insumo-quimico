<script lang="ts">
	// Grade de 4 colunas com as propriedades físico-químicas.
	import RotuloSecao from './RotuloSecao.svelte';
	import CartaoPropriedade from './CartaoPropriedade.svelte';
	import type { Propriedade } from '$lib/types';

	interface Props {
		propriedades: Propriedade[];
	}
	let { propriedades }: Props = $props();
</script>

<RotuloSecao texto="Propriedades" />
<div class="grade">
	{#each propriedades as propriedade (propriedade.rotulo)}
		<CartaoPropriedade {propriedade} />
	{/each}
</div>

<style>
	.grade {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
		margin-bottom: 26px;
	}
	/* Em telas estreitas, quebra para 2 colunas. */
	@media (max-width: 720px) {
		.grade {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
