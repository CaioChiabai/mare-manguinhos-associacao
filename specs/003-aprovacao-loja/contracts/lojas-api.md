# API Contract: Aprovação de Loja

**Feature**: 003-aprovacao-loja
**Date**: 2026-07-06
**Consumer**: Painel administrativo (frontend React)
**Auth**: JWT obrigatório (`papel = ADMIN`)

---

## `POST /api/lojas` — criar loja

**Request**

```json
{
  "associadoId": "…",
  "nomeLoja": "Peixaria do João",
  "descricao": "Pescado fresco da Baía"
}
```

**Response 201**: loja criada com `status = "pendente"` (FR-001).

**Erros**: `409` se tentar nascer `aprovada` com associado não-`ativo` (FR-002); `400` payload inválido.

---

## `PATCH /api/lojas/:id/status` — transição de status

**Request**

```json
{
  "status": "aprovada"
}
```

Para rejeição:

```json
{
  "status": "rejeitada",
  "motivoRejeicao": "Documentação incompleta"
}
```

| Campo | Regra |
|---|---|
| `status` | enum `pendente\|aprovada\|rejeitada\|suspensa` |
| `motivoRejeicao` | obrigatório e não-vazio quando `status = rejeitada` (FR-003) |

**Efeitos por transição**

| status enviado | Pré-condição | Efeito |
|---|---|---|
| `aprovada` | associado `ativo` (FR-002) | `dataAprovacao = now()` (FR-004) |
| `rejeitada` | `motivoRejeicao` presente | persiste motivo, `dataAprovacao` null (FR-005) |
| `suspensa` | vinha de `aprovada` | `dataAprovacao = null` (FR-006) |

**Response 200**

```json
{
  "id": "…",
  "status": "aprovada",
  "dataAprovacao": "2026-07-06T14:00:00.000Z",
  "motivoRejeicao": null
}
```

**Erros**

| Status | Quando |
|---|---|
| `400` | `motivoRejeicao` ausente ao rejeitar |
| `409` | aprovar loja de associado não-`ativo` (FR-002) — `"Somente associados ativos podem ter lojas aprovadas"` |
| `404` | loja inexistente |

---

## Gates consumidos por outros módulos (leitura de `Loja.status`)

| Endpoint | Regra | Falha |
|---|---|---|
| `POST /api/produtos` | loja `aprovada` + associado `ativo` (FR-007) | `409` |
| `POST /api/vendas` | loja `aprovada` + associado `ativo` (FR-008) — ver `[[004-estoque-vendas]]` | `409` |
| cadastro via chatbot | loja `aprovada` (FR-009) — ver `[[005-api-publica-chatbot]]` | `409/403` |

## Estabilidade

Contrato interno. A semântica de `aprovada` como pré-condição é compartilhada com `004`, `005` e `006`.
