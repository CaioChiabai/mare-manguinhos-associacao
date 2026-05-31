import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import { ErroAplicacao, ErroNaoEncontrado } from "../../compartilhado/erros.js";
import { normalizarTelefone } from "../../compartilhado/telefone.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import { mensalidadesServico } from "../mensalidades/mensalidades.servico.js";

const esquemaCadastrarProdutoChatbot = z.object({
  especie: z.string().min(2).max(100),
  precoPorKg: z.coerce.number().positive(),
  pesoDisponivel: z.coerce.number().positive(),
  lojaId: z.string().uuid().optional(),
});

export async function rotasApiPublica(app: FastifyInstance) {
  app.get("/associados/ativos", async () => {
    await mensalidadesServico.sincronizarAtrasos();
    const associados = await prisma.associado.findMany({
      where: { status: "ativo" },
      select: {
        id: true,
        nome: true,
        status: true,
      },
      orderBy: { nome: "asc" },
    });
    return { itens: associados };
  });

  app.get("/lojas/aprovadas", async () => {
    await mensalidadesServico.sincronizarAtrasos();
    const lojas = await prisma.loja.findMany({
      where: {
        status: "aprovada",
        associado: { status: "ativo" },
      },
      include: {
        associado: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { nomeLoja: "asc" },
    });
    return { itens: lojas };
  });

  async function podeVender(associadoId: string) {
    const lojasAprovadas = await prisma.loja.count({
      where: { associadoId, status: "aprovada" },
    });
    return lojasAprovadas;
  }

  app.get<{ Params: { id: string } }>("/pescador/:id/pode-vender", async (requisicao) => {
    await mensalidadesServico.sincronizarAtrasos();
    const associado = await prisma.associado.findUnique({ where: { id: requisicao.params.id } });
    if (!associado) throw new ErroNaoEncontrado("Associado");

    const lojasAprovadas = await podeVender(associado.id);
    return {
      associadoId: associado.id,
      podeVender: associado.status === "ativo" && lojasAprovadas > 0,
      status: associado.status,
      lojasAprovadas,
    };
  });

  app.get<{ Params: { telefone: string } }>("/pescador/telefone/:telefone/pode-vender", async (requisicao) => {
    await mensalidadesServico.sincronizarAtrasos();
    const telefone = normalizarTelefone(requisicao.params.telefone);
    const associado = await prisma.associado.findUnique({ where: { telefone } });
    if (!associado) throw new ErroNaoEncontrado("Associado");

    const lojasAprovadas = await podeVender(associado.id);
    return {
      associadoId: associado.id,
      podeVender: associado.status === "ativo" && lojasAprovadas > 0,
      status: associado.status,
      lojasAprovadas,
    };
  });

  app.get<{ Params: { id: string } }>("/pescador/:id/status", async (requisicao) => {
    await mensalidadesServico.sincronizarAtrasos();
    const associado = await prisma.associado.findUnique({
      where: { id: requisicao.params.id },
      select: { id: true, nome: true, status: true },
    });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    return associado;
  });

  app.get<{ Params: { id: string } }>("/pescador/:id/ativo", async (requisicao) => {
    await mensalidadesServico.sincronizarAtrasos();
    const associado = await prisma.associado.findUnique({
      where: { id: requisicao.params.id },
      select: { status: true },
    });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    return associado.status === "ativo";
  });

  app.get<{ Params: { telefone: string } }>("/pescador/telefone/:telefone/ativo", async (requisicao) => {
    await mensalidadesServico.sincronizarAtrasos();
    const telefone = normalizarTelefone(requisicao.params.telefone);
    const associado = await prisma.associado.findUnique({
      where: { telefone },
      select: { status: true },
    });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    return associado.status === "ativo";
  });

  app.get<{ Params: { id: string } }>("/loja/:id/ativa", async (requisicao) => {
    await mensalidadesServico.sincronizarAtrasos();
    const loja = await prisma.loja.findUnique({
      where: { id: requisicao.params.id },
      select: { status: true, associado: { select: { status: true } } },
    });
    if (!loja) throw new ErroNaoEncontrado("Loja");
    return loja.status === "aprovada" && loja.associado.status === "ativo";
  });

  app.post<{ Params: { telefone: string } }>(
    "/pescador/telefone/:telefone/produto",
    async (requisicao, resposta) => {
      await mensalidadesServico.sincronizarAtrasos();

      const dados = esquemaCadastrarProdutoChatbot.parse(requisicao.body);
      const telefone = normalizarTelefone(requisicao.params.telefone);

      const associado = await prisma.associado.findUnique({
        where: { telefone },
        select: {
          id: true,
          nome: true,
          status: true,
          lojas: {
            where: { status: "aprovada" },
            select: { id: true, nomeLoja: true },
          },
        },
      });
      if (!associado) throw new ErroNaoEncontrado("Pescador");

      const lojasAprovadas = associado.lojas;
      if (associado.status !== "ativo" || lojasAprovadas.length === 0) {
        throw new ErroAplicacao(
          `Pescador não pode vender (status: ${associado.status}, lojas aprovadas: ${lojasAprovadas.length})`,
          403,
        );
      }

      // Resolve em qual loja o produto será cadastrado. Hoje cada pescador tem uma
      // única loja, mas o modelo já comporta várias: nesse caso o chatbot precisa
      // informar lojaId para desambiguar.
      let loja: { id: string; nomeLoja: string };
      if (dados.lojaId) {
        const lojaInformada = lojasAprovadas.find((l) => l.id === dados.lojaId);
        if (!lojaInformada) {
          throw new ErroAplicacao(
            "Loja informada não pertence ao pescador ou não está aprovada",
            404,
          );
        }
        loja = lojaInformada;
      } else if (lojasAprovadas.length === 1) {
        loja = lojasAprovadas[0]!;
      } else {
        throw new ErroAplicacao(
          "Pescador possui mais de uma loja aprovada; informe lojaId para identificar a loja",
          409,
        );
      }

      const produto = await prisma.produto.create({
        data: {
          lojaId: loja.id,
          especie: dados.especie,
          precoPorKg: dados.precoPorKg,
          pesoDisponivel: dados.pesoDisponivel,
        },
      });

      await registrarAuditoria({
        acao: "criar",
        entidade: "produto",
        entidadeId: produto.id,
        detalhes: { canal: "chatbot_whatsapp", telefone, especie: produto.especie, lojaId: loja.id },
      });

      return resposta.status(201).send({
        id: produto.id,
        especie: produto.especie,
        precoPorKg: produto.precoPorKg,
        pesoDisponivel: produto.pesoDisponivel,
        pescador: { id: associado.id, nome: associado.nome },
        loja: { id: loja.id, nomeLoja: loja.nomeLoja },
        criadoEm: produto.criadoEm,
      });
    },
  );
}
