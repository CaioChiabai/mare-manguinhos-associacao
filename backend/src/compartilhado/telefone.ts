export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, "");
}
