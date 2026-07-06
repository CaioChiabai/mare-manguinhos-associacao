# Data Model: Pedidos do App Delivery (Consumidor)

**Feature**: 006-pedidos-app-delivery
**Date**: 2026-07-06
**Source**: `spec.md` (Key Entities) + `backend/prisma/schema.prisma`

---

## `Consumidor` (existente) — entidade própria (FR-001)

```prisma
model Consumidor {
  id        String     @id @default(uuid())
  nome      String
  email     String     @unique
  telefone  String     @unique
  senhaHash String
  criadoEm  DateTime   @default(now())
  enderecos Endereco[]
  pedidos   Pedido[]
}
```

Tabela e credenciais separadas de `Usuario`/`Associado`. JWT com `tipo: "consumidor"` (FR-002).

---

## `Endereco` (existente) — principal exclusivo (FR-009)

```prisma
model Endereco {
  id           String  @id @default(uuid())
  consumidorId String
  label        String  @default("Casa")
  logradouro   String
  numero       String
  bairro       String
  cidade       String
  estado       String
  cep          String
  complemento  String?
  principal    Boolean @default(false)
}
```

**Invariante**: no máximo um endereço `principal=true` por consumidor. Marcar B como principal → `updateMany` zera os demais (SC-003).

---

## `Pedido` (existente)

```prisma
model Pedido {
  id              String   @id @default(uuid())
  consumidorId    String
  status          String   @default("confirmado")
  enderecoEntrega String
  janelaEntrega   String
  frete           Float    // validado >= 0 (FR-008)
  valorTotal      Float    // calculado no backend (FR-007)
  formaPagamento  String   @default("pix")
  criadoEm        DateTime @default(now())
  atualizadoEm    DateTime @updatedAt
  itens           PedidoItem[]
}
```

**Invariantes**:

- Ao menos 1 item (FR-004, schema `min(1)`).
- `valorTotal` = `Σ (precoPorKg × pesoKg)` recalculado no servidor; valor do cliente ignorado (FR-007).
- `frete >= 0` (FR-008).

---

## `PedidoItem` (existente)

```prisma
model PedidoItem {
  id         String @id @default(uuid())
  pedidoId   String
  produtoId  String
  corte      String @default("inteiro")
  pesoKg     Float
  precoPorKg Float   // snapshot no momento do pedido
}
```

---

## `Produto` (existente) — recurso de estoque e vitrine

```text
Vitrine (FR-003): produto.ativo=true  ∧  loja.status='aprovada'  ∧  associado.status='ativo'

Criação de pedido (FR-005/006), dentro de prisma.$transaction:
  updateMany({ where: { id, pesoDisponivel: { gte: pesoKg } },
               data:  { pesoDisponivel: { decrement: pesoKg } } })
  count === 0 → 409 estoque insuficiente
```

---

## Mapeamento FR → dado

| Regra | Elemento |
|---|---|
| FR-001/002 | `Consumidor` + JWT `tipo` |
| FR-003 | filtro em cascata da vitrine |
| FR-004 | `itens.min(1)` |
| FR-005/006 | `updateMany` `gte` em `$transaction` |
| FR-007 | `valorTotal` no backend |
| FR-008 | `frete >= 0` |
| FR-009 | `principal` exclusivo via `updateMany` |
| FR-010 | pagamento stub (dívida técnica) |
