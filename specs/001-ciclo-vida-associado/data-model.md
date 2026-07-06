# Data Model: Ciclo de Vida do Status do Associado

**Feature**: 001-ciclo-vida-associado
**Date**: 2026-07-06
**Source**: `spec.md` (Key Entities) + `backend/prisma/schema.prisma`

---

## `Associado` (existente) — eixo de elegibilidade

Campos relevantes a esta feature (modelo completo no schema Prisma):

```prisma
model Associado {
  id           String   @id @default(uuid())
  nome         String
  status       String   @default("ativo")   // ativo | suspenso | inadimplente | bloqueado
  atualizadoEm DateTime @updatedAt
  historicoStatus HistoricoStatusAssociado[]
  // ... demais campos de cadastro
}
```

**Estados de `status`** (FR-001):

| Estado | Origem da transição | Efeito na elegibilidade |
|---|---|---|
| `ativo` | manual ou automática | Elegível: pode ter loja aprovada e permissão ativa |
| `inadimplente` | **automática** (mensalidade vencida) | Inelegível ao comércio |
| `suspenso` | **manual** (exige motivo) | Inelegível; imune à automação (FR-006) |
| `bloqueado` | **manual** (exige motivo) | Inelegível; imune à automação (FR-006) |

**Máquina de estados** (transições válidas):

```text
        ┌──────────── (pagamento/regularização, automático) ────────────┐
        │                                                                │
   inadimplente ◄──(débito vencido, automático)── ativo ──(admin+motivo)─► suspenso
        ▲                                           │  ▲                    │
        │                                           │  └──(admin, reativa)──┘
        └───────────────────────────────────────── │
                                                    └──(admin+motivo)──► bloqueado
```

> `suspenso`/`bloqueado` **não** têm arestas de saída disparadas pela sincronização — só saem por ação manual do admin.

---

## `HistoricoStatusAssociado` (existente) — trilha imutável

```prisma
model HistoricoStatusAssociado {
  id             String   @id @default(uuid())
  associadoId    String
  statusAnterior String
  statusNovo     String
  motivo         String?
  alteradoEm     DateTime @default(now())
  alteradoPor    String?   // id do admin, ou null quando automático
  associado      Associado @relation(fields: [associadoId], references: [id], onDelete: Cascade)
}
```

**Invariantes**:

- Um registro é criado **se e somente se** `statusAnterior !== statusNovo` (FR-007, SC-001).
- Nenhum registro é atualizado ou removido individualmente — a trilha é *append-only*.
- Transição manual: `alteradoPor` = id do admin, `motivo` obrigatório.
- Transição automática: `alteradoPor` = `null`, `motivo` fixo ("Mensalidades em aberto" / "Regularização financeira").

---

## `LogAuditoria` (existente) — registro da ação administrativa

```prisma
model LogAuditoria {
  id         String   @id @default(uuid())
  usuarioId  String?
  acao       String   // "alterar_status"
  entidade   String   // "Associado"
  entidadeId String?  // id do associado
  detalhes   String?  // JSON com { statusAnterior, statusNovo, motivo }
  criadoEm   DateTime @default(now())
}
```

Gerado apenas em transições **manuais** (a automática já é rastreada pelo histórico).

---

## Regras de validação (mapeamento FR → dado)

| Regra | Campo afetado |
|---|---|
| FR-002/003 | `motivo` NOT NULL/não-vazio ao mudar para `suspenso`/`bloqueado` |
| FR-004/005 | `status` recalculado a partir de `Mensalidade` (ver `[[002-inadimplencia-mensalidades]]`) |
| FR-007 | escrita condicional em `HistoricoStatusAssociado` |
| FR-008 | `Loja.status='aprovada'` exige `Associado.status='ativo'` (ver `[[003-aprovacao-loja]]`) |
| FR-009 | `Permissao.ativa=true` exige `Associado.status='ativo'` |
