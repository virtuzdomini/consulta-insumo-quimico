<script lang="ts">
	// Botão de alternar tema (claro/escuro) no cabeçalho.
	//
	// A fonte da verdade é o atributo `data-tema` em <html>, que o script inline
	// do app.html já definiu antes da 1ª pintura (a partir do localStorage ou do
	// prefers-color-scheme). Aqui apenas sincronizamos no mount e alternamos no
	// clique, persistindo a escolha.
	import { onMount } from 'svelte';

	let tema = $state<'claro' | 'escuro'>('escuro');

	onMount(() => {
		tema = document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'escuro';
	});

	function alternar() {
		tema = tema === 'escuro' ? 'claro' : 'escuro';
		document.documentElement.setAttribute('data-tema', tema);
		try {
			localStorage.setItem('ciq:tema', tema);
		} catch {
			/* sem persistência se o localStorage estiver indisponível */
		}
	}
</script>

<button
	class="toggle"
	type="button"
	onclick={alternar}
	aria-label={tema === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
	title={tema === 'escuro' ? 'Modo claro' : 'Modo escuro'}
>
	{#if tema === 'escuro'}
		<!-- sol (indica que um clique vai para o modo claro) -->
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
			<circle cx="12" cy="12" r="4.2" />
			<line x1="12" y1="2.5" x2="12" y2="5" />
			<line x1="12" y1="19" x2="12" y2="21.5" />
			<line x1="2.5" y1="12" x2="5" y2="12" />
			<line x1="19" y1="12" x2="21.5" y2="12" />
			<line x1="5.2" y1="5.2" x2="6.9" y2="6.9" />
			<line x1="17.1" y1="17.1" x2="18.8" y2="18.8" />
			<line x1="5.2" y1="18.8" x2="6.9" y2="17.1" />
			<line x1="17.1" y1="6.9" x2="18.8" y2="5.2" />
		</svg>
	{:else}
		<!-- lua (indica que um clique vai para o modo escuro) -->
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M20 14.5A8 8 0 1 1 9.5 4 6.2 6.2 0 0 0 20 14.5Z" />
		</svg>
	{/if}
</button>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: 1px solid var(--cor-borda);
		color: var(--cor-texto-secundario);
		background: var(--cor-painel);
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}
	.toggle:hover {
		color: var(--cor-acento);
		border-color: var(--cor-acento);
	}
</style>
