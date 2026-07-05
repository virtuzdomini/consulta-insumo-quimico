/*
  consulta.ts — pipeline de fetch/cache no cliente (fonte ÚNICA da verdade).

  Toda ida ao backend (/api/consulta, /api/ghs) passa por aqui, sempre checando
  antes o cache localStorage (24h). É reutilizado pela página de busca, pelo
  bloco GHS e pelas stores de comparação — nada de caminho de dados paralelo.
*/

import {
	lerCache,
	gravarCache,
	lerCacheConsultaCid,
	gravarCacheConsultaCid,
	lerCacheGhs,
	gravarCacheGhs
} from './cache';
import type { ResultadoConsulta, ResultadoGhs } from './types';

/** Erro tipado da busca, para a UI distinguir "não encontrado" de "falha". */
export class ErroBusca extends Error {
	constructor(
		public tipo: 'nao_encontrado' | 'falha',
		mensagem: string
	) {
		super(mensagem);
		this.name = 'ErroBusca';
	}
}

async function erroDaResposta(resp: Response): Promise<ErroBusca> {
	// O endpoint devolve { message } via error() do SvelteKit.
	const corpo = await resp.json().catch(() => null);
	const mensagem = corpo?.message ?? 'Não foi possível concluir a consulta.';
	return new ErroBusca(resp.status === 404 ? 'nao_encontrado' : 'falha', mensagem);
}

/** Consulta por nome. Cacheia por nome E por CID (p/ reidratar comparação). */
export async function buscarConsultaPorNome(nome: string): Promise<ResultadoConsulta> {
	const emCache = lerCache(nome);
	if (emCache) return emCache;

	const resp = await fetch(`/api/consulta?nome=${encodeURIComponent(nome)}`);
	if (!resp.ok) throw await erroDaResposta(resp);

	const dados = (await resp.json()) as ResultadoConsulta;
	gravarCache(nome, dados);
	gravarCacheConsultaCid(dados.cid, dados);
	return dados;
}

/** Consulta por CID. Usada ao reidratar a comparação a partir de CIDs salvos. */
export async function buscarConsultaPorCid(cid: number): Promise<ResultadoConsulta> {
	const emCache = lerCacheConsultaCid(cid);
	if (emCache) return emCache;

	const resp = await fetch(`/api/consulta?cid=${cid}`);
	if (!resp.ok) throw await erroDaResposta(resp);

	const dados = (await resp.json()) as ResultadoConsulta;
	gravarCacheConsultaCid(cid, dados);
	return dados;
}

/** Classificação GHS por CID (cache 24h). Lança em falha de rede/servidor. */
export async function buscarGhs(cid: number): Promise<ResultadoGhs> {
	const emCache = lerCacheGhs(cid);
	if (emCache) return emCache;

	const resp = await fetch(`/api/ghs?cid=${cid}`);
	if (!resp.ok) throw new ErroBusca('falha', `GHS respondeu ${resp.status}.`);

	const dados = (await resp.json()) as ResultadoGhs;
	gravarCacheGhs(cid, dados);
	return dados;
}
