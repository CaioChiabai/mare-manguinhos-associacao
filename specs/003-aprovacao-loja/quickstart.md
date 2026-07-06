# Quickstart: Fluxo de Aprovação de Loja

**Feature**: 003-aprovacao-loja
**Branch**: `003-aprovacao-loja`
**Date**: 2026-07-06

Guia para rodar e validar a máquina de estados da loja e o gate comercial.

---

## Pré-requisitos

- Node.js 20+, PostgreSQL via `DATABASE_URL`
- `cd backend && npm install && npx prisma migrate dev && npm run dev`

---

## Arquivos desta feature

```text
backend/src/modulos/lojas/
├── lojas.rotas.ts     # POST /api/lojas, PATCH /api/lojas/:id/status
├── lojas.servico.ts   # criar() (FR-002), atualizarStatus() (FR-002..FR-006)
└── lojas.esquemas.ts  # esquemaCriarLoja, esquemaAtualizarStatusLoja
backend/src/modulos/produtos/produtos.servico.ts  # gate FR-007
backend/src/modulos/vendas/vendas.servico.ts       # gate FR-008
backend/src/modulos/api-publica/api-publica.rotas.ts  # gate FR-009
```

---

## Validar manualmente

```bash
TOKEN=<jwt-admin>

# 1. Aprovar loja de associado ativo → aprovada + dataAprovacao (FR-002/004)
curl -s -X PATCH http://localhost:3000/api/lojas/<id>/status \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"aprovada"}'

# 2. Aprovar loja de associado inadimplente → 409 (FR-002)
# 3. Rejeitar sem motivo → 400 (FR-003)
curl -i -X PATCH http://localhost:3000/api/lojas/<id>/status \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"rejeitada"}'

# 4. Cadastrar produto em loja pendente → 409 (FR-007)
curl -i -X POST http://localhost:3000/api/produtos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"lojaId":"<loja-pendente>","especie":"Tilápia","precoPorKg":30,"pesoDisponivel":10}'
```

---

## Rodar os testes

```bash
cd backend
npm test -- SPEC-003-aprovacao-loja
```

| Cenário | Regra |
|---|---|
| Aprovar loja de associado ativo → dataAprovacao preenchida | FR-002, FR-004 |
| Aprovar loja de associado inadimplente → 409 | FR-002 |
| Rejeitar sem motivo → 400 | FR-003 |
| Rejeitar com motivo → motivoRejeicao persistido | FR-003, FR-005 |
| Suspender aprovada → dataAprovacao zerada | FR-006 |
| Produto/venda em loja não-aprovada → 409 | FR-007, FR-008 |

---

## Critério de pronto

- [ ] Nenhuma loja de associado não-`ativo` fica `aprovada` (SC-001).
- [ ] Nenhum produto/venda criado sob loja não-aprovada (SC-002).
- [ ] Toda rejeição tem motivo registrado (SC-003).
