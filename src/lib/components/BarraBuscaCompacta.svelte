<script lang="ts">
	// Barra de busca COMPACTA que vive no cabeçalho quando já há resultado.
	// Mantém a busca acessível sem voltar ao estado vazio. Mesma mecânica da
	// barra grande: `valor` bindable + callback `aoBuscar` + autocomplete.
	import IconeBusca from './IconeBusca.svelte';
	import SugestoesBusca from './SugestoesBusca.svelte';

	interface Props {
		valor?: string;
		aoBuscar?: () => void;
		aoDigitar?: (texto: string) => void;
		sugestoes?: string[];
		aoSelecionar?: (termo: string) => void;
		aoFechar?: () => void;
	}
	let {
		valor = $bindable(''),
		aoBuscar,
		aoDigitar,
		sugestoes = [],
		aoSelecionar,
		aoFechar
	}: Props = $props();

	function submeter(evento: SubmitEvent) {
		evento.preventDefault();
		aoBuscar?.();
	}
</script>

<div class="campo">
	<form class="barra" onsubmit={submeter} role="search">
		<IconeBusca tamanho={17} />
		<input
			class="entrada"
			type="text"
			data-campo-busca
			bind:value={valor}
			oninput={(e) => aoDigitar?.(e.currentTarget.value)}
			onblur={() => aoFechar?.()}
			aria-label="Buscar outra substância"
			autocomplete="off"
		/>
	</form>
	<SugestoesBusca {sugestoes} {aoSelecionar} />
</div>

<style>
	.campo {
		position: relative;
		width: 420px;
		max-width: 100%;
	}
	.barra {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--cor-painel);
		border: 1.5px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		padding: 0 8px 0 18px;
		height: 44px;
	}
	.entrada {
		flex: 1;
		min-width: 0;
		background: none;
		border: none;
		outline: none;
		font:
			600 14px var(--fonte-ui);
		color: var(--cor-texto);
	}
</style>
