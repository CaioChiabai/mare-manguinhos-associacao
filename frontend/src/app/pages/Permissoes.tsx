import { useEffect, useState, type FormEvent } from "react";
import { Search, ShieldCheck, Plus, Edit, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAutenticacao } from "../hooks/useAutenticacao";
import { servicoPermissoes } from "../servicos/permissoes";
import { servicoAssociados } from "../servicos/associados";
import type { Associado, Permissao } from "../tipos/api";
import { formatarData } from "../utils/formatacao";

const formularioInicial = {
  associadoId: "",
  tipoPermissao: "",
  dataInicio: "",
  dataFim: "",
  quota: "",
};

export function Permissoes() {
  const { token } = useAutenticacao();
  const [busca, setBusca] = useState("");
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberta, setModalAberta] = useState(false);
  const [permissaoEmEdicao, setPermissaoEmEdicao] = useState<Permissao | null>(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [excluindo, setExcluindo] = useState<Permissao | null>(null);

  async function carregarDados() {
    if (!token) return;
    setCarregando(true);
    try {
      const [respostaPermissoes, respostaAssociados] = await Promise.all([
        servicoPermissoes.listar(token, { busca }),
        servicoAssociados.listar(token, { porPagina: 100 }),
      ]);
      setPermissoes(respostaPermissoes.itens);
      setAssociados(respostaAssociados.itens);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao carregar permissões");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void carregarDados(), 250);
    return () => clearTimeout(timer);
  }, [token, busca]);

  function abrirCriacao() {
    setPermissaoEmEdicao(null);
    setFormulario(formularioInicial);
    setModalAberta(true);
  }

  function abrirEdicao(permissao: Permissao) {
    setPermissaoEmEdicao(permissao);
    setFormulario({
      associadoId: permissao.associadoId,
      tipoPermissao: permissao.tipoPermissao,
      dataInicio: permissao.dataInicio.slice(0, 16),
      dataFim: permissao.dataFim ? permissao.dataFim.slice(0, 16) : "",
      quota: permissao.quota ? String(permissao.quota) : "",
    });
    setModalAberta(true);
  }

  async function salvarPermissao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    if (!formulario.associadoId || !formulario.tipoPermissao.trim() || !formulario.dataInicio) {
      toast.error("Preencha associado, tipo e data de início para salvar a permissão");
      return;
    }

    const dados = {
      associadoId: formulario.associadoId,
      tipoPermissao: formulario.tipoPermissao,
      dataInicio: new Date(formulario.dataInicio).toISOString(),
      dataFim: formulario.dataFim ? new Date(formulario.dataFim).toISOString() : null,
      quota: formulario.quota ? Number(formulario.quota) : null,
      ativa: permissaoEmEdicao ? permissaoEmEdicao.ativa : true,
    };

    try {
      if (permissaoEmEdicao) {
        await servicoPermissoes.atualizar(token, permissaoEmEdicao.id, dados);
        toast.success("Permissão atualizada");
      } else {
        await servicoPermissoes.criar(token, dados);
        toast.success("Permissão criada");
      }
      setModalAberta(false);
      setFormulario(formularioInicial);
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao salvar permissão");
    }
  }

  async function alternarPermissao(id: string, ativa: boolean) {
    if (!token) return;
    try {
      await servicoPermissoes.alternar(token, id, ativa);
      toast.success(`Permissão ${ativa ? "ativada" : "desativada"}`);
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao atualizar permissão");
    }
  }

  async function confirmarExclusao() {
    if (!excluindo || !token) return;
    try {
      await servicoPermissoes.excluir(token, excluindo.id);
      toast.success("Permissão removida");
      setExcluindo(null);
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao excluir permissão");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl text-slate-900">Permissões de Venda e Pesca</h1>
          <p className="text-slate-500">Controle centralizado das autorizações vinculadas aos associados</p>
        </div>
        <Dialog open={modalAberta} onOpenChange={setModalAberta}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={abrirCriacao}>
              <Plus className="w-4 h-4" />
              Nova Permissão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{permissaoEmEdicao ? "Editar permissão" : "Nova permissão"}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={salvarPermissao}>
              <Select value={formulario.associadoId} onValueChange={(value) => setFormulario((atual) => ({ ...atual, associadoId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Associado" />
                </SelectTrigger>
                <SelectContent>
                  {associados.map((associado) => (
                    <SelectItem key={associado.id} value={associado.id}>
                      {associado.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Tipo da permissão" value={formulario.tipoPermissao} onChange={(event) => setFormulario((atual) => ({ ...atual, tipoPermissao: event.target.value }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <Input type="datetime-local" value={formulario.dataInicio} onChange={(event) => setFormulario((atual) => ({ ...atual, dataInicio: event.target.value }))} />
                <Input type="datetime-local" value={formulario.dataFim} onChange={(event) => setFormulario((atual) => ({ ...atual, dataFim: event.target.value }))} />
              </div>
              <Input type="number" min={0} placeholder="Quota (kg)" value={formulario.quota} onChange={(event) => setFormulario((atual) => ({ ...atual, quota: event.target.value }))} />
              <Button className="w-full" type="submit">
                {permissaoEmEdicao ? "Salvar alterações" : "Criar permissão"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por associado ou tipo de permissão..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="py-10 text-center text-slate-500">Carregando permissões...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Quota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissoes.map((permissao) => (
                  <TableRow key={permissao.id}>
                    <TableCell>{permissao.associado?.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        {permissao.tipoPermissao}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatarData(permissao.dataInicio)}
                      <br />
                      <span className="text-slate-500">
                        {permissao.dataFim ? `até ${formatarData(permissao.dataFim)}` : "Indeterminada"}
                      </span>
                    </TableCell>
                    <TableCell>{permissao.quota ? `${permissao.quota} kg` : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch checked={permissao.ativa} onCheckedChange={(valor) => void alternarPermissao(permissao.id, valor)} />
                        <Badge className={permissao.ativa ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}>
                          {permissao.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicao(permissao)} title="Editar permissão">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setExcluindo(permissao)} title="Revogar permissão">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!carregando && permissoes.length === 0 && (
            <div className="py-12 text-center text-slate-500">Nenhuma permissão encontrada</div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={excluindo !== null} onOpenChange={(open) => { if (!open) setExcluindo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar permissão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja revogar a permissão <strong>{excluindo?.tipoPermissao}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmarExclusao()}>Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
