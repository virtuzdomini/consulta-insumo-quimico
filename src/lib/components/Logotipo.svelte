<script lang="ts">
	// Logotipo do cabeçalho: o quadradinho de acento com "Ci" + o nome da
	// ferramenta e a linha de contexto ("LABORATÓRIO · INDÚSTRIA DE TINTAS").
</script>

<div class="logo">
	<div class="marca" aria-hidden="true">Ci</div>
	<div class="textos">
		<span class="titulo">Consulta de Insumo Químico</span>
		<span class="subtitulo">LABORATÓRIO · INDÚSTRIA DE TINTAS</span>
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
		letter-spacing: 0.08em;
	}
</style>
