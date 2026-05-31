import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import { ErroNaoEncontrado } from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import type {
  EntradaAtualizarStatusTransporte,
  EntradaAtualizarTransporte,
  EntradaCriarTransporte,
} from "./transportes.esquemas.js";

export const transportesServico = {
  async listar(filtros: {
    status?: "pendente" | "em_transito" | "entregue" | "cancelado";
    vendaId?: string;
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.TransporteWhereInput = {};
    if (filtros.status) where.status = filtros.status;
    if (filtros.vendaId) where.vendaId = filtros.vendaId;

    const [itens, total] = await Promise.all([
      prisma.transporte.findMany({
        where,
        include: {
          venda: {
            select: {
              id: true,
              total: true,
              loja: { select: { id: true, nomeLoja: true } },
            },
          },
        },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: { criadoEm: "desc" },
      }),
      prisma.transporte.count({ where }),
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
    const transporte = await prisma.transporte.findUnique({
      where: { id },
      include: {
        venda: {
          include: {
            loja: { select: { id: true, nomeLoja: true } },
            associado: { select: { id: true, nome: true } },
          },
        },
      },
    });
    if (!transporte) throw new ErroNaoEncontrado("Transporte");
    return transporte;
  },

  async criar(dados: EntradaCriarTransporte, usuarioId?: string) {
    const venda = await prisma.venda.findUnique({
      where: { id: dados.vendaId },
    });
    if (!venda) throw new ErroNaoEncontrado("Venda");

    const transporte = await prisma.transporte.create({
      data: {
        ...dados,
        dataEnvio: dados.status === "em_transito" ? new Date() : null,
        dataEntrega: dados.status === "entregue" ? new Date() : null,
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "criar",
      entidade: "transporte",
      entidadeId: transporte.id,
      detalhes: { vendaId: transporte.vendaId, destino: transporte.destino },
    });

    return transporte;
  },

  async atualizar(id: string, dados: EntradaAtualizarTransporte, usuarioId?: string) {
    const existente = await prisma.transporte.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Transporte");

    const transporte = await prisma.transporte.update({ where: { id }, data: dados });

    await registrarAuditoria({
      usuarioId,
      acao: "atualizar",
      entidade: "transporte",
      entidadeId: id,
      detalhes: dados,
    });

    return transporte;
  },

  async atualizarStatus(id: string, dados: EntradaAtualizarStatusTransporte, usuarioId?: string) {
    const existente = await prisma.transporte.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Transporte");

    const transporte = await prisma.transporte.update({
      where: { id },
      data: {
        status: dados.status,
        rastreamento: dados.rastreamento ?? existente.rastreamento,
        observacoes: dados.observacoes ?? existente.observacoes,
        dataEnvio:
          dados.status === "em_transito" && !existente.dataEnvio
            ? new Date()
            : existente.dataEnvio,
        dataEntrega: dados.status === "entregue" ? new Date() : existente.dataEntrega,
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "alterar_status",
      entidade: "transporte",
      entidadeId: id,
      detalhes: { de: existente.status, para: dados.status },
    });

    return transporte;
  },

  async excluir(id: string, usuarioId?: string) {
    const existente = await prisma.transporte.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Transporte");

    await prisma.transporte.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId,
      acao: "excluir",
      entidade: "transporte",
      entidadeId: id,
    });
  },
};
