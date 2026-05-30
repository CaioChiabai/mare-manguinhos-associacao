import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import {
  ErroAplicacao,
  ErroConflito,
  ErroNaoEncontrado,
} from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import type {
  EntradaAtualizarStatusVenda,
  EntradaCriarVenda,
} from "./vendas.esquemas.js";

async function ajustarEstoqueItens(
  tx: Prisma.TransactionClient,
  itens: Array<{ produtoId: string; quantidade: number }>,
  direcao: "decrementar" | "incrementar"
) {
  for (const item of itens) {
    if (direcao === "decrementar") {
      const resultado = await tx.produto.updateMany({
        where: {
          id: item.produtoId,
          ativo: true,
          estoque: { gte: item.quantidade },
        },
        data: { estoque: { decrement: item.quantidade } },
      });

      if (resultado.count !== 1) {
        throw new ErroConflito("Estoque insuficiente ou produto inativo");
      }
      continue;
    }

    await tx.produto.update({
      where: { id: item.produtoId },
      data: { estoque: { increment: item.quantidade } },
    });
  }
}

export const vendasServico = {
  async listar(filtros: {
    lojaId?: string;
    associadoId?: string;
    status?: "pendente" | "concluida" | "cancelada";
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.VendaWhereInput = {};
    if (filtros.lojaId) where.lojaId = filtros.lojaId;
    if (filtros.associadoId) where.associadoId = filtros.associadoId;
    if (filtros.status) where.status = filtros.status;

    const [itens, total] = await Promise.all([
      prisma.venda.findMany({
        where,
        include: {
          loja: { select: { id: true, nomeLoja: true } },
          associado: { select: { id: true, nome: true } },
          itens: { include: { produto: { select: { id: true, nome: true } } } },
          transporte: true,
        },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: { criadoEm: "desc" },
      }),
      prisma.venda.count({ where }),
    ]);

    return {
      itens,
      total,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
      totalPaginas: Math.ceil(total / filtros.porPagina),
    };
  },

  async buscarPorId(id: string) {
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        loja: { select: { id: true, nomeLoja: true, status: true } },
        associado: { select: { id: true, nome: true, status: true } },
        itens: { include: { produto: true } },
        transporte: true,
      },
    });
    if (!venda) throw new ErroNaoEncontrado("Venda");
    return venda;
  },

  async criar(dados: EntradaCriarVenda, usuarioId?: string) {
    const loja = await prisma.loja.findUnique({
      where: { id: dados.lojaId },
      include: {
        associado: { select: { id: true, status: true } },
      },
    });
    if (!loja) throw new ErroNaoEncontrado("Loja");
    if (loja.status !== "aprovada") {
      throw new ErroConflito("Somente lojas aprovadas podem registrar vendas");
    }
    if (!loja.associado || loja.associado.status !== "ativo") {
      throw new ErroConflito(
        "Somente lojas com associado ativo podem registrar vendas"
      );
    }

    const associado = await prisma.associado.findUnique({ where: { id: dados.associadoId } });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    if (associado.status !== "ativo") {
      throw new ErroConflito("Somente associados ativos podem realizar vendas");
    }

    const produtoIds = [...new Set(dados.itens.map((item) => item.produtoId))];
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds } },
    });
    if (produtos.length !== produtoIds.length) {
      throw new ErroNaoEncontrado("Produto");
    }

    let total = 0;
    const itensComPreco = dados.itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId)!;
      if (!produto.ativo) {
        throw new ErroAplicacao(`Produto inativo: ${produto.nome}`);
      }
      if (produto.estoque < item.quantidade) {
        throw new ErroConflito(`Estoque insuficiente para ${produto.nome}`);
      }
      const subtotal = produto.preco * item.quantidade;
      total += subtotal;
      return {
        produtoId: produto.id,
        quantidade: item.quantidade,
        precoUnitario: produto.preco,
        subtotal,
      };
    });

    const venda = await prisma.$transaction(async (tx) => {
      const criada = await tx.venda.create({
        data: {
          lojaId: dados.lojaId,
          associadoId: dados.associadoId,
          status: dados.status,
          observacoes: dados.observacoes,
          total,
          itens: { create: itensComPreco },
        },
        include: { itens: true },
      });

      if (dados.status === "concluida") {
        await ajustarEstoqueItens(
          tx,
          itensComPreco.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
          "decrementar"
        );
      }

      return criada;
    });

    await registrarAuditoria({
      usuarioId,
      acao: "criar",
      entidade: "venda",
      entidadeId: venda.id,
      detalhes: { lojaId: venda.lojaId, total: venda.total },
    });

    return venda;
  },

  async atualizarStatus(id: string, dados: EntradaAtualizarStatusVenda, usuarioId?: string) {
    const resultado = await prisma.$transaction(async (tx) => {
      const venda = await tx.venda.findUnique({
        where: { id },
        include: { itens: true },
      });
      if (!venda) throw new ErroNaoEncontrado("Venda");

      if (venda.status === dados.status) {
        return { atualizada: venda, statusAnterior: venda.status, alterou: false };
      }

      const statusAnterior = venda.status;
      const updateResult = await tx.venda.updateMany({
        where: { id, status: statusAnterior },
        data: { status: dados.status, observacoes: dados.observacoes ?? venda.observacoes },
      });

      if (updateResult.count !== 1) {
        throw new ErroConflito("A venda foi alterada por outra operação. Tente novamente.");
      }

      if (statusAnterior !== "concluida" && dados.status === "concluida") {
        await ajustarEstoqueItens(tx, venda.itens, "decrementar");
      } else if (statusAnterior === "concluida" && dados.status === "cancelada") {
        await ajustarEstoqueItens(tx, venda.itens, "incrementar");
      }

      const atualizada = await tx.venda.findUnique({ where: { id } });
      if (!atualizada) throw new ErroNaoEncontrado("Venda");

      return { atualizada, statusAnterior, alterou: true };
    });

    if (!resultado.alterou) return resultado.atualizada;

    await registrarAuditoria({
      usuarioId,
      acao: "alterar_status",
      entidade: "venda",
      entidadeId: id,
      detalhes: { de: resultado.statusAnterior, para: dados.status },
    });

    return resultado.atualizada;
  },

  async excluir(id: string, usuarioId?: string) {
    const existente = await prisma.venda.findUnique({
      where: { id },
      include: { itens: true },
    });
    if (!existente) throw new ErroNaoEncontrado("Venda");

    await prisma.$transaction(async (tx) => {
      if (existente.status === "concluida") {
        await ajustarEstoqueItens(tx, existente.itens, "incrementar");
      }

      await tx.venda.delete({ where: { id } });
    });

    await registrarAuditoria({
      usuarioId,
      acao: "excluir",
      entidade: "venda",
      entidadeId: id,
    });
  },
};
