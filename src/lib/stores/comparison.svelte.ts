/*
  comparison.svelte.ts — bandeja de comparação (máx. 3 compostos).

  Mesmas regras das outras stores:
  - Classe singleton com `$state` (nada de estado solto em componente).
  - Em MEMÓRIA guardamos o registro COMPLETO (ResultadoConsulta + GHS) para a
    tabela. No localStorage persistimos APENAS os CIDs (`chemcheck:comparar`);
    ao carregar, reidratamos via pipeline (que bate no cache 24h).
  - Persistência EXPLÍCITA (save() em cada mutação); load() guardado por `browser`.
  - Dedupe por CID; limite de 3 (com feedback via toast quando cheio).
*/

import { browser } from '$app/environment';
import type { ResultadoConsulta, ResultadoGhs } from '../types';
import { buscarConsultaPorCid, buscarGhs } from '../consulta';
import { toast } from './toast.svelte';

const CHAVE = 'chemcheck:comparar';
const LIMITE = 3;

export interface CompostoComparacao {
	consulta: ResultadoConsulta;
	ghs: ResultadoGhs | null; // null = sem GHS ou falhou ao buscar
}

class ComparacaoStore {
	itens = $state<CompostoComparacao[]>([]);
	count = $derived(this.itens.length);
	cheia = $derived(this.itens.length >= LIMITE);
	readonly limite = LIMITE;

	// CIDs em reidratação no momento — evita corrida entre localStorage e URL
	// (?compare=) reidratarem o mesmo CID duas vezes.
	private carregando = new Set<number>();

	constructor() {
		this.load();
	}

	has(cid: number): boolean {
		return this.itens.some((i) => i.consulta.cid === cid);
	}

	/**
	 * Adiciona um composto (registro completo já em memória). Respeita o limite
	 * e o dedupe. Busca o GHS em paralelo (best-effort). Retorna false se cheio.
	 */
	async add(consulta: ResultadoConsulta): Promise<boolean> {
		if (this.has(consulta.cid)) return true; // já está — dedupe
		if (this.itens.length >= LIMITE) {
			toast.mostrar(`Máximo de ${LIMITE} compostos na comparação.`);
			return false;
		}

		// Insere já (feedback imediato); o GHS chega e preenche depois.
		this.itens.push({ consulta, ghs: null });
		this.save();

		buscarGhs(consulta.cid)
			.then((ghs) => this.definirGhs(consulta.cid, ghs))
			.catch(() => {
				/* GHS é opcional na tabela */
			});

		return true;
	}

	private definirGhs(cid: number, ghs: ResultadoGhs) {
		const item = this.itens.find((i) => i.consulta.cid === cid);
		if (item) item.ghs = ghs;
	}

	remove(cid: number) {
		this.itens = this.itens.filter((i) => i.consulta.cid !== cid);
		this.save();
	}

	clear() {
		this.itens = [];
		this.save();
	}

	/** Lista de CIDs na ordem atual (usada para o deep-link ?compare=). */
	cids(): number[] {
		return this.itens.map((i) => i.consulta.cid);
	}

	private save() {
		if (!browser) return;
		try {
			localStorage.setItem(CHAVE, JSON.stringify(this.cids()));
		} catch {
			/* best-effort */
		}
	}

	private load() {
		if (!browser) return;
		let cids: unknown;
		try {
			const bruto = localStorage.getItem(CHAVE);
			if (!bruto) return;
			cids = JSON.parse(bruto);
		} catch {
			return;
		}
		if (!Array.isArray(cids)) return;
		const validos = cids.filter((c): c is number => typeof c === 'number').slice(0, LIMITE);
		this.reidratar(validos);
	}

	/**
	 * Reidrata a partir de uma lista de CIDs (do localStorage ou da URL),
	 * refazendo o fetch pelo pipeline. Preserva a ordem e não duplica.
	 */
	async reidratar(cids: number[]) {
		for (const cid of cids) {
			if (this.has(cid) || this.carregando.has(cid) || this.itens.length >= LIMITE) continue;
			this.carregando.add(cid);
			try {
				const consulta = await buscarConsultaPorCid(cid);
				if (this.has(cid) || this.itens.length >= LIMITE) continue;
				const ghs = await buscarGhs(cid).catch(() => null);
				if (this.has(cid) || this.itens.length >= LIMITE) continue;
				this.itens.push({ consulta, ghs });
			} catch {
				// Um CID que não reidratou fica de fora, sem quebrar os demais.
			} finally {
				this.carregando.delete(cid);
			}
		}
		this.save();
	}
}

/** Singleton compartilhado por toda a aplicação. */
export const comparacao = new ComparacaoStore();
