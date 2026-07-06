# Implementation Plan: Controle Transacional de Estoque em Vendas

**Branch**: `004-estoque-vendas` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

## Summary

Vendas ajustam estoque atomicamente, com total calculado no backend e concorrência controlada
por *optimistic locking* dentro de `prisma.$transaction`.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Fastify, Prisma ORM (`$transaction`, `updateMany`), Zod
**Storage**: PostgreSQL
**Testing**: Vitest — `backend/src/__tests__/SPEC-004-estoque-vendas.test.ts`
**Project Type**: Web (backend)
**Constraints**: Atomicidade absoluta; estoque nunca negativo; sem estado intermediário.

## Constitution Check

- **V. Consistência transacional**: ✅ princípio central desta feature (`$transaction` + optimistic lock).
- **I/II/III/IV**: ✅ regras numeradas, Zod, módulo `vendas`, `ErroConflito`.

## Project Structure

```text
backend/src/modulos/vendas/
├── vendas.rotas.ts     # POST /api/vendas, PATCH /api/vendas/:id/status
├── vendas.servico.ts   # criar() (FR-001/002/007/008)
│                       # atualizarStatus() (FR-003/004/005/007/009)
│                       # ajustarEstoqueItens() (privada, FR-006/010)
└── vendas.esquemas.ts
```

**Structure Decision**: O ajuste de estoque é uma função privada chamada dentro da transação
tanto na criação quanto na transição, evitando duplicação da lógica de concorrência.

## Complexity Tracking

Sem violações. O uso de `updateMany` com filtro de estado é o padrão de referência do projeto
para concorrência (reutilizado em `006`).
