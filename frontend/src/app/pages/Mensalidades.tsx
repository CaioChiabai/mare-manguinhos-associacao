import { useEffect, useState, type FormEvent } from "react";
import { CreditCard, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAutenticacao } from "../hooks/useAutenticacao";
import { servicoMensalidades } from "../servicos/mensalidades";
import { servicoAssociados } from "../servicos/associados";
import type { Associado, Mensalidade, StatusMensalidade } from "../tipos/api";
import { formatarData, formatarMoeda } from "../utils/formatacao";

const statusClasse: Record<StatusMensalidade, string> = {
  pendente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  pago: "bg-green-100 text-green-800 hover:bg-green-100",
  atrasado: "bg-red-100 text-red-800 hover:bg-red-100",
};

export function Mensalidades() {
  const { token } = useAutenticacao();
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusMensalidade>("todos");
  const [carregando, setCarregando] = useState(true);
  const [registrandoPagamento, setRegistrandoPagamento] = useState<string | null>(null);
  const [modalAberta, setModalAberta] = useState(false);
  const [formulario, setFormulario] = useState({
    associadoId: "",
    competencia: "",
    valor: 50,
    dataVencimento: "",
  });

  async function carregarDados() {
    if (!token) return;
    setCarregando(true);
    try {
      const [respostaMensalidades, respostaAssociados] = await Promise.all([
        servicoMensalidades.listar(token, {
          status: filtroStatus === "todos" ? undefined : filtroStatus,
          porPagina: 200,
        }),
        servicoAssociados.listar(token, { porPagina: 1000 }),
      ]);
      setMensalidades(respostaMensalidades.itens);
      setAssociados(respostaAssociados.itens);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao carregar mensalidades");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void carregarDados(), 250);
    return () => clearTimeout(timer);
  }, [token, filtroStatus]);

  const mensalidadesFiltradas = busca.trim()
    ? mensalidades.filter(
        (mensalidade) =>
          mensalidade.associado?.nome.toLowerCase().includes(busca.toLowerCase()) ||
          mensalidade.competencia.includes(busca),
      )
    : mensalidades;

  async function handleCriar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    try {
      await servicoMensalidades.criar(token, {
        associadoId: formulario.associadoId,
        competencia: formulario.competencia,
        valor: formulario.valor,
        dataVencimento: new Date(formulario.dataVencimento).toISOString(),
      });
      toast.success("Mensalidade cadastrada com sucesso");
      setModalAberta(false);
      setFormulario({ associadoId: "", competencia: "", valor: 50, dataVencimento: "" });
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao criar mensalidade");
    }
  }

  async function handleRegistrarPagamento(id: string) {
    if (!token || registrandoPagamento) return;
    setRegistrandoPagamento(id);
    try {
      await servicoMensalidades.registrarPagamento(token, id);
      toast.success("Pagamento registrado");
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao registrar pagamento");
    } finally {
      setRegistrandoPagamento(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl text-slate-900">Mensalidades</h1>
          <p className="text-slate-500">Controle financeiro básico com atualização automática de inadimplência</p>
        </div>

        <Dialog open={modalAberta} onOpenChange={setModalAberta}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Mensalidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar mensalidade</DialogTitle>
            </DialogHeader>

            <form className="space-y-4" onSubmit={handleCriar}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Associado</label>
                <Select
                  value={formulario.associadoId}
                  onValueChange={(value) => setFormulario((atual) => ({ ...atual, associadoId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o associado" />
                  </SelectTrigger>
                  <SelectContent>
                    {associados.map((associado) => (
                      <SelectItem key={associado.id} value={associado.id}>
                        {associado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Competência</label>
                  <Input
                    placeholder="2026-04"
                    value={formulario.competencia}
                    onChange={(event) =>
                      setFormulario((atual) => ({ ...atual, competencia: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    type="number"
                    min={1}
                    value={formulario.valor}
                    onChange={(event) =>
                      setFormulario((atual) => ({ ...atual, valor: Number(event.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Vencimento</label>
                <Input
                  type="datetime-local"
                  value={formulario.dataVencimento}
                  onChange={(event) =>
                    setFormulario((atual) => ({ ...atual, dataVencimento: event.target.value }))
                  }
                />
              </div>

              <Button className="w-full" type="submit">
                Salvar mensalidade
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão financeira</CardTitle>
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Buscar por associado ou competência..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>
            <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as "todos" | StatusMensalidade)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="py-10 text-center text-slate-500">Carregando mensalidades...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associado</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mensalidadesFiltradas.map((mensalidade) => (
                  <TableRow key={mensalidade.id}>
                    <TableCell>{mensalidade.associado?.nome}</TableCell>
                    <TableCell>{mensalidade.competencia}</TableCell>
                    <TableCell>{formatarMoeda(mensalidade.valor)}</TableCell>
                    <TableCell>{formatarData(mensalidade.dataVencimento)}</TableCell>
                    <TableCell>
                      <Badge className={statusClasse[mensalidade.status]}>
                        {mensalidade.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {mensalidade.status !== "pago" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={registrandoPagamento === mensalidade.id}
                          onClick={() => void handleRegistrarPagamento(mensalidade.id)}
                        >
                          {registrandoPagamento === mensalidade.id ? "Registrando..." : "Registrar pagamento"}
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-500">
                          Pago em {formatarData(mensalidade.dataPagamento)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!carregando && mensalidadesFiltradas.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              Nenhuma mensalidade encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
