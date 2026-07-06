# Feature Specification: Fluxo de Aprovação de Loja

**Feature Branch**: `003-aprovacao-loja`
**Created**: 2026-07-06
**Status**: Implementada
**Input**: Cada pescador pode ter uma ou mais lojas virtuais; elas passam por aprovação administrativa antes de operar (cadastrar produtos e vender).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aprovar/rejeitar loja (Priority: P1)

Como **administrador**, quero aprovar ou rejeitar lojas de associados, para liberar apenas
pescadores aptos a comercializar.

**Why this priority**: É o portão de entrada do ciclo comercial.

**Independent Test**: Criar loja `pendente` de associado `ativo` e aprová-la; verificar
`dataAprovacao` preenchida.

**Acceptance Scenarios**:

1. **Given** loja `pendente` de associado `ativo`, **When** admin aprova, **Then** status vira `aprovada` e `dataAprovacao` é preenchida. *(FR-002, FR-004)*
2. **Given** loja `pendente` de associado `inadimplente`, **When** admin tenta aprovar, **Then** 409 "Somente associados ativos podem ter lojas aprovadas". *(FR-002)*
3. **Given** loja `pendente`, **When** admin rejeita sem `motivoRejeicao`, **Then** 400. *(FR-003)*
4. **Given** loja `pendente`, **When** admin rejeita com motivo, **Then** status vira `rejeitada`, `motivoRejeicao` persistido e `dataAprovacao` nula. *(FR-003, FR-005)*

---

### User Story 2 - Estoque comercial gated por status (Priority: P1)

Como **sistema**, quero permitir cadastro de produtos e vendas somente em lojas `aprovada` de
associados `ativo`, para impedir comércio de pescadores inaptos.

**Why this priority**: Garante integridade da regra de elegibilidade no comércio.

**Independent Test**: Tentar cadastrar produto em loja `pendente` → 409; em loja `aprovada` → sucesso.

**Acceptance Scenarios**:

1. **Given** loja `aprovada` e associado `ativo`, **When** produto é cadastrado, **Then** sucesso. *(FR-007)*
2. **Given** loja `pendente`, **When** produto é cadastrado, **Then** 409. *(FR-007)*
3. **Given** loja `aprovada` e associado `ativo`, **When** venda é registrada, **Then** sucesso. *(FR-008)*

---

### User Story 3 - Reversão de aprovação (Priority: P2)

Como **administrador**, quero suspender uma loja aprovada, para retirar temporariamente sua
operação limpando a data de aprovação.

**Acceptance Scenarios**:

1. **Given** loja `aprovada`, **When** admin suspende, **Then** status vira `suspensa` e `dataAprovacao` é zerada. *(FR-006)*

### Edge Cases

- Loja criada sem `status` explícito → `pendente` (FR-001).
- Loja `rejeitada` pode ser resubmetida para `pendente`.
- Chatbot só cadastra produto em loja `aprovada` (FR-009 — detalhado em `005`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Loja sem status explícito DEVE nascer `pendente`.
- **FR-002**: Loja só PODE ser `aprovada` se o associado estiver `ativo` (na criação e na mudança de status).
- **FR-003**: A transição para `rejeitada` DEVE exigir `motivoRejeicao` não vazio.
- **FR-004**: Ao aprovar, `dataAprovacao` DEVE receber o timestamp atual.
- **FR-005**: Ao rejeitar, `motivoRejeicao` DEVE ser persistido e `dataAprovacao` permanecer nula.
- **FR-006**: Ao reverter de `aprovada`, `dataAprovacao` DEVE ser zerada.
- **FR-007**: Produto só PODE ser cadastrado em loja `aprovada` de associado `ativo`.
- **FR-008**: Venda só PODE ser registrada em loja `aprovada` de associado `ativo`.
- **FR-009**: O chatbot só PODE cadastrar produto em loja `aprovada`.

### Key Entities

- **Loja**: `status`, `dataAprovacao`, `motivoRejeicao`, `associadoId`.
- **Associado**: pré-condição de elegibilidade (`status = ativo`).
- **Produto / Venda**: dependem de loja aprovada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma loja de associado não-`ativo` fica `aprovada`.
- **SC-002**: Nenhum produto ou venda é criado sob loja não-aprovada.
- **SC-003**: Toda rejeição tem motivo registrado.

## Assumptions

- Não há estado "excluída": lojas são deletadas diretamente.
- Uma loja suspensa pode ser reaprovada se o associado voltar a `ativo`.
