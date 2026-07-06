# API Contract: App Delivery — Consumidor & Pedidos

**Feature**: 006-pedidos-app-delivery
**Date**: 2026-07-06
**Consumer**: App mobile de delivery (consumidor final)
**Auth**: JWT com `tipo: "consumidor"` (exceto vitrine, que é pública)
**Base**: `/api/app`

---

## `POST /api/app/cadastro` · `POST /api/app/login`

Autenticação própria do consumidor (FR-001). Emite JWT com `tipo: "consumidor"` (FR-002).

**Login — Request**

```json
{ "email": "cliente@ex.com", "senha": "..." }
```

**Response 200**: `{ "token": "<jwt>", "consumidor": { "id": "…", "nome": "…" } }`

---

## `GET /api/app/vitrine` — vitrine pública (FR-003)

Sem autenticação. Retorna apenas produtos `ativo=true`, de loja `aprovada`, de associado `ativo`.

**Response 200**

```json
[
  { "id": "…", "especie": "Robalo", "precoPorKg": 45.0, "pesoDisponivel": 8.0, "loja": { "nomeLoja": "…" } }
]
```

Produto de associado que ficou inadimplente desaparece automaticamente.

---

## `POST /api/app/pedidos` — criar pedido

**Request**

```json
{
  "itens": [ { "produtoId": "…", "corte": "inteiro", "pesoKg": 2.0 } ],
  "enderecoEntrega": "…",
  "janelaEntrega": "10h-12h",
  "frete": 10.0,
  "formaPagamento": "pix"
}
```

| Campo | Regra |
|---|---|
| `itens` | ao menos 1 (FR-004) |
| `frete` | `>= 0` (FR-008) |
| `valorTotal` | **não enviar** — recalculado no backend (FR-007) |

**Comportamento**: valida estoque e decrementa `pesoDisponivel` em `prisma.$transaction` com `updateMany`/`gte` (FR-005/006); recalcula `valorTotal` (FR-007).

**Response 201**

```json
{ "id": "…", "status": "confirmado", "valorTotal": 90.0, "frete": 10.0 }
```

**Erros**

| Status | Quando |
|---|---|
| `400` | `itens: []` ou `frete < 0` |
| `409` | estoque insuficiente (`pesoKg > pesoDisponivel`) (FR-005/006) |
| `404` | produto inexistente/inativo |
| `401` | sem JWT de consumidor |

---

## Endereços

### `POST /api/app/enderecos` · `PATCH /api/app/enderecos/:id/principal`

Marcar principal zera `principal` nos demais endereços do consumidor (FR-009) — no máximo um principal.

---

## Pagamento (STUB — FR-010)

### `POST /api/app/pagamento/pix` · `POST /api/app/pagamento/cartao`

⚠️ **Stub**: retornam sucesso simulado, **sem cobrança real**. Devem ser substituídos por gateway (Efí/Gerencianet ou similar) antes de produção.

---

## Frete

### `GET /api/app-frete/calcular?cep=...` (FR-008)

Serviço separado (`app-frete`). O valor retornado é enviado no pedido e apenas validado (`>= 0`) na criação.

---

## Estabilidade

Contrato do app. Reutiliza o padrão de concorrência de estoque de `[[004-estoque-vendas]]`. FR-010 (pagamento) é dívida técnica registrada no `plan.md`.
