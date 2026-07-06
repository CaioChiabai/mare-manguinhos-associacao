# Data Model: Fluxo de Aprovação de Loja

**Feature**: 003-aprovacao-loja
**Date**: 2026-07-06
**Source**: `spec.md` (Key Entities) + `backend/prisma/schema.prisma`

---

## `Loja` (existente)

```prisma
model Loja {
  id              String    @id @default(uuid())
  associadoId     String
  nomeLoja        String
  descricao       String
  status          String    @default("pendente")  // pendente | aprovada | rejeitada | suspensa
  dataSolicitacao DateTime  @default(now())
  dataAprovacao   DateTime?
  motivoRejeicao  String?
  atualizadoEm    DateTime  @updatedAt
  associado       Associado @relation(fields: [associadoId], references: [id], onDelete: Cascade)
  produtos        Produto[]
  vendas          Venda[]
}
```

**Máquina de estados**:

```text
             (admin, associado ativo)        (admin)
   pendente ──────────────────────► aprovada ──────► suspensa
      │  ▲                              │  ▲             │
      │  └──(resubmete)── rejeitada     │  └─────────────┘ (reaprova, associado ativo)
      │                      ▲          │
      └──(admin + motivo)────┘          └──(reverte, zera dataAprovacao)
```

| Estado | dataAprovacao | motivoRejeicao | Pode vender? |
|---|---|---|---|
| `pendente` | null | null | Não |
| `aprovada` | preenchida (FR-004) | null | Sim (se associado `ativo`) |
| `rejeitada` | null (FR-005) | obrigatório (FR-003) | Não |
| `suspensa` | null (zerada, FR-006) | — | Não |

**Invariantes**:

- `aprovada` só é atingível se `associado.status === 'ativo'` (FR-002) — checado na criação e na transição.
- Transição para `rejeitada` exige `motivoRejeicao` não-vazio (FR-003).
- Loja sem status explícito nasce `pendente` (FR-001).

---

## `Associado` (existente) — pré-condição de elegibilidade

Leitura de `status` como gate (`= 'ativo'`); não é alterado por esta feature. Ver `[[001-ciclo-vida-associado]]`.

---

## `Produto` / `Venda` (existentes) — dependem da loja aprovada

O gate comercial lê `Loja.status` e `Associado.status` antes de qualquer escrita:

| Escrita | Pré-condição | Falha |
|---|---|---|
| Criar `Produto` | loja `aprovada` + associado `ativo` (FR-007) | `409` |
| Registrar `Venda` | loja `aprovada` + associado `ativo` (FR-008) | `409` |
| Cadastro via chatbot | loja `aprovada` (FR-009) | `409/403` — ver `[[005-api-publica-chatbot]]` |

Detalhe transacional das vendas em `[[004-estoque-vendas]]`.

---

## Mapeamento FR → dado

| Regra | Elemento |
|---|---|
| FR-001 | `@default("pendente")` |
| FR-002 | gate `associado.status='ativo'` na criação/transição |
| FR-003 | `motivoRejeicao` obrigatório |
| FR-004 | `dataAprovacao = now()` |
| FR-005 | `motivoRejeicao` persistido, `dataAprovacao` null |
| FR-006 | `dataAprovacao = null` ao reverter |
| FR-007..009 | gate em produto/venda/chatbot |
