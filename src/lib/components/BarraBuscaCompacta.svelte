<script lang="ts">
	// Barra de busca COMPACTA que vive no cabeçalho quando já há resultado.
	// Mantém a busca acessível sem voltar ao estado vazio. Mesma mecânica da
	// barra grande: `valor` bindable + callback `aoBuscar`.
	import IconeBusca from './IconeBusca.svelte';

	interface Props {
		valor?: string;
		aoBuscar?: () => void;
	}
	let { valor = $bindable(''), aoBuscar }: Props = $props();

	function submeter(evento: SubmitEvent) {
		evento.preventDefault();
		aoBuscar?.();
	}
</script>

<form class="barra" onsubmit={submeter} role="search">
	<IconeBusca tamanho={17} />
	<input
		class="entrada"
		type="text"
		bind:value={valor}
		aria-label="Buscar outra substância"
		autocomplete="off"
	/>
</form>

<style>
	.barra {
		width: 420px;
		max-width: 100%;
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
