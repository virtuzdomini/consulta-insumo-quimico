<script lang="ts">
	// Toast global (feedback efêmero). Lê a store singleton de toast.
	import { toast } from '$lib/stores/toast.svelte';
</script>

{#if toast.mensagem}
	<div class="toast" role="status" aria-live="polite">{toast.mensagem}</div>
{/if}

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: 96px;
		transform: translateX(-50%);
		z-index: 60;
		background: var(--cor-texto);
		color: var(--cor-fundo);
		font:
			600 13px var(--fonte-ui);
		padding: 11px 20px;
		border-radius: var(--raio-pilula);
		box-shadow: 0 12px 30px -12px rgba(0, 0, 0, 0.6);
		pointer-events: none;
	}
	/* Não imprime. */
	@media print {
		.toast {
			display: none;
		}
	}
</style>
