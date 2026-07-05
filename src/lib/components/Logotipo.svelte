<script lang="ts">
	// Logotipo do cabeçalho: o quadradinho de acento com "Ci" + o nome da
	// ferramenta e a frase que descreve o app.
</script>

<div class="logo">
	<div class="marca" aria-hidden="true">Ci</div>
	<div class="textos">
		<span class="titulo">Chem Check</span>
		<span class="subtitulo"
			>Consulta rápida de propriedades físico-químicas e segurança de insumos
			químicos, via PubChem.</span
		>
	</div>
</div>

<style>
	.logo {
		display: flex;
		align-items: center;
		gap: 13px;
	}
	.marca {
		width: 30px;
		height: 30px;
		background: var(--cor-acento);
		border-radius: 9px;
		display: flex;
		align-items: center;
		justify-content: center;
		font:
			800 13px var(--fonte-ui);
		color: var(--cor-acento-texto);
	}
	.textos {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
	}
	.titulo {
		font:
			800 15px var(--fonte-ui);
		color: var(--cor-texto);
		letter-spacing: 0.01em;
	}
	.subtitulo {
		font:
			500 11px var(--fonte-mono);
		color: var(--cor-texto-terciario);
		letter-spacing: 0.01em;
		max-width: 340px;
	}
	/* Em telas estreitas a frase esconde para não empurrar o cabeçalho. */
	@media (max-width: 560px) {
		.subtitulo {
			display: none;
		}
	}
</style>
