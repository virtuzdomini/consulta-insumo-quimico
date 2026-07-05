<script lang="ts">
	// View de comparação: tabela lado a lado (linhas = propriedades, colunas =
	// compostos). Lê a store de comparação (fonte única). Trata dados ausentes
	// com "—" e rola horizontalmente no mobile (sem amassar colunas).
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Logotipo from '$lib/components/Logotipo.svelte';
	import AlternarTema from '$lib/components/AlternarTema.svelte';
	import { comparacao } from '$lib/stores/comparison.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		LINHAS_COMPARACAO,
		comparacaoParaMarkdown,
		comparacaoParaCsv,
		copiarTexto,
		baixarArquivo
	} from '$lib/exportar';

	// Linhas de texto da tabela vêm da fonte única (exportar.ts); a estrutura
	// 2D é uma linha à parte, renderizada como imagem.
	const linhas = LINHAS_COMPARACAO;

	// ---- Deep-link ?compare=CID1,CID2,CID3 ----
	// A URL é a fonte da verdade nesta página: ao abrir/recarregar um link com
	// ?compare=, reidratamos exatamente aqueles CIDs (via pipeline → cache 24h).
	let ultimoCompare = '';

	$effect(() => {
		const param = page.url.searchParams.get('compare') ?? '';
		if (param === ultimoCompare) return;
		ultimoCompare = param;

		const cids = param
			.split(',')
			.map(Number)
			.filter((n) => Number.isInteger(n) && n > 0)
			.slice(0, comparacao.limite);
		if (cids.length === 0) return; // sem ?compare=: mantém o que veio do localStorage

		const atual = comparacao.cids();
		const igual = atual.length === cids.length && atual.every((c, i) => c === cids[i]);
		if (!igual) {
			comparacao.clear();
			comparacao.reidratar(cids);
		}
	});

	// Reflete o estado atual na URL (após remover uma coluna), para o link
	// continuar deep-linkável e o reload manter a comparação.
	function sincronizarUrl() {
		const cids = comparacao.cids();
		ultimoCompare = cids.join(','); // evita o $effect reprocessar a própria escrita
		const q = cids.length ? `?compare=${cids.join(',')}` : '';
		goto(`/comparar${q}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function removerColuna(cid: number) {
		comparacao.remove(cid);
		sincronizarUrl();
	}

	async function copiarMarkdown() {
		const ok = await copiarTexto(comparacaoParaMarkdown(comparacao.itens));
		toast.mostrar(ok ? 'Tabela copiada como Markdown!' : 'Não foi possível copiar.');
	}

	function baixarCsv() {
		baixarArquivo('comparacao.csv', comparacaoParaCsv(comparacao.itens), 'text/csv;charset=utf-8');
	}

	function imprimir() {
		window.print();
	}
</script>

<svelte:head>
	<title>Comparação · Consulta de Insumo Químico</title>
</svelte:head>

<main class="moldura">
	<header class="cabecalho">
		<a class="reset-logo" href="/" aria-label="Voltar ao início">
			<Logotipo />
		</a>
		<AlternarTema />
	</header>

	<div class="conteudo">
		<div class="titulo-linha">
			<h1 class="titulo">Comparação</h1>
			<a class="voltar" href="/" data-print-hide>← Voltar à busca</a>
		</div>

		{#if comparacao.count === 0}
			<p class="vazio">
				Nenhum composto na comparação. Volte à busca e use “Adicionar à comparação” numa ficha.
			</p>
		{:else}
			<div class="ferramentas" data-print-hide>
				<button class="ferr" type="button" onclick={copiarMarkdown}>Copiar Markdown</button>
				<button class="ferr" type="button" onclick={baixarCsv}>Baixar CSV</button>
				<button class="ferr" type="button" onclick={imprimir}>Imprimir / PDF</button>
			</div>

			<div class="rolagem">
				<table class="tabela">
					<thead>
						<tr>
							<th class="canto" scope="col">Propriedade</th>
							{#each comparacao.itens as item (item.consulta.cid)}
								<th class="coluna" scope="col">
									<div class="cabeca">
										<span class="nome-comp">{item.consulta.nome}</span>
										<button
											class="remover"
											type="button"
											data-print-hide
											onclick={() => removerColuna(item.consulta.cid)}
											aria-label="Remover {item.consulta.nome} da comparação"
											title="Remover coluna"
										>
											<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
												<line x1="6" y1="6" x2="18" y2="18" />
												<line x1="18" y1="6" x2="6" y2="18" />
											</svg>
										</button>
									</div>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						<tr>
							<th class="rotulo" scope="row">Estrutura 2D</th>
							{#each comparacao.itens as item (item.consulta.cid)}
								<td class="cel-img">
									<img
										class="estrutura"
										src={item.consulta.imagemUrl}
										alt="Estrutura 2D de {item.consulta.nome}"
										loading="lazy"
									/>
								</td>
							{/each}
						</tr>
						{#each linhas as linha (linha.rotulo)}
							<tr>
								<th class="rotulo" scope="row">{linha.rotulo}</th>
								{#each comparacao.itens as item (item.consulta.cid)}
									<td class="cel">{linha.valor(item)}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</main>

<style>
	.moldura {
		width: 100%;
		max-width: 1120px;
		background: var(--cor-fundo);
		border: 1px solid var(--cor-borda);
		border-radius: 18px;
		overflow: hidden;
		box-shadow: var(--sombra-cartao);
		display: flex;
		flex-direction: column;
	}
	.cabecalho {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 18px 30px;
		border-bottom: 1px solid var(--cor-borda-sutil);
		background: var(--cor-cabecalho);
	}
	.reset-logo {
		display: flex;
		align-items: center;
		text-decoration: none;
		padding: 2px;
		margin: -2px;
		border-radius: 10px;
	}
	.conteudo {
		padding: 34px 30px 44px;
	}
	.titulo-linha {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 24px;
	}
	.titulo {
		margin: 0;
		font:
			800 30px var(--fonte-ui);
		color: var(--cor-texto);
		letter-spacing: -0.02em;
	}
	.voltar {
		font:
			600 14px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		text-decoration: none;
		white-space: nowrap;
	}
	.voltar:hover {
		color: var(--cor-acento);
	}
	.vazio {
		font:
			500 15px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		line-height: 1.6;
	}
	.ferramentas {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 18px;
	}
	.ferr {
		font:
			600 13px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		background: var(--cor-painel);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		padding: 9px 16px;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}
	.ferr:hover {
		color: var(--cor-texto);
		border-color: var(--cor-acento);
	}

	/* Rola horizontalmente no mobile sem amassar as colunas. */
	.rolagem {
		overflow-x: auto;
	}
	.tabela {
		border-collapse: collapse;
		width: 100%;
		min-width: 520px;
	}
	th,
	td {
		border: 1px solid var(--cor-borda);
		padding: 12px 14px;
		text-align: left;
		vertical-align: middle;
	}
	.canto {
		background: var(--cor-painel-elevado);
	}
	.coluna {
		background: var(--cor-painel-elevado);
		min-width: 160px;
	}
	.cabeca {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.nome-comp {
		font:
			800 15px var(--fonte-ui);
		color: var(--cor-texto);
	}
	.remover {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		color: var(--cor-texto-fraco);
		flex-shrink: 0;
	}
	.remover:hover {
		color: var(--cor-erro);
	}
	.rotulo {
		font:
			600 12px var(--fonte-mono);
		color: var(--cor-texto-mono);
		background: var(--cor-painel-elevado);
		white-space: nowrap;
		position: sticky;
		left: 0;
	}
	.cel {
		font:
			500 14px var(--fonte-ui);
		color: var(--cor-texto);
	}
	.cel-img {
		background: #ffffff;
		text-align: center;
	}
	.estrutura {
		width: 120px;
		height: 120px;
		object-fit: contain;
	}

	@media (max-width: 720px) {
		.moldura {
			border-radius: 0;
			border: none;
			min-height: 100vh;
		}
		.conteudo {
			padding: 24px 16px 36px;
		}
	}
</style>
