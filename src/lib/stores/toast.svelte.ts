/*
  toast.svelte.ts — feedback efêmero (ex.: "Copiado!", "Máximo de 3 compostos").

  Store minimalista: uma mensagem por vez, some sozinha após alguns segundos.
*/

class ToastStore {
	mensagem = $state<string | null>(null);
	private timer: ReturnType<typeof setTimeout> | undefined;

	mostrar(mensagem: string, ms = 2200) {
		this.mensagem = mensagem;
		clearTimeout(this.timer);
		this.timer = setTimeout(() => (this.mensagem = null), ms);
	}
}

export const toast = new ToastStore();
