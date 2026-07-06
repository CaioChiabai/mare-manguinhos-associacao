# API Contract: Transição de Status do Associado

**Feature**: 001-ciclo-vida-associado
**Date**: 2026-07-06
**Consumer**: Painel administrativo (frontend React)
**Auth**: JWT obrigatório com `papel = ADMIN`

---

## `PATCH /api/associados/:id/status`

Altera manualmente o status de um associado. Único endpoint de transição **manual**.

**Path params**

| Param | Tipo | Descrição |
|---|---|---|
| `id` | `string` (uuid) | Id do associado |

**Request**

```http
PATCH /api/associados/{id}/status
Authorization: Bearer <jwt-admin>
Content-Type: application/json

{
  "status": "suspenso",
  "motivo": "Sanção por infração X"
}
```

| Campo | Tipo | Regra |
|---|---|---|
| `status` | enum `ativo\|suspenso\|inadimplente\|bloqueado` | obrigatório (FR-001) |
| `motivo` | `string` | obrigatório e não-vazio para `suspenso`/`bloqueado` (FR-002/003) |

> Transições para `inadimplente`/`ativo` são normalmente **automáticas**; ver `[[002-inadimplencia-mensalidades]]`.

**Response 200 — transição aplicada**

```json
{
  "id": "…",
  "nome": "João Pescador",
  "status": "suspenso",
  "atualizadoEm": "2026-07-06T14:00:00.000Z"
}
```

Efeitos colaterais: cria 1 registro em `HistoricoStatusAssociado` (FR-007) e 1 `LogAuditoria` `acao=alterar_status`.

**Response 200 — transição idempotente** (status já era o enviado): retorna o associado sem gravar histórico.

**Erros**

| Status | Quando | Corpo |
|---|---|---|
| `400` | `motivo` ausente/vazio ao mudar para `suspenso`/`bloqueado` | `{ "erro": "Motivo é obrigatório" }` |
| `400` | `status` fora do enum | `{ "erro": "Status inválido" }` |
| `401` | sem JWT válido | `{ "erro": "Não autenticado" }` |
| `403` | JWT sem `papel = ADMIN` | `{ "erro": "Acesso negado" }` |
| `404` | associado inexistente | `{ "erro": "Associado não encontrado" }` |

---

## Pré-condições consumidas por outros módulos

Estes contratos **leem** `Associado.status` como gate (não alteram):

| Endpoint | Regra | Falha |
|---|---|---|
| `POST /api/lojas`, `PATCH /api/lojas/:id/status` (→ `aprovada`) | associado deve estar `ativo` (FR-008) | `409` |
| `POST /api/permissoes`, toggle de permissão (→ `ativa`) | associado deve estar `ativo` (FR-009) | `409` |

---

## Estabilidade

Contrato **interno** (painel admin). Mudanças no enum de `status` exigem revisão conjunta de `[[002-inadimplencia-mensalidades]]` e `[[003-aprovacao-loja]]`, pois compartilham a semântica de elegibilidade.
