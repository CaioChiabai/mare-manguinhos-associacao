# Tasks: Ciclo de Vida do Status do Associado

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Tests**: incluídos (derivados dos critérios de aceitação).

## Phase 1: Setup

- [x] T001 Definir enum de status e schema Zod `statusAssociado` em `associados.esquemas.ts`.
- [x] T002 Modelar `Associado.status` e `HistoricoStatusAssociado` no `schema.prisma`.

## Phase 2: Foundational

- [x] T003 Criar helper de registro de histórico + auditoria em `compartilhado/auditoria.ts`.
- [x] T004 Classes de erro `ErroValidacao`/`ErroConflito` em `compartilhado/erros.ts`.

## Phase 3: User Story 1 - Transição manual (P1) 🎯 MVP

- [x] T005 [US1] `esquemaAlterarStatus` exige `motivo` para `suspenso`/`bloqueado`.
- [x] T006 [US1] `alterarStatus()` em `associados.servico.ts` (guarda de idempotência).
- [x] T007 [US1] Rota `PATCH /api/associados/:id/status` (admin) em `associados.rotas.ts`.
- [x] T008 [US1] Teste: motivo obrigatório e registro de histórico.

## Phase 4: User Story 2 - Inadimplência automática (P1)

- [x] T009 [US2] `sincronizarStatusAssociado()` aplica FR-004/FR-005 com motivos fixos.
- [x] T010 [US2] Teste: transições `ativo↔inadimplente` conforme débito.

## Phase 5: User Story 3 - Proteção de estados manuais (P2)

- [x] T011 [US3] Guarda em `sincronizarStatusAssociado()` para `suspenso`/`bloqueado` (FR-006).
- [x] T012 [US3] Pré-condições FR-008 (lojas) e FR-009 (permissões).
- [x] T013 [US3] Teste: estado protegido não muda por sincronização.

## Phase 6: Polish

- [x] T014 Documentar máquina de estados em `docs/ARQUITETURA.md`.
- [x] T015 Rastreabilidade cruzada com `002-inadimplencia-mensalidades`.
