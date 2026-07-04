<script lang="ts">
	// Indicador "base online" (bolinha de acento + texto) exibido à direita
	// do cabeçalho enquanto NÃO há resultado.
</script>

<div class="indicador">
	<span class="ponto" aria-hidden="true"></span>
	<span class="texto">base online</span>
</div>

<style>
	.indicador {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.ponto {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--cor-acento);
	}
	.texto {
		font:
			500 12px var(--fonte-mono);
		color: var(--cor-texto-terciario);
	}
</style>
