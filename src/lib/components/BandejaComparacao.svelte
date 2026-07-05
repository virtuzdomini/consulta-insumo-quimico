<script lang="ts">
	// Bandeja flutuante de comparação. Aparece quando há ≥1 composto na store.
	// Fica escondida na própria página /comparar (lá a tabela já mostra tudo).
	import { page } from '$app/state';
	import { comparacao } from '$lib/stores/comparison.svelte';

	let naPaginaComparar = $derived(page.url.pathname === '/comparar');
	let visivel = $derived(comparacao.count > 0 && !naPaginaComparar);
</script>

{#if visivel}
	<div class="bandeja" role="region" aria-label="Bandeja de comparação">
		<span class="titulo">Comparar <span class="contador">{comparacao.count}/{comparacao.limite}</span></span>

		<div class="chips">
			{#each comparacao.itens as item (item.consulta.cid)}
				<span class="chip">
					<span class="nome">{item.consulta.nome}</span>
					<button
						class="x"
						type="button"
						onclick={() => comparacao.remove(item.consulta.cid)}
						aria-label="Remover {item.consulta.nome} da comparação"
						title="Remover"
					>
						<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true">
							<line x1="6" y1="6" x2="18" y2="18" />
							<line x1="18" y1="6" x2="6" y2="18" />
						</svg>
					</button>
				</span>
			{/each}
		</div>

		<div class="acoes">
			<button class="limpar" type="button" onclick={() => comparacao.clear()}>Limpar</button>
			<a class="ver" href="/comparar">Ver comparação</a>
		</div>
	</div>
{/if}

<style>
	.bandeja {
		position: fixed;
		left: 50%;
		bottom: 22px;
		transform: translateX(-50%);
		z-index: 50;
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		max-width: calc(100vw - 32px);
		padding: 12px 16px;
		background: var(--cor-cabecalho);
		border: 1px solid var(--cor-borda);
		border-radius: 14px;
		box-shadow: 0 18px 44px -18px rgba(0, 0, 0, 0.6);
	}
	.titulo {
		font:
			700 13px var(--fonte-ui);
		color: var(--cor-texto);
		white-space: nowrap;
	}
	.contador {
		color: var(--cor-texto-terciario);
		font-family: var(--fonte-mono);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--cor-painel);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		padding: 5px 6px 5px 12px;
		font:
			500 12.5px var(--fonte-ui);
		color: var(--cor-chip);
		max-width: 180px;
	}
	.nome {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.x {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--cor-texto-fraco);
		border-radius: 50%;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}
	.x:hover {
		color: var(--cor-erro);
	}
	.acoes {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.limpar {
		font:
			600 12.5px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		padding: 8px 10px;
	}
	.limpar:hover {
		color: var(--cor-texto);
	}
	.ver {
		font:
			700 13px var(--fonte-ui);
		color: var(--cor-acento-texto);
		background: var(--cor-acento);
		border-radius: var(--raio-pilula);
		padding: 9px 18px;
		text-decoration: none;
		white-space: nowrap;
		transition: filter 0.15s ease;
	}
	.ver:hover {
		filter: brightness(1.08);
	}
	@media print {
		.bandeja {
			display: none;
		}
	}
</style>
