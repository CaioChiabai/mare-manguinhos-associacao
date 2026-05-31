import { useEffect, useMemo, useState, type ComponentType, type FormEvent } from "react";
import { Calendar, Plus, Users, FileText, MapPin, Clock, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useAutenticacao } from "../hooks/useAutenticacao";
import { servicoReunioes } from "../servicos/reunioes";
import { servicoAssociados } from "../servicos/associados";
import type { Associado, Reuniao, StatusReuniao } from "../tipos/api";
import { formatarData } from "../utils/formatacao";

const statusClasse: Record<StatusReuniao, string> = {
  agendada: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  em_andamento: "bg-green-100 text-green-800 hover:bg-green-100",
  concluida: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  cancelada: "bg-red-100 text-red-800 hover:bg-red-100",
};

export function Reunioes() {
  const { token } = useAutenticacao();
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberta, setModalAberta] = useState(false);
  const [listaPresencaAbertaId, setListaPresencaAbertaId] = useState<string | null>(null);
  const [finalizandoReuniao, setFinalizandoReuniao] = useState<Reuniao | null>(null);
  const [excluindo, setExcluindo] = useState<Reuniao | null>(null);
  const [ataText, setAtaText] = useState("");
  const [formulario, setFormulario] = useState({
    titulo: "",
    descricao: "",
    data: "",
    horario: "",
    local: "",
    pauta: "",
    associadosConvocadosIds: [] as string[],
  });

  async function carregarDados() {
    if (!token) return;
    setCarregando(true);
    try {
      const [respostaReunioes, respostaAssociados] = await Promise.all([
        servicoReunioes.listar(token),
        servicoAssociados.listar(token, { porPagina: 100 }),
      ]);
      setReunioes(respostaReunioes.itens);
      setAssociados(respostaAssociados.itens);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao carregar reuniões");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, [token]);

  const reunioesAgendadas = useMemo(() => reunioes.filter((item) => item.status === "agendada"), [reunioes]);
  const reunioesEmAndamento = useMemo(() => reunioes.filter((item) => item.status === "em_andamento"), [reunioes]);
  const reunioesConcluidas = useMemo(() => reunioes.filter((item) => item.status === "concluida"), [reunioes]);

  async function criarReuniao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    try {
      await servicoReunioes.criar(token, {
        titulo: formulario.titulo,
        descricao: formulario.descricao,
        data: new Date(`${formulario.data}T${formulario.horario}`).toISOString(),
        horario: formulario.horario,
        local: formulario.local,
        pauta: formulario.pauta.split("\n").map((item) => item.trim()).filter(Boolean),
        associadosConvocadosIds: formulario.associadosConvocadosIds,
      });
      toast.success("Reunião cadastrada");
      setModalAberta(false);
      setFormulario({
        titulo: "",
        descricao: "",
        data: "",
        horario: "",
        local: "",
        pauta: "",
        associadosConvocadosIds: [],
      });
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao criar reunião");
    }
  }

  async function atualizarStatus(reuniao: Reuniao, status: StatusReuniao) {
    if (!token) return;
    if (status === "concluida") {
      setAtaText(reuniao.ata ?? "");
      setFinalizandoReuniao(reuniao);
      return;
    }
    try {
      await servicoReunioes.atualizarStatus(token, reuniao.id, status, undefined);
      toast.success("Status da reunião atualizado");
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao atualizar reunião");
    }
  }

  async function confirmarFinalizacao() {
    if (!token || !finalizandoReuniao) return;
    try {
      await servicoReunioes.atualizarStatus(token, finalizandoReuniao.id, "concluida", ataText || undefined);
      toast.success("Reunião finalizada");
      setFinalizandoReuniao(null);
      setAtaText("");
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao finalizar reunião");
    }
  }

  async function alternarPresenca(reuniaoId: string, associadoId: string, presente: boolean) {
    if (!token) return;
    try {
      await servicoReunioes.atualizarPresenca(token, reuniaoId, associadoId, presente);
      setReunioes((atuais) =>
        atuais.map((reuniao) =>
          reuniao.id === reuniaoId
            ? {
                ...reuniao,
                presencas: reuniao.presencas.map((presenca) =>
                  presenca.associadoId === associadoId ? { ...presenca, presente } : presenca,
                ),
              }
            : reuniao,
        ),
      );
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao atualizar presença");
    }
  }

  async function confirmarExclusao() {
    if (!excluindo || !token) return;
    try {
      await servicoReunioes.excluir(token, excluindo.id);
      toast.success("Reunião removida");
      setExcluindo(null);
      setListaPresencaAbertaId(null);
      await carregarDados();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao remover reunião");
    }
  }

  function alternarConvocacao(associadoId: string) {
    setFormulario((atual) => ({
      ...atual,
      associadosConvocadosIds: atual.associadosConvocadosIds.includes(associadoId)
        ? atual.associadosConvocadosIds.filter((id) => id !== associadoId)
        : [...atual.associadosConvocadosIds, associadoId],
    }));
  }

  return (
    <>
    <AlertDialog open={excluindo !== null} onOpenChange={(open) => { if (!open) setExcluindo(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover reunião</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente remover <strong>{excluindo?.titulo}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => void confirmarExclusao()}>Remover</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={finalizandoReuniao !== null} onOpenChange={(open) => { if (!open) { setFinalizandoReuniao(null); setAtaText(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar reunião</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Registre a ata resumida antes de concluir a reunião <strong>{finalizandoReuniao?.titulo}</strong>.
          </p>
          <Textarea
            placeholder="Ata da reunião (opcional)"
            value={ataText}
            onChange={(event) => setAtaText(event.target.value)}
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setFinalizandoReuniao(null); setAtaText(""); }}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmarFinalizacao()}>
              Concluir reunião
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl text-slate-900">Reuniões de Associados</h1>
          <p className="text-slate-500">Assembleias, presenças e registro de atas</p>
        </div>
        <Dialog open={modalAberta} onOpenChange={setModalAberta}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Agendar Reunião
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova reunião</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={criarReuniao}>
              <div className="grid gap-4 md:grid-cols-2">
                <InputWrapper label="Título" value={formulario.titulo} onChange={(value) => setFormulario((atual) => ({ ...atual, titulo: value }))} />
                <InputWrapper label="Local" value={formulario.local} onChange={(value) => setFormulario((atual) => ({ ...atual, local: value }))} />
                <InputWrapper label="Data" type="date" value={formulario.data} onChange={(value) => setFormulario((atual) => ({ ...atual, data: value }))} />
                <InputWrapper label="Horário" type="time" value={formulario.horario} onChange={(value) => setFormulario((atual) => ({ ...atual, horario: value }))} />
              </div>
              <Textarea placeholder="Descrição" value={formulario.descricao} onChange={(event) => setFormulario((atual) => ({ ...atual, descricao: event.target.value }))} />
              <Textarea placeholder="Pauta, uma linha por item" value={formulario.pauta} onChange={(event) => setFormulario((atual) => ({ ...atual, pauta: event.target.value }))} />
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Associados convocados</p>
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border border-slate-200 p-3">
                  {associados.map((associado) => (
                    <label key={associado.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                      <span>{associado.nome}</span>
                      <Checkbox
                        checked={formulario.associadosConvocadosIds.includes(associado.id)}
                        onCheckedChange={() => alternarConvocacao(associado.id)}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <Button className="w-full" type="submit">Criar reunião</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResumoCard titulo="Agendadas" valor={reunioesAgendadas.length} icone={Calendar} cor="bg-blue-50 text-blue-600" />
        <ResumoCard titulo="Em andamento" valor={reunioesEmAndamento.length} icone={Users} cor="bg-green-50 text-green-600" />
        <ResumoCard titulo="Concluídas" valor={reunioesConcluidas.length} icone={CheckCircle} cor="bg-slate-100 text-slate-700" />
      </div>

      <Tabs defaultValue="agendadas" className="w-full">
        <TabsList>
          <TabsTrigger value="agendadas">Agendadas ({reunioesAgendadas.length})</TabsTrigger>
          <TabsTrigger value="em_andamento">Em andamento ({reunioesEmAndamento.length})</TabsTrigger>
          <TabsTrigger value="concluidas">Concluídas ({reunioesConcluidas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="agendadas" className="mt-4 space-y-4">
          {carregando ? (
            <Card><CardContent className="py-10 text-center text-slate-500">Carregando reuniões...</CardContent></Card>
          ) : (
            reunioesAgendadas.map((reuniao) => (
              <Card key={reuniao.id}>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <CabecalhoReuniao reuniao={reuniao} />
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setExcluindo(reuniao)} title="Remover reunião">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-slate-600">{reuniao.descricao}</p>
                  <MetadadosReuniao reuniao={reuniao} />
                  <PautaReuniao reuniao={reuniao} />
                  <div className="flex flex-wrap gap-3">
                    <Dialog
                      open={listaPresencaAbertaId === reuniao.id}
                      onOpenChange={(open) => setListaPresencaAbertaId(open ? reuniao.id : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">Lista de presença</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Lista de presença</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          {reuniao.presencas.map((presenca) => (
                            <div key={presenca.associadoId} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                              <span>{presenca.associadoNome}</span>
                              <Checkbox checked={presenca.presente} onCheckedChange={(checked) => void alternarPresenca(reuniao.id, presenca.associadoId, Boolean(checked))} />
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => void atualizarStatus(reuniao, "em_andamento")}>Iniciar reunião</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="em_andamento" className="mt-4 space-y-4">
          {reunioesEmAndamento.map((reuniao) => (
            <Card key={reuniao.id}>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <CabecalhoReuniao reuniao={reuniao} />
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setExcluindo(reuniao)} title="Remover reunião">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-slate-600">{reuniao.descricao}</p>
                <p className="text-sm text-slate-500">
                  Presentes: {reuniao.presencas.filter((item) => item.presente).length} de {reuniao.presencas.length}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void atualizarStatus(reuniao, "concluida")}>Finalizar reunião</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="concluidas" className="mt-4 space-y-4">
          {reunioesConcluidas.map((reuniao) => (
            <Card key={reuniao.id}>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <CabecalhoReuniao reuniao={reuniao} />
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setExcluindo(reuniao)} title="Remover reunião">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <MetadadosReuniao reuniao={reuniao} />
                {reuniao.ata && (
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-slate-900">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Ata da reunião</span>
                    </div>
                    <p className="text-sm text-slate-600">{reuniao.ata}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => window.print()}>
                    Exportar / imprimir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}

function InputWrapper(props: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{props.label}</label>
      <Input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

function ResumoCard(props: { titulo: string; valor: number; icone: ComponentType<{ className?: string }>; cor: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-slate-500">{props.titulo}</p>
          <p className="mt-2 text-3xl text-slate-900">{props.valor}</p>
        </div>
        <div className={`rounded-lg p-3 ${props.cor}`}>
          <props.icone className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function CabecalhoReuniao({ reuniao }: { reuniao: Reuniao }) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-semibold text-slate-900">{reuniao.titulo}</h3>
      <Badge className={statusClasse[reuniao.status]}>{reuniao.status}</Badge>
    </div>
  );
}

function MetadadosReuniao({ reuniao }: { reuniao: Reuniao }) {
  return (
    <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-slate-400" />
        {formatarData(reuniao.data)}
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-400" />
        {reuniao.horario}
      </div>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-slate-400" />
        {reuniao.local}
      </div>
    </div>
  );
}

function PautaReuniao({ reuniao }: { reuniao: Reuniao }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">Pauta</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
        {reuniao.pauta.map((item, index) => (
          <li key={`${reuniao.id}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
