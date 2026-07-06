# Feature Specification: Ciclo de Vida do Status do Associado

**Feature Branch**: `001-ciclo-vida-associado`
**Created**: 2026-07-06
**Status**: Implementada
**Input**: O status do associado é o eixo central de elegibilidade do sistema — controla se o pescador pode ter loja aprovada, permissão ativa e participar do ciclo comercial.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Suspender/bloquear associado com motivo (Priority: P1)

Como **administrador da associação**, quero mudar manualmente o status de um associado para
`suspenso` ou `bloqueado` informando um motivo, para registrar formalmente uma sanção e
retirar a elegibilidade comercial do pescador.

**Why this priority**: É a ação administrativa direta sobre a entidade central do sistema;
sem ela não há controle de elegibilidade.

**Independent Test**: Autenticar como admin, chamar `PATCH /api/associados/:id/status` com
`status=suspenso` e verificar a mudança + o registro em histórico.

**Acceptance Scenarios**:

1. **Given** associado `ativo`, **When** admin altera para `suspenso` sem informar motivo, **Then** retorna 400 "Motivo é obrigatório". *(FR-002)*
2. **Given** associado `ativo`, **When** admin altera para `bloqueado` com motivo "Fraude", **Then** status vira `bloqueado` e o histórico registra a transição. *(FR-003, FR-007)*
3. **Given** status idêntico ao atual, **When** admin reenvia a mesma transição, **Then** o associado é retornado sem duplicar histórico. *(idempotência)*

---

### User Story 2 - Inadimplência automática por débito (Priority: P1)

Como **sistema**, quero rebaixar automaticamente para `inadimplente` o associado que tem
mensalidade vencida e restaurá-lo a `ativo` ao quitar, para que a elegibilidade reflita a
situação financeira sem ação manual.

**Why this priority**: Automatiza a regra de negócio que sustenta o modelo financeiro.

**Independent Test**: Criar mensalidade vencida para um associado ativo e disparar a
sincronização; verificar transição para `inadimplente`.

**Acceptance Scenarios**:

1. **Given** associado `ativo` com mensalidade vencida, **When** a sincronização executa, **Then** status vira `inadimplente` com motivo "Mensalidades em aberto". *(FR-004, FR-007)*
2. **Given** associado `inadimplente` que quita os débitos, **When** a sincronização executa, **Then** status volta a `ativo` com motivo "Regularização financeira". *(FR-005, FR-007)*

---

### User Story 3 - Proteção de estados manuais (Priority: P2)

Como **administrador**, quero que estados `suspenso`/`bloqueado` NÃO sejam sobrescritos pela
sincronização automática, para que uma sanção manual não seja revertida por um pagamento.

**Why this priority**: Garante que a automação não anule decisões administrativas.

**Independent Test**: Colocar associado `suspenso` com mensalidade vencida e rodar a
sincronização; verificar que permanece `suspenso`.

**Acceptance Scenarios**:

1. **Given** associado `suspenso` com débito, **When** a sincronização executa, **Then** permanece `suspenso`. *(FR-006)*
2. **Given** associado `bloqueado` que quita débitos, **When** a sincronização executa, **Then** permanece `bloqueado`. *(FR-006)*

### Edge Cases

- Tentar aprovar loja de associado não-`ativo` → bloqueado (FR-008).
- Ativar permissão de associado não-`ativo` → bloqueado (FR-009).
- Transição para o mesmo status → sem efeito, sem duplicar histórico.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE aceitar apenas os status `ativo`, `suspenso`, `inadimplente`, `bloqueado`.
- **FR-002**: A transição para `suspenso` DEVE ser exclusivamente manual e exigir `motivo` não vazio.
- **FR-003**: A transição para `bloqueado` DEVE ser exclusivamente manual e exigir `motivo` não vazio.
- **FR-004**: A transição `ativo → inadimplente` DEVE ser automática quando houver mensalidade atrasada/vencida sem pagamento.
- **FR-005**: A transição `inadimplente → ativo` DEVE ser automática quando não houver débitos em aberto.
- **FR-006**: Associados `suspenso`/`bloqueado` NÃO DEVEM ser afetados pela sincronização automática.
- **FR-007**: Toda mudança de status DEVE gerar registro em `HistoricoStatusAssociado` (`statusAnterior`, `statusNovo`, `motivo`, `alteradoPor`).
- **FR-008**: Somente associado `ativo` PODE ter loja `aprovada`.
- **FR-009**: Somente associado `ativo` PODE ter permissão com `ativa = true`.

### Key Entities

- **Associado**: pescador; possui `status` e `atualizadoEm`. É o eixo de elegibilidade.
- **HistoricoStatusAssociado**: trilha imutável de transições de status.
- **LogAuditoria**: registro da ação administrativa `alterar_status`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das transições de status geram exatamente um registro de histórico (nunca zero, nunca duplicado).
- **SC-002**: Nenhum associado `suspenso`/`bloqueado` muda de status por efeito da sincronização automática.
- **SC-003**: Nenhuma loja é aprovada ou permissão ativada para associado fora de `ativo`.

## Assumptions

- Transições manuais exigem JWT com `papel = ADMIN`.
- A sincronização automática é sempre invocada após operações de mensalidade (ver `002-inadimplencia-mensalidades`).
