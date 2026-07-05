/*
  +server.ts — endpoint HTTP GET /api/autocomplete?termo=...

  Espelha /api/consulta, mas para sugestões de digitação. Passar pelo servidor
  (em vez de o navegador chamar o PubChem direto) mantém tudo sob o mesmo
  limitador de taxa central e evita depender de CORS do endpoint de autocomplete.

  Sempre responde 200 com um array (possivelmente vazio): autocomplete é um
  "extra" e nunca deve fazer a UI mostrar erro.
*/

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sugerir } from '$lib/pubchem';

export const GET: RequestHandler = async ({ url }) => {
	const termo = url.searchParams.get('termo')?.trim() ?? '';
	if (termo.length < 2) return json([]);

	try {
		return json(await sugerir(termo));
	} catch {
		return json([]); // best-effort: falha silenciosa
	}
};
