# Feature Specification: Pedidos do App Delivery (Consumidor)

**Feature Branch**: `006-pedidos-app-delivery`
**Created**: 2026-07-06
**Status**: Implementada (gaps GAP-02/GAP-03 corrigidos)
**Input**: Fluxo de pedidos de consumidores finais via app de delivery — módulo separado e independente do painel administrativo, com autenticação própria (`tipo: "consumidor"`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fazer um pedido (Priority: P1)

Como **consumidor**, quero montar um carrinho e confirmar um pedido, para receber pescado em casa
com estoque e valores corretos.

**Why this priority**: É a razão de existir do app; sem pedido não há delivery.

**Independent Test**: Consumidor autenticado envia `POST /api/app/pedidos` com itens válidos →
pedido `confirmado` e estoque decrementado.

**Acceptance Scenarios**:

1. **Given** carrinho vazio, **When** `itens: []` é enviado, **Then** 400 (schema `min(1)`). *(FR-004)*
2. **Given** item com `pesoKg > pesoDisponivel`, **When** o pedido é criado, **Then** 409 estoque insuficiente. *(FR-005)*
3. **Given** cliente envia `valorTotal` adulterado, **When** o pedido é criado, **Then** o backend recalcula `valorTotal` a partir dos preços do banco. *(FR-007)*
4. **Given** dois pedidos simultâneos com estoque exato, **When** ambos executam, **Then** um falha (transação/`updateMany` com `gte`). *(FR-006)*

---

### User Story 2 - Navegar a vitrine (Priority: P1)

Como **consumidor**, quero ver apenas produtos realmente disponíveis, para não pedir algo que não
pode ser vendido.

**Independent Test**: `GET /api/app/vitrine` (público) e conferir que produtos de associado
inadimplente não aparecem.

**Acceptance Scenarios**:

1. **Given** associado do produto vira inadimplente, **When** a vitrine é consultada, **Then** o produto some. *(FR-003)*

---

### User Story 3 - Gerenciar endereços e pagamento (Priority: P2)

Como **consumidor**, quero cadastrar endereços (um principal) e pagar via Pix/cartão, para concluir
a compra.

**Acceptance Scenarios**:

1. **Given** endereço A principal, **When** B é marcado principal, **Then** A vira `false` e B `true`. *(FR-009)*
2. **Given** `frete: -1`, **When** enviado, **Then** 400 (schema). *(FR-008)*

### Edge Cases

- Produto inexistente/inativo no pedido → 404.
- Pagamento é STUB — nenhuma cobrança real é feita (FR-010).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Consumidor DEVE ser entidade própria (`Consumidor`), sem compartilhar tabela/credencial com `Usuario`/`Associado`.
- **FR-002**: O JWT do consumidor DEVE ter `tipo: "consumidor"`.
- **FR-003**: A vitrine DEVE exibir apenas produtos `ativo=true` de loja `aprovada` de associado `ativo`.
- **FR-004**: Pedido DEVE exigir ao menos 1 item.
- **FR-005**: O estoque DEVE ser validado antes da criação (`pesoDisponivel ≥ pesoKg`).
- **FR-006**: `pesoDisponivel` DEVE ser decrementado atomicamente em `prisma.$transaction` com `updateMany` (`gte: pesoKg`) como controle de concorrência.
- **FR-007**: `valorTotal` DEVE ser calculado no backend (`Σ precoPorKg × pesoKg`); valores do cliente são ignorados.
- **FR-008**: O frete é calculado por `GET /api/app-frete/calcular` e enviado pelo cliente; o backend valida `frete ≥ 0`.
- **FR-009**: Endereço `principal` DEVE ser exclusivo por consumidor (`updateMany` zera os demais).
- **FR-010**: Pagamentos (`gerarPix`, `processarCartao`) são STUB e DEVEM ser substituídos por gateway antes de produção.

### Key Entities

- **Consumidor**, **Endereco** (`principal`), **Pedido** (`status`, `valorTotal`, `frete`), **PedidoItem** (`pesoKg`, `precoPorKg`), **Produto**.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhum pedido persiste com `valorTotal` divergente do cálculo do backend.
- **SC-002**: Estoque nunca fica negativo mesmo sob pedidos simultâneos.
- **SC-003**: Cada consumidor tem no máximo um endereço principal.

## Assumptions

- O gateway de pagamento real será integrado depois (Efí/Gerencianet ou similar).
- O frete é confiável na borda do app-frete; o backend só valida a não-negatividade.
