# Research: Inadimplência Automática por Mensalidades

**Feature**: 002-inadimplencia-mensalidades
**Date**: 2026-07-06
**Scope**: Decisões que sustentam o motor financeiro que alimenta a máquina de estados de `[[001-ciclo-vida-associado]]`.

---

## R-001 — Status da mensalidade derivado, não armazenado como verdade

**Decision**: O status de negócio (`pago`/`atrasado`/`pendente`) é derivado por `obterStatusAutomatico()` a partir de `dataPagamento` e `dataVencimento` a cada operação; o campo `status` no banco é um cache recalculado, nunca editado à mão.

**Rationale**: Torna "pago/pendente/atrasado" determinístico e coerente (FR-002). Datas são a fonte da verdade; um campo livremente editável divergiria da realidade.

**Alternatives considered**: Deixar o cliente enviar o `status` — rejeitado por permitir inconsistência entre datas e rótulo.

---

## R-002 — Sincronização disparada por toda operação de escrita (FR-001)

**Decision**: `criar`, `atualizar`, `registrarPagamento` e `excluir` chamam `sincronizarStatusAssociado(associadoId)` ao final, dentro do mesmo fluxo.

**Rationale**: Um único ponto de verdade para inadimplência: qualquer mudança no conjunto de mensalidades recalcula o status do associado imediatamente, sem depender de job externo.

**Alternatives considered**: Recalcular só num cron noturno — rejeitado por deixar a elegibilidade defasada entre o evento e o job.

---

## R-003 — Sincronização idempotente e respeitando estados protegidos

**Decision**: `sincronizarStatusAssociado()` só transita entre `ativo` e `inadimplente`; retorna cedo para `suspenso`/`bloqueado` (FR-006) e só grava histórico quando o status muda de fato (herda a idempotência de `[[001-ciclo-vida-associado]]`).

**Rationale**: Garante que rodar a sincronização N vezes produza o mesmo resultado que rodar uma vez, e que a automação nunca sobrescreva uma sanção manual.

**Alternatives considered**: Sempre reescrever o status — rejeitado por gerar histórico redundante (viola SC-003).

---

## R-004 — Unicidade `(associadoId, competencia)` no banco (FR-008)

**Decision**: Constraint `@@unique([associadoId, competencia])` no modelo `Mensalidade`; violação vira `ErroConflito` (409) no `tratador-erros.ts`.

**Rationale**: Impede duas cobranças para o mesmo mês/associado na origem (banco), não apenas na aplicação — a garantia mais forte possível contra duplicidade.

**Alternatives considered**: Checar duplicidade só na aplicação — rejeitado por abrir corrida entre duas criações simultâneas.

---

## R-005 — Sincronização em lote sem cron dedicado (FR-009)

**Decision**: Expor `POST /api/dashboard/sincronizar-atrasos`, que percorre associados com vencimentos passados e chama a sincronização individual. Acionado pelo dashboard ou por sistemas externos (ex.: antes do cadastro via chatbot em `[[005-api-publica-chatbot]]`).

**Rationale**: Corrige atrasos acumulados que "amadurecem" com o tempo (uma mensalidade pendente vira atrasada só quando a data passa) sem introduzir infraestrutura de agendamento no MVP.

**Alternatives considered**: Cron/worker dedicado — adiado; seria complexidade de infraestrutura desnecessária enquanto o gatilho manual/dashboard atende o volume atual.
