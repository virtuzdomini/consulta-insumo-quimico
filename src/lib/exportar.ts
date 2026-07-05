/*
  exportar.ts — exportação SEM bibliotecas externas (só APIs nativas).

  - Markdown: ficha individual e tabela de comparação (string pronta p/ clipboard).
  - CSV (pt-BR): separador ';' porque o decimal usa vírgula; BOM UTF-8 + CRLF para
    o Excel pt-BR abrir com acentos e subscritos corretos.
  - clipboard via navigator.clipboard; download via Blob + <a download>.

  As LINHAS_COMPARACAO são a fonte única das linhas da tabela — usadas tanto na
  view /comparar quanto no Markdown/CSV, para nada divergir.
*/

import type { CompostoComparacao } from './stores/comparison.svelte';
import type { ResultadoConsulta, ResultadoGhs } from './types';
import { nomeFonteExibicao } from './ghs';

/* ---- Extração de valores (com "—" para ausentes) ---- */

export function propValor(consulta: ResultadoConsulta, rotulo: string): string {
	const p = consulta.propriedades.find((x) => x.rotulo === rotulo);
	if (!p || p.valor === '—') return '—';
	return p.unidade ? `${p.valor} ${p.unidade}` : p.valor;
}

export function advertenciaTexto(ghs: ResultadoGhs | null): string {
	if (!ghs?.temDados || !ghs.advertencia) return '—';
	return ghs.advertencia === 'perigo' ? 'Perigo' : 'Atenção';
}

export function nFrasesH(ghs: ResultadoGhs | null): string {
	if (!ghs?.temDados) return '—';
	return String(ghs.frasesH.length);
}

export interface LinhaComparacao {
	rotulo: string;
	valor: (c: CompostoComparacao) => string;
}

/** Linhas de texto da tabela de comparação (sem a linha de imagem). */
export const LINHAS_COMPARACAO: LinhaComparacao[] = [
	{ rotulo: 'Fórmula', valor: (c) => c.consulta.formula },
	{ rotulo: 'Massa molar', valor: (c) => c.consulta.massaMolar },
	{ rotulo: 'CAS', valor: (c) => c.consulta.cas ?? '—' },
	{ rotulo: 'Nome IUPAC', valor: (c) => c.consulta.nomeIupac ?? '—' },
	{ rotulo: 'logP', valor: (c) => propValor(c.consulta, 'logP') },
	{ rotulo: 'TPSA', valor: (c) => propValor(c.consulta, 'TPSA') },
	{ rotulo: 'Doadores H', valor: (c) => propValor(c.consulta, 'Doadores H') },
	{ rotulo: 'Aceptores H', valor: (c) => propValor(c.consulta, 'Aceptores H') },
	{ rotulo: 'Advertência GHS', valor: (c) => advertenciaTexto(c.ghs) },
	{ rotulo: 'Frases H', valor: (c) => nFrasesH(c.ghs) }
];

/* ---- Markdown ---- */

/** Ficha individual em Markdown (inclui GHS se `ghs` vier com dados). */
export function fichaParaMarkdown(r: ResultadoConsulta, ghs: ResultadoGhs | null): string {
	const l: string[] = [`# ${r.nome}`, ''];
	l.push(`- **Fórmula:** ${r.formula}`);
	l.push(`- **Massa molar:** ${r.massaMolar}`);
	if (r.cas) l.push(`- **CAS:** ${r.cas}`);
	if (r.nomeIupac) l.push(`- **Nome IUPAC:** ${r.nomeIupac}`);
	for (const p of r.propriedades) {
		l.push(`- **${p.rotulo}:** ${p.unidade ? `${p.valor} ${p.unidade}` : p.valor}`);
	}

	if (ghs?.temDados) {
		l.push('', '## Segurança (GHS)');
		if (ghs.advertencia) l.push(`- **Advertência:** ${advertenciaTexto(ghs)}`);
		if (ghs.pictogramas.length) {
			l.push(`- **Pictogramas:** ${ghs.pictogramas.map((p) => `${p.codigo} (${p.rotulo})`).join(', ')}`);
		}
		for (const h of ghs.frasesH) {
			l.push(`- **${h.codigo}:** ${h.descricao}${h.percentual ? ` (${h.percentual})` : ''}`);
		}
		if (ghs.codigosP.length) l.push(`- **Códigos P:** ${ghs.codigosP.join(', ')}`);
		if (ghs.fonte) l.push(`- _Fonte: ${nomeFonteExibicao(ghs.fonte)}, via PubChem_`);
	}

	l.push('', `Fonte dos dados: PubChem — CID ${r.cid}`);
	return l.join('\n');
}

/** Tabela de comparação em Markdown. */
export function comparacaoParaMarkdown(itens: CompostoComparacao[]): string {
	const nomes = itens.map((i) => i.consulta.nome);
	const header = `| Propriedade | ${nomes.join(' | ')} |`;
	const sep = `| --- | ${nomes.map(() => '---').join(' | ')} |`;
	const linhas = LINHAS_COMPARACAO.map(
		(l) => `| ${l.rotulo} | ${itens.map((i) => l.valor(i)).join(' | ')} |`
	);
	return [header, sep, ...linhas].join('\n');
}

/* ---- CSV (pt-BR) ---- */

function celCsv(v: string): string {
	// Aspas se contiver o separador, aspas ou quebra de linha (padrão RFC 4180).
	return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function comparacaoParaCsv(itens: CompostoComparacao[]): string {
	const cabecalho = ['Propriedade', ...itens.map((i) => i.consulta.nome)];
	const linhas = [cabecalho.map(celCsv).join(';')];
	for (const l of LINHAS_COMPARACAO) {
		const linha = [l.rotulo, ...itens.map((i) => l.valor(i))];
		linhas.push(linha.map(celCsv).join(';'));
	}
	// BOM UTF-8 para o Excel pt-BR abrir acentos/subscritos; CRLF entre linhas.
	return '﻿' + linhas.join('\r\n');
}

/* ---- Ações nativas ---- */

/** Copia texto para a área de transferência. Retorna true se deu certo. */
export async function copiarTexto(texto: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(texto);
		return true;
	} catch {
		return false;
	}
}

/** Dispara o download de um arquivo a partir de uma string (Blob + link). */
export function baixarArquivo(nomeArquivo: string, conteudo: string, mime: string): void {
	const blob = new Blob([conteudo], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = nomeArquivo;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
