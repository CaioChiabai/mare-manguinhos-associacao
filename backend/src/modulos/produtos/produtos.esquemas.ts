import { z } from "zod";

export const esquemaCriarProduto = z.object({
  associadoId: z.string().uuid(),
  especie: z.string().min(2).max(100),
  descricao: z.string().optional(),
  precoPorKg: z.coerce.number().positive(),
  pesoDisponivel: z.coerce.number().nonnegative().default(0),
  ativo: z.coerce.boolean().default(true),
});

export const esquemaAtualizarProduto = esquemaCriarProduto.partial().omit({ associadoId: true });

export const esquemaListarProdutos = z.object({
  busca: z.string().optional(),
  associadoId: z.string().uuid().optional(),
  ativo: z
    .preprocess((val: unknown) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    }, z.boolean())
    .optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export type EntradaCriarProduto = z.infer<typeof esquemaCriarProduto>;
export type EntradaAtualizarProduto = z.infer<typeof esquemaAtualizarProduto>;
