import { describe, it, expect } from 'vitest';
import { normalizar, ehCas, ehFormula, resolverBusca } from './normalizar';

describe('normalizar', () => {
	it('remove acentos', () => {
		expect(normalizar('Dióxido de Titânio')).toBe('dioxido de titanio');
		expect(normalizar('Ácido Sulfúrico')).toBe('acido sulfurico');
		expect(normalizar('amônia')).toBe('amonia');
	});

	it('ignora caixa (maiúsculas/minúsculas)', () => {
		expect(normalizar('ÁGUA')).toBe('agua');
		expect(normalizar('EtAnOl')).toBe('etanol');
	});

	it('apara e colapsa espaços', () => {
		expect(normalizar('   tolueno  ')).toBe('tolueno');
		expect(normalizar('carbonato   de    calcio')).toBe('carbonato de calcio');
	});

	it('converge grafias diferentes da mesma substância', () => {
		const alvo = 'dioxido de titanio';
		expect(normalizar('Dióxido de Titânio')).toBe(alvo);
		expect(normalizar('dióxido de titânio')).toBe(alvo);
		expect(normalizar('dioxido de titanio')).toBe(alvo);
	});
});

describe('ehCas', () => {
	it('reconhece números CAS válidos', () => {
		expect(ehCas('50-78-2')).toBe(true); // aspirina
		expect(ehCas('13463-67-7')).toBe(true); // dióxido de titânio
	});

	it('rejeita o que não é CAS', () => {
		expect(ehCas('water')).toBe(false);
		expect(ehCas('123')).toBe(false);
		expect(ehCas('tolueno')).toBe(false);
	});
});

describe('ehFormula', () => {
	it('reconhece fórmulas moleculares', () => {
		expect(ehFormula('H2O')).toBe(true);
		expect(ehFormula('C9H8O4')).toBe(true);
		expect(ehFormula('TiO2')).toBe(true);
		expect(ehFormula('NaOH')).toBe(true);
		expect(ehFormula('CO2')).toBe(true);
	});

	it('não confunde palavras comuns com fórmula', () => {
		expect(ehFormula('Water')).toBe(false);
		expect(ehFormula('Iron')).toBe(false);
		expect(ehFormula('agua')).toBe(false);
		expect(ehFormula('Talco')).toBe(false);
		expect(ehFormula('Na')).toBe(false); // um só elemento não conta
	});
});

describe('resolverBusca', () => {
	it('traduz pelo dicionário (CAMADA B)', () => {
		expect(resolverBusca('Dióxido de Titânio')).toEqual({
			consulta: 'titanium dioxide',
			tipo: 'nome'
		});
		expect(resolverBusca('tolueno')).toEqual({ consulta: 'toluene', tipo: 'nome' });
	});

	it('normaliza e segue como fallback quando não há no dicionário (CAMADA C)', () => {
		expect(resolverBusca('Benzeno')).toEqual({ consulta: 'benzeno', tipo: 'nome' });
	});

	it('detecta CAS e fórmula (CAMADA C)', () => {
		expect(resolverBusca('13463-67-7')).toEqual({ consulta: '13463-67-7', tipo: 'cas' });
		expect(resolverBusca('TiO2')).toEqual({ consulta: 'TiO2', tipo: 'formula' });
	});
});
