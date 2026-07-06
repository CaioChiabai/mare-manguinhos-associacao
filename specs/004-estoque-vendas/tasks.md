# Tasks: Controle Transacional de Estoque em Vendas

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Tests**: incluídos.

## Phase 1: Setup

- [x] T001 Modelar `Venda`, `ItemVenda` e `Produto.pesoDisponivel`.
- [x] T002 Schemas Zod de venda (sem `total` no input — FR-008).

## Phase 2: Foundational

- [x] T003 `ajustarEstoqueItens()` com `updateMany` (`gte: pesoKg`, `ativo:true`) — FR-006/010.

## Phase 3: User Story 1 - Concluir venda (P1) 🎯 MVP

- [x] T004 [US1] `criar()` decrementa estoque só quando `concluida` (FR-001/002).
- [x] T005 [US1] Total calculado no backend (FR-008).
- [x] T006 [US1] Tudo dentro de `$transaction` (FR-007).
- [x] T007 [US1] Teste: decremento e falha por estoque insuficiente.

## Phase 4: User Story 2 - Transições de status (P2)

- [x] T008 [US2] `atualizarStatus()` decrementa/estorna conforme transição (FR-003/004).

## Phase 5: User Story 3 - Concorrência (P2)

- [x] T009 [US3] Optimistic lock com status atual no filtro (FR-009); rejeitar `cancelada→*` (FR-005).
- [x] T010 [US3] Teste: segunda operação simultânea recebe 409.

## Phase 6: Polish

- [x] T011 Documentar padrão de concorrência em `docs/ARQUITETURA.md`.
