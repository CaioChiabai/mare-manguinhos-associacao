import { z } from "zod";

export const esquemaCadastro = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const esquemaLogin = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export const esquemaCriarPedido = z.object({
  itens: z
    .array(
      z.object({
        produtoId: z.string().uuid(),
        corte: z.enum(["inteiro", "limpo", "file"]),
        pesoKg: z.number().positive(),
      }),
    )
    .min(1, "Pedido deve ter pelo menos 1 item"),
  enderecoEntrega: z.string().min(1, "Endereço de entrega obrigatório"),
  janelaEntrega: z.string().min(1, "Janela de entrega obrigatória"),
  formaPagamento: z.enum(["pix", "cartao"]),
  frete: z.number().nonnegative(),
  valorTotal: z.number().nonnegative(),
});

export const esquemaAtualizarPerfil = z.object({
  nome: z.string().min(2).optional(),
  telefone: z.string().min(10).optional(),
});

export const esquemaCriarEndereco = z.object({
  label: z.string().default("Casa"),
  logradouro: z.string().min(1, "Logradouro obrigatório"),
  numero: z.string().min(1, "Número obrigatório"),
  bairro: z.string().min(1, "Bairro obrigatório"),
  cidade: z.string().min(1, "Cidade obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres"),
  cep: z.string().min(8, "CEP inválido"),
  complemento: z.string().optional(),
  principal: z.coerce.boolean().default(false),
});

export const esquemaCalcularFrete = z.object({
  endereco: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const esquemaPagamentoPix = z.object({
  pedidoId: z.string().uuid(),
  valor: z.number().positive(),
});

export const esquemaPagamentoCartao = z.object({
  pedidoId: z.string().uuid(),
  valor: z.number().positive(),
  tokenCartao: z.string().min(1, "Token do cartão obrigatório"),
});

export const esquemaListarProdutos = z.object({
  busca: z.string().optional(),
  categoria: z.string().optional(),
  pescador_id: z.string().uuid().optional(),
});

export const esquemaListarPedidos = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

export type EntradaCadastro = z.infer<typeof esquemaCadastro>;
export type EntradaLoginApp = z.infer<typeof esquemaLogin>;
export type EntradaCriarPedido = z.infer<typeof esquemaCriarPedido>;
export type EntradaAtualizarPerfil = z.infer<typeof esquemaAtualizarPerfil>;
export type EntradaCriarEndereco = z.infer<typeof esquemaCriarEndereco>;
export type EntradaCalcularFrete = z.infer<typeof esquemaCalcularFrete>;
export type EntradaPagamentoPix = z.infer<typeof esquemaPagamentoPix>;
export type EntradaPagamentoCartao = z.infer<typeof esquemaPagamentoCartao>;
