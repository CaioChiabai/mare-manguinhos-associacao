# Feature Specification: Inadimplência Automática por Mensalidades

**Feature Branch**: `002-inadimplencia-mensalidades`
**Created**: 2026-07-06
**Status**: Implementada
**Input**: O sistema controla automaticamente a inadimplência do associado a partir do estado das suas mensalidades. Complemento operacional de `001-ciclo-vida-associado` — descreve *como* as transições automáticas ocorrem.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar mensalidade e sincronizar status (Priority: P1)

Como **administrador financeiro**, quero cadastrar mensalidades e registrar pagamentos, e que
o status do associado seja recalculado automaticamente a cada operação, para não precisar
atualizar elegibilidade manualmente.

**Why this priority**: É o motor financeiro que alimenta a máquina de estados do associado.

**Independent Test**: Criar mensalidade vencida e verificar que o associado vira `inadimplente`;
registrar pagamento e verificar retorno a `ativo`.

**Acceptance Scenarios**:

1. **Given** associado `ativo` sem mensalidades, **When** uma mensalidade vencida ontem é criada, **Then** o associado passa a `inadimplente`. *(FR-001, FR-003, FR-004)*
2. **Given** associado `inadimplente` com única mensalidade atrasada, **When** o pagamento é registrado, **Then** o associado volta a `ativo`. *(FR-001, FR-005)*
3. **Given** associado `suspenso` com mensalidade vencida, **When** a sincronização executa, **Then** permanece `suspenso`. *(FR-006)*

---

### User Story 2 - Cálculo determinístico do status da mensalidade (Priority: P2)

Como **sistema**, quero derivar o status de cada mensalidade de forma determinística a partir
de `dataPagamento` e `dataVencimento`, para que "pago/pendente/atrasado" seja sempre coerente.

**Why this priority**: Base de cálculo da inadimplência; precisa ser previsível.

**Independent Test**: Chamar a função de cálculo com combinações de datas e conferir o status.

**Acceptance Scenarios**:

1. **Given** mensalidade sem pagamento e vencimento no futuro, **Then** status = `pendente`. *(FR-002)*
2. **Given** mensalidade sem pagamento e vencimento no passado, **Then** status = `atrasado`. *(FR-002)*
3. **Given** mensalidade com `dataPagamento` preenchida, **Then** status = `pago` independente do vencimento. *(FR-002)*

---

### User Story 3 - Correção de atrasos em lote (Priority: P3)

Como **administrador**, quero um gatilho que sincronize todos os associados com mensalidades
vencidas de uma vez, para corrigir atrasos acumulados entre operações individuais.

**Independent Test**: `POST /api/dashboard/sincronizar-atrasos` e conferir os status atualizados.

**Acceptance Scenarios**:

1. **Given** vários associados com vencimentos passados, **When** a sincronização em lote roda, **Then** todos os status de mensalidade e associado ficam consistentes. *(FR-009)*

### Edge Cases

- Segunda mensalidade para a mesma `(associadoId, competencia)` → 409 (FR-008).
- Exclusão de mensalidade também dispara a sincronização (FR-001).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda operação sobre mensalidade (criar/atualizar/pagar/excluir) DEVE disparar a sincronização do status do associado afetado.
- **FR-002**: O status da mensalidade DEVE ser: `pago` (se `dataPagamento`), senão `atrasado` (se vencida), senão `pendente`.
- **FR-003**: A sincronização DEVE considerar inadimplente quem tiver mensalidade `atrasado`, ou `pendente` já vencida.
- **FR-004**: Se inadimplente, o status do associado DEVE virar `inadimplente` (exceto protegidos — ver `001` FR-006).
- **FR-005**: Se sem débitos, o status DEVE virar `ativo` (exceto protegidos).
- **FR-006**: A sincronização NÃO DEVE alterar associados `suspenso`/`bloqueado`.
- **FR-007**: Mudança por inadimplência DEVE gerar histórico com motivo fixo ("Mensalidades em aberto" / "Regularização financeira").
- **FR-008**: A combinação `(associadoId, competencia)` DEVE ser única.
- **FR-009**: DEVE existir sincronização em lote via `POST /api/dashboard/sincronizar-atrasos`.

### Key Entities

- **Mensalidade**: `competencia`, `valor`, `dataVencimento`, `dataPagamento`, `status`.
- **Associado**: recebe o efeito colateral da sincronização.
- **HistoricoStatusAssociado**: registra a transição quando (e só quando) há mudança.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhum associado com débito vencido permanece `ativo` após qualquer operação de mensalidade.
- **SC-002**: Nenhuma competência duplicada é aceita.
- **SC-003**: Histórico é criado se e somente se houve mudança real de status.

## Assumptions

- "Agora" é o instante do servidor no momento da sincronização.
- A sincronização em lote é acionada manualmente ou pelo dashboard; não há cron dedicado.
