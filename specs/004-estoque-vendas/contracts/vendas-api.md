# API Contract: Vendas & Ajuste de Estoque

**Feature**: 004-estoque-vendas
**Date**: 2026-07-06
**Consumer**: Painel administrativo (frontend React)
**Auth**: JWT obrigatório (`papel = ADMIN`)
**Pré-condição**: loja `aprovada` + associado `ativo` (ver `[[003-aprovacao-loja]]`)

---

## `POST /api/vendas` — criar venda

**Request**

```json
{
  "lojaId": "…",
  "status": "concluida",
  "observacoes": "Venda balcão",
  "itens": [
    { "produtoId": "…", "pesoKg": 3.0 }
  ]
}
```

| Campo | Regra |
|---|---|
| `status` | `pendente` ou `concluida` (default `concluida`) |
| `itens[].pesoKg` | `> 0` |
| `total` | **não enviar** — calculado no backend (FR-008) |

**Comportamento**

- `concluida` → decrementa `pesoDisponivel` de cada item na mesma `$transaction` (FR-001/007).
- `pendente` → não toca estoque (FR-002).

**Response 201**

```json
{
  "id": "…",
  "status": "concluida",
  "total": 90.0,
  "itens": [ { "produtoId": "…", "pesoKg": 3.0, "precoUnitario": 30.0, "subtotal": 90.0 } ]
}
```

**Erros**

| Status | Quando |
|---|---|
| `409` | `"Peso disponível insuficiente"` — estoque < pedido em qualquer item (FR-006); reverte tudo |
| `409` | produto `ativo=false` (FR-010) |
| `409` | loja não-aprovada / associado não-ativo (herdado de `003`) |
| `400` | payload inválido |

---

## `PATCH /api/vendas/:id/status` — transição de status

**Request**

```json
{ "status": "cancelada" }
```

| Transição | Efeito |
|---|---|
| `pendente → concluida` | decrementa estoque (FR-003) |
| `concluida → cancelada` | estorna estoque (FR-004) |
| a partir de `cancelada` | rejeitada (FR-005) |

**Concorrência (FR-009)**: usa `updateMany` filtrando o status atual. Se outra operação já mudou a venda, retorna:

```json
409  { "erro": "A venda foi alterada por outra operação" }
```

**Response 200**: venda atualizada com estoque ajustado.

---

## Estabilidade

Contrato interno. O padrão de concorrência (`updateMany` condicional + `$transaction`) é o de referência do projeto e é reutilizado em `[[006-pedidos-app-delivery]]`.
