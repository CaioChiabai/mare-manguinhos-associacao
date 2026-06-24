# SPEC-004 — Controle Transacional de Estoque em Vendas

**Domínio:** Venda, ItemVenda, Produto  
**Status:** ativo

---

## Objetivo

As vendas consomem estoque físico dos produtos (campo `pesoDisponivel` em kg).  
O ajuste de estoque deve ser atômico com a criação/mudança de status da venda para garantir consistência mesmo sob operações concorrentes.  
Esta spec descreve quando o estoque é decrementado/incrementado e como a integridade é protegida.

---

## Regras de Negócio

**R001** — Venda criada com `status = "concluida"` decrementa imediatamente o `pesoDisponivel` de cada produto nos itens.

**R002** — Venda criada com `status = "pendente"` **não** decrementa estoque. O estoque só é afetado na conclusão.

**R003** — Transição de status `pendente → concluida` decrementa o estoque.

**R004** — Transição de status `concluida → cancelada` incrementa o estoque (estorno).

**R005** — Transição `cancelada → *` qualquer é rejeitada silenciosamente: o `updateMany` com condição no status anterior retorna `count = 0` e o sistema lança `ErroConflito`.

**R006** — Se o `pesoDisponivel` de qualquer item for insuficiente no momento do decremento, a operação inteira é revertida (transação Prisma). Nenhum item parcial é decrementado.

**R007** — A venda e o ajuste de estoque ocorrem na **mesma transação Prisma** (`$transaction`). Não existe estado intermediário onde a venda existe mas o estoque não foi ajustado.

**R008** — O total da venda é calculado pelo backend com base em `precoPorKg * pesoKg` por item. O cliente não envia o total.

**R009** — O mecanismo de concorrência usa **optimistic locking**: o `updateMany` inclui o `status` atual como condição de filtro. Se outro processo alterou o status antes, `count` retorna 0 e a operação falha com mensagem "A venda foi alterada por outra operação. Tente novamente."

**R010** — Produto inativo (`ativo = false`) não pode ter pesoDisponivel decrementado pelo `updateMany` (a condição `ativo: true` está no filtro). Isso torna impossível vender produto desativado.

---

## Pré-condições

- Loja com `status = "aprovada"` e associado com `status = "ativo"` (ver [SPEC-003 R008](SPEC-003-aprovacao-loja.md)).
- Todos os `produtoId` dos itens existem, estão `ativo = true` e têm `pesoDisponivel >= pesoKg` solicitado.

---

## Pós-condições

Após criação de venda `concluida` ou transição para `concluida`:
- `pesoDisponivel` de cada produto é reduzido pelo `pesoKg` correspondente.
- A venda existe com `total` calculado pelo backend.
- O log de auditoria registra `{ lojaId, total }`.

Após cancelamento de venda `concluida`:
- `pesoDisponivel` de cada produto é restaurado.

---

## Casos de Aceitação

**AC-001** | Dado produto com `pesoDisponivel = 10`, quando venda `concluida` com `pesoKg = 3` é criada → então `pesoDisponivel` do produto vira `7`. *(valida R001, R007)*

**AC-002** | Dado produto com `pesoDisponivel = 10`, quando venda `pendente` com `pesoKg = 3` é criada → então `pesoDisponivel` permanece `10`. *(valida R002)*

**AC-003** | Dado venda `pendente`, quando status muda para `concluida` → então estoque é decrementado. *(valida R003)*

**AC-004** | Dado venda `concluida`, quando status muda para `cancelada` → então estoque é restaurado. *(valida R004)*

**AC-005** | Dado produto com `pesoDisponivel = 2`, quando venda `concluida` com `pesoKg = 5` é solicitada → então retorna erro 409 "Peso disponível insuficiente" e nenhum produto tem estoque alterado. *(valida R006)*

**AC-006** | Dado dois processos simultâneos tentando atualizar a mesma venda, quando o segundo executa depois que o primeiro mudou o status → então o segundo recebe erro 409 "A venda foi alterada por outra operação". *(valida R009)*

**AC-007** | O total da venda enviado pelo cliente é ignorado; o backend recalcula. *(valida R008)*

**AC-008** | Dado produto com `ativo = false`, quando venda `concluida` com esse produto é criada → então retorna erro pois o `updateMany` com `ativo: true` falha. *(valida R010)*

---

## Rastreabilidade

**Serviços**
- `backend/src/modulos/vendas/vendas.servico.ts`
  - `criar()` → implementa R001, R002, R007, R008
  - `atualizarStatus()` → implementa R003, R004, R005, R007, R009
  - `ajustarEstoqueItens()` *(função privada)* → implementa R006, R010

**Endpoints**
- `POST /api/vendas`
- `PATCH /api/vendas/:id/status`

**Entidades Prisma**
- `Venda` (`status`, `total`, `lojaId`, `associadoId`)
- `ItemVenda` (`produtoId`, `pesoKg`, `precoUnitario`, `subtotal`)
- `Produto` (`pesoDisponivel`, `precoPorKg`, `ativo`)

**Schemas de validação**
- `backend/src/modulos/vendas/vendas.esquemas.ts`

**Testes**
- `backend/src/__tests__/SPEC-004-estoque-vendas.test.ts` *(requer mock de Prisma ou banco de teste)*

**Docs relacionados**
- [`SPEC-003`](SPEC-003-aprovacao-loja.md) — pré-condição: loja aprovada e associado ativo
- [`docs/API.md`](../API.md) — seção Vendas
