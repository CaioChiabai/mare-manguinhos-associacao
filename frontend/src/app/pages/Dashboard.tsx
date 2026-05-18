import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Users, Store, AlertCircle, Calendar, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAutenticacao } from "../hooks/useAutenticacao";
import { servicoDashboard } from "../servicos/dashboard";
import type { DashboardResumo } from "../tipos/api";
import { formatarDataHora, formatarMoeda } from "../utils/formatacao";

export function Dashboard() {
  const { token } = useAutenticacao();
  const navigate = useNavigate();
  const [dados, setDados] = useState<DashboardResumo | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (!token) return;
      setCarregando(true);
      try {
        setDados(await servicoDashboard.buscar(token));
      } catch (erro) {
        toast.error(erro instanceof Error ? erro.message : "Erro ao carregar dashboard");
      } finally {
        setCarregando(false);
      }
    }

    void carregar();
  }, [token]);

  const indicadores = dados?.indicadores;
  const resumoFinanceiro = dados?.resumoFinanceiro;

  const stats = indicadores
    ? [
        {
          title: "Total de Associados",
          value: indicadores.totalAssociados,
          description: `${indicadores.associadosAtivos} ativos`,
          icon: Users,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        },
        {
          title: "Lojas Aprovadas",
          value: indicadores.lojasAprovadas,
          description: `${indicadores.lojasPendentes} pendentes`,
          icon: Store,
          color: "text-green-600",
          bgColor: "bg-green-50",
        },
        {
          title: "Permissões Ativas",
          value: indicadores.permissoesAtivas,
          description: "Permissões em vigor",
          icon: ShieldCheck,
          color: "text-cyan-600",
          bgColor: "bg-cyan-50",
        },
        {
          title: "Reuniões Agendadas",
          value: indicadores.reunioesAgendadas,
          description: "Próximos encontros",
          icon: Calendar,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
        },
        {
          title: "Mensalidades em Aberto",
          value: indicadores.mensalidadesPendentes,
          description: `${indicadores.associadosInadimplentes} associados inadimplentes`,
          icon: CreditCard,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
        },
        {
          title: "Casos Críticos",
          value: indicadores.associadosBloqueados + indicadores.associadosSuspensos,
          description: "Suspensos e bloqueados",
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-100 bg-[linear-gradient(140deg,#ecfeff_0%,#f0f9ff_45%,#ffffff_100%)] p-6">
        <h1 className="text-2xl text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Visão consolidada da associação com dados operacionais em tempo real</p>
      </div>

      {carregando ? (
        <Card>
          <CardContent className="py-14 text-center text-slate-500">Carregando indicadores...</CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-slate-200/80 bg-white/90 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{stat.title}</p>
                      <p className="mt-2 text-3xl text-slate-900">{stat.value}</p>
                      <p className="mt-1 text-sm text-slate-600">{stat.description}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-slate-200/80 bg-white/90 shadow-sm xl:col-span-2">
              <CardHeader>
                <CardTitle>Resumo financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Valor em aberto</p>
                    <p className="mt-2 text-2xl text-slate-900">
                      {formatarMoeda(resumoFinanceiro?.valorEmAberto)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {resumoFinanceiro?.mensalidadesPendentes ?? 0} pendentes e{" "}
                      {resumoFinanceiro?.mensalidadesAtrasadas ?? 0} atrasadas
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                    <p className="text-sm text-red-700">Valor atrasado</p>
                    <p className="mt-2 text-2xl text-red-900">
                      {formatarMoeda(resumoFinanceiro?.valorAtrasado)}
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      Mensalidades vencidas sem pagamento
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                    <p className="text-sm text-green-700">Recebido no mês</p>
                    <p className="mt-2 text-2xl text-green-900">
                      {formatarMoeda(resumoFinanceiro?.valorRecebidoMesAtual)}
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      Pagamentos registrados no mês atual
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Atividade recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dados?.atividadeRecente.map((item) => (
                    <div key={item.id} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                      <p className="text-sm font-medium text-slate-900">
                        {item.acao} em {item.entidade}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.usuario?.nome ?? "Sistema"} • {formatarDataHora(item.criadoEm)}
                      </p>
                    </div>
                  ))}
                  {dados?.atividadeRecente.length === 0 && (
                    <p className="text-sm text-slate-500">Nenhuma atividade registrada ainda.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Ações rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/lojas")}>
                  Revisar lojas pendentes
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/mensalidades")}>
                  Conferir inadimplência
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/reunioes")}>
                  Organizar reuniões
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/associados")}>
                  Gerenciar associados
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
