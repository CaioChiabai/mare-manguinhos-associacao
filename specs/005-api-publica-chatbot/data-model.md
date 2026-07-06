# Data Model: Contrato Público da API (Chatbot WhatsApp)

**Feature**: 005-api-publica-chatbot
**Date**: 2026-07-06
**Source**: `spec.md` (Key Entities) + `backend/prisma/schema.prisma`

> Esta feature **não cria entidades novas** — define projeções de leitura (DTOs públicos) sobre entidades existentes e uma escrita restrita de `Produto`.

---

## Projeções públicas (DTOs) — exposição mínima (FR-001..FR-004)

| Endpoint | Campos expostos | Ocultos |
|---|---|---|
| `GET /api/publico/associados/ativos` | `{ id, nome, foto, telefone, status }` | CPF, e-mail, dados bancários |
| `GET /api/publico/pescador/:id/ativo` | `boolean` | tudo o mais |
| `GET /api/publico/pescador/:id/status` | `{ id, nome, status }` | CPF, e-mail |

**Invariante**: nenhuma resposta pública contém CPF, e-mail ou dados bancários (SC-001).

---

## `Associado` (existente) — leitura + escrita de telefone normalizado

Campos usados:

```prisma
status   String    // gate de elegibilidade (= "ativo")
telefone String    @unique   // normalizado: só dígitos (FR-005/006)
nome     String
foto     String?
```

`normalizarTelefone(raw)` → só dígitos, aplicada na busca (`:tel`) e na escrita do cadastro.

---

## `Loja` (existente) — resolução de loja aprovada

```text
contarLojasAprovadas(associadoId):
  0  → não pode cadastrar (sem loja aprovada)   (FR-009)
  1  → lojaId resolvido automaticamente          (FR-010)
  >1 → lojaId obrigatório, senão 409             (FR-011)
```

---

## `Produto` (existente) — escrita restrita via chatbot (FR-013)

Campos informados pelo chatbot:

```prisma
especie        String   // informado
precoPorKg     Float    // informado
pesoDisponivel Float    // informado
// demais campos → defaults do schema:
// estoque=0, cortesDisponiveis="[]", badges="[]", ativo=true, ...
```

Pré-condição: pescador `ativo` **e** loja `aprovada` (FR-009), após `sincronizarAtrasos()` (FR-008).

---

## `LogAuditoria` (existente) — auditoria de canal (FR-012)

```prisma
acao      "criar_produto"
entidade  "Produto"
detalhes  JSON contendo { "canal": "chatbot_whatsapp", ... }
```

---

## Mapeamento FR → dado

| Regra | Elemento |
|---|---|
| FR-001..004 | DTOs públicos com campos mínimos |
| FR-005/006 | `normalizarTelefone()` em leitura e escrita |
| FR-007 | único endpoint público de escrita |
| FR-008 | `sincronizarAtrasos()` antes de cadastrar |
| FR-009 | gate `ativo` + loja `aprovada` |
| FR-010/011 | `contarLojasAprovadas()` |
| FR-012 | `LogAuditoria.canal` |
| FR-013 | defaults de `Produto` |
