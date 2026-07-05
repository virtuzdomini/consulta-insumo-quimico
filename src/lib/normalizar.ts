/*
  normalizar.ts — normalização de termos e detecção de CAS/fórmula (lógica pura).

  Este módulo NÃO acessa rede nem browser: são só funções puras, o que o torna
  fácil de testar (Vitest) e seguro para importar tanto no cliente (cache.ts)
  quanto no servidor (pubchem.ts).

  A normalização é a CAMADA A do suporte a português: uma mesma substância
  digitada de formas diferentes ("Dióxido de Titânio", "dióxido de titânio",
  "dioxido de titanio") tem que virar a MESMA string, para cair na mesma busca
  e na mesma chave de cache. O texto original (com acento) é preservado à parte,
  só para exibição.
*/

import { traduzirPtBr } from './data/nomes-ptbr';

/**
 * Forma canônica de um termo: sem acentos, minúsculo, sem espaços nas pontas
 * e com espaços internos colapsados. É esta forma que usamos em TRÊS pontos:
 * (1) busca ao PubChem, (2) autocomplete, (3) chave do cache.
 */
export function normalizar(q: string): string {
	return q
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // remove os diacriticos (acentos)
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ');
}

/**
 * Detecta um número CAS (ex.: "50-78-2", "13463-67-7"). O PubChem resolve CAS
 * nativamente pelo endpoint de nome, então basta reconhecê-lo. Case não importa.
 */
export function ehCas(termo: string): boolean {
	return /^\d{2,7}-\d{2}-\d$/.test(termo.trim());
}

/**
 * Detecta uma fórmula molecular (ex.: "H2O", "C9H8O4", "TiO2", "NaOH").
 *
 * IMPORTANTE: a checagem é sensível a maiúsculas/minúsculas e roda no texto
 * ORIGINAL (antes de normalizar), pois no PubChem "Co" (cobalto) ≠ "CO" (mon-
 * óxido de carbono). Exigimos ≥2 grupos de elemento (símbolo com inicial
 * maiúscula + letra minúscula opcional + contagem opcional) para não confundir
 * palavras comuns ("Water", "Iron", "Talco") com fórmula.
 */
export function ehFormula(termo: string): boolean {
	return /^(?:[A-Z][a-z]?\d*){2,}$/.test(termo.trim());
}

/** Como o termo deve ser consultado no PubChem, já resolvido pelas 3 camadas. */
export interface TermoResolvido {
	consulta: string; // o que enviar ao PubChem
	tipo: 'nome' | 'cas' | 'formula'; // como consultar (nome/CAS via /name, fórmula via /fastformula)
}

/**
 * Resolve o termo digitado nas 3 camadas de suporte a português, na ordem:
 *   1. CAS  → consulta o número como está (CAMADA C).
 *   2. Fórmula → consulta a fórmula como está, sensível a caixa (CAMADA C).
 *   3. Nome → normaliza (CAMADA A) e, se houver, traduz PT→EN pelo
 *      dicionário (CAMADA B); senão segue com o termo normalizado (CAMADA C
 *      fallback: o PubChem conhece alguns sinônimos em PT).
 *
 * `original` NÃO é alterado aqui — ele segue sendo usado só para exibição.
 */
export function resolverBusca(original: string): TermoResolvido {
	const bruto = original.trim();

	if (ehCas(bruto)) return { consulta: bruto, tipo: 'cas' };
	if (ehFormula(bruto)) return { consulta: bruto, tipo: 'formula' };

	const norm = normalizar(bruto);
	return { consulta: traduzirPtBr(norm) ?? norm, tipo: 'nome' };
}
