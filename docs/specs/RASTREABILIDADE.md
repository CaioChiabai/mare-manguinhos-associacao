# Rastreabilidade SDD — Feature ↔ Regra

Documento de associação bidirecional entre módulos e specs de domínio.
Atualizado em: 2026-06-23

---

## 1. Feature → Spec (o que cada módulo deve obedecer)

| Módulo | Specs aplicáveis | Observação |
|---|---|---|
| `associados` | SPEC-001, SPEC-002 (efeito via sync) | SPEC-001 é a spec primária do status |
| `mensalidades` | SPEC-002, SPEC-001 R004-R007 (dispara sync) | Motor da inadimplência automática |
| `lojas` | SPEC-003, SPEC-001 R008 (pré-condição) | Aprovação depende do status do associado |
| `produtos` | SPEC-003 R007 | Gate loja aprovada + associado ativo na criação |
| `vendas` | SPEC-004, SPEC-003 R008 | Controle de estoque transacional |
| `permissoes` | SPEC-001 R009 | Permissão ativa exige associado ativo |
| `dashboard` | SPEC-002 R009 | `sincronizarAtrasos` em lote |
| `api-publica` | SPEC-005 | Contrato externo — chatbot WhatsApp |
| `app` (delivery) | SPEC-006 | Pedidos do consumidor final |
| `app-frete` | SPEC-006 R008 | Cálculo de frete para o app |
| `transportes` | — | Sem spec formal (baixa densidade de regras de negócio) |
| `reunioes` | — | Sem spec formal (agenda administrativa simples) |
| `auditoria` | cross-cutting | Referenciada em todas as specs como rastreabilidade |

---

## 2. Spec → Feature (onde cada regra está implementada)

### SPEC-001 — Ciclo de Vida do Associado

| Regra | Arquivo | Ponto de enforçamento |
|---|---|---|
| R001 | `associados/associados.esquemas.ts` | `statusAssociado` enum + validação CPF |
| R002, R003 | `associados/associados.servico.ts` → `alterarStatus()` | `if (!dados.motivo)` para suspenso/bloqueado |
| R004, R005, R006 | `mensalidades/mensalidades.servico.ts` → `sincronizarStatusAssociado()` | Protege suspenso/bloqueado; alterna ativo↔inadimplente |
| R007 | `mensalidades/mensalidades.servico.ts` → `sincronizarStatusAssociado()` | Cria `historicoStatusAssociado` em toda transição |
| R008 | `lojas/lojas.servico.ts` → `criar()` e `atualizarStatus()` | `throw ErroConflito("Somente associados ativos...")` |
| R009 | `permissoes/permissoes.servico.ts` → `criar()`, `atualizar()`, `alternar()` | `if (dados.ativa && associado.status !== "ativo")` |

### SPEC-002 — Inadimplência por Mensalidades

| Regra | Arquivo | Ponto de enforçamento |
|---|---|---|
| R001 | `mensalidades/mensalidades.servico.ts` → `criar()`, `atualizar()`, `registrarPagamento()`, `excluir()` | Todo CRUD chama `sincronizarStatusAssociado()` |
| R002 | `mensalidades/mensalidades.servico.ts` → `obterStatusAutomatico()` | pagamento→pago; vencido→atrasado; else→pendente |
| R003..R006 | `mensalidades/mensalidades.servico.ts` → `sincronizarStatusAssociado()` | `possuiDebitos` + guard `bloqueado/suspenso` |
| R007 | `mensalidades/mensalidades.esquemas.ts` | `competencia: z.string().regex(/^\d{4}-\d{2}$/)` |
| R008 | `prisma/schema.prisma` | `@@unique([associadoId, competencia])` |
| R009 | `dashboard/dashboard.servico.ts` | Chama `mensalidadesServico.sincronizarAtrasos()` |

### SPEC-003 — Aprovação de Loja

| Regra | Arquivo | Ponto de enforçamento |
|---|---|---|
| R001 | `lojas/lojas.esquemas.ts` | `statusLoja` enum |
| R002 | `lojas/lojas.servico.ts` → `criar()` L88 | `if (dados.status === "aprovada" && associado.status !== "ativo")` |
| R003 | `lojas/lojas.servico.ts` → `atualizarStatus()` L172 | `if (dados.status === "rejeitada" && !dados.motivoRejeicao?.trim())` |
| R004, R006 | `lojas/lojas.servico.ts` → `atualizarStatus()` L131-134 | `dataAprovacao = existente.dataAprovacao ?? new Date()` / `null` |
| R005 | `lojas/lojas.servico.ts` → `atualizarStatus()` L123-126 | Revalida status do associado antes de aprovar |
| R007 | `produtos/produtos.servico.ts` → `criar()` L80 | `loja.status !== "aprovada" \|\| loja.associado.status !== "ativo"` |
| R008 | `vendas/vendas.servico.ts` → `criar()` | `loja.status !== "aprovada"` L104 + `loja.associado.status !== "ativo"` L107 + `produto.ativo` |
| R009 | `api-publica/api-publica.rotas.ts` L183 | `canal: "chatbot_whatsapp"` no log de auditoria |

### SPEC-004 — Estoque e Vendas

| Regra | Arquivo | Ponto de enforçamento |
|---|---|---|
| R001, R002 | `vendas/vendas.servico.ts` → `criar()` | `if (dados.status === "concluida")` chama ajuste |
| R003..R005 | `vendas/vendas.servico.ts` → `atualizarStatus()` | Transições pendente→concluida, concluida→cancelada |
| R006, R010 | `vendas/vendas.servico.ts` → `ajustarEstoqueItens()` | `updateMany` com `pesoDisponivel: { gte: pesoKg }` |
| R007 | `vendas/vendas.servico.ts` → `ajustarEstoqueItens()` | `resultado.count !== 1 → throw ErroConflito` |
| R008 | `vendas/vendas.servico.ts` → `criar()` | `total += precoUnit * item.pesoKg` (backend calcula) |
| R009 | `vendas/vendas.servico.ts` → `atualizarStatus()` | `updateMany` com `{ id, status: statusAnterior }` → optimistic lock |

### SPEC-005 — API Pública (Chatbot WhatsApp)

| Regra | Arquivo | Ponto de enforçamento |
|---|---|---|
| R001 | `api-publica/api-publica.rotas.ts` | Nenhuma rota tem `preHandler: autenticar` |
| R002 | `api-publica/api-publica.rotas.ts` | Endpoints `/ativo` e `/ativa` → `{ ativo: boolean }` |
| R003, R004 | `api-publica/api-publica.rotas.ts` | `select` expõe apenas nome/status, sem CPF/email |
| R005, R006 | `compartilhado/telefone.ts` → `normalizarTelefone()` | `replace(/\D/g, "")` |
| R007..R013 | `api-publica/api-publica.rotas.ts` (chatbot endpoint) | Busca por telefone, registra interesse |

### SPEC-006 — Pedidos do App Delivery

| Regra | Arquivo | Ponto de enforçamento |
|---|---|---|
| R001 | `prisma/schema.prisma` | `model Consumidor` separado de `Usuario` e `Associado` |
| R002 | `middlewares/autenticar.ts` | JWT `tipo: "consumidor"` via `requisicao.user.sub` |
| R003 | `app/app.servico.ts` → `listarProdutos()` | `where: { ativo: true, loja: { status: "aprovada", ... } }` |
| R004 | `app/app.esquemas.ts` | `itens: z.array(...).min(1)` |
| R005 | `app/app.servico.ts` → `criarPedido()` L348-351 | `pesoDisponivel < item.pesoKg → throw ErroConflito` |
| R006 | `app/app.servico.ts` → `criarPedido()` | `prisma.$transaction` + `tx.produto.updateMany({ gte })` → decrement atômico |
| R007 | `app/app.servico.ts` → `criarPedido()` | `valorTotal = sum(precoPorKg × pesoKg)` calculado do `produtoMap`; removido do schema |
| R008 | `app/app.esquemas.ts` | `frete: z.number().nonnegative()` |
| R009 | `app/app.servico.ts` → `marcarEnderecoPrincipal()` | `updateMany` desmarca outros endereços |
| R010 | `app/app.servico.ts` → `gerarPix()`, `processarCartao()` | Marcados como STUB |

---

## 4. Cobertura de testes por spec

| Spec | Arquivo de teste | Tipo | Status |
|---|---|---|---|
| SPEC-001 | `__tests__/SPEC-001-validacao-associado.test.ts` | Puro (schema) | ✅ 22 testes |
| SPEC-002 | `__tests__/SPEC-002-inadimplencia.test.ts` | Puro + mock comentado | ✅ 8 testes |
| SPEC-003 | — | — | Pendente |
| SPEC-004 (estoque vendas) | — | — | Pendente (testes cobrem frete adjacente) |
| SPEC-004 (frete) | `__tests__/SPEC-004-calculo-frete.test.ts` | Puro (função pura) | ✅ 12 testes |
| SPEC-005 | `__tests__/SPEC-005-normalizacao-telefone.test.ts` | Puro | ✅ 14 testes |
| SPEC-006 | `__tests__/SPEC-006-pedidos-app.test.ts` | Puro (schema) | ✅ 12 testes |
