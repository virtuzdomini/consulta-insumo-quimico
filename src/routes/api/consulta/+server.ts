/*
  +server.ts — endpoint HTTP GET /api/consulta?nome=... OU ?cid=...

  Num arquivo +server.ts, cada função exportada (GET, POST, ...) vira um
  handler de rota que roda NO SERVIDOR. O navegador só chama
  /api/consulta?nome=aspirina (ou ?cid=1140, usado para reidratar a comparação)
  e recebe JSON de volta — toda a conversa com a PubChem fica escondida aqui.
*/

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { consultarInsumo, consultarInsumoPorCid, ErroPubChem } from '$lib/pubchem';

export const GET: RequestHandler = async ({ url }) => {
	const nome = url.searchParams.get('nome')?.trim() ?? '';
	const cidBruto = url.searchParams.get('cid')?.trim() ?? '';

	if (!nome && !cidBruto) {
		// 400 = requisição malformada (faltou o termo de busca).
		throw error(400, 'Informe "nome" ou "cid".');
	}

	// Valida o CID FORA do try — senão o error(400) cairia no catch e viraria 502.
	const cid = cidBruto ? Number(cidBruto) : null;
	if (cidBruto && (cid == null || !Number.isInteger(cid) || cid <= 0)) {
		throw error(400, 'Parâmetro "cid" inválido.');
	}

	try {
		const resultado = cid != null ? await consultarInsumoPorCid(cid) : await consultarInsumo(nome);
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
