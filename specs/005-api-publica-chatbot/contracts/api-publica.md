# API Contract: API Pública (Chatbot WhatsApp)

**Feature**: 005-api-publica-chatbot
**Date**: 2026-07-06
**Consumer**: Chatbot WhatsApp + sistemas externos
**Auth**: **Nenhuma** (contrato público)
**Base**: `/api/publico`

> ⚠️ **Contrato externo estável.** Não alterar sem: (1) notificar o time do chatbot, (2) versionar se incompatível (`/v2/publico/...`), (3) manter o endpoint antigo na transição. Retornos booleanos são especialmente sensíveis: mudar o tipo quebra o chatbot silenciosamente.

---

## Leitura de elegibilidade

### `GET /api/publico/associados/ativos`

Lista os pescadores ativos com dados mínimos (FR-004).

**Response 200**

```json
[
  { "id": "…", "nome": "João Pescador", "foto": null, "telefone": "27987654321", "status": "ativo" }
]
```

Nunca inclui CPF, e-mail ou dados bancários (FR-001).

### `GET /api/publico/pescador/:id/ativo`

**Response 200**: `true` ou `false` (boolean puro — FR-002).

### `GET /api/publico/pescador/:id/status`

**Response 200**

```json
{ "id": "…", "nome": "João Pescador", "status": "inadimplente" }
```

### `GET /api/publico/pescador/:tel/status` (por telefone)

`:tel` aceita qualquer máscara; é normalizado para dígitos antes da busca (FR-005).

---

## Escrita (único endpoint público de escrita — FR-007)

### `POST /api/publico/pescador/telefone/:tel/produto`

Cadastra um produto na loja aprovada do pescador identificado pelo telefone.

**Path params**

| Param | Descrição |
|---|---|
| `:tel` | telefone em qualquer formato; normalizado (FR-005) |

**Request**

```json
{
  "especie": "Robalo",
  "precoPorKg": 45.0,
  "pesoDisponivel": 8.0,
  "lojaId": "…"
}
```

| Campo | Regra |
|---|---|
| `especie`, `precoPorKg`, `pesoDisponivel` | obrigatórios (demais campos assumem defaults — FR-013) |
| `lojaId` | opcional se o pescador tem 1 loja aprovada (FR-010); obrigatório se tem >1 (FR-011) |

**Fluxo**

1. Normaliza `:tel` e localiza o pescador.
2. Chama `sincronizarAtrasos()` (FR-008).
3. Verifica `status === 'ativo'` e loja `aprovada` (FR-009).
4. Resolve `lojaId` (FR-010/011).
5. Cria o produto e grava `LogAuditoria` com `canal: "chatbot_whatsapp"` (FR-012).

**Response 201**

```json
{ "id": "…", "especie": "Robalo", "precoPorKg": 45.0, "pesoDisponivel": 8.0, "lojaId": "…" }
```

**Erros**

| Status | Quando |
|---|---|
| `403` | pescador não `ativo` — `"Pescador não pode vender"` (FR-009) |
| `409` | mais de uma loja aprovada e `lojaId` ausente — `"informe lojaId"` (FR-011) |
| `404` | telefone não corresponde a nenhum pescador |
| `400` | payload inválido |

---

## Estabilidade

Ver *Alerta de Estabilidade* na `spec.md`. Depende de `[[002-inadimplencia-mensalidades]]` (sincronização) e `[[003-aprovacao-loja]]` (loja aprovada).
