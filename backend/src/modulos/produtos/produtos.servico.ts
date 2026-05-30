import { Prisma } from "../../../src/generated/prisma/index.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import { ErroConflito, ErroNaoEncontrado } from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import type {
  EntradaAtualizarProduto,
  EntradaCriarProduto,
} from "./produtos.esquemas.js";

export const produtosServico = {
  async listar(filtros: {
    busca?: string;
    associadoId?: string;
    ativo?: boolean;
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.ProdutoWhereInput = {};

    if (filtros.associadoId) where.associadoId = filtros.associadoId;
    if (typeof filtros.ativo === "boolean") where.ativo = filtros.ativo;

    if (filtros.busca) {
      where.OR = [
        { especie: { contains: filtros.busca } },
        { descricao: { contains: filtros.busca } },
      ];
    }

    const [itens, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        include: { associado: { select: { id: true, nome: true } } },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: { criadoEm: "desc" },
      }),
      prisma.produto.count({ where }),
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
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: { associado: { select: { id: true, nome: true, status: true } } },
    });
    if (!produto) throw new ErroNaoEncontrado("Produto");
    return produto;
  },

  async criar(dados: EntradaCriarProduto, usuarioId?: string) {
    const associado = await prisma.associado.findUnique({
      where: { id: dados.associadoId },
    });
    if (!associado) throw new ErroNaoEncontrado("Associado");
    if (associado.status !== "ativo") {
      throw new ErroConflito("Somente associados ativos podem cadastrar produtos");
    }

    const lojasAprovadas = await prisma.loja.count({
      where: { associadoId: associado.id, status: "aprovada" },
    });
    if (lojasAprovadas === 0) {
      throw new ErroConflito("Associado precisa de uma loja aprovada para cadastrar produtos");
    }

    const produto = await prisma.produto.create({ data: dados });

    await registrarAuditoria({
      usuarioId,
      acao: "criar",
      entidade: "produto",
      entidadeId: produto.id,
      detalhes: { especie: produto.especie, associadoId: produto.associadoId },
    });

    return produto;
  },

  async atualizar(id: string, dados: EntradaAtualizarProduto, usuarioId?: string) {
    const existente = await prisma.produto.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Produto");

    const produto = await prisma.produto.update({ where: { id }, data: dados });

    await registrarAuditoria({
      usuarioId,
      acao: "atualizar",
      entidade: "produto",
      entidadeId: id,
      detalhes: dados,
    });

    return produto;
  },

  async excluir(id: string, usuarioId?: string) {
    const existente = await prisma.produto.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Produto");

    const itemVendaRelacionado = await prisma.itemVenda.findFirst({
      where: { produtoId: id },
      select: { id: true },
    });

    if (itemVendaRelacionado) {
      throw new ErroConflito("Não é possível excluir produto com itens de venda vinculados");
    }

    await prisma.produto.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId,
      acao: "excluir",
      entidade: "produto",
      entidadeId: id,
      detalhes: { especie: existente.especie },
    });
  },
};
