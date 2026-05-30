import { z } from "zod";

export const statusVenda = z.enum(["pendente", "concluida", "cancelada"]);

export const esquemaItemVenda = z.object({
  produtoId: z.string().uuid(),
  pesoKg: z.coerce.number().positive(),
});

export const esquemaCriarVenda = z.object({
  lojaId: z.string().uuid(),
  associadoId: z.string().uuid(),
  itens: z.array(esquemaItemVenda).min(1),
  status: statusVenda.default("concluida"),
  observacoes: z.string().optional(),
});

export const esquemaAtualizarStatusVenda = z.object({
  status: statusVenda,
  observacoes: z.string().optional(),
});

export const esquemaListarVendas = z.object({
  lojaId: z.string().uuid().optional(),
  associadoId: z.string().uuid().optional(),
  status: statusVenda.optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export type EntradaCriarVenda = z.infer<typeof esquemaCriarVenda>;
export type EntradaAtualizarStatusVenda = z.infer<typeof esquemaAtualizarStatusVenda>;
