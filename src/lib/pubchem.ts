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

import type { Propriedade, ResultadoConsulta, ResultadoGhs, FraseH, NivelAdvertencia } from './types';
import { extrairCodigoGhs, rotuloGhs } from './ghs';
import { resolverBusca, normalizar } from './normalizar';
import { traduzirPtBr } from './data/nomes-ptbr';

const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
// O autocomplete fica FORA do PUG-REST (caminho /rest/autocomplete/...).
const BASE_AUTOCOMPLETE = 'https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound';
// GHS vive no PUG-View (texto estruturado por seções), não no PUG-REST.
const BASE_VIEW = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view';

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

interface RespostaAutocomplete {
	dictionary_terms?: { compound?: string[] };
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

/**
 * Resolve uma FÓRMULA molecular -> CID pelo endpoint fastformula (o endpoint de
 * nome não entende fórmula). Sensível a maiúsculas/minúsculas: "CO" ≠ "Co".
 */
async function resolverCidPorFormula(formula: string): Promise<number> {
	const url = `${BASE}/compound/fastformula/${encodeURIComponent(formula)}/cids/JSON`;
	const resp = await requisitar(url);

	if (resp.status === 404) {
		throw new ErroPubChem('nao_encontrado', `Nenhum composto encontrado para "${formula}".`);
	}
	if (!resp.ok) {
		throw new ErroPubChem('falha', `PubChem respondeu ${resp.status} ao resolver a fórmula.`);
	}

	const dados = (await resp.json()) as RespostaCids;
	const cid = dados.IdentifierList?.CID?.[0];
	if (cid == null) {
		throw new ErroPubChem('nao_encontrado', `Nenhum composto encontrado para "${formula}".`);
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

type PropsBrutas = Awaited<ReturnType<typeof buscarPropriedades>>;

/**
 * Monta o ResultadoConsulta final a partir das partes já buscadas.
 * Compartilhado pela consulta por nome e por CID (mesma forma de saída).
 */
function montarResultado(
	cid: number,
	props: PropsBrutas,
	sinonimosBrutos: string[],
	nome: string
): ResultadoConsulta {
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
		nome,
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

export async function consultarInsumo(nome: string): Promise<ResultadoConsulta> {
	const original = nome.trim();
	if (!original) {
		throw new ErroPubChem('nao_encontrado', 'Informe o nome de uma substância.');
	}

	// CAMADAS A/B/C: decide O QUE (e COMO) consultar a partir do termo digitado.
	//   - nome/CAS  → endpoint de nome (o PubChem resolve CAS nativamente)
	//   - fórmula   → endpoint fastformula
	// O `original` (com acento, como digitado) é preservado só para exibição.
	const { consulta, tipo } = resolverBusca(original);

	// 1) termo -> CID
	let cid: number;
	try {
		cid = tipo === 'formula' ? await resolverCidPorFormula(consulta) : await resolverCid(consulta);
	} catch (e) {
		// Não achou por nenhum caminho: troca o "não encontrado" seco por uma
		// mensagem que ORIENTA o usuário (CAMADA C), citando o termo original.
		if (e instanceof ErroPubChem && e.tipo === 'nao_encontrado') {
			throw new ErroPubChem(
				'nao_encontrado',
				`Não encontrei "${original}". Tente o nome em inglês, o número CAS ou a fórmula.`
			);
		}
		throw e;
	}

	// 2) e 3) rodam em sequência (o limitador já espaça em 200 ms cada).
	const props = await buscarPropriedades(cid);
	const sinonimosBrutos = await buscarSinonimos(cid);

	return montarResultado(cid, props, sinonimosBrutos, capitalizar(original));
}

/**
 * Consulta direto por CID (usada para reidratar a comparação a partir da URL
 * ou do localStorage). Reutiliza os mesmos passos 2 e 3, pulando o resolver
 * nome→CID. O nome de exibição vem do melhor sinônimo curado, ou do IUPAC.
 */
export async function consultarInsumoPorCid(cid: number): Promise<ResultadoConsulta> {
	if (!Number.isInteger(cid) || cid <= 0) {
		throw new ErroPubChem('nao_encontrado', 'CID inválido.');
	}

	const props = await buscarPropriedades(cid);
	const sinonimosBrutos = await buscarSinonimos(cid);

	const curados = curarSinonimos(sinonimosBrutos);
	const nome = capitalizar(curados[0] ?? props.IUPACName ?? `CID ${cid}`);

	return montarResultado(cid, props, sinonimosBrutos, nome);
}

/* ------------------------------------------------------------------ */
/*  Autocomplete — sugestões de nomes conforme o usuário digita        */
/* ------------------------------------------------------------------ */

/**
 * Sugere nomes de compostos a partir de um prefixo, usando o endpoint de
 * autocomplete do PubChem (bem mais rápido que resolver o composto inteiro).
 * É best-effort: qualquer falha vira lista vazia, sem quebrar a digitação.
 */
export async function sugerir(termo: string, limite = 8): Promise<string[]> {
	const t = termo.trim();
	if (t.length < 2) return []; // 1 letra gera ruído demais
	// CAMADA A/B: consulta o autocomplete pela forma normalizada e, se o termo
	// já bater no dicionário PT→EN, pelo nome em inglês — assim "dióxido" e
	// "tolueno" sugerem os compostos certos.
	const norm = normalizar(t);
	const consulta = traduzirPtBr(norm) ?? norm;
	const url = `${BASE_AUTOCOMPLETE}/${encodeURIComponent(consulta)}/json?limit=${limite}`;
	const resp = await requisitar(url);
	if (!resp.ok) return [];
	const dados = (await resp.json()) as RespostaAutocomplete;
	return dados.dictionary_terms?.compound ?? [];
}

/* ================================================================== */
/*  Classificação de segurança GHS (PUG-View)                          */
/* ================================================================== */

/* ---- Forma bruta do PUG-View (só o que usamos) ---- */

interface MarkupPV {
	URL?: string;
	Type?: string;
	Extra?: string;
}
interface StringComMarkupPV {
	String?: string;
	Markup?: MarkupPV[];
}
interface InfoPV {
	ReferenceNumber?: number;
	Name?: string;
	Value?: { StringWithMarkup?: StringComMarkupPV[] };
}
interface SecaoPV {
	TOCHeading?: string;
	Section?: SecaoPV[];
	Information?: InfoPV[];
}
interface ReferenciaPV {
	ReferenceNumber?: number;
	SourceName?: string;
}
interface RespostaPugView {
	Record?: { Section?: SecaoPV[]; Reference?: ReferenciaPV[] };
}

/** Resultado vazio (composto sem GHS) — caso NORMAL, não erro. */
function ghsVazio(): ResultadoGhs {
	return {
		temDados: false,
		fonte: null,
		pictogramas: [],
		advertencia: null,
		frasesH: [],
		codigosP: []
	};
}

/** Acha uma subseção pelo TOCHeading exato. */
function acharSecao(secoes: SecaoPV[] | undefined, heading: string): SecaoPV | undefined {
	return secoes?.find((s) => s.TOCHeading === heading);
}

/**
 * Parseia uma frase H: "H225 (> 99.9%): Highly Flammable liquid and vapor [Danger …]"
 * → { codigo: "H225", descricao: "Highly Flammable liquid and vapor", percentual: "> 99.9%" }.
 */
export function parseFraseH(texto: string): FraseH | null {
	const codigo = texto.match(/H\d{3}/)?.[0];
	if (!codigo) return null;
	// percentual (quando existe) vem entre parênteses e contém "%".
	const percentual = texto.match(/\(([^)]*%[^)]*)\)/)?.[1]?.trim();
	// descrição fica entre o primeiro ": " e o " [" (ou o fim da string).
	let descricao = '';
	const idx = texto.indexOf(': ');
	if (idx >= 0) {
		descricao = texto.slice(idx + 2).trim();
		const colchete = descricao.indexOf(' [');
		if (colchete >= 0) descricao = descricao.slice(0, colchete).trim();
	}
	return { codigo, descricao, percentual: percentual || undefined };
}

/** Separa "P210, P233, and P501" em ["P210","P233","P501"] (aceita combos P301+P312). */
export function parseCodigosP(texto: string): string[] {
	const out: string[] = [];
	for (const parte of texto.split(',')) {
		const m = parte.match(/P\d{3}(?:\+P\d{3})*/);
		if (m) out.push(m[0]);
	}
	return out;
}

/**
 * Busca a classificação GHS de um CID no PUG-View e delega o parsing puro a
 * `parsearGhs`. Só a parte de REDE (URL, 404, status) vive aqui; a lógica
 * multi-fonte é testável isoladamente.
 *
 *  - 404 / seção ausente = composto sem GHS: retorna "sem dados" (não é erro).
 */
export async function consultarGhs(cid: number): Promise<ResultadoGhs> {
	const url = `${BASE_VIEW}/data/compound/${cid}/JSON?heading=GHS+Classification`;
	const resp = await requisitar(url);

	if (resp.status === 404) return ghsVazio(); // sem GHS: normal
	if (!resp.ok) {
		throw new ErroPubChem('falha', `PubChem respondeu ${resp.status} ao buscar GHS.`);
	}

	return parsearGhs((await resp.json()) as RespostaPugView);
}

/**
 * Parser PURO da classificação GHS (sem rede) — recebe o JSON do PUG-View e
 * devolve o `ResultadoGhs` pronto para a UI.
 *
 * Pontos delicados (ver especificação):
 *  - O array Information REPETE campos por fonte (ReferenceNumber). Escolhemos UMA
 *    fonte por prioridade de SourceName (ECHA → Regulação 1272/2008 → primeira) e
 *    ignoramos o resto, para nada aparecer duplicado.
 *  - Pictogramas vêm no Markup[] (URL do SVG), não no texto.
 */
export function parsearGhs(dados: RespostaPugView): ResultadoGhs {
	// Record.Section["Safety and Hazards"] → ["Hazards Identification"] → ["GHS Classification"]
	const seguranca = acharSecao(dados.Record?.Section, 'Safety and Hazards');
	const perigos = acharSecao(seguranca?.Section, 'Hazards Identification');
	const ghs = acharSecao(perigos?.Section, 'GHS Classification');
	const info = ghs?.Information ?? [];
	if (info.length === 0) return ghsVazio();

	// Mapa ReferenceNumber → SourceName (de Record.Reference[]).
	const nomePorRef = new Map<number, string>();
	for (const r of dados.Record?.Reference ?? []) {
		if (r.ReferenceNumber != null && r.SourceName) nomePorRef.set(r.ReferenceNumber, r.SourceName);
	}

	// ReferenceNumbers presentes no bloco GHS, na ordem em que aparecem.
	const refsPresentes: number[] = [];
	for (const it of info) {
		if (it.ReferenceNumber != null && !refsPresentes.includes(it.ReferenceNumber)) {
			refsPresentes.push(it.ReferenceNumber);
		}
	}

	// Escolha da fonte POR NOME (números variam por composto).
	const refEscolhida =
		refsPresentes.find((n) => nomePorRef.get(n) === 'European Chemicals Agency (ECHA)') ??
		refsPresentes.find((n) => nomePorRef.get(n)?.startsWith('Regulation (EC) No 1272/2008')) ??
		refsPresentes[0];
	if (refEscolhida == null) return ghsVazio();

	const fonte = nomePorRef.get(refEscolhida) ?? null;
	const itens = info.filter((it) => it.ReferenceNumber === refEscolhida);
	const porNome = (nome: string) => itens.filter((it) => it.Name === nome);

	// Pictogramas: do Markup[], deduplicados por URL.
	const pictogramas: ResultadoGhs['pictogramas'] = [];
	const urlsVistas = new Set<string>();
	for (const it of porNome('Pictogram(s)')) {
		for (const m of it.Value?.StringWithMarkup?.[0]?.Markup ?? []) {
			if (!m.URL || urlsVistas.has(m.URL)) continue;
			urlsVistas.add(m.URL);
			const codigo = extrairCodigoGhs(m.URL);
			if (!codigo) continue;
			pictogramas.push({ codigo, rotulo: rotuloGhs(codigo), urlPubchem: m.URL });
		}
	}

	// Signal → nível de advertência.
	const signal = porNome('Signal')[0]?.Value?.StringWithMarkup?.[0]?.String?.trim().toLowerCase();
	let advertencia: NivelAdvertencia | null = null;
	if (signal === 'danger') advertencia = 'perigo';
	else if (signal === 'warning') advertencia = 'atencao';

	// Frases H parseadas, deduplicadas por código.
	const frasesH: FraseH[] = [];
	const codigosHVistos = new Set<string>();
	for (const it of porNome('GHS Hazard Statements')) {
		for (const sw of it.Value?.StringWithMarkup ?? []) {
			const frase = parseFraseH(sw.String ?? '');
			if (frase && !codigosHVistos.has(frase.codigo)) {
				codigosHVistos.add(frase.codigo);
				frasesH.push(frase);
			}
		}
	}

	// Códigos P, deduplicados.
	const codigosP: string[] = [];
	const codigosPVistos = new Set<string>();
	for (const it of porNome('Precautionary Statement Codes')) {
		const texto = it.Value?.StringWithMarkup?.[0]?.String ?? '';
		for (const c of parseCodigosP(texto)) {
			if (!codigosPVistos.has(c)) {
				codigosPVistos.add(c);
				codigosP.push(c);
			}
		}
	}

	const temDados =
		pictogramas.length > 0 || advertencia != null || frasesH.length > 0 || codigosP.length > 0;

	return temDados
		? { temDados, fonte, pictogramas, advertencia, frasesH, codigosP }
		: ghsVazio();
}
