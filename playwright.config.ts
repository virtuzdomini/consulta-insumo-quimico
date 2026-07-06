import { defineConfig, devices } from '@playwright/test';

/*
  Configuração do Playwright — 1 fluxo ponta a ponta (buscar → ver a ficha).

  O `webServer` builda e sobe o preview de PRODUÇÃO antes dos testes, para
  exercitar o mesmo caminho do deploy (endpoints /api reais → PubChem).
  Localmente reaproveita um servidor já rodando; no CI sempre sobe um novo.
*/
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['list']] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
