/*
  debounce.ts — adia a execução de uma função até ela "parar de ser chamada".

  Uso típico: autocomplete. Enquanto o usuário digita, `debounce` reinicia o
  contador a cada tecla; a função de verdade só dispara depois de `ms` sem novas
  chamadas — evitando uma requisição por letra.
*/

export function debounce<A extends unknown[]>(
	fn: (...args: A) => void,
	ms: number
): (...args: A) => void {
	let id: ReturnType<typeof setTimeout> | undefined;
	return (...args: A) => {
		if (id !== undefined) clearTimeout(id);
		id = setTimeout(() => fn(...args), ms);
	};
}
