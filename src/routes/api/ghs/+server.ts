/*
  +server.ts — endpoint HTTP GET /api/ghs?cid=...

  Espelha /api/consulta: passa pelo MESMO backend (por CORS e pelo rate-limit
  central de `pubchem.ts`). O cliente cacheia o resultado 24h no localStorage
  (chave `ciq:ghs:<CID>`), então este endpoint não guarda estado.

  "Sem dados GHS" é um 200 normal (temDados:false), NÃO um erro — muitos
  compostos simplesmente não têm classificação GHS no PubChem.
*/

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { consultarGhs, ErroPubChem } from '$lib/pubchem';

export const GET: RequestHandler = async ({ url }) => {
	const cidBruto = url.searchParams.get('cid')?.trim() ?? '';
	const cid = Number(cidBruto);

	if (!cidBruto || !Number.isInteger(cid) || cid <= 0) {
		throw error(400, 'Parâmetro "cid" inteiro é obrigatório.');
	}

	try {
		return json(await consultarGhs(cid));
	} catch (e) {
		if (e instanceof ErroPubChem) {
			// GHS só falha "de verdade" quando o PubChem erra (não no 404 = sem dados).
			throw error(502, e.message);
		}
		throw error(502, 'Falha ao consultar o GHS na PubChem. Tente novamente.');
	}
};
