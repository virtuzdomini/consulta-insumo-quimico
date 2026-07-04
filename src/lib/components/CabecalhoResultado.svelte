<script lang="ts">
	// Topo do painel de informações: nome do composto, linha de metadados
	// (fórmula · massa molar · CAS) e o selo "Identificado".
	import SeloIdentificado from './SeloIdentificado.svelte';
	import type { ResultadoConsulta } from '$lib/types';

	interface Props {
		resultado: ResultadoConsulta;
	}
	let { resultado }: Props = $props();
</script>

<div class="topo">
	<div>
		<h3 class="nome">{resultado.nome}</h3>
		<div class="meta">
			<span class="formula">{resultado.formula}</span>
			<span class="massa">{resultado.massaMolar}</span>
			{#if resultado.cas}
				<span class="cas">CAS {resultado.cas}</span>
			{/if}
		</div>
	</div>
	<SeloIdentificado />
</div>

<style>
	.topo {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 22px;
	}
	.nome {
		margin: 0 0 10px;
		font:
			800 26px var(--fonte-ui);
		color: var(--cor-texto);
		letter-spacing: -0.015em;
	}
	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 16px;
	}
	.formula {
		font:
			500 17px var(--fonte-mono);
		color: var(--cor-acento);
	}
	.massa {
		font:
			500 14px var(--fonte-ui);
		color: var(--cor-texto-secundario);
	}
	.cas {
		font:
			500 13px var(--fonte-mono);
		color: #727f87;
	}
</style>
