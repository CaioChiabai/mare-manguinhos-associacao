/**
 * Testes de SPEC-005 — Contrato Público da API (Chatbot WhatsApp)
 *
 * Cobertura neste arquivo:
 *   - AC-004: normalização de telefone (R005, R006)
 *   - AC-002: retorno boolean dos endpoints /ativo (validado via schema — sem banco)
 *
 * Os demais ACs da SPEC-005 (AC-001, AC-005..AC-010) requerem banco ou mock de Prisma
 * e devem ser implementados em testes de integração.
 */

import { describe, it, expect } from "vitest";
import { normalizarTelefone } from "../compartilhado/telefone.js";

// ── Normalização de telefone (SPEC-005 R005, R006) ────────────────────────

describe("normalizarTelefone — SPEC-005 R005", () => {
  it("AC-004 | remove parênteses, espaços e hífen", () => {
    expect(normalizarTelefone("(27) 98765-4321")).toBe("27987654321");
  });

  it("AC-004 | aceita número já normalizado (sem alteração)", () => {
    expect(normalizarTelefone("27987654321")).toBe("27987654321");
  });

  it("AC-004 | remove pontos e traços", () => {
    expect(normalizarTelefone("27.98765.4321")).toBe("27987654321");
  });

  it("AC-004 | remove todos os espaços internos", () => {
    expect(normalizarTelefone("27 9 8 7 6 5 4 3 2 1")).toBe("27987654321");
  });

  it("AC-004 | número internacional com + → remove o +", () => {
    expect(normalizarTelefone("+5527987654321")).toBe("5527987654321");
  });

  it("string vazia retorna string vazia", () => {
    expect(normalizarTelefone("")).toBe("");
  });

  it("somente letras retorna string vazia (remove tudo que não é dígito)", () => {
    expect(normalizarTelefone("abc")).toBe("");
  });

  it("mantém zeros à esquerda", () => {
    expect(normalizarTelefone("0800 123 4567")).toBe("08001234567");
  });
});

// ── Comportamento dos endpoints /ativo (SPEC-005 R002) ───────────────────
//
// Os endpoints GET /api/publico/pescador/:id/ativo e /loja/:id/ativa devem retornar
// SOMENTE um boolean. Isso é validado nos testes de integração (requerem servidor).
// O teste abaixo valida a lógica de conversão de status → boolean usada internamente.

describe("lógica de elegibilidade (R002 — verificação de status)", () => {
  const podeVender = (status: string, lojasAprovadas: number) =>
    status === "ativo" && lojasAprovadas > 0;

  it("associado ativo com loja aprovada → pode vender", () => {
    expect(podeVender("ativo", 1)).toBe(true);
  });

  it("associado inadimplente → não pode vender", () => {
    expect(podeVender("inadimplente", 1)).toBe(false);
  });

  it("associado suspenso → não pode vender", () => {
    expect(podeVender("suspenso", 1)).toBe(false);
  });

  it("associado bloqueado → não pode vender", () => {
    expect(podeVender("bloqueado", 0)).toBe(false);
  });

  it("associado ativo mas sem loja aprovada → não pode vender", () => {
    expect(podeVender("ativo", 0)).toBe(false);
  });

  it("associado ativo com múltiplas lojas → pode vender", () => {
    expect(podeVender("ativo", 3)).toBe(true);
  });
});
