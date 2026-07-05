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
			<a
				class="pubchem"
				href="https://pubchem.ncbi.nlm.nih.gov/compound/{resultado.cid}"
				target="_blank"
				rel="noopener"
			>
				Ver no PubChem
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M14 5h5v5" />
					<path d="M19 5 10 14" />
					<path d="M19 13v6H5V5h6" />
				</svg>
			</a>
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
		color: var(--cor-texto-fraco);
	}
	.pubchem {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font:
			600 13px var(--fonte-ui);
		color: var(--cor-acento);
		text-decoration: none;
		padding: 3px 2px;
		border-radius: 6px;
		transition: opacity 0.15s ease;
	}
	.pubchem:hover {
		opacity: 0.8;
		text-decoration: underline;
	}
</style>
