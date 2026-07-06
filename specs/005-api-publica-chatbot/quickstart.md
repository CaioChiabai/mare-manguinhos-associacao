# Quickstart: Contrato Público da API (Chatbot WhatsApp)

**Feature**: 005-api-publica-chatbot
**Branch**: `005-api-publica-chatbot`
**Date**: 2026-07-06

Guia para rodar e validar os endpoints públicos consumidos pelo chatbot WhatsApp.

---

## Pré-requisitos

- Node.js 20+, PostgreSQL via `DATABASE_URL`
- `cd backend && npm install && npx prisma migrate dev && npm run dev`

> ⚠️ **Contrato externo**: estes endpoints são consumidos por terceiros. Ver o *Alerta de Estabilidade* na `spec.md` antes de alterar qualquer resposta.

---

## Arquivos desta feature

```text
backend/src/modulos/api-publica/api-publica.rotas.ts   # lógica inline (sem servico.ts)
│   ├── contarLojasAprovadas()   # FR-010/011
│   ├── usa mensalidadesServico.sincronizarAtrasos()   # FR-008
│   └── usa registrarAuditoria()                        # FR-012
backend/src/compartilhado/telefone.ts   # normalizarTelefone() (FR-005/006)
```

---

## Validar manualmente (sem autenticação)

```bash
# 1. Lista de ativos — não deve conter CPF nem e-mail (FR-001/004)
curl -s http://localhost:3000/api/publico/associados/ativos | jq '.[0]'
# → { id, nome, foto, telefone, status }

# 2. Elegibilidade booleana (FR-002)
curl -s http://localhost:3000/api/publico/pescador/<id>/ativo    # → true|false

# 3. Busca por telefone com máscara (FR-005) — normalizado internamente
curl -s "http://localhost:3000/api/publico/pescador/(27)%2098765-4321/status"
# → { id, nome, status }

# 4. Cadastro de produto via chatbot (FR-007..013)
curl -s -X POST "http://localhost:3000/api/publico/pescador/telefone/27987654321/produto" \
  -H 'Content-Type: application/json' \
  -d '{"especie":"Robalo","precoPorKg":45,"pesoDisponivel":8}'
# pescador inadimplente → 403; duas lojas aprovadas sem lojaId → 409
```

---

## Rodar os testes

```bash
cd backend
npm test -- SPEC-005-normalizacao-telefone
```

| Cenário | Regra |
|---|---|
| Normalização de telefone em vários formatos | FR-005, FR-006 |
| Lista pública sem CPF/e-mail | FR-001, FR-004 |
| Endpoints `*/ativo` retornam boolean | FR-002 |
| Uma loja aprovada → lojaId opcional | FR-010 |
| Duas lojas aprovadas sem lojaId → 409 | FR-011 |
| Pescador inadimplente → 403 | FR-009 |

---

## Critério de pronto

- [ ] Nenhuma resposta pública contém CPF/e-mail/dados bancários (SC-001).
- [ ] 100% das buscas por telefone funcionam independente da máscara (SC-002).
- [ ] Nenhum produto cadastrado por pescador inapto (SC-003).
