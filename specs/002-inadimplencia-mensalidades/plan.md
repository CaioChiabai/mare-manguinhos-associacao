# Implementation Plan: Inadimplência Automática por Mensalidades

**Branch**: `002-inadimplencia-mensalidades` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

## Summary

Motor financeiro que deriva o status da mensalidade e sincroniza o status do associado a
cada operação, respeitando os estados protegidos definidos em `001`.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Fastify, Prisma ORM, Zod
**Storage**: PostgreSQL — constraint `@@unique([associadoId, competencia])`
**Testing**: Vitest — `backend/src/__tests__/SPEC-002-inadimplencia.test.ts`
**Project Type**: Web (backend)
**Constraints**: Sincronização idempotente; histórico só em mudança real.

## Constitution Check

- **I/II/III**: ✅ regras numeradas, schemas Zod, módulo `mensalidades`.
- **IV**: ✅ `ErroConflito` para competência duplicada.
- **V**: ✅ efeito colateral auditado; unicidade garantida no banco.

## Project Structure

```text
backend/src/modulos/mensalidades/
├── mensalidades.rotas.ts     # POST/PUT/PATCH/DELETE + pagamento
├── mensalidades.servico.ts   # criar/atualizar/registrarPagamento/excluir
│                             # sincronizarStatusAssociado() (privada)
│                             # obterStatusAutomatico() (privada, FR-002)
│                             # sincronizarAtrasos() (lote, FR-009)
└── mensalidades.esquemas.ts
backend/src/modulos/dashboard/dashboard.rotas.ts  # POST /sincronizar-atrasos
```

**Structure Decision**: A sincronização é privada ao serviço de mensalidades e chamada por
todas as operações de escrita, garantindo um único ponto de verdade para a inadimplência.

## Complexity Tracking

Sem violações.
