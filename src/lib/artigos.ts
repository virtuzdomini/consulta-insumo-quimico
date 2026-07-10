import { gravarCacheArtigos, lerCacheArtigos } from './cache';
import type { ResultadoArtigos } from './types';

interface BuscarArtigosParams {
	cid: number;
	nome: string;
	cas: string | null;
	nomeIupac: string | null;
}

export async function buscarArtigosRecentes({
	cid,
	nome,
	cas,
	nomeIupac
}: BuscarArtigosParams): Promise<ResultadoArtigos> {
	const emCache = lerCacheArtigos(cid);
	if (emCache) return emCache;

	const params = new URLSearchParams({ nome });
	if (cas) params.set('cas', cas);
	if (nomeIupac) params.set('iupac', nomeIupac);

	const resp = await fetch(`/api/artigos?${params.toString()}`);
	if (!resp.ok) throw new Error(`Artigos respondeu ${resp.status}.`);

	const dados = (await resp.json()) as ResultadoArtigos;
	gravarCacheArtigos(cid, dados);
	return dados;
}
