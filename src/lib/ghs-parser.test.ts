import { describe, it, expect } from 'vitest';
import { parseFraseH, parseCodigosP, parsearGhs } from './pubchem';

describe('parseFraseH', () => {
	it('extrai código, descrição e percentual', () => {
		expect(
			parseFraseH('H225 (> 99.9%): Highly Flammable liquid and vapor [Danger Flammable]')
		).toEqual({
			codigo: 'H225',
			descricao: 'Highly Flammable liquid and vapor',
			percentual: '> 99.9%'
		});
	});

	it('funciona sem percentual', () => {
		expect(parseFraseH('H319: Causes serious eye irritation')).toEqual({
			codigo: 'H319',
			descricao: 'Causes serious eye irritation',
			percentual: undefined
		});
	});

	it('retorna null quando não há código H', () => {
		expect(parseFraseH('texto sem frase de perigo')).toBeNull();
	});
});

describe('parseCodigosP', () => {
	it('separa lista de códigos P', () => {
		expect(parseCodigosP('P210, P233, and P501')).toEqual(['P210', 'P233', 'P501']);
	});

	it('preserva combinações P301+P312', () => {
		expect(parseCodigosP('P301+P312, P330, and P501')).toEqual(['P301+P312', 'P330', 'P501']);
	});
});

// Fixture do PUG-View com DUAS fontes (ECHA e "outra"): o parser deve escolher
// a ECHA por prioridade e ignorar os dados da outra fonte, sem duplicar.
const fixtureDuasFontes = {
	Record: {
		Reference: [
			{ ReferenceNumber: 1, SourceName: 'European Chemicals Agency (ECHA)' },
			{ ReferenceNumber: 2, SourceName: 'Some Other Aggregator' }
		],
		Section: [
			{
				TOCHeading: 'Safety and Hazards',
				Section: [
					{
						TOCHeading: 'Hazards Identification',
						Section: [
							{
								TOCHeading: 'GHS Classification',
								Information: [
									// Fonte 2 (deve ser ignorada)
									{
										ReferenceNumber: 2,
										Name: 'Signal',
										Value: { StringWithMarkup: [{ String: 'Warning' }] }
									},
									{
										ReferenceNumber: 2,
										Name: 'GHS Hazard Statements',
										Value: { StringWithMarkup: [{ String: 'H999: Deve ser ignorado' }] }
									},
									// Fonte 1 = ECHA (deve prevalecer)
									{
										ReferenceNumber: 1,
										Name: 'Signal',
										Value: { StringWithMarkup: [{ String: 'Danger' }] }
									},
									{
										ReferenceNumber: 1,
										Name: 'Pictogram(s)',
										Value: {
											StringWithMarkup: [
												{
													Markup: [
														{ URL: 'https://x/GHS02.svg' },
														{ URL: 'https://x/GHS02.svg' } // duplicado → dedup
													]
												}
											]
										}
									},
									{
										ReferenceNumber: 1,
										Name: 'GHS Hazard Statements',
										Value: {
											StringWithMarkup: [
												{ String: 'H225 (> 99%): Flammable liquid [Danger]' },
												{ String: 'H319: Eye irritation' }
											]
										}
									},
									{
										ReferenceNumber: 1,
										Name: 'Precautionary Statement Codes',
										Value: { StringWithMarkup: [{ String: 'P210, P233, and P501' }] }
									}
								]
							}
						]
					}
				]
			}
		]
	}
};

describe('parsearGhs (multi-fonte)', () => {
	const r = parsearGhs(fixtureDuasFontes);

	it('escolhe a fonte ECHA', () => {
		expect(r.temDados).toBe(true);
		expect(r.fonte).toBe('European Chemicals Agency (ECHA)');
	});

	it('usa o Signal da ECHA (Danger → perigo), não o da outra fonte', () => {
		expect(r.advertencia).toBe('perigo');
	});

	it('parseia apenas as frases H da ECHA (ignora H999 da outra fonte)', () => {
		expect(r.frasesH.map((f) => f.codigo)).toEqual(['H225', 'H319']);
	});

	it('deduplica pictogramas por URL', () => {
		expect(r.pictogramas).toHaveLength(1);
		expect(r.pictogramas[0].codigo).toBe('GHS02');
	});

	it('extrai os códigos P', () => {
		expect(r.codigosP).toEqual(['P210', 'P233', 'P501']);
	});

	it('retorna "sem dados" para JSON vazio', () => {
		expect(parsearGhs({}).temDados).toBe(false);
	});
});
