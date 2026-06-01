import { z } from "zod";

export const esquemaCriarProduto = z.object({
  lojaId: z.string().uuid(),
  especie: z.string().min(2).max(100),
  descricao: z.string().optional(),
  precoPorKg: z.coerce.number().positive(),
  pesoDisponivel: z.coerce.number().nonnegative().default(0),
  estoque: z.coerce.number().int().nonnegative().default(0),
  categoria: z.enum(["peixe", "crustaceo"]).optional(),
  cortesDisponiveis: z.string().optional(),
  badges: z.string().optional(),
  foto: z.string().optional(),
  ativo: z.coerce.boolean().default(true),
});

export const esquemaAtualizarProduto = esquemaCriarProduto.partial().omit({ lojaId: true });

export const esquemaListarProdutos = z.object({
  busca: z.string().optional(),
  lojaId: z.string().uuid().optional(),
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
