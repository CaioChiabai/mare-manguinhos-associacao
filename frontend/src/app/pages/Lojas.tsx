import { useEffect, useState, type FormEvent } from "react";
import { Search, Store as StoreIcon, Check, X, Plus, Eye, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useAutenticacao } from "../hooks/useAutenticacao";
import { servicoLojas } from "../servicos/lojas";
import { servicoAssociados } from "../servicos/associados";
import type { Associado, Loja, StatusLoja } from "../tipos/api";
import { formatarData } from "../utils/formatacao";

const statusClasse: Record<StatusLoja, string> = {
  aprovada: "bg-green-100 text-green-800 hover:bg-green-100",
  pendente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  rejeitada: "bg-red-100 text-red-800 hover:bg-red-100",
  suspensa: "bg-slate-200 text-slate-800 hover:bg-slate-200",
};

export function Lojas() {
  const { token } = useAutenticacao();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusLoja>("todos");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null);
  const [modalAberta, setModalAberta] = useState(false);
  const [lojaSelecionada, setLojaSelecionada] = useState<Loja | null>(null);
  const [rejeitandoLoja, setRejeitandoLoja] = useState<Loja | null>(null);
  const [excluindo, setExcluindo] = useState<Loja | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [formulario, setFormulario] = useState({
    associadoId: "",
    nomeLoja: "",
    descricao: "",
  });

  async function carregarDados() {
    if (!token) return;
    setCarregando(true);
    try {
      const [respostaLojas, respostaAssociados] = await Promise.all([
        servicoLojas.listar(token, {
          busca: busca || undefined,
          status: filtroStatus === "todos" ? undefined : filtroStatus,
        }),
        servicoAssociados.listar(token, { porPagina: 100 }),
      ]);
      setLojas(respostaLojas.itens);
      setAssociados(respostaAssociados.itens);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao carregar lojas");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void carregarDados(), 250);
    return () => clearTimeout(timer);
  }, [token, busca, filtroStatus]);


  async function handleCriar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    try {
      await servicoLojas.criar(token, formulario);
      toast.success("Loja cadastrada com sucesso");
      setFormulario({ associadoId: "", nomeLoja: "", descricao: "" });
      setModalAberta(false);
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao criar loja");
    }
  }

  function iniciarAtualizacaoStatus(loja: Loja, status: StatusLoja) {
    if (status === "rejeitada") {
      setMotivoRejeicao("");
      setRejeitandoLoja(loja);
    } else {
      void executarAtualizacaoStatus(loja, status, undefined);
    }
  }

  async function executarAtualizacaoStatus(loja: Loja, status: StatusLoja, motivo: string | undefined) {
    if (!token || atualizandoStatus) return;
    setAtualizandoStatus(loja.id);
    try {
      await servicoLojas.atualizarStatus(token, loja.id, status, motivo);
      toast.success(`Loja "${loja.nomeLoja}" atualizada`);
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao atualizar loja");
    } finally {
      setAtualizandoStatus(null);
    }
  }

  async function confirmarRejeicao() {
    if (!rejeitandoLoja) return;
    await executarAtualizacaoStatus(rejeitandoLoja, "rejeitada", motivoRejeicao || undefined);
    setRejeitandoLoja(null);
    setMotivoRejeicao("");
  }

  async function confirmarExclusao() {
    if (!excluindo || !token) return;
    try {
      await servicoLojas.excluir(token, excluindo.id);
      toast.success("Loja removida");
      setExcluindo(null);
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao remover loja");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl text-slate-900">Aprovação de Lojas</h1>
          <p className="text-slate-500">Fluxo de solicitação, análise e aprovação das lojas vinculadas</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => void carregarDados()}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Dialog open={modalAberta} onOpenChange={setModalAberta}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Loja
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar loja</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleCriar}>
                <Select value={formulario.associadoId} onValueChange={(value) => setFormulario((atual) => ({ ...atual, associadoId: value }))}>
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
                <Input placeholder="Nome da loja" value={formulario.nomeLoja} onChange={(event) => setFormulario((atual) => ({ ...atual, nomeLoja: event.target.value }))} />
                <Textarea placeholder="Descrição da loja" value={formulario.descricao} onChange={(event) => setFormulario((atual) => ({ ...atual, descricao: event.target.value }))} />
                <Button className="w-full" type="submit">Salvar loja</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Buscar por loja ou associado..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>
            <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as "todos" | StatusLoja)}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovada">Aprovada</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
                <SelectItem value="suspensa">Suspensa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="py-10 text-center text-slate-500">Carregando lojas...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Associado</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Solicitação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lojas.map((loja) => (
                  <TableRow key={loja.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <StoreIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-900">{loja.nomeLoja}</span>
                      </div>
                    </TableCell>
                    <TableCell>{loja.associado?.nome ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{loja.descricao}</TableCell>
                    <TableCell>{formatarData(loja.dataSolicitacao)}</TableCell>
                    <TableCell>
                      <Badge className={statusClasse[loja.status]}>{loja.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {loja.status === "pendente" && (
                          <>
                            <Button size="sm" variant="outline" className="gap-2 text-green-700" disabled={atualizandoStatus === loja.id} onClick={() => iniciarAtualizacaoStatus(loja, "aprovada")}>
                              <Check className="h-4 w-4" />
                              {atualizandoStatus === loja.id ? "..." : "Aprovar"}
                            </Button>
                            <Button size="sm" variant="outline" className="gap-2 text-red-700" disabled={atualizandoStatus === loja.id} onClick={() => iniciarAtualizacaoStatus(loja, "rejeitada")}>
                              <X className="h-4 w-4" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setLojaSelecionada(loja)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalhes da loja</DialogTitle>
                            </DialogHeader>
                            {lojaSelecionada && (
                              <div className="space-y-3 text-sm">
                                <p><strong>Loja:</strong> {lojaSelecionada.nomeLoja}</p>
                                <p><strong>Associado:</strong> {lojaSelecionada.associado?.nome}</p>
                                <p><strong>Status:</strong> {lojaSelecionada.status}</p>
                                <p><strong>Descrição:</strong> {lojaSelecionada.descricao}</p>
                                <p><strong>Motivo da rejeição:</strong> {lojaSelecionada.motivoRejeicao || "—"}</p>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setExcluindo(loja)} title="Remover loja">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!carregando && lojas.length === 0 && (
            <div className="py-12 text-center text-slate-500">Nenhuma loja encontrada</div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={excluindo !== null} onOpenChange={(open) => { if (!open) setExcluindo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover loja</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente remover <strong>{excluindo?.nomeLoja}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmarExclusao()}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejeitandoLoja !== null} onOpenChange={(open) => { if (!open) { setRejeitandoLoja(null); setMotivoRejeicao(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Informe o motivo para rejeitar a loja <strong>{rejeitandoLoja?.nomeLoja}</strong>.
            </p>
            <div className="space-y-2">
              <Label>Motivo da rejeição</Label>
              <Textarea
                placeholder="Descreva o motivo..."
                value={motivoRejeicao}
                onChange={(event) => setMotivoRejeicao(event.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRejeitandoLoja(null); setMotivoRejeicao(""); }}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => void confirmarRejeicao()}>
                Rejeitar loja
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
