/*
  nomes-ptbr.ts — dicionário PT→EN de insumos químicos (CAMADA B).

  O PubChem entende bem nomes em INGLÊS, mas mal (ou nada) em português. Este
  dicionário mapeia o nome em português JÁ NORMALIZADO (sem acento, minúsculo,
  espaços colapsados — ver `normalizar`) para o nome canônico em inglês que o
  PubChem resolve com segurança.

  COMO ESTENDER:
    - A CHAVE deve estar na forma normalizada: sem acentos, tudo minúsculo,
      um espaço entre palavras. Ex.: "Dióxido de Titânio" → "dioxido de titanio".
    - O VALOR é o nome em inglês que o PubChem reconhece. Na dúvida, teste em
      https://pubchem.ncbi.nlm.nih.gov/ e use o nome do composto.
    - Adicione uma linha nova, mantendo a ordem alfabética por conveniência.

  Termos que não estiverem aqui seguem para a CAMADA C (fallback): o próprio
  termo normalizado vai ao PubChem, que conhece alguns sinônimos em PT, além
  de CAS e fórmula.
*/

/** Nome PT normalizado → nome canônico EN que o PubChem entende. */
export const NOMES_PTBR: Record<string, string> = {
	// --- insumos típicos do laboratório de tintas ---
	'dioxido de titanio': 'titanium dioxide',
	tolueno: 'toluene',
	butilglicol: '2-butoxyethanol',
	dolomita: 'dolomite',
	quartzo: 'quartz',
	'carbonato de calcio': 'calcium carbonate',
	caulim: 'kaolin',
	talco: 'talc',
	// --- químicos comuns ---
	amonia: 'ammonia',
	agua: 'water',
	'acido sulfurico': 'sulfuric acid',
	'hidroxido de sodio': 'sodium hydroxide',
	etanol: 'ethanol',
	acetona: 'acetone',
	xileno: 'xylene'
};

/**
 * Procura o nome EN correspondente a um termo PT JÁ NORMALIZADO.
 * Retorna `null` quando não há entrada — aí o fluxo cai na CAMADA C.
 *
 * O termo já deve vir normalizado (ver `normalizar`); mantemos a assinatura
 * simples de propósito, para a função ser trivial de testar isoladamente.
 */
export function traduzirPtBr(normalizado: string): string | null {
	return NOMES_PTBR[normalizado] ?? null;
}
