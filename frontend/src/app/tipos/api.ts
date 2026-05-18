export type PapelUsuario = "ADMIN";

export type StatusAssociado = "ativo" | "suspenso" | "inadimplente" | "bloqueado";
export type StatusLoja = "pendente" | "aprovada" | "rejeitada" | "suspensa";
export type StatusReuniao = "agendada" | "em_andamento" | "concluida" | "cancelada";
export type StatusMensalidade = "pendente" | "pago" | "atrasado";

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  criadoEm?: string;
}

export interface Associado {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  embarcacao?: string | null;
  numeroCarteira: string;
  status: StatusAssociado;
  dataCadastro: string;
  observacoes?: string | null;
  atualizadoEm?: string;
}

export interface HistoricoStatusAssociado {
  id: string;
  statusAnterior: StatusAssociado;
  statusNovo: StatusAssociado;
  motivo?: string | null;
  alteradoEm: string;
  alteradoPor?: string | null;
}

export interface Loja {
  id: string;
  associadoId: string;
  nomeLoja: string;
  descricao: string;
  status: StatusLoja;
  dataSolicitacao: string;
  dataAprovacao?: string | null;
  motivoRejeicao?: string | null;
  associado?: Pick<Associado, "id" | "nome" | "status" | "numeroCarteira" | "email" | "telefone">;
}

export interface Permissao {
  id: string;
  associadoId: string;
  tipoPermissao: string;
  ativa: boolean;
  dataInicio: string;
  dataFim?: string | null;
  quota?: number | null;
  criadoEm: string;
  atualizadoEm: string;
  associado?: Pick<Associado, "id" | "nome" | "status" | "email" | "telefone">;
}

export interface PresencaReuniao {
  id?: string;
  associadoId: string;
  associadoNome: string;
  presente: boolean;
}

export interface Reuniao {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
  local: string;
  status: StatusReuniao;
  pauta: string[];
  ata?: string | null;
  presencas: PresencaReuniao[];
}

export interface Mensalidade {
  id: string;
  associadoId: string;
  competencia: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: StatusMensalidade;
  criadoEm: string;
  atualizadoEm: string;
  associado?: Pick<Associado, "id" | "nome" | "status" | "numeroCarteira" | "email" | "telefone">;
}

export interface LogAuditoria {
  id: string;
  usuarioId?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  detalhes?: string | null;
  criadoEm: string;
  usuario?: Pick<UsuarioAutenticado, "id" | "nome" | "email"> | null;
}

export interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface DashboardResumo {
  indicadores: {
    totalAssociados: number;
    associadosAtivos: number;
    associadosInadimplentes: number;
    associadosSuspensos: number;
    associadosBloqueados: number;
    lojasAprovadas: number;
    lojasPendentes: number;
    reunioesAgendadas: number;
    permissoesAtivas: number;
    mensalidadesPendentes: number;
  };
  resumoFinanceiro: {
    valorEmAberto: number;
    valorAtrasado: number;
    valorRecebidoMesAtual: number;
    mensalidadesPendentes: number;
    mensalidadesAtrasadas: number;
  };
  atividadeRecente: LogAuditoria[];
}
