# SPEC-003 — Fluxo de Aprovação de Loja

**Domínio:** Loja, Associado, Produto, Venda  
**Status:** ativo

---

## Objetivo

Cada pescador pode ter uma ou mais lojas virtuais para comercializar seus produtos.  
As lojas passam por um fluxo de aprovação administrativa antes de poderem operar.  
Esta spec descreve os estados possíveis, as transições, as validações e as restrições que dependem do status da loja.

---

## Máquina de Estados

```
criação
  │
  ▼
pendente ──── aprovada ──► (operacional: produtos e vendas habilitados)
  │        ▲
  │        │ reativar (implícito via atualizar status)
  ▼        │
rejeitada  suspensa
```

- Uma loja **rejeitada** pode ser resubmetida (update para `pendente` novamente).
- Uma loja **suspensa** pode ser reaprovada se o associado estiver `ativo`.
- Não existe estado `excluída` — lojas são deletadas diretamente.

---

## Regras de Negócio

**R001** — Loja criada sem status explícito recebe `pendente` como padrão.

**R002** — Loja só pode ter status `aprovada` se o associado vinculado estiver `ativo`. Essa regra é verificada tanto na **criação** (se enviado `status = "aprovada"`) quanto na **mudança de status**.

**R003** — A transição para `rejeitada` exige campo `motivoRejeicao` preenchido e não vazio.

**R004** — Ao aprovar uma loja (`status → "aprovada"`), o campo `dataAprovacao` é registrado automaticamente com o timestamp atual.

**R005** — Ao rejeitar uma loja, `motivoRejeicao` é persistido; `dataAprovacao` é nula.

**R006** — Ao reverter de `aprovada` para outro status, `dataAprovacao` é zerada (`null`).

**R007** — Produto só pode ser cadastrado em loja com `status = "aprovada"` cujo associado tenha `status = "ativo"`.

**R008** — Venda só pode ser registrada em loja com `status = "aprovada"` cujo associado tenha `status = "ativo"`.

**R009** — O chatbot WhatsApp só pode cadastrar produto se a loja estiver `aprovada` (verificado via `/api/publico/pescador/telefone/:tel/produto`).

---

## Pré-condições

- O associado referenciado existe no banco (`associadoId` válido).
- Para aprovação: associado deve estar `ativo`.
- Para rejeição: `motivoRejeicao` deve ser fornecido.

---

## Pós-condições

- O campo `status` da loja reflete o novo estado.
- `dataAprovacao` é preenchida ao aprovar e zerada ao reverter.
- `motivoRejeicao` é preenchido ao rejeitar e zerado em outras transições.
- O log de auditoria registra a ação com `{ de, para, motivoRejeicao }`.

---

## Casos de Aceitação

**AC-001** | Dado loja `pendente` de associado `ativo`, quando admin aprova → então status muda para `aprovada` e `dataAprovacao` é preenchida. *(valida R002, R004)*

**AC-002** | Dado loja `pendente` de associado `inadimplente`, quando admin tenta aprovar → então retorna erro 409 "Somente associados ativos podem ter lojas aprovadas". *(valida R002)*

**AC-003** | Dado loja `pendente`, quando admin rejeita sem informar `motivoRejeicao` → então retorna erro 400. *(valida R003)*

**AC-004** | Dado loja `pendente`, quando admin rejeita com motivo "Documentação incompleta" → então status muda para `rejeitada`, `motivoRejeicao` é persistido e `dataAprovacao` permanece nula. *(valida R003, R005)*

**AC-005** | Dado loja `aprovada`, quando admin suspende → então status muda para `suspensa` e `dataAprovacao` é zerada. *(valida R006)*

**AC-006** | Dado loja `aprovada` e associado `ativo`, quando cadastro de produto é solicitado → então produto é criado com sucesso. *(valida R007)*

**AC-007** | Dado loja `pendente`, quando cadastro de produto é solicitado → então retorna erro 409 "Somente lojas aprovadas de associados ativos podem cadastrar produtos". *(valida R007)*

**AC-008** | Dado loja `aprovada` de associado `ativo`, quando venda é registrada → então venda é criada. *(valida R008)*

**AC-009** | Criação de loja sem campo `status` explícito → loja criada com status `pendente`. *(valida R001)*

---

## Rastreabilidade

**Serviços**
- `backend/src/modulos/lojas/lojas.servico.ts`
  - `criar()` → valida R002 na criação
  - `atualizarStatus()` → valida R002, R003, R004, R005, R006
- `backend/src/modulos/produtos/produtos.servico.ts`
  - `criar()` → valida R007
- `backend/src/modulos/vendas/vendas.servico.ts`
  - `criar()` → valida R008
- `backend/src/modulos/api-publica/api-publica.rotas.ts`
  - `POST /api/publico/pescador/telefone/:tel/produto` → valida R009

**Endpoints**
- `POST /api/lojas`
- `PATCH /api/lojas/:id/status`
- `POST /api/produtos`
- `POST /api/vendas`

**Entidades Prisma**
- `Loja` (`status`, `dataAprovacao`, `motivoRejeicao`, `associadoId`)
- `Associado` (`status`)
- `Produto` (`lojaId`)
- `Venda` (`lojaId`)

**Schemas de validação**
- `backend/src/modulos/lojas/lojas.esquemas.ts` → `esquemaCriarLoja`, `esquemaAtualizarStatusLoja`

**Testes**
- `backend/src/__tests__/SPEC-003-aprovacao-loja.test.ts` *(requer mock de Prisma)*

**Docs relacionados**
- [`SPEC-001`](SPEC-001-ciclo-vida-associado.md) — status do associado é pré-condição para aprovação
- [`SPEC-004`](SPEC-004-estoque-vendas.md) — loja aprovada é pré-condição para vendas
- [`SPEC-005`](SPEC-005-api-publica-chatbot.md) — chatbot depende de loja aprovada (R009)
