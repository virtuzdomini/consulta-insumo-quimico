<script lang="ts">
	// Chip clicável de sugestão ("Recentes"). Ao clicar, dispara `aoEscolher`
	// com o próprio rótulo — a página usa isso para preencher e buscar.
	interface Props {
		rotulo: string;
		aoEscolher?: (termo: string) => void;
	}
	let { rotulo, aoEscolher }: Props = $props();
</script>

<button class="chip" type="button" onclick={() => aoEscolher?.(rotulo)}>
	{rotulo}
</button>

<style>
	.chip {
		font:
			500 13px var(--fonte-ui);
		color: var(--cor-chip);
		background: var(--cor-painel);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		padding: 7px 15px;
		transition:
			border-color 0.15s ease,
			color 0.15s ease;
	}
	.chip:hover {
		border-color: var(--cor-acento);
		color: var(--cor-texto);
	}
</style>
