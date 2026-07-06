# Quickstart: Inadimplência Automática por Mensalidades

**Feature**: 002-inadimplencia-mensalidades
**Branch**: `002-inadimplencia-mensalidades`
**Date**: 2026-07-06

Guia para rodar e validar o motor financeiro que sincroniza o status do associado.

---

## Pré-requisitos

- Node.js 20+, PostgreSQL via `DATABASE_URL`
- `cd backend && npm install && npx prisma migrate dev`
- `npm run dev`

---

## Arquivos desta feature

```text
backend/src/modulos/mensalidades/
├── mensalidades.rotas.ts     # POST/PUT/PATCH/DELETE + registrar pagamento
├── mensalidades.servico.ts   # criar/atualizar/registrarPagamento/excluir
│                             # sincronizarStatusAssociado()  (privada)
│                             # obterStatusAutomatico()       (privada, FR-002)
│                             # sincronizarAtrasos()          (lote, FR-009)
└── mensalidades.esquemas.ts
backend/src/modulos/dashboard/dashboard.rotas.ts  # POST /api/dashboard/sincronizar-atrasos
```

---

## Validar manualmente

```bash
TOKEN=<jwt-admin>

# 1. Criar mensalidade vencida ontem para associado ativo → vira inadimplente (FR-003/004)
curl -s -X POST http://localhost:3000/api/mensalidades \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"associadoId":"<id>","competencia":"2026-06","valor":50,"dataVencimento":"2026-07-05"}'

# 2. Conferir o status do associado
curl -s http://localhost:3000/api/associados/<id> -H "Authorization: Bearer $TOKEN" | jq .status
# → "inadimplente"

# 3. Registrar pagamento → volta a ativo (FR-005)
curl -s -X PATCH http://localhost:3000/api/mensalidades/<mid>/pagamento \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"dataPagamento":"2026-07-06"}'

# 4. Corrigir atrasos acumulados em lote (FR-009)
curl -s -X POST http://localhost:3000/api/dashboard/sincronizar-atrasos \
  -H "Authorization: Bearer $TOKEN"
```

---

## Rodar os testes

```bash
cd backend
npm test -- SPEC-002-inadimplencia
```

| Cenário | Regra |
|---|---|
| Mensalidade vencida → associado inadimplente | FR-003, FR-004 |
| Pagamento da única atrasada → associado ativo | FR-005 |
| Associado suspenso com débito → permanece suspenso | FR-006 |
| Cálculo pago/atrasado/pendente por datas | FR-002 |
| Competência duplicada → 409 | FR-008 |

---

## Critério de pronto

- [ ] Nenhum associado com débito vencido permanece `ativo` (SC-001).
- [ ] Nenhuma competência duplicada aceita (SC-002).
- [ ] Histórico criado se e somente se houve mudança real (SC-003).
