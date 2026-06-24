/**
 * Testes de SPEC-004 (adjacente) — Cálculo de Frete do App Delivery
 *
 * O módulo app-frete.servico.ts é inteiramente puro (sem I/O de banco).
 * É o melhor candidato para testes unitários sem mock.
 *
 * Vinculação com specs:
 *   - SPEC-003 AC-006: loja aprovada habilita comercialização → frete é calculado antes do pedido
 *   - SPEC-005: chatbot não usa frete; este módulo serve o app delivery (/api/app-frete/calcular)
 *
 * Referência de valores (app-frete.servico.ts):
 *   LOCAL    = R$ 8,50  | prazo 45 min  | raio ≤ 10 km  | bairros: manguinhos, jacaraipe...
 *   REGIONAL = R$ 15,00 | prazo 75 min  | raio ≤ 25 km  | cidades: serra, vitoria...
 *   DISTANTE = R$ 25,00 | prazo 120 min | demais
 *
 * Coordenadas de referência: Manguinhos, ES (-20.1176, -40.1953)
 */

import { describe, it, expect } from "vitest";
import { appFreteServico } from "../modulos/app-frete/app-frete.servico.js";

// ── Por endereço (texto) ───────────────────────────────────────────────────

describe("appFreteServico.calcular — por texto de endereço", () => {
  it("endereço em Manguinhos → frete LOCAL", () => {
    const resultado = appFreteServico.calcular({ endereco: "Rua das Redes, Manguinhos, ES" });
    expect(resultado.valorFrete).toBe(8.5);
    expect(resultado.prazoEstimadoMinutos).toBe(45);
  });

  it("endereço em Jacaraípe → frete LOCAL", () => {
    const resultado = appFreteServico.calcular({ endereco: "Av. Central, Jacaraipe, ES" });
    expect(resultado.valorFrete).toBe(8.5);
    expect(resultado.prazoEstimadoMinutos).toBe(45);
  });

  it("endereço em Serra → frete REGIONAL", () => {
    const resultado = appFreteServico.calcular({ endereco: "Rua A, Serra, ES" });
    expect(resultado.valorFrete).toBe(15.0);
    expect(resultado.prazoEstimadoMinutos).toBe(75);
  });

  it("endereço em Vitória → frete REGIONAL", () => {
    const resultado = appFreteServico.calcular({ endereco: "Av. Jerônimo Monteiro, Vitoria, ES" });
    expect(resultado.valorFrete).toBe(15.0);
    expect(resultado.prazoEstimadoMinutos).toBe(75);
  });

  it("endereço em Vila Velha → frete REGIONAL", () => {
    const resultado = appFreteServico.calcular({ endereco: "Rua B, Vila Velha, ES" });
    expect(resultado.valorFrete).toBe(15.0);
    expect(resultado.prazoEstimadoMinutos).toBe(75);
  });

  it("endereço desconhecido → frete DISTANTE", () => {
    const resultado = appFreteServico.calcular({ endereco: "Rua Desconhecida, Cidade XYZ" });
    expect(resultado.valorFrete).toBe(25.0);
    expect(resultado.prazoEstimadoMinutos).toBe(120);
  });

  it("comparação de endereço é case-insensitive", () => {
    const resultado = appFreteServico.calcular({ endereco: "RUA DAS REDES, MANGUINHOS" });
    expect(resultado.valorFrete).toBe(8.5);
  });

  it("rejeita endereço vazio quando não há coordenadas", () => {
    expect(() => appFreteServico.calcular({ endereco: "   " })).toThrow();
  });
});

// ── Por coordenadas GPS ────────────────────────────────────────────────────

describe("appFreteServico.calcular — por coordenadas GPS", () => {
  // Manguinhos: -20.1176, -40.1953
  const MANGUINHOS = { latitude: -20.1176, longitude: -40.1953 };

  it("coordenadas idênticas a Manguinhos → frete LOCAL (0 km)", () => {
    const resultado = appFreteServico.calcular({
      endereco: "qualquer",
      ...MANGUINHOS,
    });
    expect(resultado.valorFrete).toBe(8.5);
    expect(resultado.prazoEstimadoMinutos).toBe(45);
  });

  it("coordenadas a ~15 km (norte de Manguinhos) → frete REGIONAL", () => {
    // ~15 km ao norte: lat += 0.135
    const resultado = appFreteServico.calcular({
      endereco: "qualquer",
      latitude: -19.9826,
      longitude: -40.1953,
    });
    expect(resultado.valorFrete).toBe(15.0);
    expect(resultado.prazoEstimadoMinutos).toBe(75);
  });

  it("coordenadas muito distantes (Rio de Janeiro) → frete DISTANTE", () => {
    const resultado = appFreteServico.calcular({
      endereco: "qualquer",
      latitude: -22.9068,
      longitude: -43.1729,
    });
    expect(resultado.valorFrete).toBe(25.0);
    expect(resultado.prazoEstimadoMinutos).toBe(120);
  });

  it("coordenadas têm prioridade sobre texto do endereço", () => {
    // Coordenadas locais mas texto sugere lugar distante
    const resultado = appFreteServico.calcular({
      endereco: "Rua Desconhecida, Cidade XYZ",
      ...MANGUINHOS,
    });
    // Deve usar coordenadas → LOCAL
    expect(resultado.valorFrete).toBe(8.5);
  });
});

// ── Schema de entrada (via Zod) ────────────────────────────────────────────

describe("esquemaCalcularFrete — validação de entrada", () => {
  it("rejeita endereço com menos de 5 caracteres", async () => {
    const { esquemaCalcularFrete } = await import(
      "../modulos/app-frete/app-frete.esquemas.js"
    );
    const resultado = esquemaCalcularFrete.safeParse({ endereco: "Rua" });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.endereco).toBeDefined();
  });

  it("aceita endereço com coordenadas opcionais", async () => {
    const { esquemaCalcularFrete } = await import(
      "../modulos/app-frete/app-frete.esquemas.js"
    );
    const resultado = esquemaCalcularFrete.safeParse({
      endereco: "Rua das Redes, Manguinhos",
      latitude: -20.1176,
      longitude: -40.1953,
    });
    expect(resultado.success).toBe(true);
  });
});
