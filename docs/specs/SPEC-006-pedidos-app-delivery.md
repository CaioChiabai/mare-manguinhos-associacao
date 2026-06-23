# SPEC-006 — Pedidos do App Delivery (Consumidor)

**Status:** vigente | **Versão:** 1.0 | **Data:** 2026-06-23

## Objetivo

Definir as regras de negócio para o fluxo de pedidos realizados por consumidores finais via aplicativo de delivery. Este módulo é separado e independente do painel administrativo.

## Contexto

O módulo `app` e `app-frete` implementam o lado do consumidor: cadastro, vitrine de produtos, pedidos e pagamento. A autenticação usa JWT com `tipo: "consumidor"`, distinto dos JWTs administrativos.

> ⚠️ **GAP-02 e GAP-03** identificados em 2026-06-23 representam divergências entre esta spec e o código atual. Ambos são risco de produção e devem ser corrigidos antes do lançamento público. Ver detalhes nas regras R006 e R007.

---

## Regras (R)

### R001 — Consumidor é entidade própria
Consumidor é um model Prisma distinto de `Usuario` (admin) e `Associado` (pescador). Os três não compartilham tabela nem credenciais.

### R002 — JWT do consumidor tem tipo definido
O JWT emitido no cadastro e login do consumidor tem campo `tipo: "consumidor"`. As rotas do app usam o mesmo middleware `autenticar`, mas o token emitido identifica o contexto do usuário.

### R003 — Vitrine exibe apenas produtos disponíveis
A vitrine (`GET /api/app/vitrine`) retorna apenas produtos com `ativo=true` de lojas com `status="aprovada"` de associados com `status="ativo"`. Qualquer mudança de status em qualquer um dos três níveis exclui o produto da vitrine.

### R004 — Pedido exige ao menos 1 item
Schema de entrada: `itens: z.array(...).min(1)`. Pedido vazio é rejeitado na validação (400).

### R005 — Estoque validado antes da criação
Antes de criar o pedido, o sistema verifica que `pesoDisponivel ≥ pesoKg` para cada item. Se qualquer item não tiver estoque suficiente, o pedido inteiro é rejeitado (409).

### R006 — pesoDisponivel decrementado atomicamente

Ao criar um pedido, o backend decrementa `pesoDisponivel` para cada produto dentro de `prisma.$transaction`, usando `tx.produto.updateMany` com condição `{ gte: pesoKg }` como controle de concorrência. Se o decrement falhar (race condition entre pedidos simultâneos), a transação é revertida e o pedido não é criado.

### R007 — Total calculado pelo backend

`valorTotal = sum(precoPorKg × pesoKg)` é calculado a partir dos preços lidos do banco (`produtoMap`). O campo `valorTotal` foi removido de `esquemaCriarPedido` — valores enviados pelo cliente são ignorados (stripped por Zod).

### R008 — Frete informado pelo cliente, validado como não-negativo
O frete é calculado previamente via `GET /api/app-frete/calcular`. O valor calculado é enviado pelo cliente no body. O backend valida apenas `frete ≥ 0` sem recalcular.

### R009 — Endereço principal é exclusivo por consumidor
Ao marcar um endereço como `principal=true`, todos os outros endereços do mesmo consumidor têm `principal` setado para `false` atomicamente via `updateMany`.

### R010 — Pagamentos são STUB
`gerarPix()` e `processarCartao()` em `app.servico.ts` não realizam cobranças reais. Toda aprovação é simulada. Deve ser substituído por integração com gateway (ex: Efí/Gerencianet) antes de produção.

---

## Pré-condições

- Consumidor autenticado (JWT válido) para pedidos, endereços e pagamento
- Vitrine (`/api/app/vitrine`) é pública — sem autenticação

## Pós-condições

- Pedido criado com status `"confirmado"`
- `pesoDisponivel` decrementado para cada produto do pedido

---

## Casos de Aceitação (AC)

| AC | Regra | Entrada | Resultado esperado |
|---|---|---|---|
| AC-001 | R004 | Pedido com `itens: []` | 400 — schema rejeita |
| AC-002 | R005 | Item com `pesoKg > pesoDisponivel` | 409 — estoque insuficiente |
| AC-003 | R005 | Produto inexistente ou inativo | 404 — produto não encontrado |
| AC-004 | R003 | Vitrine com associado inadimplente | Produtos não aparecem |
| AC-005 | R008 | `frete: -1` | 400 — schema rejeita |
| AC-006 | R009 | Marcar endereço B como principal (A já era) | A → `false`, B → `true` |
| AC-007 | R007 | Cliente envia `valorTotal: 0.01` com itens de R$ 50 | (**Gap**) Backend deve recalcular; atualmente aceita 0.01 |
| AC-008 | R006 | Dois pedidos simultâneos com o mesmo produto e estoque exato | (**Gap**) Um deve falhar; atualmente ambos passam |

---

## Rastreabilidade

| Artefato | Localização |
|---|---|
| Schema de entrada | `app/app.esquemas.ts` → `esquemaCriarPedido`, `esquemaCadastro` |
| Lógica de pedidos | `app/app.servico.ts` → `criarPedido()` |
| Lógica de vitrine | `app/app.servico.ts` → `listarProdutos()` |
| Lógica de endereços | `app/app.servico.ts` → `adicionarEndereco()`, `marcarEnderecoPrincipal()` |
| Stubs de pagamento | `app/app.servico.ts` → `gerarPix()`, `processarCartao()` |
| Cálculo de frete | `app-frete/app-frete.servico.ts` → `calcular()` |
| Testes unitários | `src/__tests__/SPEC-006-pedidos-app.test.ts` |
| Gaps documentados | `docs/specs/RASTREABILIDADE.md` → Seção 3 |
| Padrão de referência para GAP-02 e GAP-03 | `vendas/vendas.servico.ts` → `ajustarEstoqueItens()`, `criar()` |
