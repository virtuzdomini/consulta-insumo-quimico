<script lang="ts">
	// Página "Sobre": fonte dos dados, limitações e aviso de portfólio.
	// Reaproveita a mesma moldura visual do app para manter a identidade.
	import Logotipo from '$lib/components/Logotipo.svelte';
	import AlternarTema from '$lib/components/AlternarTema.svelte';
</script>

<svelte:head>
	<title>Sobre · Consulta de Insumo Químico</title>
	<meta name="description" content="Sobre o projeto: fonte dos dados (PubChem), limitações conhecidas e aviso de projeto de portfólio." />
</svelte:head>

<main class="moldura">
	<header class="cabecalho">
		<a class="reset-logo" href="/" aria-label="Voltar ao início">
			<Logotipo />
		</a>
		<AlternarTema />
	</header>

	<div class="conteudo">
		<h1 class="titulo">Sobre</h1>

		<section class="bloco">
			<h2>Fonte dos dados</h2>
			<p>
				Todas as informações — fórmula, massa molar, estrutura 2D, número CAS, sinônimos e
				propriedades físico-químicas — vêm do
				<a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubChem</a>,
				a base pública de química do NCBI (National Center for Biotechnology Information, EUA).
				A consulta é feita em tempo real via PUG-REST.
			</p>
		</section>

		<section class="bloco">
			<h2>Limitações conhecidas</h2>
			<ul>
				<li>
					A base cobre bem <strong>compostos moleculares definidos</strong>. Misturas, polímeros
					e nomes puramente comerciais podem não retornar resultado ou vir incompletos.
				</li>
				<li>
					A resolução de nomes funciona melhor em <strong>inglês</strong>; muitos termos em
					português são reconhecidos, mas nem todos.
				</li>
				<li>
					Algumas propriedades podem estar ausentes para certas substâncias — nesses casos o
					campo aparece como “—”.
				</li>
			</ul>
		</section>

		<section class="bloco aviso">
			<h2>Aviso</h2>
			<p>
				Este é um <strong>projeto pessoal de portfólio</strong>, sem vínculo com o NCBI/PubChem.
				As informações têm caráter informativo e <strong>não substituem a FISPQ oficial</strong>
				do fornecedor nem orientações de segurança do fabricante.
			</p>
		</section>

		<a class="voltar" href="/">← Voltar para a busca</a>
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
		padding: 48px 60px 56px;
		max-width: 760px;
	}
	.titulo {
		margin: 0 0 28px;
		font:
			800 32px var(--fonte-ui);
		color: var(--cor-texto);
		letter-spacing: -0.02em;
	}
	.bloco {
		margin-bottom: 30px;
	}
	.bloco h2 {
		margin: 0 0 10px;
		font:
			700 15px var(--fonte-mono);
		color: var(--cor-acento);
		letter-spacing: 0.02em;
	}
	.bloco p,
	.bloco li {
		font:
			500 15px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		line-height: 1.6;
	}
	.bloco ul {
		margin: 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.bloco strong {
		color: var(--cor-texto);
		font-weight: 700;
	}
	.bloco a {
		color: var(--cor-acento);
	}
	.aviso {
		padding: 20px 22px;
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-painel);
		background: var(--cor-painel-elevado);
	}
	.aviso h2 {
		margin-bottom: 8px;
	}
	.voltar {
		display: inline-block;
		margin-top: 8px;
		font:
			600 14px var(--fonte-ui);
		color: var(--cor-texto);
		text-decoration: none;
	}
	.voltar:hover {
		color: var(--cor-acento);
	}
	@media (max-width: 720px) {
		.moldura {
			border-radius: 0;
			border: none;
			min-height: 100vh;
		}
		.conteudo {
			padding: 32px 22px 40px;
		}
	}
</style>
