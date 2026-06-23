import { z } from "zod";

export const statusAssociado = z.enum(["ativo", "suspenso", "inadimplente", "bloqueado"]);

function validarCPF(cpf: string): boolean {
  const apenas = cpf.replace(/\D/g, "");
  if (apenas.length !== 11 || /^(\d)\1{10}$/.test(apenas)) return false;
  const calc = (mod: number) => {
    const soma = Array.from({ length: mod - 1 }, (_, i) => Number(apenas[i]) * (mod - i)).reduce((a, b) => a + b, 0);
    const resto = (soma * 10) % 11;
    return resto >= 10 ? 0 : resto;
  };
  return calc(10) === Number(apenas[9]) && calc(11) === Number(apenas[10]);
}

export const esquemaCriarAssociado = z.object({
  nome: z.string().min(2),
  cpf: z.string().min(11).max(14).refine(validarCPF, { message: "CPF inválido" }),
  email: z.string().email(),
  telefone: z.string().min(8),
  foto: z.string().optional(),
  embarcacao: z.string().optional(),
  numeroCarteira: z.string().min(2),
  status: statusAssociado.default("ativo"),
  observacoes: z.string().optional(),
});

export const esquemaAtualizarAssociado = esquemaCriarAssociado.partial();

export const esquemaAlterarStatus = z.object({
  status: statusAssociado,
  motivo: z.string().optional(),
});

export const esquemaListarAssociados = z.object({
  busca: z.string().optional(),
  status: statusAssociado.optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export type EntradaCriarAssociado = z.infer<typeof esquemaCriarAssociado>;
export type EntradaAtualizarAssociado = z.infer<typeof esquemaAtualizarAssociado>;
export type EntradaAlterarStatus = z.infer<typeof esquemaAlterarStatus>;
