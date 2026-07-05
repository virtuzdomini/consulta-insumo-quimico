<script lang="ts">
	// Barra de ações da ficha: adicionar/remover da comparação (e, na Fase 5,
	// copiar Markdown / imprimir). Estado derivado das stores.
	import { comparacao } from '$lib/stores/comparison.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { lerCacheGhs } from '$lib/cache';
	import { fichaParaMarkdown, copiarTexto } from '$lib/exportar';
	import type { ResultadoConsulta } from '$lib/types';

	interface Props {
		resultado: ResultadoConsulta;
	}
	let { resultado }: Props = $props();

	let naComparacao = $derived(comparacao.has(resultado.cid));

	function alternarComparacao() {
		if (naComparacao) comparacao.remove(resultado.cid);
		else comparacao.add(resultado);
	}

	async function copiarMarkdown() {
		// Inclui o GHS se já estiver no cache (o bloco GHS carrega em paralelo).
		const ghs = lerCacheGhs(resultado.cid);
		const ok = await copiarTexto(fichaParaMarkdown(resultado, ghs));
		toast.mostrar(ok ? 'Ficha copiada como Markdown!' : 'Não foi possível copiar.');
	}

	function imprimir() {
		window.print();
	}
</script>

<div class="barra" data-print-hide>
	<button
		class="acao"
		class:ativo={naComparacao}
		type="button"
		onclick={alternarComparacao}
		aria-pressed={naComparacao}
	>
		{#if naComparacao}
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M5 12l5 5 9-11" />
			</svg>
			Na comparação
		{:else}
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			Adicionar à comparação
		{/if}
	</button>

	<button class="acao" type="button" onclick={copiarMarkdown}>
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<rect x="9" y="9" width="11" height="11" rx="2" />
			<path d="M5 15V5a2 2 0 0 1 2-2h8" />
		</svg>
		Copiar Markdown
	</button>

	<button class="acao" type="button" onclick={imprimir}>
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M6 9V3h12v6" />
			<path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
			<rect x="6" y="14" width="12" height="7" />
		</svg>
		Imprimir / PDF
	</button>
</div>

<style>
	.barra {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 24px;
	}
	.acao {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font:
			600 13px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		background: var(--cor-painel);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		padding: 9px 16px;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}
	.acao:hover {
		color: var(--cor-texto);
		border-color: var(--cor-acento);
	}
	.acao.ativo {
		color: var(--cor-acento);
		border-color: var(--cor-acento-borda);
		background: var(--cor-acento-suave);
	}
</style>
