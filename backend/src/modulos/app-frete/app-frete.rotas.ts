import type { FastifyInstance } from "fastify";
import { esquemaCalcularFrete } from "./app-frete.esquemas.js";
import { appFreteServico } from "./app-frete.servico.js";

export async function rotasAppFrete(app: FastifyInstance) {
  app.post("/calcular", async (requisicao) => {
    const dados = esquemaCalcularFrete.parse(requisicao.body);
    return appFreteServico.calcular(dados);
  });
}
