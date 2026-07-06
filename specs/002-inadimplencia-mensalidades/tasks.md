# Tasks: Inadimplência Automática por Mensalidades

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Tests**: incluídos.

## Phase 1: Setup

- [x] T001 Modelar `Mensalidade` com `@@unique([associadoId, competencia])`.
- [x] T002 Schemas Zod de criação/atualização/pagamento.

## Phase 2: Foundational

- [x] T003 `obterStatusAutomatico()` implementando FR-002.
- [x] T004 `sincronizarStatusAssociado()` respeitando estados protegidos (FR-006).

## Phase 3: User Story 1 - Operar mensalidade e sincronizar (P1) 🎯 MVP

- [x] T005 [US1] `criar()`/`atualizar()`/`registrarPagamento()`/`excluir()` disparam sincronização.
- [x] T006 [US1] Bloqueio de competência duplicada (FR-008, 409).
- [x] T007 [US1] Teste: `ativo↔inadimplente` e proteção de `suspenso`.

## Phase 4: User Story 2 - Cálculo determinístico (P2)

- [x] T008 [US2] Teste puro de `obterStatusAutomatico()` cobrindo pago/pendente/atrasado.

## Phase 5: User Story 3 - Correção em lote (P3)

- [x] T009 [US3] `sincronizarAtrasos()` + rota `POST /api/dashboard/sincronizar-atrasos`.

## Phase 6: Polish

- [x] T010 Documentar mecanismo em `docs/ARQUITETURA.md` (seção Mensalidades).
