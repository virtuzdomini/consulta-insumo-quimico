<script lang="ts">
	// Bloco de segurança GHS na ficha, ABAIXO das propriedades.
	//
	// Carregamento PREGUIÇOSO: busca o GHS por conta própria (não bloqueia nem
	// atrasa o card principal) e tem estado independente:
	//   carregando · ok (com dados) · sem_dados · erro (com retry).
	//
	// Reutiliza o mesmo backend (/api/ghs) e o mesmo cache 24h (chave ciq:ghs:<CID>).
	import RotuloSecao from './RotuloSecao.svelte';
	import { lerCacheGhs, gravarCacheGhs } from '$lib/cache';
	import { assetGhs, nomeFonteExibicao } from '$lib/ghs';
	import type { ResultadoGhs } from '$lib/types';

	interface Props {
		cid: number;
	}
	let { cid }: Props = $props();

	let estado = $state<'carregando' | 'ok' | 'sem_dados' | 'erro'>('carregando');
	let dados = $state<ResultadoGhs | null>(null);
	let idAtual = 0;

	// Página base dos códigos H/P no PubChem (âncora #H225, #P210, …).
	const GHS_BASE = 'https://pubchem.ncbi.nlm.nih.gov/ghs/#';

	// Dispara a cada CID novo. Um contador descarta respostas atrasadas.
	$effect(() => {
		carregar(cid);
	});

	async function carregar(cidLocal: number) {
		const meu = ++idAtual;
		estado = 'carregando';
		dados = null;

		// Cache local primeiro (mesma política das consultas).
		const cache = lerCacheGhs(cidLocal);
		if (cache) {
			aplicar(cache, meu);
			return;
		}

		try {
			const resp = await fetch(`/api/ghs?cid=${cidLocal}`);
			if (meu !== idAtual) return;
			if (!resp.ok) {
				estado = 'erro';
				return;
			}
			const r = (await resp.json()) as ResultadoGhs;
			if (meu !== idAtual) return;
			gravarCacheGhs(cidLocal, r);
			aplicar(r, meu);
		} catch {
			if (meu !== idAtual) return;
			estado = 'erro';
		}
	}

	function aplicar(r: ResultadoGhs, meu: number) {
		if (meu !== idAtual) return;
		dados = r;
		estado = r.temDados ? 'ok' : 'sem_dados';
	}

	function tentarNovamente() {
		carregar(cid);
	}

	// Fallback do asset local para a URL do PubChem, se faltar algum SVG.
	function aoFalharPicto(evento: Event, urlPubchem: string) {
		const img = evento.currentTarget as HTMLImageElement;
		if (img.src !== urlPubchem) img.src = urlPubchem;
	}
</script>

<section class="ghs">
	<RotuloSecao texto="Segurança (GHS)" />

	{#if estado === 'carregando'}
		<p class="nota">Carregando classificação de segurança…</p>
	{:else if estado === 'erro'}
		<div class="nota falha">
			<span>Não foi possível carregar a classificação GHS.</span>
			<button type="button" class="retry" onclick={tentarNovamente}>Tentar novamente</button>
		</div>
	{:else if estado === 'sem_dados'}
		<p class="nota">Sem classificação GHS disponível no PubChem para este composto.</p>
		<p class="disclaimer">
			Dados agregados do PubChem, apenas para referência rápida. Não substitui a Ficha com Dados
			de Segurança (FDS) do fornecedor.
		</p>
	{:else if dados}
		{#if dados.pictogramas.length > 0}
			<div class="pictos">
				{#each dados.pictogramas as p (p.codigo)}
					<img
						class="picto"
						src={assetGhs(p.codigo)}
						alt="Pictograma GHS: {p.rotulo}"
						title={p.rotulo}
						width="52"
						height="52"
						loading="lazy"
						onerror={(e) => aoFalharPicto(e, p.urlPubchem)}
					/>
				{/each}
			</div>
		{/if}

		{#if dados.advertencia}
			<div
				class="advert"
				class:perigo={dados.advertencia === 'perigo'}
				class:atencao={dados.advertencia === 'atencao'}
			>
				{dados.advertencia === 'perigo' ? 'Perigo' : 'Atenção'}
			</div>
		{/if}

		{#if dados.frasesH.length > 0}
			<ul class="frases">
				{#each dados.frasesH as h (h.codigo)}
					<li>
						<a class="cod" href="{GHS_BASE}{h.codigo}" target="_blank" rel="noopener">{h.codigo}</a>
						<span class="desc">
							{h.descricao}{#if h.percentual}<span class="pct"> ({h.percentual})</span>{/if}
						</span>
					</li>
				{/each}
			</ul>
		{/if}

		{#if dados.codigosP.length > 0}
			<div class="pcodigos">
				{#each dados.codigosP as p (p)}
					<a class="chip" href="{GHS_BASE}{p}" target="_blank" rel="noopener">{p}</a>
				{/each}
			</div>
		{/if}

		{#if dados.fonte}
			<p class="fonte">Classificação: {nomeFonteExibicao(dados.fonte)}, via PubChem</p>
		{/if}

		<p class="disclaimer">
			Dados agregados do PubChem, apenas para referência rápida. Não substitui a Ficha com Dados
			de Segurança (FDS) do fornecedor.
		</p>
	{/if}
</section>

<style>
	.ghs {
		margin-bottom: 26px;
	}
	.nota {
		margin: 0;
		font:
			500 13px var(--fonte-ui);
		color: var(--cor-texto-secundario);
	}
	.nota.falha {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 12px;
		color: var(--cor-erro);
	}
	.retry {
		font:
			700 12px var(--fonte-ui);
		color: var(--cor-acento-texto);
		background: var(--cor-acento);
		border-radius: var(--raio-pilula);
		padding: 6px 14px;
	}

	.pictos {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 14px;
	}
	.picto {
		width: 52px;
		height: 52px;
		border-radius: 8px;
		background: #ffffff; /* garante o diamante legível em qualquer tema */
		padding: 2px;
	}

	.advert {
		display: inline-block;
		font:
			800 12px var(--fonte-ui);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 6px 14px;
		border-radius: var(--raio-pilula);
		margin-bottom: 16px;
	}
	/* Cores sólidas independentes do tema, para contraste garantido (AA). */
	.advert.perigo {
		background: #d32f2f;
		color: #ffffff;
	}
	.advert.atencao {
		background: #f2a900;
		color: #1a1a1a;
	}

	.frases {
		list-style: none;
		margin: 0 0 16px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 9px;
	}
	.frases li {
		display: flex;
		gap: 10px;
		align-items: baseline;
	}
	.cod {
		flex-shrink: 0;
		font:
			700 13px var(--fonte-mono);
		color: var(--cor-acento);
		text-decoration: none;
		min-width: 44px;
	}
	.cod:hover {
		text-decoration: underline;
	}
	.desc {
		font:
			500 13.5px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		line-height: 1.4;
	}
	.pct {
		color: var(--cor-texto-fraco);
		font-size: 12px;
	}

	.pcodigos {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		margin-bottom: 16px;
	}
	.chip {
		font:
			600 12px var(--fonte-mono);
		color: var(--cor-chip);
		background: var(--cor-painel-elevado);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-chip);
		padding: 5px 10px;
		text-decoration: none;
		transition: border-color 0.15s ease;
	}
	.chip:hover {
		border-color: var(--cor-acento);
		color: var(--cor-texto);
	}

	.fonte {
		margin: 0 0 6px;
		font:
			500 12px var(--fonte-mono);
		color: var(--cor-texto-terciario);
	}
	.disclaimer {
		margin: 0;
		font:
			500 11.5px var(--fonte-ui);
		color: var(--cor-texto-fraco);
		line-height: 1.45;
		max-width: 560px;
	}
</style>
