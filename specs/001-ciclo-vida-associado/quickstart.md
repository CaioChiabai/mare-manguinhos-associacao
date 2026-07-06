# Quickstart: Ciclo de Vida do Status do Associado

**Feature**: 001-ciclo-vida-associado
**Branch**: `001-ciclo-vida-associado`
**Date**: 2026-07-06

Guia para rodar e validar a máquina de estados do associado no backend.

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL acessível via `DATABASE_URL` (`backend/.env`)
- Dependências instaladas: `cd backend && npm install`

---

## Rodar o backend

```bash
cd backend
npx prisma migrate dev        # aplica o schema
npx prisma db seed            # dados de exemplo (se configurado)
npm run dev                   # sobe a API (Fastify)
```

---

## Arquivos desta feature

```text
backend/src/modulos/associados/
├── associados.rotas.ts       # PATCH /api/associados/:id/status
├── associados.servico.ts     # alterarStatus()
└── associados.esquemas.ts    # statusAssociado, esquemaAlterarStatus
backend/src/modulos/mensalidades/mensalidades.servico.ts  # sincronizarStatusAssociado()
backend/src/modulos/lojas/lojas.servico.ts                # gate FR-008
backend/src/modulos/permissoes/permissoes.servico.ts      # gate FR-009
```

---

## Validar manualmente (transição manual)

```bash
# 1. Autenticar como admin e capturar o token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@mare.org","senha":"..."}' | jq -r .token)

# 2. Suspender sem motivo → 400 (FR-002)
curl -i -X PATCH http://localhost:3000/api/associados/<id>/status \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"suspenso"}'

# 3. Bloquear com motivo → 200 + histórico (FR-003, FR-007)
curl -s -X PATCH http://localhost:3000/api/associados/<id>/status \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"bloqueado","motivo":"Fraude"}'
```

---

## Rodar os testes

```bash
cd backend
npm test -- SPEC-001-validacao-associado
```

**Cobertura esperada** (`SPEC-001-validacao-associado.test.ts`):

| Cenário | Regra |
|---|---|
| Suspender sem motivo → erro | FR-002 |
| Bloquear com motivo → histórico gravado | FR-003, FR-007 |
| Reenviar mesma transição → sem duplicar histórico | idempotência (SC-001) |
| Sincronização não altera `suspenso`/`bloqueado` | FR-006, SC-002 |
| Aprovar loja de associado não-`ativo` → bloqueado | FR-008, SC-003 |

---

## Critério de pronto

- [ ] Todas as transições geram exatamente um registro de histórico (SC-001).
- [ ] Estados protegidos imunes à sincronização (SC-002).
- [ ] Nenhuma loja/permissão elegível fora de `ativo` (SC-003).
