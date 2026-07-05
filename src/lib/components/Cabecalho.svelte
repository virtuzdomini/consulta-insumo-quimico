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
		aoResetar?: () => void; // volta ao estado inicial (logo / "Nova busca")
	}
	let {
		mostrarBusca = false,
		valor = $bindable(''),
		aoBuscar,
		aoDigitar,
		sugestoes = [],
		aoSelecionar,
		aoFechar,
		aoResetar
	}: Props = $props();
</script>

<header class="cabecalho">
	<!-- Logo clicável: volta ao estado inicial (como o "home" de um site). -->
	<button class="reset-logo" type="button" onclick={() => aoResetar?.()} aria-label="Voltar ao início">
		<Logotipo />
	</button>

	<div class="direita">
		{#if mostrarBusca}
			<button class="nova-busca" type="button" onclick={() => aoResetar?.()}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M11 5 L4 12 L11 19" />
					<line x1="4" y1="12" x2="20" y2="12" />
				</svg>
				Nova busca
			</button>
			<BarraBuscaCompacta bind:valor {aoBuscar} {aoDigitar} {sugestoes} {aoSelecionar} {aoFechar} />
		{:else}
			<IndicadorBase />
		{/if}
	</div>
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
	.reset-logo {
		display: flex;
		align-items: center;
		padding: 2px;
		margin: -2px;
		border-radius: 10px;
	}
	.direita {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.nova-busca {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font:
			600 13px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		padding: 8px 12px;
		border-radius: var(--raio-pilula);
		border: 1px solid var(--cor-borda);
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}
	.nova-busca:hover {
		color: var(--cor-texto);
		border-color: var(--cor-acento);
	}
	/* Em telas estreitas some o texto, fica só a seta (economiza espaço). */
	@media (max-width: 560px) {
		.nova-busca {
			font-size: 0;
			gap: 0;
			padding: 8px;
		}
	}
</style>
