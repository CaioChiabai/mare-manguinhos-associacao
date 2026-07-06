# Research: Fluxo de Aprovação de Loja

**Feature**: 003-aprovacao-loja
**Date**: 2026-07-06
**Scope**: Decisões da máquina de estados da loja e do gate comercial dependente da aprovação.

---

## R-001 — Estado inicial `pendente` por default no banco (FR-001)

**Decision**: `Loja.status` tem `@default("pendente")`; loja criada sem status explícito nasce pendente.

**Rationale**: Nenhuma loja deve operar sem passar pela aprovação administrativa. O default no banco garante o estado seguro mesmo quando a criação vem de origens diferentes (painel, seed).

**Alternatives considered**: Exigir status na criação — rejeitado por permitir criar já `aprovada` sem passar pelo fluxo.

---

## R-002 — Elegibilidade do associado revalidada na criação e na transição (FR-002)

**Decision**: `associado.status === 'ativo'` é checado tanto em `criar()` (quando a loja já nasce/entra em aprovação) quanto em `atualizarStatus()` ao mover para `aprovada`.

**Rationale**: O status do associado pode mudar entre a solicitação e a aprovação. Revalidar no instante da transição fecha a janela em que um associado que ficou inadimplente teria a loja aprovada.

**Alternatives considered**: Checar só na criação — rejeitado por permitir aprovar loja de associado que já não é mais elegível.

---

## R-003 — Gate comercial em profundidade (FR-007/008/009)

**Decision**: Produto (`produtos.servico`), venda (`vendas.servico`) e o cadastro via chatbot (`api-publica`) revalidam independentemente `loja.status === 'aprovada'` **e** `associado.status === 'ativo'` no momento da escrita.

**Rationale**: Defesa em profundidade — cada ponto de escrita comercial protege sua própria invariante e não confia num estado consultado antes. Reflete o Princípio V da constituição.

**Alternatives considered**: Confiar apenas na aprovação registrada — rejeitado porque associado pode ter mudado de status após a aprovação da loja.

---

## R-004 — Campos de decisão explícitos: `dataAprovacao` e `motivoRejeicao` (FR-004/005/006)

**Decision**: Aprovar preenche `dataAprovacao`; rejeitar exige e persiste `motivoRejeicao` e mantém `dataAprovacao = null`; reverter de `aprovada` zera `dataAprovacao`.

**Rationale**: A decisão administrativa precisa ser auditável e reversível. `dataAprovacao` funciona como flag temporal de "está operando"; `motivoRejeicao` documenta a negativa.

**Alternatives considered**: Guardar só o status sem datas/motivo — rejeitado por perder rastreabilidade da decisão (viola SC-003).

---

## R-005 — Sem estado "excluída"; loja é deletada diretamente

**Decision**: Não há status `excluida`; remoção é `DELETE` físico. Reaprovação de loja `suspensa`/`rejeitada` é feita voltando o status para `pendente`/`aprovada`.

**Rationale**: Simplifica a máquina de estados ao mínimo necessário ao negócio (pendente/aprovada/rejeitada/suspensa). Soft-delete não traz valor no MVP.

**Alternatives considered**: Soft-delete com `excluida` — adiado; adicionaria um estado sem requisito que o justifique hoje.
