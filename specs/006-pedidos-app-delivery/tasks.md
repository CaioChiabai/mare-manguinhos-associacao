# Tasks: Pedidos do App Delivery (Consumidor)

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Tests**: incluídos.

## Phase 1: Setup

- [x] T001 Modelar `Consumidor`, `Endereco`, `Pedido`, `PedidoItem`.
- [x] T002 `esquemaCadastro` e `esquemaCriarPedido` (`itens.min(1)`, sem `valorTotal`, `frete ≥ 0`).

## Phase 2: Foundational

- [x] T003 Autenticação do consumidor com JWT `tipo: "consumidor"` (FR-001/002).

## Phase 3: User Story 1 - Fazer pedido (P1) 🎯 MVP

- [x] T004 [US1] `criarPedido()` valida estoque (FR-005) e cria em `$transaction` (FR-006).
- [x] T005 [US1] `valorTotal` recalculado no backend (FR-007) — **GAP-02 corrigido**.
- [x] T006 [US1] `updateMany` com `gte: pesoKg` para concorrência (FR-006) — **GAP-03 corrigido**.
- [x] T007 [US1] Teste: carrinho vazio, estoque insuficiente e recálculo de total.

## Phase 4: User Story 2 - Vitrine (P1)

- [x] T008 [US2] `listarProdutos()` filtra por 3 níveis de status (FR-003).

## Phase 5: User Story 3 - Endereços e pagamento (P2)

- [x] T009 [US3] `marcarEnderecoPrincipal()` com exclusividade via `updateMany` (FR-009).
- [x] T010 [US3] `gerarPix()`/`processarCartao()` stub (FR-010) — dívida técnica registrada.

## Phase 6: Polish

- [x] T011 Atualizar `docs/specs/RASTREABILIDADE.md` marcando GAP-02/GAP-03 como resolvidos.
- [ ] T012 Substituir stubs de pagamento por gateway real (pré-produção) — pendente.
