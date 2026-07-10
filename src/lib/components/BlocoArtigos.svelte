<script lang="ts">
	import { buscarArtigosRecentes } from '$lib/artigos';
	import type { ResultadoArtigos, ResultadoConsulta } from '$lib/types';
	import RotuloSecao from './RotuloSecao.svelte';

	interface Props {
		resultado: ResultadoConsulta;
	}
	let { resultado }: Props = $props();

	let estado = $state<'carregando' | 'ok' | 'sem_dados' | 'erro'>('carregando');
	let dados = $state<ResultadoArtigos | null>(null);
	let idAtual = 0;

	let termoLinks = $derived(resultado.cas || resultado.nomeIupac || resultado.nome);
	let googleScholarUrl = $derived(
		`https://scholar.google.com/scholar?q=${encodeURIComponent(termoLinks)}`
	);
	let googleUrl = $derived(`https://www.google.com/search?q=${encodeURIComponent(termoLinks)}`);

	$effect(() => {
		carregar(resultado.cid);
	});

	async function carregar(cidLocal: number) {
		const meu = ++idAtual;
		estado = 'carregando';
		dados = null;

		try {
			const r = await buscarArtigosRecentes({
				cid: cidLocal,
				nome: resultado.nome,
				cas: resultado.cas,
				nomeIupac: resultado.nomeIupac
			});
			if (meu !== idAtual) return;
			dados = r;
			estado = r.artigos.length > 0 ? 'ok' : 'sem_dados';
		} catch {
			if (meu !== idAtual) return;
			estado = 'erro';
		}
	}

	function tentarNovamente() {
		carregar(resultado.cid);
	}

	function autoresResumo(autores: string[]): string {
		if (autores.length === 0) return 'Autores nao informados';
		if (autores.length === 1) return autores[0];
		return `${autores.join(', ')} et al.`;
	}

	function dataResumo(data: string | null, ano: number | null): string {
		if (data) return data;
		return ano ? String(ano) : 'Data nao informada';
	}
</script>

<section class="artigos">
	<div class="topo">
		<RotuloSecao texto="Artigos recentes" espaco={0} />
		<div class="links">
			<a href={googleScholarUrl} target="_blank" rel="noopener">Google Scholar</a>
			<a href={googleUrl} target="_blank" rel="noopener">Google</a>
		</div>
	</div>

	{#if estado === 'carregando'}
		<p class="nota">Buscando artigos recentes...</p>
	{:else if estado === 'erro'}
		<div class="nota falha">
			<span>Nao foi possivel carregar artigos recentes.</span>
			<button type="button" class="retry" onclick={tentarNovamente}>Tentar novamente</button>
		</div>
	{:else if estado === 'sem_dados'}
		<p class="nota">
			Nenhum artigo recente encontrado automaticamente. Use os links acima para ampliar a busca.
		</p>
	{:else if dados}
		<ul class="lista">
			{#each dados.artigos as artigo (artigo.id)}
				<li>
					<a class="titulo" href={artigo.url} target="_blank" rel="noopener">{artigo.titulo}</a>
					<div class="meta">
						<span>{dataResumo(artigo.dataPublicacao, artigo.ano)}</span>
						{#if artigo.fonte}<span>{artigo.fonte}</span>{/if}
						{#if artigo.acessoAberto}<span>Acesso aberto</span>{/if}
					</div>
					<p class="autores">{autoresResumo(artigo.autores)}</p>
					{#if artigo.doi}
						<a class="doi" href="https://doi.org/{artigo.doi}" target="_blank" rel="noopener">
							DOI: {artigo.doi}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
		<p class="fonte">Resultados via OpenAlex para "{dados.termo}".</p>
	{/if}
</section>

<style>
	.artigos {
		margin-bottom: 26px;
	}
	.topo {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		margin-bottom: 13px;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.links a {
		font:
			700 11px var(--fonte-ui);
		color: var(--cor-acento);
		text-decoration: none;
		border: 1px solid var(--cor-acento-borda);
		border-radius: var(--raio-pilula);
		padding: 6px 10px;
		background: var(--cor-acento-suave);
	}
	.links a:hover {
		color: var(--cor-texto);
		border-color: var(--cor-acento);
	}
	.nota {
		margin: 0;
		font:
			500 13px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		line-height: 1.45;
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
	.lista {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin: 0;
		padding: 0;
	}
	.lista li {
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-chip);
		background: var(--cor-painel-elevado);
		padding: 13px 14px;
	}
	.titulo {
		display: block;
		font:
			800 14px var(--fonte-ui);
		line-height: 1.35;
		color: var(--cor-texto);
		text-decoration: none;
		margin-bottom: 8px;
	}
	.titulo:hover {
		color: var(--cor-acento);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
		margin-bottom: 7px;
	}
	.meta span {
		font:
			700 11px var(--fonte-mono);
		color: var(--cor-texto-terciario);
		background: var(--cor-painel);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-pilula);
		padding: 4px 8px;
	}
	.autores {
		margin: 0 0 6px;
		font:
			500 12.5px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		line-height: 1.4;
	}
	.doi {
		font:
			600 12px var(--fonte-mono);
		color: var(--cor-acento);
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.doi:hover {
		text-decoration: underline;
	}
	.fonte {
		margin: 12px 0 0;
		font:
			500 12px var(--fonte-mono);
		color: var(--cor-texto-terciario);
	}
	@media (max-width: 560px) {
		.topo {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
