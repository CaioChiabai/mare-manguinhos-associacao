# API Contract: Mensalidades & Sincronização de Inadimplência

**Feature**: 002-inadimplencia-mensalidades
**Date**: 2026-07-06
**Consumer**: Painel administrativo (frontend React) + dashboard
**Auth**: JWT obrigatório (`papel = ADMIN`)

> **Efeito colateral comum a toda escrita**: cada operação abaixo dispara `sincronizarStatusAssociado(associadoId)` (FR-001), que pode transitar o associado entre `ativo` e `inadimplente`.

---

## `POST /api/mensalidades` — criar

**Request**

```json
{
  "associadoId": "…",
  "competencia": "2026-06",
  "valor": 50.0,
  "dataVencimento": "2026-07-05"
}
```

| Campo | Regra |
|---|---|
| `competencia` | `"AAAA-MM"`, único por associado (FR-008) |
| `valor` | `> 0` |
| `dataVencimento` | data ISO |

**Response 201**: mensalidade criada com `status` derivado (FR-002). Se vencida, o associado pode passar a `inadimplente`.

**Erros**: `409` competência duplicada; `400` payload inválido; `404` associado inexistente.

---

## `PATCH /api/mensalidades/:id/pagamento` — registrar pagamento

**Request**

```json
{ "dataPagamento": "2026-07-06" }
```

**Response 200**: `status → "pago"`; se era o único débito, o associado volta a `ativo` (FR-005).

---

## `PUT /api/mensalidades/:id` — atualizar

Atualiza `valor`/`dataVencimento`/`competencia`. Recalcula o `status` derivado e ressincroniza o associado.

---

## `DELETE /api/mensalidades/:id` — excluir

**Response 204**. Também dispara a sincronização (FR-001): remover o último débito pode reativar o associado.

---

## `POST /api/dashboard/sincronizar-atrasos` — sincronização em lote (FR-009)

Sem corpo. Percorre associados com vencimentos passados e recalcula status de mensalidade + associado.

**Response 200**

```json
{ "associadosAtualizados": 3, "mensalidadesReclassificadas": 7 }
```

> Também é invocado internamente por `[[005-api-publica-chatbot]]` antes de um cadastro via WhatsApp, para garantir elegibilidade atualizada.

---

## Regra derivada (não é endpoint) — status da mensalidade

```text
dataPagamento != null → "pago"; senão vencida → "atrasado"; senão → "pendente"   (FR-002)
```

## Estabilidade

Contrato interno. A regra de derivação de status e a semântica de `inadimplente` são compartilhadas com `[[001-ciclo-vida-associado]]`; alterá-las exige revisão conjunta.
