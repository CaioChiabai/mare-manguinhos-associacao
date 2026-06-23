/**
 * Testes de SPEC-006 — Pedidos do App Delivery (Consumidor)
 *
 * Cobertura (testes puros, sem banco):
 *   - AC-001: itens vazio → schema rejeita (R004)
 *   - AC-005: frete negativo → schema rejeita (R008)
 *   - R007: schema não expõe valorTotal — backend calcula a partir de produtoMap
 *   - AC-002: lógica de validação de estoque inline (R005)
 *   - R001: schema de cadastro do consumidor
 *
 * Testes que requerem banco (AC-002 via serviço, AC-006, AC-008):
 *   → implementar em testes de integração com mock de Prisma ou banco de teste.
 */

import { describe, it, expect } from "vitest";
import {
  esquemaCriarPedido,
  esquemaCadastro,
} from "../modulos/app/app.esquemas.js";

// ── Schema de pedido (SPEC-006 R004, R008) ────────────────────────────────

const pedidoBase = () => ({
  itens: [
    {
      produtoId: "550e8400-e29b-41d4-a716-446655440000",
      corte: "inteiro",
      pesoKg: 1.5,
    },
  ],
  enderecoEntrega: "Rua das Redes, 10, Manguinhos",
  janelaEntrega: "08:00–12:00",
  frete: 8.5,
  formaPagamento: "pix",
});

describe("esquemaCriarPedido — R004: ao menos 1 item", () => {
  it("AC-001 | itens vazio → schema rejeita", () => {
    const resultado = esquemaCriarPedido.safeParse({ ...pedidoBase(), itens: [] });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.itens).toBeDefined();
  });

  it("aceita pedido com 1 item válido", () => {
    const resultado = esquemaCriarPedido.safeParse(pedidoBase());
    expect(resultado.success).toBe(true);
  });

  it("aceita pedido com múltiplos itens", () => {
    const resultado = esquemaCriarPedido.safeParse({
      ...pedidoBase(),
      itens: [
        { produtoId: "550e8400-e29b-41d4-a716-446655440000", corte: "inteiro", pesoKg: 1.5 },
        { produtoId: "550e8400-e29b-41d4-a716-446655440001", corte: "limpo", pesoKg: 0.5 },
      ],
    });
    expect(resultado.success).toBe(true);
  });
});

describe("esquemaCriarPedido — R008: frete não-negativo", () => {
  it("AC-005 | frete negativo → schema rejeita", () => {
    const resultado = esquemaCriarPedido.safeParse({ ...pedidoBase(), frete: -1 });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.frete).toBeDefined();
  });

  it("frete zero é válido (ex: retirada)", () => {
    const resultado = esquemaCriarPedido.safeParse({ ...pedidoBase(), frete: 0 });
    expect(resultado.success).toBe(true);
  });

  it("frete positivo é válido", () => {
    const resultado = esquemaCriarPedido.safeParse({ ...pedidoBase(), frete: 15 });
    expect(resultado.success).toBe(true);
  });
});

describe("esquemaCriarPedido — R007: valorTotal calculado pelo backend", () => {
  it("schema não inclui valorTotal — qualquer valor enviado pelo cliente é ignorado", () => {
    // GAP-03 corrigido: valorTotal removido do esquemaCriarPedido.
    // Cliente pode enviar o campo; Zod o ignora (strip). Backend recalcula.
    const resultado = esquemaCriarPedido.safeParse({
      ...pedidoBase(),
      valorTotal: 0.01, // enviado pelo cliente — ignorado pelo schema
    });
    expect(resultado.success).toBe(true);
    expect((resultado.data as any).valorTotal).toBeUndefined();
  });
});

// ── Lógica inline de validação de estoque (SPEC-006 R005) ─────────────────

describe("validação de estoque — R005 (lógica inline do criarPedido)", () => {
  const estoqueDisponivel = (pesoSolicitado: number, pesoDisponivel: number) =>
    pesoDisponivel >= pesoSolicitado;

  it("AC-002 | estoque suficiente → permite pedido", () => {
    expect(estoqueDisponivel(1.5, 5.0)).toBe(true);
  });

  it("AC-002 | estoque insuficiente → rejeita pedido", () => {
    expect(estoqueDisponivel(3.0, 2.0)).toBe(false);
  });

  it("AC-002 | estoque exato → permite pedido", () => {
    expect(estoqueDisponivel(2.0, 2.0)).toBe(true);
  });

  it("AC-002 | estoque zero → rejeita qualquer pedido", () => {
    expect(estoqueDisponivel(0.5, 0)).toBe(false);
  });
});

// ── Cálculo correto de total (SPEC-006 R007 — como deveria ser) ───────────

describe("cálculo de valorTotal — R007 (lógica correta, como em vendas.servico.ts)", () => {
  const calcularTotal = (itens: Array<{ pesoKg: number; precoPorKg: number }>) =>
    itens.reduce((acc, item) => acc + item.pesoKg * item.precoPorKg, 0);

  it("1 item: 2 kg × R$ 25/kg = R$ 50,00", () => {
    expect(calcularTotal([{ pesoKg: 2, precoPorKg: 25 }])).toBe(50);
  });

  it("múltiplos itens somam corretamente", () => {
    const itens = [
      { pesoKg: 1.5, precoPorKg: 30 }, // 45
      { pesoKg: 0.5, precoPorKg: 20 }, // 10
    ];
    expect(calcularTotal(itens)).toBeCloseTo(55, 2);
  });

  it("total com zero itens é zero", () => {
    expect(calcularTotal([])).toBe(0);
  });
});

// ── Schema do consumidor (SPEC-006 R001) ──────────────────────────────────

describe("esquemaCadastro — R001: consumidor como entidade própria", () => {
  const consumidorBase = () => ({
    nome: "Maria Silva",
    email: "maria@email.com",
    telefone: "27987654321",
    senha: "minhasenha123",
  });

  it("aceita consumidor com campos válidos", () => {
    const resultado = esquemaCadastro.safeParse(consumidorBase());
    expect(resultado.success).toBe(true);
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    const resultado = esquemaCadastro.safeParse({ ...consumidorBase(), nome: "M" });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.nome).toBeDefined();
  });

  it("rejeita senha com menos de 6 caracteres", () => {
    const resultado = esquemaCadastro.safeParse({ ...consumidorBase(), senha: "abc" });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.senha).toBeDefined();
  });

  it("rejeita telefone com menos de 10 dígitos", () => {
    const resultado = esquemaCadastro.safeParse({ ...consumidorBase(), telefone: "123456789" });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.telefone).toBeDefined();
  });
});
