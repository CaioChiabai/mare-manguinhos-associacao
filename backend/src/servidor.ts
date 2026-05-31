import { construirAplicacao } from "./aplicacao.js";
import { ambiente } from "./configuracao/ambiente.js";

async function iniciar() {
  const app = await construirAplicacao();

  const porta = Number(process.env.PORT) || ambiente.PORTA;
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : ambiente.HOST;

  try {
    await app.listen({ port: porta, host });
    console.log(`🚀 API rodando na porta ${porta}`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

iniciar();