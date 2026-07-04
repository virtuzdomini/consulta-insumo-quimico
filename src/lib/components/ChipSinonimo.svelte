<script lang="ts">
	// Chip (não clicável) de um sinônimo do composto.
	interface Props {
		texto: string;
	}
	let { texto }: Props = $props();
</script>

<span class="chip">{texto}</span>

<style>
	.chip {
		font:
			500 13px var(--fonte-ui);
		color: var(--cor-chip);
		background: var(--cor-painel-elevado);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		padding: 7px 14px;
	}
</style>
