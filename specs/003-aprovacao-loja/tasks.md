# Tasks: Fluxo de Aprovação de Loja

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Tests**: incluídos.

## Phase 1: Setup

- [x] T001 Modelar `Loja` (`status`, `dataAprovacao`, `motivoRejeicao`).
- [x] T002 Schemas `esquemaCriarLoja` / `esquemaAtualizarStatusLoja`.

## Phase 2: Foundational

- [x] T003 Helper de verificação "associado está ativo?".

## Phase 3: User Story 1 - Aprovar/rejeitar (P1) 🎯 MVP

- [x] T004 [US1] `criar()` com default `pendente` (FR-001) e guarda de aprovação (FR-002).
- [x] T005 [US1] `atualizarStatus()` cobrindo FR-002..FR-006.
- [x] T006 [US1] Rotas `POST /api/lojas` e `PATCH /api/lojas/:id/status`.
- [x] T007 [US1] Teste: aprovação/rejeição e guarda de associado inadimplente.

## Phase 4: User Story 2 - Gate comercial (P1)

- [x] T008 [US2] `produtos.servico.criar()` valida loja aprovada + associado ativo (FR-007).
- [x] T009 [US2] `vendas.servico.criar()` valida loja aprovada + associado ativo (FR-008).
- [x] T010 [US2] Chatbot valida loja aprovada (FR-009).

## Phase 5: User Story 3 - Reversão (P2)

- [x] T011 [US3] Suspensão zera `dataAprovacao` (FR-006).

## Phase 6: Polish

- [x] T012 Documentar fluxo em `docs/ARQUITETURA.md` e `docs/API.md`.
