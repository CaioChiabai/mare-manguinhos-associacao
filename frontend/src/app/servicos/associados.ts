import { requisitar } from "./http";
import type { Associado, RespostaPaginada, StatusAssociado } from "../tipos/api";

interface FiltrosAssociados {
  busca?: string;
  status?: StatusAssociado;
  porPagina?: number;
  pagina?: number;
}

export const servicoAssociados = {
  listar(token: string, filtros: FiltrosAssociados = {}) {
    const params = new URLSearchParams();
    if (filtros.busca) params.set("busca", filtros.busca);
    if (filtros.status) params.set("status", filtros.status);
    if (filtros.porPagina) params.set("porPagina", String(filtros.porPagina));
    if (filtros.pagina) params.set("pagina", String(filtros.pagina));
    return requisitar<RespostaPaginada<Associado>>(`/api/associados?${params.toString()}`, { token });
  },

  buscar(token: string, id: string) {
    return requisitar<Associado & { historicoStatus: unknown[]; lojas: unknown[]; permissoes: unknown[]; mensalidades: unknown[] }>(
      `/api/associados/${id}`,
      { token },
    );
  },

  criar(token: string, dados: Partial<Associado>) {
    return requisitar<Associado>("/api/associados", {
      metodo: "POST",
      token,
      corpo: dados,
    });
  },

  atualizar(token: string, id: string, dados: Partial<Associado>) {
    return requisitar<Associado>(`/api/associados/${id}`, {
      metodo: "PUT",
      token,
      corpo: dados,
    });
  },

  alterarStatus(token: string, id: string, status: StatusAssociado, motivo?: string) {
    return requisitar<Associado>(`/api/associados/${id}/status`, {
      metodo: "PATCH",
      token,
      corpo: { status, motivo },
    });
  },

  excluir(token: string, id: string) {
    return requisitar<void>(`/api/associados/${id}`, {
      metodo: "DELETE",
      token,
    });
  },
};
