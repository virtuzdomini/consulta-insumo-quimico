<script lang="ts">
	// Estado "carregando": um esqueleto (skeleton) que imita o layout do
	// cartão enquanto a consulta à PubChem está em andamento. Dá a sensação
	// de que o resultado "vai aparecer ali".
	interface Props {
		termo: string; // o que está sendo buscado, para dar contexto
	}
	let { termo }: Props = $props();
</script>

<div class="envelope">
	<div class="status">
		<span class="spinner" aria-hidden="true"></span>
		<span class="texto">Consultando <strong>{termo}</strong> na base PubChem…</span>
	</div>

	<!-- Esqueleto do cartão (puramente decorativo). -->
	<div class="cartao" aria-hidden="true">
		<div class="col-estrutura">
			<div class="bloco" style="height:14px;width:60%"></div>
			<div class="bloco visor"></div>
		</div>
		<div class="col-info">
			<div class="bloco" style="height:26px;width:55%"></div>
			<div class="bloco" style="height:14px;width:40%;margin-top:12px"></div>
			<div class="grade">
				<div class="bloco caixa"></div>
				<div class="bloco caixa"></div>
				<div class="bloco caixa"></div>
				<div class="bloco caixa"></div>
			</div>
			<div class="bloco" style="height:14px;width:30%;margin-top:8px"></div>
			<div class="chips">
				<div class="bloco chip"></div>
				<div class="bloco chip"></div>
				<div class="bloco chip"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.envelope {
		padding: 30px;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 24px;
		font:
			500 14px var(--fonte-ui);
		color: var(--cor-texto-secundario);
	}
	.status strong {
		color: var(--cor-texto);
		font-weight: 700;
	}
	.spinner {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid var(--cor-borda);
		border-top-color: var(--cor-acento);
		animation: girar 0.8s linear infinite;
	}
	@keyframes girar {
		to {
			transform: rotate(360deg);
		}
	}

	.cartao {
		border: 1px solid var(--cor-borda);
		border-radius: var(--raio-cartao);
		overflow: hidden;
		background: var(--cor-painel);
		display: grid;
		grid-template-columns: 400px 1fr;
	}
	.col-estrutura {
		padding: 28px;
		background: var(--cor-painel-elevado);
		border-right: 1px solid var(--cor-borda);
	}
	.col-info {
		padding: 28px 30px;
	}
	.visor {
		height: 270px;
		margin-top: 18px;
		border-radius: 13px;
	}
	.grade {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
		margin: 20px 0;
	}
	.caixa {
		height: 84px;
		border-radius: var(--raio-painel);
	}
	.chips {
		display: flex;
		gap: 9px;
		margin-top: 12px;
	}
	.chip {
		height: 30px;
		width: 90px;
		border-radius: var(--raio-pilula);
	}

	/* Blocos "pulsam" para indicar carregamento. */
	.bloco {
		background: var(--cor-painel-elevado);
		border-radius: 6px;
		animation: pulsar 1.3s ease-in-out infinite;
	}
	@keyframes pulsar {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.45;
		}
	}

	@media (max-width: 860px) {
		.cartao {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 720px) {
		.envelope {
			padding: 16px;
		}
		.grade {
			grid-template-columns: 1fr 1fr;
		}
	}

	/* Respeita quem prefere menos movimento. */
	@media (prefers-reduced-motion: reduce) {
		.spinner,
		.bloco {
			animation: none;
		}
	}
</style>
