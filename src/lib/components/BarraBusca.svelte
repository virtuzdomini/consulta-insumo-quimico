<script lang="ts">
	// Barra de busca GRANDE (pílula) do estado vazio.
	// - `valor` é bindable: o pai (a página) lê e escreve o termo digitado.
	// - `aoBuscar` é um callback disparado no submit (Enter ou clique no botão).
	// - `aoDigitar`/`sugestoes`/`aoSelecionar` alimentam o autocomplete (a página
	//   busca as sugestões com debounce e as devolve por aqui).
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
	// $bindable permite `bind:valor` no componente pai (fluxo de duas vias).
	let {
		valor = $bindable(''),
		aoBuscar,
		aoDigitar,
		sugestoes = [],
		aoSelecionar,
		aoFechar
	}: Props = $props();

	function submeter(evento: SubmitEvent) {
		evento.preventDefault(); // não recarrega a página
		aoBuscar?.();
	}
</script>

<div class="campo">
	<form class="barra" onsubmit={submeter} role="search">
		<IconeBusca tamanho={21} />
		<input
			class="entrada"
			type="text"
			placeholder="Buscar substância…"
			bind:value={valor}
			oninput={(e) => aoDigitar?.(e.currentTarget.value)}
			onblur={() => aoFechar?.()}
			aria-label="Nome da substância"
			autocomplete="off"
		/>
		<button class="botao" type="submit">Buscar</button>
	</form>
	<SugestoesBusca {sugestoes} {aoSelecionar} />
</div>

<style>
	.campo {
		position: relative;
		width: 660px;
		max-width: 100%;
	}
	.barra {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--cor-painel);
		border: 1.5px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		padding: 8px 8px 8px 24px;
		height: 66px;
		box-shadow: 0 12px 40px -18px rgba(52, 181, 224, 0.45);
	}
	.entrada {
		flex: 1;
		min-width: 0;
		background: none;
		border: none;
		outline: none;
		font:
			500 17px var(--fonte-ui);
		color: var(--cor-texto);
	}
	.entrada::placeholder {
		color: #727f87;
	}
	.botao {
		font:
			700 14px var(--fonte-ui);
		color: var(--cor-acento-texto);
		background: var(--cor-acento);
		border-radius: var(--raio-pilula);
		padding: 13px 28px;
		white-space: nowrap;
		transition: filter 0.15s ease;
	}
	.botao:hover {
		filter: brightness(1.08);
	}
</style>
