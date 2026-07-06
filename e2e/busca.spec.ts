import { test, expect } from '@playwright/test';

/*
  Fluxo ponta a ponta: da Home, buscar "Dióxido de Titânio" (com acento e caixa
  mista) e ver a ficha técnica renderizada.

  Exercita a pilha inteira: normalização + dicionário PT→EN no servidor, chamada
  real ao PubChem e a UI. Por isso depende da disponibilidade do PubChem; o
  timeout é generoso e há 1 retry no CI.
*/
test('buscar "Dióxido de Titânio" mostra a ficha', async ({ page }) => {
	await page.goto('/');

	// Home: título e a barra de busca grande.
	await expect(page.getByRole('heading', { name: /consultar hoje/i })).toBeVisible();

	const campo = page.locator('[data-campo-busca]');
	await campo.fill('Dióxido de Titânio');
	await page.getByRole('button', { name: 'Buscar' }).click();

	// A URL reflete a busca (?q=), fonte da verdade do estado.
	await expect(page).toHaveURL(/\?q=/);

	// A ficha aparece: nome de exibição preserva o texto original (com acento),
	// e há o link "Ver no PubChem" (só existe na ficha).
	await expect(page.getByRole('heading', { name: /Dióxido de Titânio/i })).toBeVisible({
		timeout: 30_000
	});
	await expect(page.getByRole('link', { name: /Ver no PubChem/i })).toBeVisible();
});
