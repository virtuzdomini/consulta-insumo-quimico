<script lang="ts">
	// View de comparação: tabela lado a lado (linhas = propriedades, colunas =
	// compostos). Lê a store de comparação (fonte única). Trata dados ausentes
	// com "—" e rola horizontalmente no mobile (sem amassar colunas).
	import Logotipo from '$lib/components/Logotipo.svelte';
	import AlternarTema from '$lib/components/AlternarTema.svelte';
	import { comparacao } from '$lib/stores/comparison.svelte';
	import type { CompostoComparacao } from '$lib/stores/comparison.svelte';
	import type { ResultadoConsulta, ResultadoGhs } from '$lib/types';

	// Valor de uma propriedade físico-química (por rótulo), já formatado ou "—".
	function prop(consulta: ResultadoConsulta, rotulo: string): string {
		const p = consulta.propriedades.find((x) => x.rotulo === rotulo);
		if (!p || p.valor === '—') return '—';
		return p.unidade ? `${p.valor} ${p.unidade}` : p.valor;
	}

	function advertencia(ghs: ResultadoGhs | null): string {
		if (!ghs?.temDados || !ghs.advertencia) return '—';
		return ghs.advertencia === 'perigo' ? 'Perigo' : 'Atenção';
	}

	function nFrasesH(ghs: ResultadoGhs | null): string {
		if (!ghs?.temDados) return '—';
		return String(ghs.frasesH.length);
	}

	// Linhas de texto da tabela (a estrutura 2D é uma linha à parte, com imagem).
	const linhas: { rotulo: string; valor: (c: CompostoComparacao) => string }[] = [
		{ rotulo: 'Fórmula', valor: (c) => c.consulta.formula },
		{ rotulo: 'Massa molar', valor: (c) => c.consulta.massaMolar },
		{ rotulo: 'CAS', valor: (c) => c.consulta.cas ?? '—' },
		{ rotulo: 'Nome IUPAC', valor: (c) => c.consulta.nomeIupac ?? '—' },
		{ rotulo: 'logP', valor: (c) => prop(c.consulta, 'logP') },
		{ rotulo: 'TPSA', valor: (c) => prop(c.consulta, 'TPSA') },
		{ rotulo: 'Doadores H', valor: (c) => prop(c.consulta, 'Doadores H') },
		{ rotulo: 'Aceptores H', valor: (c) => prop(c.consulta, 'Aceptores H') },
		{ rotulo: 'Advertência GHS', valor: (c) => advertencia(c.ghs) },
		{ rotulo: 'Frases H', valor: (c) => nFrasesH(c.ghs) }
	];
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
			<a class="voltar" href="/">← Voltar à busca</a>
		</div>

		{#if comparacao.count === 0}
			<p class="vazio">
				Nenhum composto na comparação. Volte à busca e use “Adicionar à comparação” numa ficha.
			</p>
		{:else}
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
											onclick={() => comparacao.remove(item.consulta.cid)}
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
