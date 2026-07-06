import { describe, it, expect } from 'vitest';
import { traduzirPtBr, NOMES_PTBR } from './nomes-ptbr';
import { normalizar } from '../normalizar';

describe('traduzirPtBr (dicionário PT→EN)', () => {
	it('traduz insumos do laboratório', () => {
		expect(traduzirPtBr('dioxido de titanio')).toBe('titanium dioxide');
		expect(traduzirPtBr('butilglicol')).toBe('2-butoxyethanol');
		expect(traduzirPtBr('carbonato de calcio')).toBe('calcium carbonate');
		expect(traduzirPtBr('caulim')).toBe('kaolin');
	});

	it('retorna null para termo fora do dicionário', () => {
		expect(traduzirPtBr('substancia inexistente')).toBeNull();
	});

	it('combina com normalizar: grafia acentuada acha a entrada', () => {
		expect(traduzirPtBr(normalizar('Dióxido de Titânio'))).toBe('titanium dioxide');
		expect(traduzirPtBr(normalizar('Ácido Sulfúrico'))).toBe('sulfuric acid');
	});

	it('todas as chaves já estão na forma normalizada', () => {
		for (const chave of Object.keys(NOMES_PTBR)) {
			expect(chave).toBe(normalizar(chave));
		}
	});
});
