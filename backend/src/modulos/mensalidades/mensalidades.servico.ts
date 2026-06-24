import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import {
  ErroConflito,
  ErroNaoEncontrado,
} from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import type {
  EntradaAtualizarMensalidade,
  EntradaCriarMensalidade,
  EntradaRegistrarPagamento,
} from "./mensalidades.esquemas.js";

// @spec SPEC-002 R002
function obterStatusAutomatico(dataVencimento: Date, dataPagamento?: Date | null) {
  if (dataPagamento) return "pago" as const;
  return dataVencimento < new Date() ? "atrasado" as const : "pendente" as const;
}

// @spec SPEC-001 R004 R005 R006 R007 | SPEC-002 R003 R004 R005 R006
async function sincronizarStatusAssociado(associadoId: string) {
  const associado = await prisma.associado.findUnique({ where: { id: associadoId } });
  if (!associado) throw new ErroNaoEncontrado("Associado");

  const possuiDebitos = await prisma.mensalidade.count({
    where: {
      associadoId,
      OR: [{ status: "atrasado" }, { status: "pendente", dataVencimento: { lt: new Date() } }],
    },
  });

  const novoStatus = possuiDebitos > 0 ? "inadimplente" : "ativo";
  if (associado.status !== "bloqueado" && associado.status !== "suspenso" && associado.status !== novoStatus) {
    await prisma.associado.update({
      where: { id: associadoId },
      data: { status: novoStatus },
    });

    await prisma.historicoStatusAssociado.create({
      data: {
        associadoId,
        statusAnterior: associado.status,
        statusNovo: novoStatus,
        motivo: novoStatus === "inadimplente" ? "Mensalidades em aberto" : "Regularização financeira",
      },
    });
  }
}

function converterDatas<T extends { dataVencimento?: string; dataPagamento?: string | null }>(dados: T) {
  const dataVencimento = dados.dataVencimento ? new Date(dados.dataVencimento) : undefined;
  const dataPagamento =
    dados.dataPagamento === undefined
      ? undefined
      : dados.dataPagamento
        ? new Date(dados.dataPagamento)
        : null;
  const statusAutomatico =
    dataVencimento ? obterStatusAutomatico(dataVencimento, dataPagamento ?? undefined) : undefined;

  return {
    ...dados,
    dataVencimento,
    dataPagamento,
    status: statusAutomatico,
  };
}

export const mensalidadesServico = {
  async listar(filtros: {
    associadoId?: string;
    status?: "pendente" | "pago" | "atrasado";
    competencia?: string;
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.MensalidadeWhereInput = {};
    if (filtros.associadoId) where.associadoId = filtros.associadoId;
    if (filtros.status) where.status = filtros.status;
    if (filtros.competencia) where.competencia = filtros.competencia;

    const [itens, total] = await Promise.all([
      prisma.mensalidade.findMany({
        where,
        include: {
          associado: {
            select: { id: true, nome: true, status: true, numeroCarteira: true },
          },
        },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: [{ dataVencimento: "desc" }, { criadoEm: "desc" }],
      }),
      prisma.mensalidade.count({ where }),
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
    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id },
      include: {
        associado: {
          select: {
            id: true,
            nome: true,
            status: true,
            email: true,
            telefone: true,
          },
        },
      },
    });
    if (!mensalidade) throw new ErroNaoEncontrado("Mensalidade");
    return mensalidade;
  },

  async criar(dados: EntradaCriarMensalidade, usuarioId?: string) {
    const associado = await prisma.associado.findUnique({ where: { id: dados.associadoId } });
    if (!associado) throw new ErroNaoEncontrado("Associado");

    const existente = await prisma.mensalidade.findUnique({
      where: {
        associadoId_competencia: {
          associadoId: dados.associadoId,
          competencia: dados.competencia,
        },
      },
    });
    if (existente) throw new ErroConflito("Já existe mensalidade para esta competência");

    const mensalidade = await prisma.mensalidade.create({
      data: converterDatas(dados),
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await sincronizarStatusAssociado(dados.associadoId);

    await registrarAuditoria({
      usuarioId,
      acao: "criar",
      entidade: "mensalidade",
      entidadeId: mensalidade.id,
      detalhes: { competencia: mensalidade.competencia, associadoId: mensalidade.associadoId },
    });

    return mensalidade;
  },

  async atualizar(id: string, dados: EntradaAtualizarMensalidade, usuarioId?: string) {
    const existente = await prisma.mensalidade.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Mensalidade");

    const mensalidade = await prisma.mensalidade.update({
      where: { id },
      data: converterDatas(dados),
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await sincronizarStatusAssociado(mensalidade.associadoId);

    await registrarAuditoria({
      usuarioId,
      acao: "atualizar",
      entidade: "mensalidade",
      entidadeId: id,
      detalhes: dados,
    });

    return mensalidade;
  },

  async registrarPagamento(id: string, dados: EntradaRegistrarPagamento, usuarioId?: string) {
    const existente = await prisma.mensalidade.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Mensalidade");

    const dataPagamento = dados.dataPagamento ? new Date(dados.dataPagamento) : new Date();
    const mensalidade = await prisma.mensalidade.update({
      where: { id },
      data: {
        dataPagamento,
        status: "pago",
      },
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await sincronizarStatusAssociado(mensalidade.associadoId);

    await registrarAuditoria({
      usuarioId,
      acao: "registrar_pagamento",
      entidade: "mensalidade",
      entidadeId: id,
      detalhes: { dataPagamento },
    });

    return mensalidade;
  },

  async excluir(id: string, usuarioId?: string) {
    const existente = await prisma.mensalidade.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Mensalidade");

    await prisma.mensalidade.delete({ where: { id } });
    await sincronizarStatusAssociado(existente.associadoId);

    await registrarAuditoria({
      usuarioId,
      acao: "excluir",
      entidade: "mensalidade",
      entidadeId: id,
      detalhes: { competencia: existente.competencia },
    });
  },

  async sincronizarAtrasos() {
    const pendentes = await prisma.mensalidade.findMany({
      where: {
        status: "pendente",
        dataPagamento: null,
        dataVencimento: { lt: new Date() },
      },
    });

    if (pendentes.length === 0) return;

    await prisma.$transaction(
      pendentes.map((mensalidade) =>
        prisma.mensalidade.update({
          where: { id: mensalidade.id },
          data: { status: "atrasado" },
        }),
      ),
    );

    const associadosIds = [...new Set(pendentes.map((item) => item.associadoId))];
    await Promise.all(associadosIds.map(sincronizarStatusAssociado));
  },
};
