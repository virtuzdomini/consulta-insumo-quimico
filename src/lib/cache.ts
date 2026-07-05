/*
  cache.ts — cache client das consultas, guardado no localStorage do navegador.

  Motivo: se o usuário busca "etanol" várias vezes no mesmo dia, não faz sentido
  repetir a ida ao PubChem. Guardamos o ResultadoConsulta já pronto e o servimos
  instantaneamente enquanto ele não "envelhecer" (TTL).

  É best-effort: se o localStorage estiver indisponível (modo privado, quota
  cheia, SSR), tudo aqui degrada em silêncio — a busca normal continua funcionando.
*/

import type { ResultadoConsulta } from './types';

const PREFIXO = 'ciq:consulta:';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

interface Entrada {
	em: number; // timestamp (ms) de quando foi gravado
	dados: ResultadoConsulta;
}

/** Normaliza o termo para virar chave (ignora caixa e espaços nas pontas). */
function chave(termo: string): string {
	return PREFIXO + termo.trim().toLowerCase();
}

/** localStorage só existe no navegador; no SSR retorna null. */
function armazenamento(): Storage | null {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
}

/** Devolve o resultado em cache para `termo`, ou null se não houver / expirou. */
export function lerCache(termo: string): ResultadoConsulta | null {
	const store = armazenamento();
	if (!store) return null;
	try {
		const bruto = store.getItem(chave(termo));
		if (!bruto) return null;
		const entrada = JSON.parse(bruto) as Entrada;
		if (Date.now() - entrada.em > TTL_MS) {
			store.removeItem(chave(termo));
			return null;
		}
		return entrada.dados;
	} catch {
		return null; // JSON corrompido ou acesso negado
	}
}

/** Grava o resultado de `termo` no cache. Falha silenciosa se não der. */
export function gravarCache(termo: string, dados: ResultadoConsulta): void {
	const store = armazenamento();
	if (!store) return;
	try {
		const entrada: Entrada = { em: Date.now(), dados };
		store.setItem(chave(termo), JSON.stringify(entrada));
	} catch {
		// quota cheia ou indisponível — cache é opcional, seguimos sem ele.
	}
}
