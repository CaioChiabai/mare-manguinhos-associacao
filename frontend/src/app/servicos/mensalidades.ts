import { requisitar } from "./http";
import type { Mensalidade, RespostaPaginada, StatusMensalidade } from "../tipos/api";

interface FiltrosMensalidades {
  status?: StatusMensalidade;
  associadoId?: string;
  competencia?: string;
  porPagina?: number;
  pagina?: number;
}

export const servicoMensalidades = {
  listar(token: string, filtros: FiltrosMensalidades = {}) {
    const params = new URLSearchParams();
    if (filtros.status) params.set("status", filtros.status);
    if (filtros.associadoId) params.set("associadoId", filtros.associadoId);
    if (filtros.competencia) params.set("competencia", filtros.competencia);
    if (filtros.porPagina) params.set("porPagina", String(filtros.porPagina));
    if (filtros.pagina) params.set("pagina", String(filtros.pagina));
    return requisitar<RespostaPaginada<Mensalidade>>(`/api/mensalidades?${params.toString()}`, { token });
  },

  criar(token: string, dados: {
    associadoId: string;
    competencia: string;
    valor: number;
    dataVencimento: string;
  }) {
    return requisitar<Mensalidade>("/api/mensalidades", {
      metodo: "POST",
      token,
      corpo: dados,
    });
  },

  registrarPagamento(token: string, id: string) {
    return requisitar<Mensalidade>(`/api/mensalidades/${id}/pagamento`, {
      metodo: "PATCH",
      token,
      corpo: {},
    });
  },
};
