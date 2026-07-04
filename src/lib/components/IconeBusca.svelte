<script lang="ts">
	// Ícone de lupa, reaproveitado na barra grande, na compacta e no botão.
	// Recebe tamanho e cor por props para servir a todos os contextos.
	interface Props {
		tamanho?: number;
		cor?: string;
	}
	let { tamanho = 20, cor = 'var(--cor-texto-secundario)' }: Props = $props();
</script>

<svg
	width={tamanho}
	height={tamanho}
	viewBox="0 0 24 24"
	fill="none"
	stroke={cor}
	stroke-width="2"
	aria-hidden="true"
>
	<circle cx="10.5" cy="10.5" r="6.5" />
	<line x1="15.5" y1="15.5" x2="21" y2="21" />
</svg>
