/*
  +server.ts — endpoint HTTP GET /api/consulta?nome=...

  Num arquivo +server.ts, cada função exportada (GET, POST, ...) vira um
  handler de rota que roda NO SERVIDOR. O navegador (no +page.svelte) só
  chama /api/consulta?nome=aspirina e recebe JSON de volta — toda a
  conversa com a PubChem fica escondida aqui.
*/

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { consultarInsumo, ErroPubChem } from '$lib/pubchem';

export const GET: RequestHandler = async ({ url }) => {
	// Lê o parâmetro ?nome= da URL.
	const nome = url.searchParams.get('nome')?.trim() ?? '';

	if (!nome) {
		// 400 = requisição malformada (faltou o termo de busca).
		throw error(400, 'Parâmetro "nome" é obrigatório.');
	}

	try {
		const resultado = await consultarInsumo(nome);
		return json(resultado);
	} catch (e) {
		if (e instanceof ErroPubChem) {
			// Traduzimos o tipo do erro de domínio para um status HTTP:
			//   nao_encontrado -> 404   |   falha -> 502 (erro do upstream)
			const status = e.tipo === 'nao_encontrado' ? 404 : 502;
			throw error(status, e.message);
		}
		// Qualquer outra coisa (rede caiu, JSON inválido...) vira 502.
		throw error(502, 'Falha ao consultar a PubChem. Tente novamente.');
	}
};
