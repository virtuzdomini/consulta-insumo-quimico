/*
  cache.ts — cache client no localStorage (consultas e classificação GHS).

  Motivo: se o usuário busca "etanol" várias vezes no mesmo dia, não faz sentido
  repetir a ida ao PubChem. Guardamos o resultado já pronto e o servimos
  instantaneamente enquanto ele não "envelhecer" (TTL).

  É best-effort: se o localStorage estiver indisponível (modo privado, quota
  cheia, SSR), tudo aqui degrada em silêncio — a busca normal continua funcionando.

  A mesma mecânica (TTL 24h + storage) serve para dois espaços de chave:
    - consultas:  `ciq:consulta:<termo>`
    - GHS:        `ciq:ghs:<CID>`
*/

import type { ResultadoConsulta, ResultadoGhs } from './types';

const PREFIXO_CONSULTA = 'ciq:consulta:';
const PREFIXO_GHS = 'ciq:ghs:';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface Entrada<T> {
	em: number; // timestamp (ms) de quando foi gravado
	dados: T;
}

/** localStorage só existe no navegador; no SSR retorna null. */
function armazenamento(): Storage | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
}

/** Núcleo genérico de leitura: devolve os dados válidos ou null (e limpa se expirou). */
function ler<T>(chave: string): T | null {
	const store = armazenamento();
	if (!store) return null;
	try {
		const bruto = store.getItem(chave);
		if (!bruto) return null;
		const entrada = JSON.parse(bruto) as Entrada<T>;
		if (Date.now() - entrada.em > TTL_MS) {
			store.removeItem(chave);
			return null;
		}
		return entrada.dados;
	} catch {
		return null; // JSON corrompido ou acesso negado
	}
}

/** Núcleo genérico de escrita. Falha silenciosa se não der. */
function gravar<T>(chave: string, dados: T): void {
	const store = armazenamento();
	if (!store) return;
	try {
		const entrada: Entrada<T> = { em: Date.now(), dados };
		store.setItem(chave, JSON.stringify(entrada));
	} catch {
		// quota cheia ou indisponível — cache é opcional, seguimos sem ele.
	}
}

/* ---- Consultas (por termo) ---- */

/** Normaliza o termo para virar chave (ignora caixa e espaços nas pontas). */
function chaveConsulta(termo: string): string {
	return PREFIXO_CONSULTA + termo.trim().toLowerCase();
}

export function lerCache(termo: string): ResultadoConsulta | null {
	return ler<ResultadoConsulta>(chaveConsulta(termo));
}

export function gravarCache(termo: string, dados: ResultadoConsulta): void {
	gravar(chaveConsulta(termo), dados);
}

/* ---- GHS (por CID) — mesma mecânica, espaço de chave separado ---- */

export function lerCacheGhs(cid: number): ResultadoGhs | null {
	return ler<ResultadoGhs>(PREFIXO_GHS + cid);
}

export function gravarCacheGhs(cid: number, dados: ResultadoGhs): void {
	gravar(PREFIXO_GHS + cid, dados);
}
