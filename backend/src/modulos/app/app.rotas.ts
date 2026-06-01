import type { FastifyInstance } from "fastify";
import { autenticar } from "../../middlewares/autenticar.js";
import { appServico } from "./app.servico.js";
import {
  esquemaCadastro,
  esquemaLogin,
  esquemaCriarPedido,
  esquemaAtualizarPerfil,
  esquemaCriarEndereco,
  esquemaPagamentoPix,
  esquemaPagamentoCartao,
  esquemaListarProdutos,
  esquemaListarPedidos,
} from "./app.esquemas.js";

export async function rotasApp(app: FastifyInstance) {
  // ── Auth (públicas) ───────────────────────────────────────────────────

  app.post("/auth/cadastro", async (requisicao, resposta) => {
    const dados = esquemaCadastro.parse(requisicao.body);
    const consumidor = await appServico.cadastrarConsumidor(dados);
    const token = await resposta.jwtSign({
      sub: consumidor.id,
      tipo: "consumidor",
      nome: consumidor.nome,
      email: consumidor.email,
    });
    return resposta.status(201).send({ ...consumidor, token });
  });

  app.post("/auth/login", async (requisicao, resposta) => {
    const dados = esquemaLogin.parse(requisicao.body);
    const consumidor = await appServico.autenticarConsumidor(dados);
    const token = await resposta.jwtSign({
      sub: consumidor.id,
      tipo: "consumidor",
      nome: consumidor.nome,
      email: consumidor.email,
    });
    return { ...consumidor, token };
  });

  app.get("/auth/eu", { preHandler: autenticar }, async (requisicao) => {
    const perfil = await appServico.buscarConsumidor(requisicao.user.sub);
    return perfil;
  });

  // ── Vitrine (pública) ─────────────────────────────────────────────────

  app.get("/vitrine", async () => {
    return appServico.montarVitrine();
  });

  // ── Produtos (públicas) ───────────────────────────────────────────────

  app.get("/produtos", async (requisicao) => {
    const filtros = esquemaListarProdutos.parse(requisicao.query);
    return appServico.listarProdutosApp(filtros);
  });

  app.get<{ Params: { id: string } }>("/produtos/:id", async (requisicao) => {
    return appServico.buscarProdutoApp(requisicao.params.id);
  });

  // ── Pedidos (autenticadas) ────────────────────────────────────────────

  app.post("/pedidos", { preHandler: autenticar }, async (requisicao, resposta) => {
    const dados = esquemaCriarPedido.parse(requisicao.body);
    const pedido = await appServico.criarPedido(requisicao.user.sub, dados);
    return resposta.status(201).send(pedido);
  });

  app.get<{ Params: { id: string } }>("/pedidos/:id", { preHandler: autenticar }, async (requisicao) => {
    return appServico.buscarPedido(requisicao.user.sub, requisicao.params.id);
  });

  app.get("/pedidos/meus", { preHandler: autenticar }, async (requisicao) => {
    const params = esquemaListarPedidos.parse(requisicao.query);
    return appServico.listarPedidosConsumidor(requisicao.user.sub, params.pagina, params.limite);
  });

  // ── Perfil (autenticadas) ─────────────────────────────────────────────

  app.get("/perfil", { preHandler: autenticar }, async (requisicao) => {
    return appServico.buscarConsumidor(requisicao.user.sub);
  });

  app.put("/perfil", { preHandler: autenticar }, async (requisicao) => {
    const dados = esquemaAtualizarPerfil.parse(requisicao.body);
    return appServico.atualizarConsumidor(requisicao.user.sub, dados);
  });

  // ── Endereços (autenticadas) ──────────────────────────────────────────

  app.get("/enderecos", { preHandler: autenticar }, async (requisicao) => {
    return appServico.listarEnderecos(requisicao.user.sub);
  });

  app.post("/enderecos", { preHandler: autenticar }, async (requisicao, resposta) => {
    const dados = esquemaCriarEndereco.parse(requisicao.body);
    const endereco = await appServico.criarEndereco(requisicao.user.sub, dados);
    return resposta.status(201).send(endereco);
  });

  app.delete<{ Params: { id: string } }>("/enderecos/:id", { preHandler: autenticar }, async (requisicao, resposta) => {
    await appServico.removerEndereco(requisicao.user.sub, requisicao.params.id);
    return resposta.status(204).send();
  });

  // ── Pagamento (autenticadas) ──────────────────────────────────────────

  app.post("/pagamento/pix", { preHandler: autenticar }, async (requisicao) => {
    const dados = esquemaPagamentoPix.parse(requisicao.body);
    return appServico.gerarPix(dados.pedidoId, dados.valor);
  });

  app.post("/pagamento/cartao", { preHandler: autenticar }, async (requisicao) => {
    const dados = esquemaPagamentoCartao.parse(requisicao.body);
    return appServico.processarCartao(dados.pedidoId, dados.valor, dados.tokenCartao);
  });
}
