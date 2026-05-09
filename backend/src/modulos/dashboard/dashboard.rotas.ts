import type { FastifyInstance } from "fastify";
import { autenticar } from "../../middlewares/autenticar.js";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import { mensalidadesServico } from "../mensalidades/mensalidades.servico.js";

export async function rotasDashboard(app: FastifyInstance) {
  app.addHook("preHandler", autenticar);

  app.get("/", async () => {
    await mensalidadesServico.sincronizarAtrasos();

    const agora = new Date();
    const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioProximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

    const [
      totalAssociados,
      associadosAtivos,
      associadosInadimplentes,
      associadosSuspensos,
      associadosBloqueados,
      lojasAprovadas,
      lojasPendentes,
      reunioesAgendadas,
      permissoesAtivas,
      mensalidadesPendentes,
      mensalidadesAtrasadas,
      valorEmAberto,
      valorAtrasado,
      valorRecebidoMesAtual,
      atividadeRecente,
    ] = await Promise.all([
      prisma.associado.count(),
      prisma.associado.count({ where: { status: "ativo" } }),
      prisma.associado.count({ where: { status: "inadimplente" } }),
      prisma.associado.count({ where: { status: "suspenso" } }),
      prisma.associado.count({ where: { status: "bloqueado" } }),
      prisma.loja.count({ where: { status: "aprovada" } }),
      prisma.loja.count({ where: { status: "pendente" } }),
      prisma.reuniao.count({ where: { status: "agendada" } }),
      prisma.permissao.count({ where: { ativa: true } }),
      prisma.mensalidade.count({ where: { status: { in: ["pendente", "atrasado"] } } }),
      prisma.mensalidade.count({ where: { status: "atrasado" } }),
      prisma.mensalidade.aggregate({
        where: { status: { in: ["pendente", "atrasado"] } },
        _sum: { valor: true },
      }),
      prisma.mensalidade.aggregate({
        where: { status: "atrasado" },
        _sum: { valor: true },
      }),
      prisma.mensalidade.aggregate({
        where: {
          status: "pago",
          dataPagamento: {
            gte: inicioMesAtual,
            lt: inicioProximoMes,
          },
        },
        _sum: { valor: true },
      }),
      prisma.logAuditoria.findMany({
        take: 8,
        orderBy: { criadoEm: "desc" },
        include: {
          usuario: { select: { id: true, nome: true, email: true } },
        },
      }),
    ]);

    return {
      indicadores: {
        totalAssociados,
        associadosAtivos,
        associadosInadimplentes,
        associadosSuspensos,
        associadosBloqueados,
        lojasAprovadas,
        lojasPendentes,
        reunioesAgendadas,
        permissoesAtivas,
        mensalidadesPendentes,
      },
      resumoFinanceiro: {
        valorEmAberto: valorEmAberto._sum.valor ?? 0,
        valorAtrasado: valorAtrasado._sum.valor ?? 0,
        valorRecebidoMesAtual: valorRecebidoMesAtual._sum.valor ?? 0,
        mensalidadesPendentes: mensalidadesPendentes - mensalidadesAtrasadas,
        mensalidadesAtrasadas,
      },
      atividadeRecente,
    };
  });
}
