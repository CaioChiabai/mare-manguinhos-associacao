# Quickstart: Pedidos do App Delivery (Consumidor)

**Feature**: 006-pedidos-app-delivery
**Branch**: `006-pedidos-app-delivery`
**Date**: 2026-07-06

Guia para rodar e validar o backend do app de delivery do consumidor final.

---

## Pré-requisitos

- Node.js 20+, PostgreSQL via `DATABASE_URL`
- `cd backend && npm install && npx prisma migrate dev && npm run dev`

> ⚠️ Pagamento é **stub** (FR-010): nenhuma cobrança real. Integrar gateway antes de produção.

---

## Arquivos desta feature

```text
backend/src/modulos/app/
├── app.rotas.ts       # cadastro/login consumidor, vitrine, pedidos, endereços, pagamento
├── app.servico.ts     # criarPedido() (FR-005/006/007), listarProdutos() (FR-003)
│                      # adicionarEndereco()/marcarEnderecoPrincipal() (FR-009)
│                      # gerarPix()/processarCartao() (FR-010, stub)
└── app.esquemas.ts    # esquemaCriarPedido (sem valorTotal), esquemaCadastro
backend/src/modulos/app-frete/app-frete.servico.ts  # calcular() (FR-008)
```

---

## Validar manualmente

```bash
# 1. Cadastro/login do consumidor → JWT com tipo "consumidor" (FR-001/002)
TOKEN=$(curl -s -X POST http://localhost:3000/api/app/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"cliente@ex.com","senha":"..."}' | jq -r .token)

# 2. Vitrine pública — só produtos vendáveis (FR-003)
curl -s http://localhost:3000/api/app/vitrine | jq 'length'

# 3. Pedido com carrinho vazio → 400 (FR-004)
curl -i -X POST http://localhost:3000/api/app/pedidos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"itens":[],"enderecoEntrega":"...","frete":10}'

# 4. Pedido válido → estoque decrementado, valorTotal recalculado (FR-005/006/007)
curl -s -X POST http://localhost:3000/api/app/pedidos \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"itens":[{"produtoId":"<p>","pesoKg":2}],"enderecoEntrega":"...","frete":10}'
```

---

## Rodar os testes

```bash
cd backend
npm test -- SPEC-006-pedidos-app
```

| Cenário | Regra |
|---|---|
| Carrinho vazio → 400 | FR-004 |
| Peso > estoque → 409 | FR-005 |
| valorTotal adulterado → recalculado no backend | FR-007 |
| Dois pedidos simultâneos com estoque exato → um falha | FR-006 |
| Produto de associado inadimplente some da vitrine | FR-003 |
| Trocar endereço principal → o anterior vira false | FR-009 |

---

## Critério de pronto

- [ ] Nenhum pedido persiste com `valorTotal` divergente do backend (SC-001).
- [ ] Estoque nunca fica negativo sob pedidos simultâneos (SC-002).
- [ ] Cada consumidor tem no máximo um endereço principal (SC-003).
- [ ] ⚠️ Substituir pagamento stub por gateway real antes do lançamento (FR-010).
