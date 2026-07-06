# Research: Ciclo de Vida do Status do Associado

**Feature**: 001-ciclo-vida-associado
**Date**: 2026-07-06
**Scope**: Registrar as decisões técnicas que sustentam a máquina de estados do associado antes da implementação.

---

## R-001 — Modelagem da máquina de estados como string validada por Zod

**Decision**: Representar `status` como `String` no Prisma, validado na borda por um enum Zod (`statusAssociado = z.enum(['ativo','suspenso','inadimplente','bloqueado'])`) em `associados.esquemas.ts`.

**Rationale**: O projeto usa PostgreSQL via Prisma, mas evita `enum` nativo do banco para não exigir migração a cada novo estado. A validação estrita fica no schema Zod (constituição — Princípio II), garantindo que apenas os 4 estados de FR-001 cheguem ao serviço.

**Alternatives considered**: `enum` nativo do PostgreSQL — rejeitado por acoplar mudança de domínio a migração de schema e dificultar seeds/testes.

---

## R-002 — Separação entre transições manuais e automáticas

**Decision**: Transições `suspenso`/`bloqueado` vivem no `associados.servico.ts` (ação de admin, exigem `motivo`); transições `ativo ↔ inadimplente` vivem no `mensalidades.servico.ts` (efeito colateral da sincronização financeira).

**Rationale**: Cada tipo de transição tem um gatilho e dono distintos. Manter a sincronização automática dentro do módulo que já conhece o estado financeiro (mensalidades) evita dependência circular e mantém um único ponto de verdade para inadimplência (ver `[[002-inadimplencia-mensalidades]]`).

**Alternatives considered**: Centralizar toda transição num "serviço de status" único — rejeitado por criar uma abstração sem ganho (FR manuais e automáticas não compartilham lógica além do registro de histórico).

---

## R-003 — Proteção de estados manuais contra a automação (FR-006)

**Decision**: A sincronização automática só atua sobre associados em `ativo` ou `inadimplente`; `suspenso`/`bloqueado` são explicitamente ignorados por um guard no início de `sincronizarStatusAssociado()`.

**Rationale**: Uma sanção administrativa (suspensão/bloqueio) não pode ser revertida por um evento financeiro (pagamento). Sem esse guard, quitar um débito reativaria um associado suspenso, anulando a decisão do admin.

**Alternatives considered**: Prioridade numérica entre estados — rejeitado por ser menos legível que um guard explícito de dois estados protegidos.

---

## R-004 — Histórico imutável apenas em mudança real (FR-007, idempotência)

**Decision**: `HistoricoStatusAssociado` recebe um registro **se e somente se** `statusAnterior !== statusNovo`. Reenviar a mesma transição retorna o associado sem gravar histórico.

**Rationale**: Garante SC-001 (exatamente um registro por transição, nunca duplicado) e torna a operação idempotente — segura para retries de rede e para a sincronização em lote que roda repetidamente.

**Alternatives considered**: Gravar histórico em toda chamada — rejeitado por poluir a trilha e violar SC-001.

---

## R-005 — Elegibilidade comercial como pré-condição consultada (FR-008/009)

**Decision**: Loja (`aprovada`) e Permissão (`ativa`) validam `associado.status === 'ativo'` no momento da escrita, consultando o estado atual — não confiam em cache nem em flag denormalizada.

**Rationale**: Defesa em profundidade. O status do associado é a fonte da verdade; revalidar na escrita de loja/permissão impede janelas de inconsistência entre a mudança de status e a operação comercial.

**Alternatives considered**: Denormalizar `elegivel: boolean` no associado — rejeitado por introduzir estado derivado que pode divergir da fonte.
