# Feature Specification: Controle Transacional de Estoque em Vendas

**Feature Branch**: `004-estoque-vendas`
**Created**: 2026-07-06
**Status**: Implementada
**Input**: As vendas consomem estoque físico (`pesoDisponivel` em kg). O ajuste deve ser atômico com a criação/mudança de status da venda, garantindo consistência mesmo sob concorrência.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Concluir venda decrementando estoque (Priority: P1)

Como **operador de loja**, quero registrar uma venda que abate o estoque dos produtos de forma
atômica, para que o `pesoDisponivel` reflita sempre a realidade.

**Why this priority**: É a operação comercial central; inconsistência de estoque corrompe o negócio.

**Independent Test**: Produto com `pesoDisponivel=10`; criar venda `concluida` de `3 kg` → estoque = `7`.

**Acceptance Scenarios**:

1. **Given** produto com `pesoDisponivel=10`, **When** venda `concluida` de `3 kg` é criada, **Then** estoque vira `7`. *(FR-001, FR-007)*
2. **Given** produto com `pesoDisponivel=10`, **When** venda `pendente` de `3 kg` é criada, **Then** estoque permanece `10`. *(FR-002)*
3. **Given** produto com `pesoDisponivel=2`, **When** venda `concluida` de `5 kg` é solicitada, **Then** 409 "Peso disponível insuficiente" e nenhum estoque é alterado. *(FR-006)*

---

### User Story 2 - Transições de status ajustam estoque (Priority: P2)

Como **operador**, quero que concluir uma venda pendente decremente o estoque e cancelar uma
venda concluída o estorne, para refletir corretamente o ciclo da venda.

**Acceptance Scenarios**:

1. **Given** venda `pendente`, **When** vira `concluida`, **Then** estoque é decrementado. *(FR-003)*
2. **Given** venda `concluida`, **When** vira `cancelada`, **Then** estoque é estornado. *(FR-004)*

---

### User Story 3 - Integridade sob concorrência (Priority: P2)

Como **sistema**, quero *optimistic locking* na mudança de status, para que duas operações
simultâneas sobre a mesma venda não corrompam o estoque.

**Acceptance Scenarios**:

1. **Given** dois processos atualizando a mesma venda, **When** o segundo executa após o primeiro, **Then** o segundo recebe 409 "A venda foi alterada por outra operação". *(FR-009)*
2. **Given** venda `cancelada`, **When** qualquer transição é tentada, **Then** é rejeitada (count=0 → `ErroConflito`). *(FR-005)*

### Edge Cases

- Produto `ativo=false` no filtro do `updateMany` impede venda de produto desativado (FR-010).
- Total enviado pelo cliente é ignorado; backend recalcula (FR-008).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Venda criada `concluida` DEVE decrementar `pesoDisponivel` de cada item.
- **FR-002**: Venda `pendente` NÃO DEVE afetar estoque.
- **FR-003**: Transição `pendente → concluida` DEVE decrementar o estoque.
- **FR-004**: Transição `concluida → cancelada` DEVE estornar o estoque.
- **FR-005**: Transição a partir de `cancelada` DEVE ser rejeitada (`ErroConflito`).
- **FR-006**: Estoque insuficiente em qualquer item DEVE reverter a operação inteira (transação).
- **FR-007**: Venda e ajuste de estoque DEVEM ocorrer na mesma `prisma.$transaction`.
- **FR-008**: O total DEVE ser calculado no backend (`precoPorKg * pesoKg`); o cliente não envia total.
- **FR-009**: A concorrência DEVE usar *optimistic locking* (`updateMany` com status atual no filtro).
- **FR-010**: Produto `ativo=false` NÃO DEVE ter estoque decrementado (filtro `ativo:true`).

### Key Entities

- **Venda**: `status`, `total`, `lojaId`, `associadoId`.
- **ItemVenda**: `produtoId`, `pesoKg`, `precoUnitario`, `subtotal`.
- **Produto**: `pesoDisponivel`, `precoPorKg`, `ativo`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nunca existe venda persistida sem o ajuste de estoque correspondente.
- **SC-002**: Estoque nunca fica negativo.
- **SC-003**: Sob concorrência, no máximo uma operação vence; as demais falham com 409.

## Assumptions

- O estoque é medido em kg (`pesoDisponivel`), não em unidades.
- Pré-condição herdada de `003`: loja aprovada + associado ativo.
