<script lang="ts">
	// Célula individual de propriedade físico-química (logP, TPSA, etc.).
	import type { Propriedade } from '$lib/types';

	interface Props {
		propriedade: Propriedade;
	}
	let { propriedade }: Props = $props();
</script>

<div class="cartao">
	<div class="rotulo">{propriedade.rotulo}</div>
	<div class="valor">{propriedade.valor}</div>
	<!-- Se a propriedade tem unidade (ex.: Å²), ela entra junto da descrição,
	     como no design da direção 1b. -->
	<div class="descricao">
		{#if propriedade.unidade}{propriedade.unidade} {/if}{propriedade.descricao}
	</div>
</div>

<style>
	.cartao {
		background: var(--cor-painel-elevado);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-painel);
		padding: 16px 15px;
	}
	.rotulo {
		font:
			500 11px var(--fonte-mono);
		color: var(--cor-texto-mono);
		margin-bottom: 9px;
	}
	.valor {
		font:
			800 24px var(--fonte-ui);
		color: var(--cor-texto);
		line-height: 1;
	}
	.descricao {
		font:
			500 11px var(--fonte-ui);
		color: var(--cor-texto-fraco);
		margin-top: 6px;
	}
</style>
