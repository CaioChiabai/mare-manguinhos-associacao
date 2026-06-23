# SPEC-002 — Inadimplência Automática por Mensalidades

**Domínio:** Mensalidade, Associado, HistoricoStatusAssociado  
**Status:** ativo

---

## Objetivo

O sistema controla automaticamente se um associado é inadimplente com base no estado das suas mensalidades.  
Esta spec descreve o mecanismo de sincronização, as regras de cálculo de status de mensalidade e os efeitos colaterais sobre o associado.  
É o complemento operacional de [SPEC-001](SPEC-001-ciclo-vida-associado.md) — descreve *como* as transições R004/R005 ocorrem.

---

## Regras de Negócio

**R001** — Toda operação que modifica mensalidades (criar, atualizar, registrar pagamento, excluir) dispara `sincronizarStatusAssociado` para o `associadoId` afetado.

**R002** — O status automático de uma mensalidade segue a lógica:
- Se `dataPagamento` preenchida → `pago`
- Se `dataVencimento < agora` e sem pagamento → `atrasado`
- Caso contrário → `pendente`

**R003** — `sincronizarStatusAssociado` considera o associado inadimplente se existir ao menos uma mensalidade com:
- `status = "atrasado"`, ou
- `status = "pendente"` e `dataVencimento < agora`

**R004** — Se inadimplente, o status do associado é alterado para `inadimplente` (exceto se já for `suspenso` ou `bloqueado` — ver [SPEC-001 R006](SPEC-001-ciclo-vida-associado.md)).

**R005** — Se não inadimplente, o status do associado é alterado para `ativo` (exceto se `suspenso` ou `bloqueado`).

**R006** — A sincronização **não altera** associados com status `suspenso` ou `bloqueado`.

**R007** — Toda mudança de status por inadimplência gera registro em `HistoricoStatusAssociado` com motivo fixo:
- `inadimplente` → "Mensalidades em aberto"
- `ativo` → "Regularização financeira"

**R008** — A combinação `(associadoId, competencia)` é única. Não é possível criar duas mensalidades para o mesmo associado na mesma competência.

**R009** — O endpoint `POST /api/dashboard/sincronizar-atrasos` executa a sincronização em lote para todos os associados com mensalidades vencidas. É o mecanismo de correção de atrasos acumulados entre chamadas individuais.

---

## Pré-condições

- O associado existe no banco.
- A mensalidade sendo criada/alterada pertence a esse associado.
- Para `sincronizarAtrasos`: existir mensalidades com `dataVencimento` no passado e `status != "pago"`.

---

## Pós-condições

Após qualquer operação de mensalidade:

- O `status` do associado reflete corretamente se há ou não débitos.
- Um registro em `HistoricoStatusAssociado` foi criado **se e somente se** houve mudança de status.
- O log de auditoria registra a operação sobre a mensalidade.

---

## Casos de Aceitação

**AC-001** | Dado associado `ativo` sem mensalidades, quando mensalidade vencida ontem é criada → então após `sincronizarStatusAssociado`, associado vira `inadimplente`. *(valida R001, R003, R004)*

**AC-002** | Dado associado `inadimplente` com única mensalidade `atrasada`, quando pagamento é registrado → então `sincronizarStatusAssociado` não encontra débitos e associado volta para `ativo`. *(valida R001, R005)*

**AC-003** | Dado associado `suspenso` com mensalidade vencida, quando `sincronizarStatusAssociado` executa → então status permanece `suspenso`. *(valida R006)*

**AC-004** | Dado mensalidade sem `dataPagamento` e `dataVencimento` no futuro → status calculado = `pendente`. *(valida R002)*

**AC-005** | Dado mensalidade sem `dataPagamento` e `dataVencimento` no passado → status calculado = `atrasado`. *(valida R002)*

**AC-006** | Dado mensalidade com `dataPagamento` preenchida → status calculado = `pago`, independente da data de vencimento. *(valida R002)*

**AC-007** | Dado associado com competência `2025-01` já cadastrada, quando segunda mensalidade para mesma competência é enviada → então retorna erro 409 "Já existe mensalidade para esta competência". *(valida R008)*

**AC-008** | Dado `POST /api/dashboard/sincronizar-atrasos`, quando executado → então todas as mensalidades com vencimento passado têm status atualizado e associados inadimplentes são sincronizados. *(valida R009)*

---

## Rastreabilidade

**Serviços**
- `backend/src/modulos/mensalidades/mensalidades.servico.ts`
  - `criar()` → chama `sincronizarStatusAssociado`
  - `atualizar()` → chama `sincronizarStatusAssociado`
  - `registrarPagamento()` → chama `sincronizarStatusAssociado`
  - `excluir()` → chama `sincronizarStatusAssociado`
  - `sincronizarAtrasos()` → sincronização em lote
  - `sincronizarStatusAssociado()` *(função privada — eixo desta spec)*
  - `obterStatusAutomatico()` *(função privada — implementa R002)*

**Endpoints**
- `POST /api/mensalidades`
- `PUT /api/mensalidades/:id`
- `PATCH /api/mensalidades/:id/pagamento`
- `DELETE /api/mensalidades/:id`
- `POST /api/dashboard/sincronizar-atrasos`

**Entidades Prisma**
- `Mensalidade` (`status`, `dataVencimento`, `dataPagamento`, `competencia`)
- `Associado` (`status`)
- `HistoricoStatusAssociado`

**Schemas de validação**
- `backend/src/modulos/mensalidades/mensalidades.esquemas.ts`

**Testes**
- `backend/src/__tests__/SPEC-002-inadimplencia.test.ts`

**Docs relacionados**
- [`SPEC-001`](SPEC-001-ciclo-vida-associado.md) — define os estados do associado e a regra de proteção para suspenso/bloqueado
- [`docs/ARQUITETURA.md`](../ARQUITETURA.md) — seção "Mensalidades"
