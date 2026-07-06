# Implementation Plan: Fluxo de Aprovação de Loja

**Branch**: `003-aprovacao-loja` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

## Summary

Máquina de estados da loja (`pendente`/`aprovada`/`rejeitada`/`suspensa`) com o status do
associado como pré-condição, e gate de estoque comercial (produtos/vendas) dependente da
aprovação.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Fastify, Prisma ORM, Zod
**Storage**: PostgreSQL
**Testing**: Vitest — `backend/src/__tests__/SPEC-003-aprovacao-loja.test.ts` (mock de Prisma)
**Project Type**: Web (backend)
**Constraints**: Validação de pré-condição na criação e na transição.

## Constitution Check

- **I/II/III/IV/V**: ✅ regras numeradas, Zod, módulo `lojas`, `ErroConflito`, auditoria da transição.

## Project Structure

```text
backend/src/modulos/lojas/
├── lojas.rotas.ts     # POST /api/lojas, PATCH /api/lojas/:id/status
├── lojas.servico.ts   # criar() (FR-002), atualizarStatus() (FR-002..FR-006)
└── lojas.esquemas.ts  # esquemaCriarLoja, esquemaAtualizarStatusLoja
backend/src/modulos/produtos/produtos.servico.ts  # criar() (FR-007)
backend/src/modulos/vendas/vendas.servico.ts       # criar() (FR-008)
backend/src/modulos/api-publica/api-publica.rotas.ts  # chatbot (FR-009)
```

**Structure Decision**: Pré-condição de elegibilidade é revalidada em cada ponto de escrita
comercial (loja, produto, venda, chatbot) — defesa em profundidade, não confiando em cache.

## Complexity Tracking

Sem violações.
