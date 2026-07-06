# Data Model: Inadimplência Automática por Mensalidades

**Feature**: 002-inadimplencia-mensalidades
**Date**: 2026-07-06
**Source**: `spec.md` (Key Entities) + `backend/prisma/schema.prisma`

---

## `Mensalidade` (existente)

```prisma
model Mensalidade {
  id             String    @id @default(uuid())
  associadoId    String
  competencia    String    // "AAAA-MM"
  valor          Float
  dataVencimento DateTime
  dataPagamento  DateTime?
  status         String    @default("pendente")  // pago | atrasado | pendente (cache derivado)
  criadoEm       DateTime  @default(now())
  atualizadoEm   DateTime  @updatedAt
  associado      Associado @relation(fields: [associadoId], references: [id], onDelete: Cascade)

  @@unique([associadoId, competencia])   // FR-008
}
```

**Derivação do `status`** (FR-002, função `obterStatusAutomatico`):

```text
se dataPagamento != null            → "pago"
senão se dataVencimento < agora     → "atrasado"
senão                               → "pendente"
```

| Situação | dataPagamento | dataVencimento | status |
|---|---|---|---|
| Quitada | preenchida | qualquer | `pago` |
| Em dia | null | futuro | `pendente` |
| Vencida | null | passado | `atrasado` |

**Invariantes**:

- `status` é sempre recalculado; nunca recebido do cliente (R-001).
- `(associadoId, competencia)` é único (FR-008) — segunda inserção → 409.

---

## `Associado` (existente) — recebe o efeito da sincronização

Só o campo `status` é afetado por esta feature. Regra de recálculo (`sincronizarStatusAssociado`):

```text
protegido (suspenso|bloqueado)?  → não altera            (FR-006)
tem mensalidade atrasada OU pendente-já-vencida?
   sim → status = "inadimplente"  (motivo: "Mensalidades em aberto")   (FR-003/004)
   não → status = "ativo"         (motivo: "Regularização financeira") (FR-005)
grava histórico apenas se status mudou                                  (FR-007)
```

Detalhe da máquina de estados em `[[001-ciclo-vida-associado]]` › data-model.

---

## `HistoricoStatusAssociado` (existente)

Recebe registro **somente** quando a sincronização muda de fato o status, com `alteradoPor = null` (transição automática) e motivo fixo:

| Transição | motivo |
|---|---|
| `ativo → inadimplente` | `"Mensalidades em aberto"` |
| `inadimplente → ativo` | `"Regularização financeira"` |

---

## Mapeamento FR → dado

| Regra | Elemento |
|---|---|
| FR-001 | gatilho em criar/atualizar/pagar/excluir |
| FR-002 | derivação de `Mensalidade.status` |
| FR-003..FR-005 | recálculo de `Associado.status` |
| FR-006 | guard de estados protegidos |
| FR-007 | escrita condicional em histórico |
| FR-008 | `@@unique([associadoId, competencia])` |
| FR-009 | rota de lote (ver contracts) |
