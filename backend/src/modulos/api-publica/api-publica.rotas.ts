import type { FastifyInstance } from "fastify";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import { ErroNaoEncontrado } from "../../compartilhado/erros.js";
import { normalizarTelefone } from "../../compartilhado/telefone.js";

export async function rotasApiPublica(app: FastifyInstance) {
  app.get("/associados/ativos", async () => {
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

  async function contarLojasAprovadas(associadoId: string) {
    return prisma.loja.count({
      where: { associadoId, status: "aprovada" },
    });
  }

  app.get<{ Params: { id: string } }>("/pescador/:id/pode-vender", async (requisicao) => {
    const associado = await prisma.associado.findUnique({ where: { id: requisicao.params.id } });
    if (!associado) throw new ErroNaoEncontrado("Associado");

    const lojasAprovadas = await contarLojasAprovadas(associado.id);
    return {
      associadoId: associado.id,
      podeVender: associado.status === "ativo" && lojasAprovadas > 0,
      status: associado.status,
      lojasAprovadas,
    };
  });

  app.get<{ Params: { telefone: string } }>("/pescador/telefone/:telefone/pode-vender", async (requisicao) => {
    const telefone = normalizarTelefone(requisicao.params.telefone);
    const associado = await prisma.associado.findUnique({ where: { telefone } });
    if (!associado) throw new ErroNaoEncontrado("Associado");

    const lojasAprovadas = await contarLojasAprovadas(associado.id);
    return {
      associadoId: associado.id,
      podeVender: associado.status === "ativo" && lojasAprovadas > 0,
      status: associado.status,
      lojasAprovadas,
    };
  });

  app.get<{ Params: { id: string } }>("/pescador/:id/status", async (requisicao) => {
    const associado = await prisma.associado.findUnique({
      where: { id: requisicao.params.id },
      select: { id: true, nome: true, status: true },
    });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    return associado;
  });

  app.get<{ Params: { id: string } }>("/pescador/:id/ativo", async (requisicao) => {
    const associado = await prisma.associado.findUnique({
      where: { id: requisicao.params.id },
      select: { status: true },
    });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    return associado.status === "ativo";
  });

  app.get<{ Params: { telefone: string } }>("/pescador/telefone/:telefone/ativo", async (requisicao) => {
    const telefone = normalizarTelefone(requisicao.params.telefone);
    const associado = await prisma.associado.findUnique({
      where: { telefone },
      select: { status: true },
    });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    return associado.status === "ativo";
  });

  app.get<{ Params: { id: string } }>("/loja/:id/ativa", async (requisicao) => {
    const loja = await prisma.loja.findUnique({
      where: { id: requisicao.params.id },
      select: { status: true, associado: { select: { status: true } } },
    });
    if (!loja) throw new ErroNaoEncontrado("Loja");
    return loja.status === "aprovada" && loja.associado.status === "ativo";
  });
}
