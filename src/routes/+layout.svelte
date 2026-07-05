<script lang="ts">
	// Layout raiz: envolve TODAS as páginas. Aqui só importamos o CSS global
	// (tokens + reset) e centralizamos o conteúdo numa "tela" (canvas) escura,
	// para o painel do app parecer flutuar — igual ao mockup da direção 1b.
	import '../app.css';
	import BandejaComparacao from '$lib/components/BandejaComparacao.svelte';
	import Toast from '$lib/components/Toast.svelte';

	// `children` é o conteúdo da página atual (Svelte 5 usa snippets no lugar
	// dos antigos <slot>). O `{@render children()}` desenha esse conteúdo.
	let { children } = $props();
</script>

<div class="canvas">
	{@render children()}
</div>

<!-- Globais: bandeja de comparação flutuante + toasts (aparecem em toda rota). -->
<BandejaComparacao />
<Toast />

<style>
	.canvas {
		min-height: 100vh;
		display: flex;
		justify-content: center;
		padding: 40px;
	}
	@media (max-width: 720px) {
		.canvas {
			padding: 0;
		}
	}
</style>
