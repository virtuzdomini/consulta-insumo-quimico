<script lang="ts">
	// Cabeçalho fixo do app. À esquerda sempre o logotipo; à direita, ou o
	// indicador "base online" (estado vazio) ou a busca compacta (demais estados).
	import Logotipo from './Logotipo.svelte';
	import IndicadorBase from './IndicadorBase.svelte';
	import BarraBuscaCompacta from './BarraBuscaCompacta.svelte';

	interface Props {
		mostrarBusca?: boolean; // true quando já saímos do estado vazio
		valor?: string;
		aoBuscar?: () => void;
		aoDigitar?: (texto: string) => void;
		sugestoes?: string[];
		aoSelecionar?: (termo: string) => void;
		aoFechar?: () => void;
	}
	let {
		mostrarBusca = false,
		valor = $bindable(''),
		aoBuscar,
		aoDigitar,
		sugestoes = [],
		aoSelecionar,
		aoFechar
	}: Props = $props();
</script>

<header class="cabecalho">
	<Logotipo />
	{#if mostrarBusca}
		<BarraBuscaCompacta bind:valor {aoBuscar} {aoDigitar} {sugestoes} {aoSelecionar} {aoFechar} />
	{:else}
		<IndicadorBase />
	{/if}
</header>

<style>
	.cabecalho {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 18px 30px;
		border-bottom: 1px solid var(--cor-borda-sutil);
		background: var(--cor-cabecalho);
	}
</style>
