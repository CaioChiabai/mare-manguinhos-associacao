import { Prisma } from "../../../src/generated/prisma/index.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import {
  ErroAplicacao,
  ErroConflito,
  ErroNaoEncontrado,
} from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import { normalizarTelefone } from "../../compartilhado/telefone.js";
import type {
  EntradaAlterarStatus,
  EntradaAtualizarAssociado,
  EntradaCriarAssociado,
} from "./associados.esquemas.js";

export const associadosServico = {
  async listar(filtros: {
    busca?: string;
    status?: "ativo" | "suspenso" | "inadimplente" | "bloqueado";
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.AssociadoWhereInput = {};

    if (filtros.status) where.status = filtros.status;

    if (filtros.busca) {
      where.OR = [
        { nome: { contains: filtros.busca } },
        { cpf: { contains: filtros.busca } },
        { email: { contains: filtros.busca } },
        { numeroCarteira: { contains: filtros.busca } },
      ];
    }

    const [itens, total] = await Promise.all([
      prisma.associado.findMany({
        where,
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: { dataCadastro: "desc" },
      }),
      prisma.associado.count({ where }),
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
    const associado = await prisma.associado.findUnique({
      where: { id },
      include: {
        lojas: true,
        permissoes: true,
        mensalidades: { orderBy: { dataVencimento: "desc" }, take: 12 },
        historicoStatus: { orderBy: { alteradoEm: "desc" }, take: 20 },
      },
    });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    return associado;
  },

  async criar(dados: EntradaCriarAssociado, usuarioId?: string) {
    const cpfExistente = await prisma.associado.findUnique({ where: { cpf: dados.cpf } });
    if (cpfExistente) throw new ErroConflito("CPF já cadastrado");

    const emailExistente = await prisma.associado.findUnique({ where: { email: dados.email } });
    if (emailExistente) throw new ErroConflito("E-mail já cadastrado");

    const telefone = normalizarTelefone(dados.telefone);
    const telefoneExistente = await prisma.associado.findUnique({ where: { telefone } });
    if (telefoneExistente) throw new ErroConflito("Telefone já cadastrado");

    const carteiraExistente = await prisma.associado.findUnique({
      where: { numeroCarteira: dados.numeroCarteira },
    });
    if (carteiraExistente) throw new ErroConflito("Número de carteira já cadastrado");

    const associado = await prisma.associado.create({
      data: { ...dados, telefone },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "criar",
      entidade: "associado",
      entidadeId: associado.id,
      detalhes: { nome: associado.nome },
    });

    return associado;
  },

  async atualizar(id: string, dados: EntradaAtualizarAssociado, usuarioId?: string) {
    const existente = await prisma.associado.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Associado");

    let telefone: string | undefined;
    if (dados.telefone) {
      telefone = normalizarTelefone(dados.telefone);
      if (telefone !== existente.telefone) {
        const telefoneExistente = await prisma.associado.findUnique({ where: { telefone } });
        if (telefoneExistente) throw new ErroConflito("Telefone já cadastrado");
      }
    }

    const associado = await prisma.associado.update({
      where: { id },
      data: { ...dados, ...(telefone && { telefone }) },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "atualizar",
      entidade: "associado",
      entidadeId: id,
      detalhes: dados,
    });

    return associado;
  },

  async alterarStatus(id: string, dados: EntradaAlterarStatus, usuarioId?: string) {
    const existente = await prisma.associado.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Associado");

    if (existente.status === dados.status) return existente;

    if (
      (dados.status === "suspenso" || dados.status === "bloqueado") &&
      !dados.motivo?.trim()
    ) {
      throw new ErroAplicacao("Motivo é obrigatório para suspender ou bloquear");
    }

    const [associado] = await prisma.$transaction([
      prisma.associado.update({ where: { id }, data: { status: dados.status } }),
      prisma.historicoStatusAssociado.create({
        data: {
          associadoId: id,
          statusAnterior: existente.status,
          statusNovo: dados.status,
          motivo: dados.motivo,
          alteradoPor: usuarioId,
        },
      }),
    ]);

    await registrarAuditoria({
      usuarioId,
      acao: "alterar_status",
      entidade: "associado",
      entidadeId: id,
      detalhes: { de: existente.status, para: dados.status, motivo: dados.motivo },
    });

    return associado;
  },

  async excluir(id: string, usuarioId?: string) {
    const existente = await prisma.associado.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Associado");

    await prisma.associado.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId,
      acao: "excluir",
      entidade: "associado",
      entidadeId: id,
      detalhes: { nome: existente.nome },
    });
  },

  async podeVender(id: string) {
    const associado = await prisma.associado.findUnique({ where: { id } });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    return {
      podeVender: associado.status === "ativo",
      status: associado.status,
    };
  },
};
