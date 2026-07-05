/*
  favorites.svelte.ts — store de favoritos (runes em módulo .svelte.ts).

  Regras de arquitetura desta base:
  - Estado central numa classe com `$state`, exposta como singleton.
  - localStorage SEMPRE guardado por `browser` (no SSR ele não existe).
  - Persistência EXPLÍCITA: cada método que muta o estado chama `save()`.
    Nada de `$effect` de persistência aqui (timing/contexto são armadilha).
  - Dedupe SEMPRE por CID.

  Guardamos só o mínimo para exibir/recarregar (`cid`, `nome`, `formula`);
  a ficha completa vem do cache/pipeline ao clicar no favorito.
*/

import { browser } from '$app/environment';

const CHAVE = 'chemcheck:favoritos';

export interface Favorito {
	cid: number;
	nome: string;
	formula: string;
}

class FavoritosStore {
	itens = $state<Favorito[]>([]);

	constructor() {
		this.load();
	}

	/** true se o CID já está favoritado (reativo em templates). */
	has(cid: number): boolean {
		return this.itens.some((f) => f.cid === cid);
	}

	/** Adiciona se ausente, remove se presente (dedupe por CID). */
	toggle(item: Favorito) {
		if (this.has(item.cid)) {
			this.remove(item.cid);
		} else {
			this.itens.push(item);
			this.save();
		}
	}

	remove(cid: number) {
		this.itens = this.itens.filter((f) => f.cid !== cid);
		this.save();
	}

	private save() {
		if (!browser) return;
		try {
			localStorage.setItem(CHAVE, JSON.stringify(this.itens));
		} catch {
			// quota/indisponível — favoritos são best-effort.
		}
	}

	private load() {
		if (!browser) return;
		try {
			const bruto = localStorage.getItem(CHAVE);
			if (!bruto) return;
			const arr = JSON.parse(bruto);
			if (Array.isArray(arr)) {
				this.itens = arr.filter(
					(f) => f && typeof f.cid === 'number' && typeof f.nome === 'string'
				);
			}
		} catch {
			// JSON corrompido — ignora e começa vazio.
		}
	}
}

/** Singleton compartilhado por toda a aplicação. */
export const favoritos = new FavoritosStore();
