// Configuração do SvelteKit.
// O adapter transforma o app numa forma que a plataforma de deploy entende.
// Aqui usamos o adapter-netlify: o `+server.ts` vira uma Netlify Function
// (roda no servidor), e as páginas estáticas são publicadas na CDN.
import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// vitePreprocess habilita TypeScript (e outras sintaxes) dentro dos
	// blocos <script lang="ts"> dos componentes .svelte.
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
