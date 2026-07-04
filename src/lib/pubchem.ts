/*
  pubchem.ts — camada de acesso à PubChem PUG-REST.

  IMPORTANTE: este módulo roda SÓ NO SERVIDOR (é importado pelo +server.ts).
  Isso resolve dois problemas:
    1. CORS — a PUG-REST não manda cabeçalhos que permitam chamada direta do
       navegador; do servidor, não há essa restrição.
    2. Rate limit — a PubChem pede no máximo ~5 requisições por segundo.
       Concentrando as chamadas aqui, conseguimos aplicar um limitador global.

  Uma consulta completa encadeia 3 chamadas:
    nome  -> CID            (resolve o identificador)
    CID   -> propriedades   (fórmula, massa, logP, TPSA, doadores/aceptores H)
    CID   -> sinônimos      (de onde também extraímos o CAS)
  A imagem 2D NÃO é buscada aqui: é só uma URL que o <img> do navegador carrega.
*/

import type { Propriedade, ResultadoConsulta } from './types';

const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

/* ------------------------------------------------------------------ */
/*  Limitador de taxa: no máximo 5 requisições por segundo (1 a cada  */
/*  200 ms). Implementação simples de "espaçamento": cada chamada     */
/*  espera até 200 ms depois do INÍCIO da chamada anterior.           */
/* ------------------------------------------------------------------ */

const INTERVALO_MS = 1000 / 5; // 200 ms entre requisições
let proximoSlot = 0; // timestamp (ms) em que a próxima requisição pode partir

function esperar(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enfileira uma requisição respeitando o limite de 5 req/s.
 * Chamadas concorrentes recebem "slots" de tempo espaçados de 200 ms,
 * garantindo que nunca ultrapassemos a taxa mesmo com várias buscas juntas.
 */
async function requisitar(url: string): Promise<Response> {
	const agora = Date.now();
	// Se o próximo slot livre está no futuro, espera até lá; senão, parte já.
	const partida = Math.max(agora, proximoSlot);
	proximoSlot = partida + INTERVALO_MS; // reserva o slot seguinte
	const atraso = partida - agora;
	if (atraso > 0) await esperar(atraso);

	return fetch(url, {
		headers: {
			Accept: 'application/json',
			// A NCBI pede que ferramentas se identifiquem no User-Agent.
			'User-Agent': 'ConsultaInsumoQuimico/0.1 (SvelteKit)'
		}
	});
}

/* ------------------------------------------------------------------ */
/*  Helpers de formatação (deixam os dados "prontos para a tela")     */
/* ------------------------------------------------------------------ */

const SUBSCRITOS: Record<string, string> = {
	'0': '₀',
	'1': '₁',
	'2': '₂',
	'3': '₃',
	'4': '₄',
	'5': '₅',
	'6': '₆',
	'7': '₇',
	'8': '₈',
	'9': '₉'
};

/** Converte "C9H8O4" em "C₉H₈O₄" (dígitos viram subscritos Unicode). */
function formatarFormula(formula: string): string {
	return formula.replace(/\d/g, (d) => SUBSCRITOS[d] ?? d);
}

/**
 * Formata um número no padrão pt-BR (vírgula decimal), com no máximo
 * `casas` casas decimais. Aceita string ou number (a PubChem às vezes
 * devolve números como string).
 */
function formatarNumero(valor: string | number, casas = 2): string {
	const n = typeof valor === 'string' ? Number(valor) : valor;
	if (!Number.isFinite(n)) return String(valor);
	return n.toLocaleString('pt-BR', {
		minimumFractionDigits: 0,
		maximumFractionDigits: casas
	});
}

/** Extrai o primeiro sinônimo que tem cara de número CAS (ex.: 50-78-2). */
function extrairCas(sinonimos: string[]): string | null {
	const padraoCas = /^\d{2,7}-\d{2}-\d$/;
	return sinonimos.find((s) => padraoCas.test(s)) ?? null;
}

/**
 * A PubChem devolve centenas de sinônimos, muitos são códigos de registro
 * (DTXSID, CHEMBL, InChI, puro número...). Aqui filtramos para uma lista
 * curta e legível — o que faz sentido mostrar num cartão.
 */
function curarSinonimos(sinonimos: string[]): string[] {
	const ehCodigo = (s: string) =>
		/^\d/.test(s) || // começa com dígito (CAS, IDs numéricos)
		/^(DTXSID|CHEMBL|SCHEMBL|CHEBI|UNII|MFCD|EINECS|EC |NSC|AKOS|InChI)/i.test(s) ||
		/^[A-Z0-9\-]{8,}$/.test(s) || // códigos longos em maiúsculas/dígitos
		s.length > 45; // nomes exageradamente longos

	const vistos = new Set<string>();
	const curados: string[] = [];
	for (const s of sinonimos) {
		const limpo = s.trim();
		const chave = limpo.toLowerCase();
		if (!limpo || ehCodigo(limpo) || vistos.has(chave)) continue;
		vistos.add(chave);
		curados.push(limpo);
		if (curados.length >= 8) break; // no máximo 8 chips
	}
	return curados;
}

/** Deixa a primeira letra do termo buscado maiúscula, para o título. */
function capitalizar(texto: string): string {
	const t = texto.trim();
	return t.charAt(0).toUpperCase() + t.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Forma bruta das respostas da PUG-REST (só o que usamos)           */
/* ------------------------------------------------------------------ */

interface RespostaCids {
	IdentifierList?: { CID: number[] };
}

interface RespostaPropriedades {
	PropertyTable?: {
		Properties: Array<{
			CID: number;
			MolecularFormula?: string;
			MolecularWeight?: string | number;
			XLogP?: number;
			TPSA?: number;
			HBondDonorCount?: number;
			HBondAcceptorCount?: number;
			IUPACName?: string;
		}>;
	};
}

interface RespostaSinonimos {
	InformationList?: {
		Information: Array<{ CID: number; Synonym?: string[] }>;
	};
}

/* ------------------------------------------------------------------ */
/*  Erro tipado — o +server.ts usa `tipo` para escolher o status HTTP */
/* ------------------------------------------------------------------ */

export class ErroPubChem extends Error {
	constructor(
		public tipo: 'nao_encontrado' | 'falha',
		mensagem: string
	) {
		super(mensagem);
		this.name = 'ErroPubChem';
	}
}

/* ------------------------------------------------------------------ */
/*  Passo 1 — resolver nome -> CID                                     */
/* ------------------------------------------------------------------ */

async function resolverCid(nome: string): Promise<number> {
	const url = `${BASE}/compound/name/${encodeURIComponent(nome)}/cids/JSON`;
	const resp = await requisitar(url);

	// A PubChem responde 404 quando o nome não bate com nenhum composto.
	if (resp.status === 404) {
		throw new ErroPubChem('nao_encontrado', `Nenhum composto encontrado para "${nome}".`);
	}
	if (!resp.ok) {
		throw new ErroPubChem('falha', `PubChem respondeu ${resp.status} ao resolver o nome.`);
	}

	const dados = (await resp.json()) as RespostaCids;
	const cid = dados.IdentifierList?.CID?.[0];
	if (cid == null) {
		throw new ErroPubChem('nao_encontrado', `Nenhum composto encontrado para "${nome}".`);
	}
	return cid;
}

/* ------------------------------------------------------------------ */
/*  Passo 2 — CID -> propriedades físico-químicas                     */
/* ------------------------------------------------------------------ */

async function buscarPropriedades(cid: number) {
	const campos =
		'MolecularFormula,MolecularWeight,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,IUPACName';
	const url = `${BASE}/compound/cid/${cid}/property/${campos}/JSON`;
	const resp = await requisitar(url);

	if (!resp.ok) {
		throw new ErroPubChem('falha', `PubChem respondeu ${resp.status} ao buscar propriedades.`);
	}

	const dados = (await resp.json()) as RespostaPropriedades;
	const props = dados.PropertyTable?.Properties?.[0];
	if (!props) {
		throw new ErroPubChem('falha', 'Propriedades não vieram na resposta da PubChem.');
	}
	return props;
}

/* ------------------------------------------------------------------ */
/*  Passo 3 — CID -> sinônimos                                         */
/* ------------------------------------------------------------------ */

async function buscarSinonimos(cid: number): Promise<string[]> {
	const url = `${BASE}/compound/cid/${cid}/synonyms/JSON`;
	const resp = await requisitar(url);

	// Sinônimos são "bônus": se falharem, seguimos sem eles em vez de quebrar.
	if (!resp.ok) return [];

	const dados = (await resp.json()) as RespostaSinonimos;
	return dados.InformationList?.Information?.[0]?.Synonym ?? [];
}

/* ------------------------------------------------------------------ */
/*  Orquestração — junta os 3 passos num ResultadoConsulta pronto      */
/* ------------------------------------------------------------------ */

export async function consultarInsumo(nome: string): Promise<ResultadoConsulta> {
	const termo = nome.trim();
	if (!termo) {
		throw new ErroPubChem('nao_encontrado', 'Informe o nome de uma substância.');
	}

	// 1) nome -> CID
	const cid = await resolverCid(termo);

	// 2) e 3) rodam em sequência (o limitador já espaça em 200 ms cada).
	const props = await buscarPropriedades(cid);
	const sinonimosBrutos = await buscarSinonimos(cid);

	// Monta as 4 propriedades do cartão, na ordem do design.
	const propriedades: Propriedade[] = [
		{
			rotulo: 'logP',
			valor: props.XLogP != null ? formatarNumero(props.XLogP) : '—',
			descricao: 'lipofilicidade'
		},
		{
			rotulo: 'TPSA',
			valor: props.TPSA != null ? formatarNumero(props.TPSA, 1) : '—',
			unidade: 'Å²',
			descricao: 'área polar'
		},
		{
			rotulo: 'Doadores H',
			valor: props.HBondDonorCount != null ? String(props.HBondDonorCount) : '—',
			descricao: 'de hidrogênio'
		},
		{
			rotulo: 'Aceptores H',
			valor: props.HBondAcceptorCount != null ? String(props.HBondAcceptorCount) : '—',
			descricao: 'de hidrogênio'
		}
	];

	return {
		cid,
		nome: capitalizar(termo),
		nomeIupac: props.IUPACName ?? null,
		formula: props.MolecularFormula ? formatarFormula(props.MolecularFormula) : '—',
		massaMolar: props.MolecularWeight != null ? `${formatarNumero(props.MolecularWeight)} g/mol` : '—',
		cas: extrairCas(sinonimosBrutos),
		propriedades,
		sinonimos: curarSinonimos(sinonimosBrutos),
		// Endpoint de imagem 2D. ?image_size=large deixa o PNG mais nítido.
		imagemUrl: `${BASE}/compound/cid/${cid}/PNG?image_size=large`
	};
}
