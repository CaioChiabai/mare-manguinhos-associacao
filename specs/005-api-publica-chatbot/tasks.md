# Tasks: Contrato Público da API (Chatbot WhatsApp)

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Tests**: incluídos.

## Phase 1: Setup

- [x] T001 `normalizarTelefone()` em `compartilhado/telefone.ts` (FR-005/006).
- [x] T002 Schema inline `esquemaCadastrarProdutoChatbot`.

## Phase 2: Foundational

- [x] T003 `contarLojasAprovadas()` auxiliar.

## Phase 3: User Story 1 - Cadastro via chatbot (P1) 🎯 MVP

- [x] T004 [US1] `POST .../telefone/:tel/produto` chama `sincronizarAtrasos()` (FR-008).
- [x] T005 [US1] Guarda de elegibilidade (FR-009) e resolução de `lojaId` (FR-010/011).
- [x] T006 [US1] Auditoria com `canal: "chatbot_whatsapp"` (FR-012).

## Phase 4: User Story 2 - Consultas sem vazamento (P1)

- [x] T007 [US2] Endpoints de leitura com projeção mínima (FR-001..FR-004).

## Phase 5: User Story 3 - Busca por telefone (P2)

- [x] T008 [US3] Teste puro de `normalizarTelefone()` cobrindo máscaras diversas.

## Phase 6: Polish

- [x] T009 Documentar contrato em `docs/API.md` e alerta de estabilidade.
