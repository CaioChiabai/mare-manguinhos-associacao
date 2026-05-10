import { construirAplicacao } from "./aplicacao.js";
import { ambiente } from "./configuracao/ambiente.js";

async function iniciar() {
  const app = await construirAplicacao();
  
  // O Render define a porta automaticamente na variável process.env.PORT
  const porta = Number(process.env.PORT) || ambiente.PORTA;
  
  // No deploy, o host PRECISA ser '0.0.0.0'
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : ambiente.HOST;

  try {
    await app.listen({ port: Number(porta), host: host });
    console.log(`🚀 API rodando na porta ${porta}`);
  } catch (erro) {
    app.log.error(erro);
    process.exit(1);
  }
}

iniciar();