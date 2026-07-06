# Research: Pedidos do App Delivery (Consumidor)

**Feature**: 006-pedidos-app-delivery
**Date**: 2026-07-06
**Scope**: Decisões do backend do app de delivery do consumidor final, separado do painel admin.

---

## R-001 — Consumidor como entidade própria com JWT tipado (FR-001/002)

**Decision**: `Consumidor` é uma tabela separada de `Usuario`/`Associado`, com credenciais próprias; o JWT emitido carrega `tipo: "consumidor"`.

**Rationale**: O consumidor final não compartilha domínio, permissões nem ciclo de vida com pescadores ou admins. Separar tabela e tipo de token evita escalonamento de privilégio entre os dois mundos (app público vs. painel administrativo).

**Alternatives considered**: Reusar `Usuario` com um papel `CONSUMIDOR` — rejeitado por misturar credenciais de contextos com superfícies de segurança distintas.

---

## R-002 — Vitrine filtrada por elegibilidade em cascata (FR-003)

**Decision**: `GET /api/app/vitrine` (público) exibe apenas produtos `ativo=true`, de loja `aprovada`, de associado `ativo`. Se o associado fica inadimplente, o produto desaparece automaticamente da vitrine.

**Rationale**: O consumidor não pode pedir algo que não pode ser vendido. A filtragem em cascata reflete, em tempo de leitura, toda a máquina de elegibilidade das specs `001`/`003`.

**Alternatives considered**: Denormalizar um flag `visivel` no produto — rejeitado por exigir sincronização adicional e poder divergir da fonte.

---

## R-003 — Estoque transacional reusando o padrão de `004` (FR-005/006)

**Decision**: A criação do pedido decrementa `pesoDisponivel` dentro de `prisma.$transaction`, usando `updateMany` com `gte: pesoKg` como controle de concorrência — o mesmo padrão de `[[004-estoque-vendas]]`.

**Rationale**: Reaproveita um padrão já validado no projeto (Princípio de reuso). Dois pedidos simultâneos sobre estoque exato: um vence, o outro recebe 409, e o estoque nunca fica negativo (SC-002). Correção do GAP-02/GAP-03.

**Alternatives considered**: Validar estoque só antes de criar (sem `$transaction`) — rejeitado; era exatamente o gap corrigido, pois abria corrida entre validação e escrita.

---

## R-004 — `valorTotal` recalculado no backend (FR-007)

**Decision**: `valorTotal = Σ (precoPorKg × pesoKg)` calculado no servidor a partir dos preços do banco; valores enviados pelo cliente são ignorados. O schema `esquemaCriarPedido` sequer aceita `valorTotal`.

**Rationale**: Impede adulteração de preço pelo app. Consistente com FR-008 de `[[004-estoque-vendas]]`.

**Alternatives considered**: Aceitar `valorTotal` do cliente e validar — rejeitado; recalcular é mais simples e seguro.

---

## R-005 — Frete calculado à parte e apenas validado (FR-008)

**Decision**: O frete vem de `GET /api/app-frete/calcular` e é enviado pelo cliente junto do pedido; o backend só valida `frete >= 0`.

**Rationale**: O cálculo de frete depende de CEP/distância e é um serviço separado (`app-frete`). No pedido, basta garantir a não-negatividade — a regra de cálculo vive no seu próprio módulo.

**Alternatives considered**: Recalcular o frete dentro da criação do pedido — adiado; acoplaria o pedido ao serviço de frete sem ganho no MVP.

---

## R-006 — Endereço principal exclusivo por consumidor (FR-009)

**Decision**: Marcar um endereço como `principal` dispara um `updateMany` que zera `principal` nos demais endereços do consumidor, garantindo no máximo um principal.

**Rationale**: Exclusividade garantida na escrita, de forma atômica, evita dois endereços principais simultâneos (SC-003).

**Alternatives considered**: Validar unicidade só na leitura — rejeitado por permitir estado inconsistente persistido.

---

## R-007 — Pagamento em stub como dívida técnica consciente (FR-010)

**Decision**: `gerarPix()` e `processarCartao()` são stubs — nenhuma cobrança real. Registrado explicitamente no *Complexity Tracking* do `plan.md`.

**Rationale**: Permite validar o fluxo completo de pedido/entrega sem depender de contrato de gateway, destravando o MVP. A integração real (Efí/Gerencianet ou similar) é pré-requisito antes do lançamento público.

**Alternatives considered**: Integrar o gateway agora — rejeitado por bloquear o MVP num contrato externo ainda indefinido.
