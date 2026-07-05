<script lang="ts">
	// Chip de um favorito no estado inicial: o rótulo carrega o composto
	// (reusa o pipeline de busca por nome) e o "×" o remove dos favoritos.
	interface Props {
		rotulo: string;
		aoEscolher?: (termo: string) => void;
		aoRemover?: () => void;
	}
	let { rotulo, aoEscolher, aoRemover }: Props = $props();
</script>

<span class="chip">
	<button class="rotulo" type="button" onclick={() => aoEscolher?.(rotulo)}>{rotulo}</button>
	<button
		class="x"
		type="button"
		onclick={() => aoRemover?.()}
		aria-label="Remover {rotulo} dos favoritos"
		title="Remover"
	>
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
			<line x1="6" y1="6" x2="18" y2="18" />
			<line x1="18" y1="6" x2="6" y2="18" />
		</svg>
	</button>
</span>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		background: var(--cor-painel);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		transition: border-color 0.15s ease;
	}
	.chip:hover {
		border-color: var(--cor-acento);
	}
	.rotulo {
		font:
			500 13px var(--fonte-ui);
		color: var(--cor-chip);
		padding: 7px 6px 7px 15px;
	}
	.rotulo:hover {
		color: var(--cor-texto);
	}
	.x {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--cor-texto-fraco);
		padding: 6px 12px 6px 6px;
		border-radius: var(--raio-pilula);
	}
	.x:hover {
		color: var(--cor-erro);
	}
</style>
