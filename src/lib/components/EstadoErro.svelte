<script lang="ts">
	// Estado de erro. Cobre dois casos:
	//  - "nao_encontrado": a substância não existe na base (não é bug do app).
	//  - "falha": rede/PubChem indisponível (dá pra tentar de novo).
	import type { ErroConsulta } from '$lib/types';

	interface Props {
		erro: ErroConsulta;
		termo: string;
		aoTentarNovamente?: () => void;
	}
	let { erro, termo, aoTentarNovamente }: Props = $props();

	// `$derived` recalcula automaticamente quando `erro` muda.
	let naoEncontrado = $derived(erro.tipo === 'nao_encontrado');
</script>

<div class="envelope">
	<div class="caixa" class:info={naoEncontrado}>
		<div class="icone" aria-hidden="true">
			{#if naoEncontrado}
				<!-- lupa com "x" -->
				<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="10.5" cy="10.5" r="6.5" />
					<line x1="15.5" y1="15.5" x2="21" y2="21" />
				</svg>
			{:else}
				<!-- triângulo de alerta -->
				<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 3 L22 20 L2 20 Z" />
					<line x1="12" y1="10" x2="12" y2="14" />
					<circle cx="12" cy="17" r="0.6" fill="currentColor" />
				</svg>
			{/if}
		</div>

		<h3 class="titulo">
			{#if naoEncontrado}
				Nada encontrado para “{termo}”
			{:else}
				Não deu para consultar agora
			{/if}
		</h3>

		<p class="mensagem">
			{#if naoEncontrado}
				Verifique a grafia ou tente um sinônimo/número CAS. A base cobre nomes em
				inglês e português.
			{:else}
				{erro.mensagem}
			{/if}
		</p>

		{#if !naoEncontrado}
			<button class="botao" type="button" onclick={() => aoTentarNovamente?.()}>
				Tentar novamente
			</button>
		{/if}
	</div>
</div>

<style>
	.envelope {
		padding: 30px;
	}
	.caixa {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 14px;
		padding: 72px 40px;
		border: 1px solid var(--cor-erro-borda);
		border-radius: var(--raio-cartao);
		background: var(--cor-painel);
	}
	/* "Não encontrado" usa o acento (informativo), não o vermelho (falha). */
	.caixa.info {
		border-color: var(--cor-borda);
	}
	.icone {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		color: var(--cor-erro);
		background: var(--cor-erro-suave);
	}
	.caixa.info .icone {
		color: var(--cor-acento);
		background: var(--cor-acento-suave);
	}
	.titulo {
		margin: 0;
		font:
			800 22px var(--fonte-ui);
		color: var(--cor-texto);
		letter-spacing: -0.01em;
	}
	.mensagem {
		margin: 0;
		max-width: 420px;
		font:
			500 14px var(--fonte-ui);
		color: var(--cor-texto-secundario);
		line-height: 1.5;
	}
	.botao {
		margin-top: 6px;
		font:
			700 14px var(--fonte-ui);
		color: var(--cor-acento-texto);
		background: var(--cor-acento);
		border-radius: var(--raio-pilula);
		padding: 11px 24px;
		transition: filter 0.15s ease;
	}
	.botao:hover {
		filter: brightness(1.08);
	}
</style>
