<script lang="ts">
	// Lista suspensa de sugestões de autocomplete, posicionada logo abaixo do
	// campo de busca. Compartilhada pela barra grande e pela compacta.
	//
	// Usamos `onmousedown` (não `onclick`) com preventDefault: assim a seleção
	// acontece ANTES do input perder o foco (blur), evitando que o dropdown
	// desapareça no meio do clique.
	interface Props {
		sugestoes: string[];
		aoSelecionar?: (termo: string) => void;
	}
	let { sugestoes, aoSelecionar }: Props = $props();
</script>

{#if sugestoes.length > 0}
	<ul class="lista" role="listbox">
		{#each sugestoes as sugestao (sugestao)}
			<li>
				<button
					type="button"
					class="item"
					role="option"
					aria-selected="false"
					onmousedown={(e) => {
						e.preventDefault();
						aoSelecionar?.(sugestao);
					}}
				>
					{sugestao}
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.lista {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		z-index: 20;
		margin: 0;
		padding: 6px;
		list-style: none;
		background: var(--cor-painel);
		border: 1px solid var(--cor-borda);
		border-radius: 14px;
		box-shadow: 0 18px 44px -20px rgba(0, 0, 0, 0.55);
		max-height: 320px;
		overflow-y: auto;
	}
	.item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 10px 14px;
		border-radius: 9px;
		background: none;
		border: none;
		cursor: pointer;
		font:
			500 14px var(--fonte-ui);
		color: var(--cor-texto);
		transition: background 0.12s ease;
	}
	.item:hover {
		background: var(--cor-painel-elevado);
		color: var(--cor-acento);
	}
</style>
