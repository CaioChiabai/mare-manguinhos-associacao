# Implementation Plan: Pedidos do App Delivery (Consumidor)

**Branch**: `006-pedidos-app-delivery` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

## Summary

Backend do app de delivery para o consumidor final: autenticação própria, vitrine filtrada,
pedidos com estoque transacional e total calculado no servidor, endereços com principal exclusivo
e pagamento em stub.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Fastify, Prisma ORM (`$transaction`, `updateMany`), Zod, JWT
**Storage**: PostgreSQL
**Testing**: Vitest — `backend/src/__tests__/SPEC-006-pedidos-app.test.ts`
**Project Type**: Web (backend — módulos `app` e `app-frete`)
**Constraints**: Reusar o padrão de concorrência de `004`; pagamento ainda stub.

## Constitution Check

- **V. Consistência transacional**: ✅ pedido e estoque na mesma transação (GAP corrigido).
- **I/II/III/IV**: ✅ regras numeradas, Zod (`esquemaCriarPedido` sem `valorTotal`), `tratador-erros.ts`.
- **Nota**: FR-010 (pagamento stub) é dívida técnica consciente, registrada como *Complexity Tracking*.

## Project Structure

```text
backend/src/modulos/app/
├── app.rotas.ts       # cadastro/login consumidor, vitrine, pedidos, endereços, pagamento
├── app.servico.ts     # criarPedido() (FR-005/006/007), listarProdutos() (FR-003)
│                      # adicionarEndereco()/marcarEnderecoPrincipal() (FR-009)
│                      # gerarPix()/processarCartao() (FR-010, stub)
└── app.esquemas.ts    # esquemaCriarPedido, esquemaCadastro
backend/src/modulos/app-frete/app-frete.servico.ts  # calcular() (FR-008)
```

**Structure Decision**: Módulo do consumidor totalmente separado do painel admin, com JWT
tipado. Reutiliza o padrão de `updateMany` com `gte` de `004` para concorrência de estoque.

## Complexity Tracking

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Pagamento em stub (FR-010) | Permite validar o fluxo completo sem contrato de gateway | Integrar gateway agora bloquearia o MVP; será feito antes do lançamento público |
