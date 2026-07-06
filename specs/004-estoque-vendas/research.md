# Research: Controle Transacional de Estoque em Vendas

**Feature**: 004-estoque-vendas
**Date**: 2026-07-06
**Scope**: Decisões de atomicidade e concorrência do ajuste de estoque nas vendas.

---

## R-001 — Venda + ajuste de estoque na mesma `prisma.$transaction` (FR-006/007)

**Decision**: A criação/transição da venda e o `updateMany` de `pesoDisponivel` de cada item ocorrem numa única `prisma.$transaction`. Estoque insuficiente em qualquer item aborta a transação inteira.

**Rationale**: Garante SC-001 (nunca há venda persistida sem o ajuste correspondente) e SC-002 (estoque nunca negativo). Sem transação, uma falha parcial deixaria venda registrada com estoque errado.

**Alternatives considered**: Ajustar estoque em passo separado após criar a venda — rejeitado por permitir estado intermediário inconsistente em caso de falha.

---

## R-002 — Optimistic locking via `updateMany` com estado no filtro (FR-009)

**Decision**: Transições de status usam `updateMany({ where: { id, status: <esperado> }, ... })`. Se `count === 0`, a venda já mudou → `ErroConflito` (409). O mesmo padrão de filtro por peso (`pesoDisponivel >= pesoKg`) protege o decremento.

**Rationale**: Concorrência sem locks pessimistas nem transações longas. Duas operações simultâneas sobre a mesma venda: a segunda encontra `count = 0` e falha limpa, sem corromper o estoque (SC-003).

**Alternatives considered**: `SELECT ... FOR UPDATE` — rejeitado por acoplar a lógica ao driver e segurar linhas por mais tempo; `updateMany` condicional é o padrão de referência do projeto (reusado em `[[006-pedidos-app-delivery]]`).

---

## R-003 — Estoque só se move quando a venda está `concluida` (FR-001/002/003/004)

**Decision**: Venda `pendente` não toca estoque. Decremento ocorre ao entrar em `concluida` (na criação já concluída ou na transição `pendente → concluida`); estorno ocorre em `concluida → cancelada`.

**Rationale**: O estoque físico só é comprometido quando a venda de fato se efetiva. Isso mantém `pesoDisponivel` sempre alinhado às vendas realmente concretizadas.

**Alternatives considered**: Reservar estoque já na `pendente` — rejeitado por travar estoque de vendas que podem nunca se concluir.

---

## R-004 — `cancelada` é estado terminal (FR-005)

**Decision**: Qualquer transição a partir de `cancelada` é rejeitada (`updateMany` filtra o status atual → `count = 0` → `ErroConflito`).

**Rationale**: Evita re-decrementar/re-estornar estoque de uma venda já encerrada. Cancelamento é definitivo.

**Alternatives considered**: Permitir reabrir cancelada — rejeitado por complicar o balanço de estoque sem requisito de negócio.

---

## R-005 — Total calculado no backend (FR-008)

**Decision**: O `total` da venda é `Σ (precoPorKg × pesoKg)` calculado no servidor; qualquer valor de total enviado pelo cliente é ignorado.

**Rationale**: Impede adulteração de preço pelo cliente. O preço é sempre o do banco no momento da venda.

**Alternatives considered**: Confiar no total do cliente com validação — rejeitado; recalcular é mais simples e mais seguro.

---

## R-006 — Produtos inativos não movimentam estoque (FR-010)

**Decision**: O `updateMany` de decremento inclui `ativo: true` no filtro; produto desativado não tem estoque abatido e a venda do item falha.

**Rationale**: Um produto retirado do catálogo não deve ser vendido nem ter estoque alterado.

**Alternatives considered**: Checar `ativo` em passo anterior — rejeitado por abrir janela de corrida entre a checagem e o decremento; o filtro no `updateMany` é atômico.
