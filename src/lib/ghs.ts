/*
  ghs.ts — mapa fixo dos 9 pictogramas GHS (código → rótulo pt-BR) e helpers puros.

  Módulo puro (sem dependência de servidor nem de navegador): é usado tanto no
  parsing server-side (para nomear o pictograma) quanto na UI (alt/tooltip e
  caminho do asset local). O conjunto GHS é fechado — GHS01 a GHS09.
*/

/** Rótulo em pt-BR de cada código GHS, para alt de imagem e tooltip. */
export const ROTULOS_GHS: Record<string, string> = {
	GHS01: 'Explosivo',
	GHS02: 'Inflamável',
	GHS03: 'Oxidante',
	GHS04: 'Gás sob pressão',
	GHS05: 'Corrosivo',
	GHS06: 'Tóxico',
	GHS07: 'Nocivo/Irritante',
	GHS08: 'Perigo à saúde',
	GHS09: 'Perigoso ao meio ambiente'
};

/** Extrai o código (GHS01..GHS09) de uma URL de pictograma do PubChem. */
export function extrairCodigoGhs(url: string): string | null {
	return url.match(/GHS0[1-9]/)?.[0] ?? null;
}

/** Rótulo pt-BR de um código; cai no próprio código se for desconhecido. */
export function rotuloGhs(codigo: string): string {
	return ROTULOS_GHS[codigo] ?? codigo;
}

/** Caminho do asset SVG local do pictograma (servido de static/ghs/). */
export function assetGhs(codigo: string): string {
	return `/ghs/${codigo}.svg`;
}

/** Nome curto e amigável da fonte para atribuição na UI. */
export function nomeFonteExibicao(fonte: string): string {
	if (fonte.includes('ECHA')) return 'ECHA C&L';
	if (fonte.startsWith('Regulation (EC) No 1272/2008')) return 'Regulamento CLP (UE) 1272/2008';
	return fonte;
}
