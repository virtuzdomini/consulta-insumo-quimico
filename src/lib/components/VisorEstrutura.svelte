<script lang="ts">
	// Coluna esquerda do cartão: a estrutura 2D.
	// A imagem vem direto do PubChem (endpoint .../cid/{cid}/PNG) — como é
	// só uma <img>, não sofre bloqueio de CORS e carrega no navegador.
	// Desenhos de estrutura ficam legíveis em fundo claro, então colocamos o
	// PNG sobre um "papel" branco dentro da moldura tracejada escura do design.
	import RotuloSecao from './RotuloSecao.svelte';

	interface Props {
		imagemUrl: string;
		nome: string;
		formula: string;
	}
	let { imagemUrl, nome, formula }: Props = $props();

	// Estados de carregamento da própria imagem (independente da consulta).
	let carregando = $state(true);
	let erro = $state(false);
</script>

<div class="coluna">
	<RotuloSecao texto="Estrutura molecular 2D" espaco={18} />

	<div class="visor" class:vazio={carregando || erro}>
		{#if erro}
			<span class="aviso">Não foi possível carregar a estrutura.</span>
		{:else}
			{#if carregando}
				<span class="aviso">Renderizando estrutura…</span>
			{/if}
			<!-- A imagem só "aparece" (opacity) depois de carregar, evitando flash. -->
			<img
				class="imagem"
				class:pronta={!carregando}
				src={imagemUrl}
				alt="Estrutura molecular 2D de {nome} ({formula})"
				onload={() => (carregando = false)}
				onerror={() => {
					carregando = false;
					erro = true;
				}}
			/>
		{/if}
	</div>

	<div class="acoes">
		<!-- Cross-origin: o navegador abre o PNG em nova aba; "download" é uma
		     dica que muitos navegadores respeitam mesmo entre origens. -->
		<a
			class="acao"
			href={imagemUrl}
			target="_blank"
			rel="noopener"
			aria-label="Ampliar estrutura de {nome} em nova aba"
		>
			Ampliar
		</a>
		<a
			class="acao"
			href={imagemUrl}
			download={`${nome}.png`}
			aria-label="Baixar imagem PNG da estrutura de {nome}"
		>
			Baixar PNG
		</a>
	</div>
</div>

<style>
	.coluna {
		padding: 28px;
		background: var(--cor-painel-elevado);
		border-right: 1px solid var(--cor-borda);
		display: flex;
		flex-direction: column;
	}
	.visor {
		flex: 1;
		min-height: 270px;
		border-radius: 13px;
		background: #ffffff;
		border: 1px dashed var(--cor-borda-tracejada);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		padding: 12px;
	}
	/* Enquanto carrega/erra, a moldura volta ao fundo escuro do design. */
	.visor.vazio {
		background: var(--cor-fundo);
	}
	.imagem {
		max-width: 100%;
		max-height: 320px;
		object-fit: contain;
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	.imagem.pronta {
		opacity: 1;
	}
	.aviso {
		font:
			400 11px var(--fonte-mono);
		color: var(--cor-texto-fraco);
		letter-spacing: 0.04em;
	}
	.acoes {
		margin-top: 16px;
		display: flex;
		gap: 8px;
	}
	.acao {
		flex: 1;
		text-align: center;
		font:
			600 12px var(--fonte-ui);
		color: var(--cor-chip);
		background: var(--cor-painel);
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-chip);
		padding: 9px;
		text-decoration: none;
		transition: border-color 0.15s ease;
	}
	.acao:hover {
		border-color: var(--cor-acento);
	}
</style>
