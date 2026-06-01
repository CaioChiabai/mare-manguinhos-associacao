import { z } from "zod";

export const esquemaCalcularFrete = z.object({
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type EntradaCalcularFrete = z.infer<typeof esquemaCalcularFrete>;
