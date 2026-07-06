# Research: Contrato Público da API (Chatbot WhatsApp)

**Feature**: 005-api-publica-chatbot
**Date**: 2026-07-06
**Scope**: Decisões do contrato externo sem autenticação consumido pelo chatbot WhatsApp.

---

## R-001 — Exposição mínima de dados nos endpoints públicos (FR-001/002/003/004)

**Decision**: Endpoints públicos nunca retornam CPF, e-mail ou dados bancários. Consultas de elegibilidade retornam apenas boolean (`*/ativo`), `{id, nome, status}` (status) ou `{id, nome, foto, telefone, status}` (lista de ativos).

**Rationale**: Como não há autenticação, qualquer resposta é potencialmente pública. Expor o mínimo necessário protege a privacidade dos associados (Princípio V da constituição). `telefone` está na lista de ativos porque o chatbot precisa dele para identificar o pescador.

**Alternatives considered**: Reusar o serializer do painel admin — rejeitado por vazar campos sensíveis.

---

## R-002 — Normalização determinística de telefone (FR-005/006)

**Decision**: `normalizarTelefone()` em `compartilhado/telefone.ts` reduz qualquer entrada a apenas dígitos (`"(27) 98765-4321"` → `"27987654321"`), aplicada tanto na busca por telefone quanto na escrita do cadastro do associado.

**Rationale**: O chatbot pode enviar o número em qualquer máscara. Normalizar em ambos os lados (escrita e leitura) garante que a busca sempre encontre o registro, independente do formato.

**Alternatives considered**: Exigir formato canônico do chatbot — rejeitado por acoplar o contrato externo a uma máscara específica e frágil.

---

## R-003 — Um único endpoint público de escrita (FR-007)

**Decision**: `POST /api/publico/pescador/telefone/:tel/produto` é o único endpoint público que grava dados. Todo o resto é leitura.

**Rationale**: Minimiza a superfície de ataque de um contrato sem autenticação. Escrita concentrada num ponto facilita auditar e endurecer.

**Alternatives considered**: Vários endpoints de escrita pública — rejeitado por multiplicar risco sem necessidade.

---

## R-004 — Sincronização de inadimplência antes do cadastro (FR-008/009)

**Decision**: Antes de cadastrar o produto, chama-se `sincronizarAtrasos()` (de `[[002-inadimplencia-mensalidades]]`) para garantir que a elegibilidade do pescador esteja atualizada; só cadastra se `ativo` **e** com loja `aprovada`.

**Rationale**: Uma mensalidade pode ter vencido desde a última operação. Ressincronizar na borda evita cadastrar produto de pescador que se tornou inadimplente.

**Alternatives considered**: Confiar no status atual sem ressincronizar — rejeitado por permitir cadastro de pescador inapto por status defasado.

---

## R-005 — Resolução automática de loja quando há apenas uma aprovada (FR-010/011)

**Decision**: Se o pescador tem exatamente uma loja aprovada, `lojaId` pode ser omitido e é resolvido automaticamente (`contarLojasAprovadas()`). Com mais de uma, `lojaId` é obrigatório (409 se ausente).

**Rationale**: Simplifica a mensagem do chatbot no caso comum (um pescador, uma loja) sem ambiguidade quando há múltiplas lojas.

**Alternatives considered**: Sempre exigir `lojaId` — rejeitado por sobrecarregar o fluxo do WhatsApp no caso mais comum.

---

## R-006 — Auditoria de canal e defaults de banco (FR-012/013)

**Decision**: Toda escrita via chatbot gera `LogAuditoria` com `canal: "chatbot_whatsapp"`; o produto recebe apenas `especie`, `precoPorKg`, `pesoDisponivel` e os demais campos assumem defaults do schema.

**Rationale**: Rastreabilidade de origem (distinguir cadastro por WhatsApp vs. painel) e mensagem de chatbot enxuta (o pescador só informa o essencial).

**Alternatives considered**: Exigir todos os campos do produto pelo chat — rejeitado por inviabilizar o cadastro por mensagem.
