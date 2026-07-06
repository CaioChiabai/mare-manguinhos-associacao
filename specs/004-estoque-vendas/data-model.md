# Data Model: Controle Transacional de Estoque em Vendas

**Feature**: 004-estoque-vendas
**Date**: 2026-07-06
**Source**: `spec.md` (Key Entities) + `backend/prisma/schema.prisma`

---

## `Venda` (existente)

```prisma
model Venda {
  id           String   @id @default(uuid())
  lojaId       String
  associadoId  String
  total        Float    // calculado no backend (FR-008)
  status       String   @default("concluida")  // pendente | concluida | cancelada
  observacoes  String?
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt
  itens        ItemVenda[]
  transporte   Transporte?
}
```

**Máquina de estados & efeito no estoque**:

```text
   pendente ──(concluir)──► concluida ──(cancelar)──► cancelada [terminal]
      │  (sem efeito)          │ decrementa              │ estorna
      └─ criada concluida ─────┘                         └─ transição rejeitada (FR-005)
```

| Transição | Efeito em `pesoDisponivel` | Regra |
|---|---|---|
| criar `concluida` | decrementa cada item | FR-001 |
| criar `pendente` | nenhum | FR-002 |
| `pendente → concluida` | decrementa | FR-003 |
| `concluida → cancelada` | estorna | FR-004 |
| qualquer → a partir de `cancelada` | rejeitada (`ErroConflito`) | FR-005 |

---

## `ItemVenda` (existente)

```prisma
model ItemVenda {
  id            String @id @default(uuid())
  vendaId       String
  produtoId     String
  pesoKg        Float
  precoUnitario Float   // snapshot de precoPorKg no momento da venda
  subtotal      Float   // precoUnitario * pesoKg
}
```

`total` da venda = `Σ subtotal` — recalculado no backend (FR-008).

---

## `Produto` (existente) — recurso de estoque

Campos relevantes:

```prisma
pesoDisponivel Float   @default(0)   // estoque físico em kg — nunca negativo (SC-002)
precoPorKg     Float
ativo          Boolean @default(true) // inativo não movimenta estoque (FR-010)
```

**Decremento atômico** (dentro da `$transaction`):

```text
updateMany({
  where: { id: produtoId, ativo: true, pesoDisponivel: { gte: pesoKg } },  // FR-006/010
  data:  { pesoDisponivel: { decrement: pesoKg } }
})
→ count === 0  →  ErroConflito "Peso disponível insuficiente"
```

---

## Invariantes

- Venda e ajuste de estoque sempre na mesma `prisma.$transaction` (FR-007).
- `pesoDisponivel` nunca fica negativo — garantido pelo filtro `gte` (SC-002).
- Sob concorrência, no máximo uma operação vence; as demais recebem 409 (FR-009, SC-003).
- Pré-condição herdada de `[[003-aprovacao-loja]]`: loja `aprovada` + associado `ativo`.

## Mapeamento FR → dado

| Regra | Elemento |
|---|---|
| FR-001..005 | efeito por transição na tabela acima |
| FR-006 | filtro `gte` no `updateMany` |
| FR-007 | `prisma.$transaction` |
| FR-008 | `total = Σ subtotal` no backend |
| FR-009 | `updateMany` com status no filtro |
| FR-010 | filtro `ativo: true` |
