/**
 * Testes de SPEC-001 — Ciclo de Vida do Status do Associado
 *
 * Cobertura neste arquivo: validação de dados de entrada do associado.
 * Foco nos casos de aceitação que podem ser verificados sem banco de dados.
 *
 * AC testados: validação de CPF (R001 de integridade de dados), formato de email,
 * e schema do status (R001 de SPEC-001).
 *
 * Testes que requerem banco (AC-001..AC-008 com transições de status):
 * → precisam de mock de Prisma ou banco de teste — estrutura em SPEC-002-inadimplencia.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  esquemaCriarAssociado,
  esquemaAlterarStatus,
  statusAssociado,
} from "../modulos/associados/associados.esquemas.js";

// ── Validação de CPF (integridade de dados) ────────────────────────────────

describe("esquemaCriarAssociado — validação de CPF", () => {
  it("aceita CPF válido sem máscara", () => {
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ cpf: "52998224725" }));
    expect(resultado.success).toBe(true);
  });

  it("aceita CPF válido com máscara", () => {
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ cpf: "529.982.247-25" }));
    expect(resultado.success).toBe(true);
  });

  it("aceita CPF válido — segundo caso", () => {
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ cpf: "111.444.777-35" }));
    expect(resultado.success).toBe(true);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ cpf: "111.111.111-11" }));
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.cpf).toContain("CPF inválido");
  });

  it("rejeita CPF com dígito verificador errado", () => {
    // 529.982.247-00 — dígitos verificadores corretos seriam 25
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ cpf: "529.982.247-00" }));
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.cpf).toContain("CPF inválido");
  });

  it("rejeita CPF com menos de 11 dígitos", () => {
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ cpf: "123.456.789" }));
    expect(resultado.success).toBe(false);
  });

  it("rejeita CPF vazio", () => {
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ cpf: "" }));
    expect(resultado.success).toBe(false);
  });
});

// ── Validação de email ─────────────────────────────────────────────────────

describe("esquemaCriarAssociado — validação de email", () => {
  it("aceita email válido", () => {
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ email: "joao@pescadores.local" }));
    expect(resultado.success).toBe(true);
  });

  it("rejeita email sem @", () => {
    const resultado = esquemaCriarAssociado.safeParse(associadoBase({ email: "joaopescadores" }));
    expect(resultado.success).toBe(false);
    expect(resultado.error?.flatten().fieldErrors.email).toBeDefined();
  });
});

// ── Validação do enum de status (SPEC-001 R001) ───────────────────────────

describe("statusAssociado — enum de status válidos", () => {
  const statusValidos = ["ativo", "suspenso", "inadimplente", "bloqueado"] as const;

  statusValidos.forEach((status) => {
    it(`aceita status "${status}"`, () => {
      expect(statusAssociado.safeParse(status).success).toBe(true);
    });
  });

  it("rejeita status inexistente", () => {
    expect(statusAssociado.safeParse("excluido").success).toBe(false);
    expect(statusAssociado.safeParse("inativo").success).toBe(false);
    expect(statusAssociado.safeParse("").success).toBe(false);
  });
});

// ── Validação da alteração de status (SPEC-001 R002, R003) ────────────────

describe("esquemaAlterarStatus — motivo para suspenso/bloqueado", () => {
  it("aceita alteração para ativo sem motivo", () => {
    // R002/R003 exigem motivo — mas a validação do motivo ocorre no serviço, não no schema
    const resultado = esquemaAlterarStatus.safeParse({ status: "ativo" });
    expect(resultado.success).toBe(true);
    expect(resultado.data?.motivo).toBeUndefined();
  });

  it("aceita alteração para suspenso com motivo", () => {
    const resultado = esquemaAlterarStatus.safeParse({ status: "suspenso", motivo: "Violação de contrato" });
    expect(resultado.success).toBe(true);
  });

  it("aceita alteração para suspenso sem motivo no schema (validação de negócio fica no serviço)", () => {
    // O schema não rejeita — o SERVIÇO rejeita. Isso é documentado para deixar claro
    // onde a regra R002 e R003 é enforçada (associados.servico.ts → alterarStatus).
    const resultado = esquemaAlterarStatus.safeParse({ status: "suspenso" });
    expect(resultado.success).toBe(true); // schema passa; serviço rejeita
  });

  it("rejeita status inválido", () => {
    const resultado = esquemaAlterarStatus.safeParse({ status: "arquivado" });
    expect(resultado.success).toBe(false);
  });
});

// ── Helper ────────────────────────────────────────────────────────────────

function associadoBase(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    nome: "João da Silva",
    cpf: "529.982.247-25",
    email: "joao@email.com",
    telefone: "27987654321",
    numeroCarteira: "AP-001234",
    ...overrides,
  };
}
