import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Vite é o bundler/dev-server por baixo do SvelteKit.
// Só precisamos plugar o plugin do SvelteKit; o resto é convenção.
export default defineConfig({
	plugins: [sveltekit()]
});
