/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Vite é o bundler/dev-server por baixo do SvelteKit.
// Só precisamos plugar o plugin do SvelteKit; o resto é convenção.
export default defineConfig({
	plugins: [sveltekit()],
	// Vitest roda a lógica PURA ($lib): normalização, dicionário, detecção de
	// CAS/fórmula e o parser GHS. Os testes ponta a ponta (Playwright) ficam em
	// `e2e/` e são excluídos daqui para não se misturarem.
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['e2e/**', 'node_modules/**'],
		environment: 'node'
	}
});
