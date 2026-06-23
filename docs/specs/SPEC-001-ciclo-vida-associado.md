# SPEC-001 — Ciclo de Vida do Status do Associado

**Domínio:** Associado, HistoricoStatusAssociado  
**Status:** ativo

---

## Objetivo

O status do associado é o eixo central de elegibilidade do sistema.  
Ele controla se o pescador pode ter loja aprovada, permissão ativa e participar do ciclo comercial.  
Esta spec descreve os estados possíveis, as transições válidas e as regras de guarda de cada transição.

---

## Máquina de Estados

```
                   ┌─────────────────────────────────┐
                   │                                 │
        manual     ▼          automático             │ automático
ativo ─────────► suspenso     (mensalidades)         │ (quitação)
  │                                                  │
  │    manual                                        │
  ├──────────► bloqueado                             │
  │                                                  │
  │    automático                                    │
  └──────────► inadimplente ───────────────────────►─┘
               (mensalidade                  (sem débitos)
                vencida)
```

Nota: `suspenso` e `bloqueado` são **estados protegidos** — a sincronização automática de inadimplência não os altera.

---

## Regras de Negócio

**R001** — Os únicos status válidos são: `ativo`, `suspenso`, `inadimplente`, `bloqueado`.

**R002** — A transição para `suspenso` é exclusivamente manual e exige `motivo` preenchido e não vazio.

**R003** — A transição para `bloqueado` é exclusivamente manual e exige `motivo` preenchido e não vazio.

**R004** — A transição de `ativo` → `inadimplente` é automática, disparada por `sincronizarStatusAssociado` quando há mensalidade atrasada ou vencida sem pagamento.

**R005** — A transição de `inadimplente` → `ativo` é automática, disparada por `sincronizarStatusAssociado` quando não há mais débitos em aberto.

**R006** — Associados com status `suspenso` ou `bloqueado` **não** são afetados pela sincronização automática de inadimplência. O status permanece inalterado mesmo que haja ou deixe de haver débitos.

**R007** — Toda mudança de status gera um registro em `HistoricoStatusAssociado` com os campos: `statusAnterior`, `statusNovo`, `motivo` e `alteradoPor`.

**R008** — Somente associado `ativo` pode ter loja com status `aprovada`.

**R009** — Somente associado `ativo` pode ter permissão com `ativa = true`.

---

## Pré-condições

- O associado já existe no banco (`id` válido).
- Para transições manuais: usuário admin autenticado (JWT com `papel = ADMIN`).
- Para transições automáticas: `sincronizarStatusAssociado` é invocado após operação de mensalidade.

---

## Pós-condições

- O campo `status` da entidade `Associado` reflete o novo estado.
- Um registro foi criado em `HistoricoStatusAssociado`.
- O log de auditoria registra a ação `alterar_status` com `{ de, para, motivo }`.

---

## Casos de Aceitação

**AC-001** | Dado associado `ativo`, quando admin altera para `suspenso` sem informar motivo → então retorna erro 400 com mensagem "Motivo é obrigatório". *(valida R002)*

**AC-002** | Dado associado `ativo`, quando admin altera para `bloqueado` com motivo "Fraude" → então status muda para `bloqueado` e histórico registra a transição. *(valida R003, R007)*

**AC-003** | Dado associado `ativo` com mensalidade vencida, quando `sincronizarStatusAssociado` executa → então status muda para `inadimplente` e histórico registra motivo "Mensalidades em aberto". *(valida R004, R007)*

**AC-004** | Dado associado `inadimplente` que quita todos os débitos, quando `sincronizarStatusAssociado` executa → então status muda para `ativo` e histórico registra motivo "Regularização financeira". *(valida R005, R007)*

**AC-005** | Dado associado `suspenso` com mensalidade vencida, quando `sincronizarStatusAssociado` executa → então status permanece `suspenso`. *(valida R006)*

**AC-006** | Dado associado `bloqueado` que quita todos os débitos, quando `sincronizarStatusAssociado` executa → então status permanece `bloqueado`. *(valida R006)*

**AC-007** | Dado associado `inadimplente`, quando admin tenta aprovar uma loja desse associado → então retorna erro 409 "Somente associados ativos podem ter lojas aprovadas". *(valida R008)*

**AC-008** | Dado status idêntico ao atual, quando admin envia a mesma transição → então o sistema retorna o associado sem alterar nem duplicar histórico. *(guarda de idempotência)*

---

## Rastreabilidade

**Serviços**
- `backend/src/modulos/associados/associados.servico.ts` → `alterarStatus()`
- `backend/src/modulos/mensalidades/mensalidades.servico.ts` → `sincronizarStatusAssociado()` (privada)
- `backend/src/modulos/lojas/lojas.servico.ts` → `atualizarStatus()` *(valida R008)*
- `backend/src/modulos/permissoes/permissoes.servico.ts` → `criar()`, `alternar()` *(valida R009)*

**Endpoints**
- `PATCH /api/associados/:id/status`
- `POST /api/mensalidades` → dispara sincronização indireta
- `PATCH /api/mensalidades/:id/pagamento` → dispara sincronização indireta
- `POST /api/dashboard/sincronizar-atrasos` → dispara sincronização em lote

**Entidades Prisma**
- `Associado` (`status`, `atualizadoEm`)
- `HistoricoStatusAssociado`
- `LogAuditoria`

**Schemas de validação**
- `backend/src/modulos/associados/associados.esquemas.ts` → `statusAssociado`, `esquemaAlterarStatus`

**Testes**
- `backend/src/__tests__/SPEC-001-validacao-associado.test.ts`

**Docs relacionados**
- [`docs/ARQUITETURA.md`](../ARQUITETURA.md) — seção "Status do associado"
- [`SPEC-002`](SPEC-002-inadimplencia-mensalidades.md) — mecanismo que dispara R004/R005
