import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import {
  ErroConflito,
  ErroNaoEncontrado,
} from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import type {
  EntradaAlternarPermissao,
  EntradaAtualizarPermissao,
  EntradaCriarPermissao,
} from "./permissoes.esquemas.js";

async function garantirAssociado(id: string) {
  const associado = await prisma.associado.findUnique({ where: { id } });
  if (!associado) throw new ErroNaoEncontrado("Associado");
  return associado;
}

function converterDatas<T extends { dataInicio?: string; dataFim?: string | null }>(dados: T) {
  return {
    ...dados,
    dataInicio: dados.dataInicio ? new Date(dados.dataInicio) : undefined,
    dataFim: dados.dataFim ? new Date(dados.dataFim) : dados.dataFim,
  };
}

export const permissoesServico = {
  async listar(filtros: {
    busca?: string;
    associadoId?: string;
    ativas?: boolean;
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.PermissaoWhereInput = {};

    if (typeof filtros.ativas === "boolean") where.ativa = filtros.ativas;
    if (filtros.associadoId) where.associadoId = filtros.associadoId;
    if (filtros.busca) {
      where.OR = [
        { tipoPermissao: { contains: filtros.busca } },
        { associado: { nome: { contains: filtros.busca } } },
      ];
    }

    const [itens, total] = await Promise.all([
      prisma.permissao.findMany({
        where,
        include: {
          associado: {
            select: { id: true, nome: true, status: true },
          },
        },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: [{ ativa: "desc" }, { criadoEm: "desc" }],
      }),
      prisma.permissao.count({ where }),
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
    const permissao = await prisma.permissao.findUnique({
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
    if (!permissao) throw new ErroNaoEncontrado("Permissão");
    return permissao;
  },

  async criar(dados: EntradaCriarPermissao, usuarioId?: string) {
    const associado = await garantirAssociado(dados.associadoId);

    if (dados.ativa && associado.status !== "ativo") {
      throw new ErroConflito("Permissões ativas só podem ser criadas para associados ativos");
    }

    const permissao = await prisma.permissao.create({
      data: converterDatas(dados),
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "criar",
      entidade: "permissao",
      entidadeId: permissao.id,
      detalhes: { tipoPermissao: permissao.tipoPermissao, associadoId: permissao.associadoId },
    });

    return permissao;
  },

  async atualizar(id: string, dados: EntradaAtualizarPermissao, usuarioId?: string) {
    const existente = await prisma.permissao.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Permissão");

    const associadoId = dados.associadoId ?? existente.associadoId;
    const associado = await garantirAssociado(associadoId);
    if ((dados.ativa ?? existente.ativa) && associado.status !== "ativo") {
      throw new ErroConflito("Permissões ativas só podem ser mantidas para associados ativos");
    }

    const permissao = await prisma.permissao.update({
      where: { id },
      data: converterDatas(dados),
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "atualizar",
      entidade: "permissao",
      entidadeId: id,
      detalhes: dados,
    });

    return permissao;
  },

  async alternar(id: string, dados: EntradaAlternarPermissao, usuarioId?: string) {
    const permissao = await prisma.permissao.findUnique({
      where: { id },
      include: { associado: true },
    });
    if (!permissao) throw new ErroNaoEncontrado("Permissão");

    if (dados.ativa && permissao.associado.status !== "ativo") {
      throw new ErroConflito("Só é possível ativar permissões para associados ativos");
    }

    const atualizada = await prisma.permissao.update({
      where: { id },
      data: { ativa: dados.ativa },
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: dados.ativa ? "ativar" : "desativar",
      entidade: "permissao",
      entidadeId: id,
      detalhes: { ativa: dados.ativa },
    });

    return atualizada;
  },

  async excluir(id: string, usuarioId?: string) {
    const permissao = await prisma.permissao.findUnique({ where: { id } });
    if (!permissao) throw new ErroNaoEncontrado("Permissão");

    await prisma.permissao.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId,
      acao: "excluir",
      entidade: "permissao",
      entidadeId: id,
      detalhes: { tipoPermissao: permissao.tipoPermissao },
    });
  },
};
