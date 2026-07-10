import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ArtigoRecente, ResultadoArtigos } from '$lib/types';

interface OpenAlexWork {
	id: string;
	title: string | null;
	publication_year: number | null;
	publication_date: string | null;
	doi: string | null;
	primary_location?: {
		source?: {
			display_name?: string | null;
		} | null;
		landing_page_url?: string | null;
	} | null;
	open_access?: {
		is_oa?: boolean;
		oa_url?: string | null;
	} | null;
	authorships?: Array<{
		author?: {
			display_name?: string | null;
		} | null;
	}>;
}

interface OpenAlexResponse {
	results?: OpenAlexWork[];
}

const LIMITE = 6;
const ANOS_RECENTES = 5;

function dataInicialRecente(): string {
	const data = new Date();
	data.setFullYear(data.getFullYear() - ANOS_RECENTES);
	return data.toISOString().slice(0, 10);
}

function termoPreferencial(nome: string, cas: string, iupac: string): string {
	return cas || iupac || nome;
}

function urlGoogleScholar(termo: string): string {
	return `https://scholar.google.com/scholar?q=${encodeURIComponent(termo)}`;
}

function limparDoi(doi: string | null): string | null {
	if (!doi) return null;
	return doi.replace(/^https?:\/\/doi\.org\//i, '');
}

function urlPrincipal(work: OpenAlexWork): string {
	return (
		work.open_access?.oa_url ||
		work.primary_location?.landing_page_url ||
		work.doi ||
		work.id
	);
}

function autores(work: OpenAlexWork): string[] {
	return (
		work.authorships
			?.map((a) => a.author?.display_name?.trim())
			.filter((nome): nome is string => !!nome)
			.slice(0, 3) ?? []
	);
}

function mapearArtigo(work: OpenAlexWork): ArtigoRecente | null {
	const titulo = work.title?.trim();
	if (!titulo || !work.id) return null;

	return {
		id: work.id,
		titulo,
		ano: work.publication_year,
		dataPublicacao: work.publication_date,
		fonte: work.primary_location?.source?.display_name?.trim() || null,
		autores: autores(work),
		doi: limparDoi(work.doi),
		url: urlPrincipal(work),
		acessoAberto: Boolean(work.open_access?.is_oa)
	};
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const nome = url.searchParams.get('nome')?.trim() ?? '';
	const cas = url.searchParams.get('cas')?.trim() ?? '';
	const iupac = url.searchParams.get('iupac')?.trim() ?? '';
	const termo = termoPreferencial(nome, cas, iupac);

	if (!termo) {
		throw error(400, 'Informe "nome", "cas" ou "iupac".');
	}

	const params = new URLSearchParams({
		search: termo,
		filter: `from_publication_date:${dataInicialRecente()},is_retracted:false,type:article`,
		sort: 'publication_date:desc',
		per_page: String(LIMITE),
		select:
			'id,title,publication_year,publication_date,doi,primary_location,open_access,authorships'
	});

	try {
		const resp = await fetch(`https://api.openalex.org/works?${params.toString()}`);
		if (!resp.ok) throw new Error(`OpenAlex ${resp.status}`);

		const dados = (await resp.json()) as OpenAlexResponse;
		const artigos = (dados.results ?? [])
			.map(mapearArtigo)
			.filter((artigo): artigo is ArtigoRecente => artigo != null);

		const resultado: ResultadoArtigos = { termo, artigos };
		return json(resultado);
	} catch {
		throw error(502, 'Falha ao consultar artigos recentes. Tente novamente.');
	}
};
