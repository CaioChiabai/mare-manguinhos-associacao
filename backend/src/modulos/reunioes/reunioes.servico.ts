import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import { ErroNaoEncontrado } from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import type {
  EntradaAtualizarPresenca,
  EntradaAtualizarReuniao,
  EntradaAtualizarStatusReuniao,
  EntradaCriarReuniao,
} from "./reunioes.esquemas.js";

function serializarPauta(pauta: string[] | undefined) {
  return JSON.stringify(pauta ?? []);
}

function desserializarPauta(pautaJson: string) {
  try {
    const parsed = JSON.parse(pautaJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapearReuniao<T extends { pautaJson: string }>(reuniao: T) {
  return {
    ...reuniao,
    pauta: desserializarPauta(reuniao.pautaJson),
  };
}

async function garantirAssociados(ids: string[]) {
  if (ids.length === 0) return;
  const total = await prisma.associado.count({ where: { id: { in: ids } } });
  if (total !== ids.length) throw new ErroNaoEncontrado("Associado");
}

export const reunioesServico = {
  async listar(filtros: {
    status?: "agendada" | "em_andamento" | "concluida" | "cancelada";
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.ReuniaoWhereInput = {};
    if (filtros.status) where.status = filtros.status;

    const [itens, total] = await Promise.all([
      prisma.reuniao.findMany({
        where,
        include: {
          presencas: {
            include: {
              associado: {
                select: { id: true, nome: true, status: true },
              },
            },
          },
        },
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: { data: "desc" },
      }),
      prisma.reuniao.count({ where }),
    ]);

    return {
      itens: itens.map((reuniao) =>
        mapearReuniao({
          ...reuniao,
          presencas: reuniao.presencas.map((presenca) => ({
            id: presenca.id,
            associadoId: presenca.associadoId,
            associadoNome: presenca.associado.nome,
            presente: presenca.presente,
            associado: presenca.associado,
          })),
        }),
      ),
      total,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
      totalPaginas: Math.ceil(total / filtros.porPagina),
    };
  },

  async buscarPorId(id: string) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id },
      include: {
        presencas: {
          include: {
            associado: {
              select: { id: true, nome: true, status: true, email: true, telefone: true },
            },
          },
        },
      },
    });
    if (!reuniao) throw new ErroNaoEncontrado("Reunião");

    return mapearReuniao({
      ...reuniao,
      presencas: reuniao.presencas.map((presenca) => ({
        id: presenca.id,
        associadoId: presenca.associadoId,
        associadoNome: presenca.associado.nome,
        presente: presenca.presente,
        associado: presenca.associado,
      })),
    });
  },

  async criar(dados: EntradaCriarReuniao, usuarioId?: string) {
    await garantirAssociados(dados.associadosConvocadosIds);

    const reuniao = await prisma.$transaction(async (tx) => {
      const criada = await tx.reuniao.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          data: new Date(dados.data),
          horario: dados.horario,
          local: dados.local,
          status: dados.status,
          pautaJson: serializarPauta(dados.pauta),
          ata: dados.ata,
        },
      });

      if (dados.associadosConvocadosIds.length > 0) {
        await tx.presencaReuniao.createMany({
          data: dados.associadosConvocadosIds.map((associadoId) => ({
            reuniaoId: criada.id,
            associadoId,
            presente: false,
          })),
        });
      }

      return criada;
    });

    await registrarAuditoria({
      usuarioId,
      acao: "criar",
      entidade: "reuniao",
      entidadeId: reuniao.id,
      detalhes: { titulo: reuniao.titulo },
    });

    return this.buscarPorId(reuniao.id);
  },

  async atualizar(id: string, dados: EntradaAtualizarReuniao, usuarioId?: string) {
    const existente = await prisma.reuniao.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Reunião");

    if (dados.associadosConvocadosIds) {
      await garantirAssociados(dados.associadosConvocadosIds);
    }

    await prisma.$transaction(async (tx) => {
      await tx.reuniao.update({
        where: { id },
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          data: dados.data ? new Date(dados.data) : undefined,
          horario: dados.horario,
          local: dados.local,
          status: dados.status,
          pautaJson: dados.pauta ? serializarPauta(dados.pauta) : undefined,
          ata: dados.ata,
        },
      });

      if (dados.associadosConvocadosIds) {
        const novosIds = new Set(dados.associadosConvocadosIds);

        const presencasExistentes = await tx.presencaReuniao.findMany({
          where: { reuniaoId: id },
          select: { associadoId: true },
        });
        const idsExistentes = new Set(presencasExistentes.map((p) => p.associadoId));

        const remover = [...idsExistentes].filter((aid) => !novosIds.has(aid));
        const adicionar = [...novosIds].filter((aid) => !idsExistentes.has(aid));

        if (remover.length > 0) {
          await tx.presencaReuniao.deleteMany({
            where: { reuniaoId: id, associadoId: { in: remover } },
          });
        }
        if (adicionar.length > 0) {
          await tx.presencaReuniao.createMany({
            data: adicionar.map((associadoId) => ({
              reuniaoId: id,
              associadoId,
              presente: false,
            })),
          });
        }
      }
    });

    await registrarAuditoria({
      usuarioId,
      acao: "atualizar",
      entidade: "reuniao",
      entidadeId: id,
      detalhes: dados,
    });

    return this.buscarPorId(id);
  },

  async atualizarPresenca(id: string, dados: EntradaAtualizarPresenca, usuarioId?: string) {
    await this.buscarPorId(id);

    const presenca = await prisma.presencaReuniao.findUnique({
      where: {
        reuniaoId_associadoId: {
          reuniaoId: id,
          associadoId: dados.associadoId,
        },
      },
      include: { associado: true },
    });

    if (!presenca) throw new ErroNaoEncontrado("Presença");

    const atualizada = await prisma.presencaReuniao.update({
      where: { id: presenca.id },
      data: { presente: dados.presente },
      include: {
        associado: {
          select: { id: true, nome: true, status: true },
        },
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "marcar_presenca",
      entidade: "reuniao",
      entidadeId: id,
      detalhes: { associadoId: dados.associadoId, presente: dados.presente },
    });

    return {
      id: atualizada.id,
      associadoId: atualizada.associadoId,
      associadoNome: atualizada.associado.nome,
      presente: atualizada.presente,
    };
  },

  async atualizarStatus(id: string, dados: EntradaAtualizarStatusReuniao, usuarioId?: string) {
    const reuniao = await prisma.reuniao.findUnique({ where: { id } });
    if (!reuniao) throw new ErroNaoEncontrado("Reunião");

    await prisma.reuniao.update({
      where: { id },
      data: {
        status: dados.status,
        ata: dados.ata ?? (dados.status === "concluida" ? reuniao.ata : undefined),
      },
    });

    await registrarAuditoria({
      usuarioId,
      acao: "alterar_status",
      entidade: "reuniao",
      entidadeId: id,
      detalhes: { de: reuniao.status, para: dados.status },
    });

    return this.buscarPorId(id);
  },

  async excluir(id: string, usuarioId?: string) {
    const reuniao = await prisma.reuniao.findUnique({ where: { id } });
    if (!reuniao) throw new ErroNaoEncontrado("Reunião");

    await prisma.reuniao.delete({ where: { id } });

    await registrarAuditoria({
      usuarioId,
      acao: "excluir",
      entidade: "reuniao",
      entidadeId: id,
      detalhes: { titulo: reuniao.titulo },
    });
  },
};
