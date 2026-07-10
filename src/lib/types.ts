// Tipos compartilhados entre o servidor (endpoint) e o cliente (página).
// Deixar isso num arquivo só garante que os dois lados falem a "mesma língua".

/**
 * Uma propriedade físico-química já formatada para exibição no cartão.
 * `valor` e `unidade` são separados para o layout poder estilizar a unidade
 * menor (ex.: "63,6" grande + "Å²" pequeno), como no design.
 */
export interface Propriedade {
	rotulo: string; // ex.: "logP"
	valor: string; // ex.: "1,19"
	unidade?: string; // ex.: "Å²"
	descricao: string; // ex.: "lipofilicidade"
}

/**
 * O resultado completo de uma consulta bem-sucedida à PubChem.
 * É exatamente a forma que o endpoint /api/consulta devolve em JSON.
 */
export interface ResultadoConsulta {
	cid: number; // PubChem Compound ID
	nome: string; // nome de exibição (o termo buscado, capitalizado)
	nomeIupac: string | null; // nome IUPAC oficial
	formula: string; // fórmula molecular já com subscritos (ex.: C₉H₈O₄)
	massaMolar: string; // ex.: "180,16 g/mol"
	cas: string | null; // número CAS extraído dos sinônimos (ex.: 50-78-2)
	propriedades: Propriedade[]; // logP, TPSA, doadores/aceptores de H
	sinonimos: string[]; // lista curada de sinônimos
	imagemUrl: string; // URL do PNG 2D no PubChem
}

/**
 * Resposta de erro padronizada do endpoint. `tipo` deixa o cliente
 * distinguir "não achei a substância" de "a rede/PubChem falhou".
 */
export interface ErroConsulta {
	tipo: 'nao_encontrado' | 'falha';
	mensagem: string;
}

/**
 * Estados possíveis da tela. Modelar isso como união de strings deixa o
 * `+page.svelte` alternar a UI de forma exaustiva e sem ambiguidade.
 */
export type EstadoBusca = 'vazio' | 'carregando' | 'resultado' | 'erro';

/* ------------------------------------------------------------------ */
/*  Classificação de segurança GHS (bloco de perigo da ficha)          */
/* ------------------------------------------------------------------ */

/** Um pictograma GHS já resolvido (código + rótulo pt-BR + fallback de URL). */
export interface PictogramaGhs {
	codigo: string; // GHS01..GHS09
	rotulo: string; // rótulo pt-BR (ex.: "Inflamável")
	urlPubchem: string; // URL original no PubChem (fallback do asset local)
}

/** Uma frase de perigo H já parseada. */
export interface FraseH {
	codigo: string; // ex.: "H225"
	descricao: string; // ex.: "Highly Flammable liquid and vapor"
	percentual?: string; // ex.: "> 99.9%" (quando a fonte informa)
}

/**
 * Nível da palavra de advertência (GHS "Signal"):
 *  - 'perigo'  → "Danger"  (vermelho)
 *  - 'atencao' → "Warning" (âmbar)
 */
export type NivelAdvertencia = 'perigo' | 'atencao';

/**
 * Resultado do bloco GHS para um CID. `temDados: false` é caso NORMAL
 * (muitos compostos não têm classificação GHS no PubChem), não erro.
 */
export interface ResultadoGhs {
	temDados: boolean;
	fonte: string | null; // SourceName escolhido (ex.: "European Chemicals Agency (ECHA)")
	pictogramas: PictogramaGhs[];
	advertencia: NivelAdvertencia | null;
	frasesH: FraseH[];
	codigosP: string[];
}

/* ------------------------------------------------------------------ */
/*  Artigos cientificos recentes (OpenAlex)                            */
/* ------------------------------------------------------------------ */

export interface ArtigoRecente {
	id: string;
	titulo: string;
	ano: number | null;
	dataPublicacao: string | null;
	fonte: string | null;
	autores: string[];
	doi: string | null;
	url: string;
	acessoAberto: boolean;
}

export interface ResultadoArtigos {
	termo: string;
	artigos: ArtigoRecente[];
}
