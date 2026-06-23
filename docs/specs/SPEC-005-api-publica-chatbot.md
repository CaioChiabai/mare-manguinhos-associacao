# SPEC-005 — Contrato Público da API (Chatbot WhatsApp)

**Domínio:** Associado, Loja, Produto (via api-publica)  
**Status:** ativo  
**⚠️ Contrato externo:** Endpoints consumidos pelo chatbot WhatsApp e por sistemas de terceiros. **Não alterar sem coordenação prévia.**

---

## Objetivo

O módulo `api-publica` expõe um conjunto mínimo de endpoints **sem autenticação** para consumo por sistemas externos, principalmente o chatbot WhatsApp que permite ao pescador cadastrar produtos via mensagem.  
Esta spec define o contrato: quais dados são expostos, quais são omitidos por segurança, e as regras de negócio do fluxo de cadastro via chatbot.

---

## Regras de Negócio

### Segurança de dados

**R001** — Endpoints públicos não expõem CPF, e-mail, telefone (exceto quando o próprio telefone é o parâmetro de busca) ou dados bancários.

**R002** — Endpoints `*/ativo` e `*/ativa` retornam **somente um boolean** (`true` ou `false`). Não retornam objeto.

**R003** — O endpoint de status retorna somente `{ id, nome, status }`.

**R004** — A lista de associados ativos expõe somente `{ id, nome, foto, telefone, status }`. O campo `telefone` é incluído pois é necessário para o chatbot identificar o pescador.

### Normalização de telefone

**R005** — Parâmetros de telefone na URL (`:telefone`) aceitam qualquer formato (com/sem máscara, espaços). O servidor normaliza removendo todos os caracteres não numéricos antes de buscar no banco.

**R006** — O telefone armazenado no banco também é normalizado no momento do cadastro do associado. A busca por telefone é portanto uma busca exata em dígitos.

### Fluxo de cadastro de produto via chatbot

**R007** — O endpoint `POST /api/publico/pescador/telefone/:tel/produto` é o único endpoint de **escrita** na API pública.

**R008** — Antes de cadastrar o produto, o endpoint chama `sincronizarAtrasos()` para garantir que o status de inadimplência do pescador está atualizado.

**R009** — O produto só é cadastrado se:
- O pescador (associado) estiver com `status = "ativo"`, E
- Existir ao menos uma loja do pescador com `status = "aprovada"`.

**R010** — Se o pescador tiver **uma única** loja aprovada, o `lojaId` no body é **opcional** — o sistema resolve automaticamente.

**R011** — Se o pescador tiver **mais de uma** loja aprovada, o `lojaId` é **obrigatório**. Sem ele, retorna erro 409.

**R012** — Toda operação bem-sucedida do chatbot gera log de auditoria com `{ canal: "chatbot_whatsapp", telefone, especie, lojaId }`.

**R013** — O produto cadastrado via chatbot recebe apenas: `especie`, `precoPorKg`, `pesoDisponivel`. Campos como `categoria`, `cortesDisponiveis`, `badges` não são enviados pelo chatbot e assumem defaults do banco.

---

## Pré-condições

Para os endpoints de leitura: nenhuma — são públicos.

Para o cadastro de produto:
- Pescador identificado por telefone existe no banco.
- Pescador está `ativo`.
- Pescador tem ao menos uma loja `aprovada`.
- Se mais de uma loja, `lojaId` fornecido no body e pertence ao pescador.

---

## Pós-condições

Após cadastro de produto via chatbot:
- Produto existe na tabela `produtos` vinculado à loja correta.
- Log de auditoria registrado com canal `chatbot_whatsapp`.
- Resposta contém `{ id, especie, precoPorKg, pesoDisponivel, pescador: { id, nome }, loja: { id, nomeLoja } }`.

---

## Casos de Aceitação

**AC-001** | `GET /api/publico/associados/ativos` → retorna lista sem CPF, email. *(valida R001, R004)*

**AC-002** | `GET /api/publico/pescador/:id/ativo` → retorna somente `true` ou `false`. *(valida R002)*

**AC-003** | `GET /api/publico/pescador/:id/status` → retorna somente `{ id, nome, status }`. *(valida R003)*

**AC-004** | Telefone `"(27) 98765-4321"` na URL → buscado como `"27987654321"` no banco. *(valida R005)*

**AC-005** | Dado pescador `inadimplente`, quando chatbot tenta cadastrar produto → então retorna 403 "Pescador não pode vender". *(valida R009)*

**AC-006** | Dado pescador `ativo` sem loja aprovada, quando chatbot tenta cadastrar produto → então retorna 403. *(valida R009)*

**AC-007** | Dado pescador `ativo` com uma loja aprovada, quando chatbot cadastra produto sem `lojaId` → então produto é criado na única loja disponível. *(valida R010)*

**AC-008** | Dado pescador `ativo` com duas lojas aprovadas, quando chatbot cadastra produto sem `lojaId` → então retorna 409 "Pescador possui mais de uma loja aprovada; informe lojaId". *(valida R011)*

**AC-009** | Dado pescador `ativo` com duas lojas aprovadas, quando chatbot cadastra produto com `lojaId` da segunda loja → então produto é criado na segunda loja. *(valida R011)*

**AC-010** | Toda criação via chatbot → log de auditoria contém `canal: "chatbot_whatsapp"`. *(valida R012)*

**AC-011** | `GET /api/publico/loja/:id/ativa` → retorna somente `true` ou `false`. *(valida R002)*

---

## Rastreabilidade

**Serviços / Implementação**
- `backend/src/modulos/api-publica/api-publica.rotas.ts` *(lógica inline — sem servico.ts separado)*
  - Função auxiliar `contarLojasAprovadas()`
  - Usa `mensalidadesServico.sincronizarAtrasos()` antes do cadastro
  - Usa `registrarAuditoria()` para R012
- `backend/src/compartilhado/telefone.ts` → `normalizarTelefone()` *(implementa R005, R006)*

**Endpoints (todos sem autenticação)**
- `GET /api/publico/associados/ativos`
- `GET /api/publico/lojas/aprovadas`
- `GET /api/publico/pescador/:id/pode-vender`
- `GET /api/publico/pescador/telefone/:tel/pode-vender`
- `GET /api/publico/pescador/:id/status`
- `GET /api/publico/pescador/:id/ativo`
- `GET /api/publico/pescador/telefone/:tel/ativo`
- `GET /api/publico/loja/:id/ativa`
- `POST /api/publico/pescador/telefone/:tel/produto`

**Entidades Prisma**
- `Associado` (`status`, `telefone`, `nome`, `foto`)
- `Loja` (`status`, `associadoId`)
- `Produto` (`especie`, `precoPorKg`, `pesoDisponivel`, `lojaId`)
- `LogAuditoria`

**Schemas de validação**
- `esquemaCadastrarProdutoChatbot` (definido inline em `api-publica.rotas.ts`)

**Testes**
- `backend/src/__tests__/SPEC-005-normalizacao-telefone.test.ts` *(testes puros, sem banco)*

**Docs relacionados**
- [`docs/COMO_USAR.md`](../COMO_USAR.md) — seção "Integração externa"
- [`docs/API.md`](../API.md) — seção "Endpoints públicos"
- [`SPEC-001`](SPEC-001-ciclo-vida-associado.md) — status do associado é verificado em R009
- [`SPEC-002`](SPEC-002-inadimplencia-mensalidades.md) — `sincronizarAtrasos` chamado em R008
- [`SPEC-003`](SPEC-003-aprovacao-loja.md) — status da loja é verificado em R009

---

## Alerta de Estabilidade

Este contrato **não deve ser alterado** sem:
1. Notificar o time responsável pelo chatbot WhatsApp.
2. Versionar a API (ex: `/v2/publico/...`) se a mudança for incompatível.
3. Manter o endpoint antigo funcionando durante o período de transição.

Rotas de leitura com retorno booleano (`/ativo`, `/ativa`) são especialmente sensíveis — qualquer alteração no tipo de retorno quebra o chatbot silenciosamente.
