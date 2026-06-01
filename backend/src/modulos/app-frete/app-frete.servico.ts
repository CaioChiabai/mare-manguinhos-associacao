import { ErroAplicacao } from "../../compartilhado/erros.js";
import type { EntradaCalcularFrete } from "./app-frete.esquemas.js";

const COORDENADAS_MANGUINHOS = { latitude: -20.1176, longitude: -40.1953 };

const RAIO_LOCAL_KM = 10;
const RAIO_REGIONAL_KM = 25;

const FRETE_LOCAL = 8.5;
const FRETE_REGIONAL = 15.0;
const FRETE_DISTANTE = 25.0;

const PRAZO_LOCAL_MINUTOS = 45;
const PRAZO_REGIONAL_MINUTOS = 75;
const PRAZO_DISTANTE_MINUTOS = 120;

function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ZonaFrete {
  palavrasChave: string[];
  valorFrete: number;
  prazoEstimadoMinutos: number;
}

const ZONAS_FRETE: ZonaFrete[] = [
  {
    palavrasChave: ["manguinhos", "jacaraipe", "nova almeida", "praia grande"],
    valorFrete: FRETE_LOCAL,
    prazoEstimadoMinutos: PRAZO_LOCAL_MINUTOS,
  },
  {
    palavrasChave: ["serra", "laranjeiras", "carapina", "jardim camburi", "vitoria", "vitória", "vila velha"],
    valorFrete: FRETE_REGIONAL,
    prazoEstimadoMinutos: PRAZO_REGIONAL_MINUTOS,
  },
];

function calcularPorEndereco(endereco: string): { valorFrete: number; prazoEstimadoMinutos: number } {
  const normalizado = endereco.toLowerCase();

  for (const zona of ZONAS_FRETE) {
    if (zona.palavrasChave.some((p) => normalizado.includes(p))) {
      return { valorFrete: zona.valorFrete, prazoEstimadoMinutos: zona.prazoEstimadoMinutos };
    }
  }

  if (normalizado.includes("es") || normalizado.includes("espírito santo") || normalizado.includes("espirito santo")) {
    return { valorFrete: FRETE_DISTANTE, prazoEstimadoMinutos: PRAZO_DISTANTE_MINUTOS };
  }

  return { valorFrete: FRETE_DISTANTE, prazoEstimadoMinutos: PRAZO_DISTANTE_MINUTOS };
}

function calcularPorCoordenadas(latitude: number, longitude: number): { valorFrete: number; prazoEstimadoMinutos: number } {
  const distancia = calcularDistanciaKm(
    COORDENADAS_MANGUINHOS.latitude,
    COORDENADAS_MANGUINHOS.longitude,
    latitude,
    longitude,
  );

  if (distancia <= RAIO_LOCAL_KM) {
    return { valorFrete: FRETE_LOCAL, prazoEstimadoMinutos: PRAZO_LOCAL_MINUTOS };
  }

  if (distancia <= RAIO_REGIONAL_KM) {
    return { valorFrete: FRETE_REGIONAL, prazoEstimadoMinutos: PRAZO_REGIONAL_MINUTOS };
  }

  return { valorFrete: FRETE_DISTANTE, prazoEstimadoMinutos: PRAZO_DISTANTE_MINUTOS };
}

export const appFreteServico = {
  calcular(dados: EntradaCalcularFrete) {
    if (dados.latitude != null && dados.longitude != null) {
      return calcularPorCoordenadas(dados.latitude, dados.longitude);
    }

    if (!dados.endereco.trim()) {
      throw new ErroAplicacao("Endereço é obrigatório para calcular o frete");
    }

    return calcularPorEndereco(dados.endereco);
  },
};
