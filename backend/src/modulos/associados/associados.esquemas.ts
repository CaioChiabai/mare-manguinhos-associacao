import { z } from "zod";

export const statusAssociado = z.enum(["ativo", "suspenso", "inadimplente", "bloqueado"]);

export const esquemaCriarAssociado = z.object({
  nome: z.string().min(2),
  cpf: z.string().min(11).max(14),
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
