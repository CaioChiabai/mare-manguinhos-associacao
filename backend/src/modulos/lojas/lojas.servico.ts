import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import {
  ErroAplicacao,
  ErroConflito,
  ErroNaoEncontrado,
} from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import type {
  EntradaAtualizarLoja,
  EntradaAtualizarStatusLoja,
  EntradaCriarLoja,
} from "./lojas.esquemas.js";

async function validarAssociadoParaLoja(associadoId: string) {
  const associado = await prisma.associado.findUnique({ where: { id: associadoId } });
  if (!associado) throw new ErroNaoEncontrado("Associado");
  return associado;
}

export const lojasServico = {
  async listar(filtros: {
    busca?: string;
    status?: "pendente" | "aprovada" | "rejeitada" | "suspensa";
    associadoId?: string;
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.LojaWhereInput = {};

    if (filtros.status) where.status = filtros.status;
    if (filtros.associadoId) where.associadoId = filtros.associadoId;

    if (filtros.busca) {
      where.OR = [
        { nomeLoja: { contains: filtros.busca } },
        { descricao: { contains: filtros.busca } },
        { associado: { nome: { contains: filtros.busca } } },
      ];
    }

    const [itens, total] = await Promise.all([
      prisma.loja.findMany({
        where,
        include: {
          associado: {
            select: { id: true, nome: true, status: true, numeroCarteira: true },
          },
        },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: [{ status: "asc" }, { dataSolicitacao: "desc" }],
      }),
      prisma.loja.count({ where }),
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
    const loja = await prisma.loja.findUnique({
      where: { id },
      include: {
        associado: {
          select: {
            id: true,
            nome: true,
            status: true,
            email: true,
            telefone: true,
            numeroCarteira: true,
          },
        },
      },
    });
    if (!loja) throw new ErroNaoEncontrado("Loja");
    return loja;
  },

  async criar(dados: EntradaCriarLoja, usuarioId?: string) {
    const associado = await validarAssociadoParaLoja(dados.associadoId);
    if (dados.status === "aprovada" && associado.status !== "ativo") {
      throw new ErroConflito("Somente associados ativos podem ter lojas aprovadas");
    }

    const loja = await prisma.loja.create({
      data: {
        ...dados,
        dataAprovacao: dados.status === "aprovada" ? new Date() : null,
      },
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "criar",
      entidade: "loja",
      entidadeId: loja.id,
      detalhes: { nomeLoja: loja.nomeLoja, associadoId: loja.associadoId },
    });

    return loja;
  },

  async atualizar(id: string, dados: EntradaAtualizarLoja, usuarioId?: string) {
    const existente = await prisma.loja.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Loja");

    const associado = dados.associadoId
      ? await validarAssociadoParaLoja(dados.associadoId)
      : null;

    if (dados.status === "aprovada") {
      const assocParaChecagem = associado ?? await validarAssociadoParaLoja(existente.associadoId);
      if (assocParaChecagem.status !== "ativo") {
        throw new ErroConflito("Somente associados ativos podem ter lojas aprovadas");
      }
    }

    let dataAprovacao: Date | null | undefined;
    if (dados.status === "aprovada") {
      dataAprovacao = existente.dataAprovacao ?? new Date();
    } else if (dados.status) {
      dataAprovacao = null;
    }

    const loja = await prisma.loja.update({
      where: { id },
      data: {
        ...dados,
        dataAprovacao,
      },
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "atualizar",
      entidade: "loja",
      entidadeId: id,
      detalhes: dados,
    });

    return loja;
  },

  async atualizarStatus(id: string, dados: EntradaAtualizarStatusLoja, usuarioId?: string) {
    const loja = await prisma.loja.findUnique({
      where: { id },
      include: { associado: true },
    });
    if (!loja) throw new ErroNaoEncontrado("Loja");

    if (dados.status === "aprovada" && loja.associado.status !== "ativo") {
      throw new ErroConflito("Somente associados ativos podem ter lojas aprovadas");
    }

    if (dados.status === "rejeitada" && !dados.motivoRejeicao?.trim()) {
      throw new ErroAplicacao("Motivo é obrigatório ao rejeitar uma loja");
    }

    const atualizada = await prisma.loja.update({
      where: { id },
      data: {
        status: dados.status,
        motivoRejeicao: dados.status === "rejeitada" ? dados.motivoRejeicao : null,
        dataAprovacao: dados.status === "aprovada" ? new Date() : null,
      },
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "alterar_status",
      entidade: "loja",
      entidadeId: id,
      detalhes: { de: loja.status, para: dados.status, motivoRejeicao: dados.motivoRejeicao },
    });

    return atualizada;
  },

  async excluir(id: string, usuarioId?: string) {
    const existente = await prisma.loja.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Loja");

    await prisma.loja.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId,
      acao: "excluir",
      entidade: "loja",
      entidadeId: id,
      detalhes: { nomeLoja: existente.nomeLoja },
    });
  },
};
