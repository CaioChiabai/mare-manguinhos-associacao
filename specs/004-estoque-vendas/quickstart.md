# Quickstart: Controle Transacional de Estoque em Vendas

**Feature**: 004-estoque-vendas
**Branch**: `004-estoque-vendas`
**Date**: 2026-07-06

Guia para rodar e validar o ajuste atômico de estoque nas vendas.

---

## Pré-requisitos

- Node.js 20+, PostgreSQL via `DATABASE_URL`
- `cd backend && npm install && npx prisma migrate dev && npm run dev`

---

## Arquivos desta feature

```text
backend/src/modulos/vendas/
├── vendas.rotas.ts     # POST /api/vendas, PATCH /api/vendas/:id/status
├── vendas.servico.ts   # criar() (FR-001/002/007/008)
│                       # atualizarStatus() (FR-003/004/005/007/009)
│                       # ajustarEstoqueItens() (privada, FR-006/010)
└── vendas.esquemas.ts
```

---

## Validar manualmente

```bash
TOKEN=<jwt-admin>

# 1. Venda concluida de 3 kg com estoque 10 → estoque vira 7 (FR-001)
curl -s -X POST http://localhost:3000/api/vendas \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"lojaId":"<loja>","status":"concluida","itens":[{"produtoId":"<p>","pesoKg":3}]}'

# 2. Venda de 5 kg com estoque 2 → 409, estoque intacto (FR-006)
# 3. Cancelar venda concluida → estoque estornado (FR-004)
curl -s -X PATCH http://localhost:3000/api/vendas/<id>/status \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"cancelada"}'
```

> Observe que o `total` enviado pelo cliente é ignorado; o backend recalcula (FR-008).

---

## Rodar os testes

```bash
cd backend
npm test -- SPEC-004-estoque-vendas
```

| Cenário | Regra |
|---|---|
| Venda concluida decrementa estoque | FR-001, FR-007 |
| Venda pendente não afeta estoque | FR-002 |
| Estoque insuficiente → 409, nada alterado | FR-006 |
| pendente→concluida decrementa / concluida→cancelada estorna | FR-003, FR-004 |
| Transição a partir de cancelada → 409 | FR-005 |
| Concorrência: segundo update → 409 | FR-009 |

---

## Critério de pronto

- [ ] Nunca há venda persistida sem o ajuste de estoque (SC-001).
- [ ] Estoque nunca fica negativo (SC-002).
- [ ] Sob concorrência, no máximo uma operação vence (SC-003).
