<script lang="ts">
	// Rótulo de seção monoespaçado em caixa alta (ex.: "PROPRIEDADES",
	// "SINÔNIMOS", "ESTRUTURA MOLECULAR 2D"). Aparece várias vezes no design,
	// então virou um componente com o espaçamento inferior configurável.
	interface Props {
		texto: string;
		espaco?: number; // margin-bottom em px
	}
	let { texto, espaco = 13 }: Props = $props();
</script>

<div class="rotulo" style="margin-bottom:{espaco}px">{texto}</div>

<style>
	.rotulo {
		font:
			600 11px var(--fonte-mono);
		color: var(--cor-texto-terciario);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
</style>
