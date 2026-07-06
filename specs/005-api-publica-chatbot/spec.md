# Feature Specification: Contrato Público da API (Chatbot WhatsApp)

**Feature Branch**: `005-api-publica-chatbot`
**Created**: 2026-07-06
**Status**: Implementada
**⚠️ Contrato externo**: Endpoints consumidos pelo chatbot WhatsApp e por terceiros. Não alterar sem coordenação e versionamento.
**Input**: O módulo `api-publica` expõe endpoints sem autenticação para sistemas externos, incluindo o cadastro de produto por pescador via WhatsApp.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar produto via chatbot (Priority: P1)

Como **pescador**, quero cadastrar um produto enviando uma mensagem no WhatsApp, para publicar
minha pesca sem acessar o painel.

**Why this priority**: É o único endpoint público de escrita e o principal canal de entrada de produtos.

**Independent Test**: `POST /api/publico/pescador/telefone/:tel/produto` para pescador ativo com
uma loja aprovada → produto criado.

**Acceptance Scenarios**:

1. **Given** pescador `ativo` com uma loja aprovada, **When** cadastra sem `lojaId`, **Then** produto é criado na única loja. *(FR-010)*
2. **Given** pescador `ativo` com duas lojas aprovadas, **When** cadastra sem `lojaId`, **Then** 409 "informe lojaId". *(FR-011)*
3. **Given** pescador `inadimplente`, **When** tenta cadastrar, **Then** 403 "Pescador não pode vender". *(FR-009)*
4. **Given** cadastro bem-sucedido, **Then** há log de auditoria com `canal: "chatbot_whatsapp"`. *(FR-012)*

---

### User Story 2 - Consultar elegibilidade sem vazar dados (Priority: P1)

Como **sistema externo (app/chatbot)**, quero consultar se um pescador/loja está ativo sem
receber dados sensíveis, para respeitar a privacidade dos associados.

**Acceptance Scenarios**:

1. **Given** `GET /api/publico/associados/ativos`, **Then** a lista não contém CPF nem e-mail. *(FR-001, FR-004)*
2. **Given** `GET /api/publico/pescador/:id/ativo`, **Then** retorna apenas `true`/`false`. *(FR-002)*
3. **Given** `GET /api/publico/pescador/:id/status`, **Then** retorna apenas `{id, nome, status}`. *(FR-003)*

---

### User Story 3 - Busca por telefone com normalização (Priority: P2)

Como **chatbot**, quero identificar o pescador pelo número em qualquer formato, para não depender
de máscara específica.

**Acceptance Scenarios**:

1. **Given** telefone `"(27) 98765-4321"` na URL, **When** consultado, **Then** é buscado como `"27987654321"`. *(FR-005, FR-006)*

### Edge Cases

- Antes de cadastrar, `sincronizarAtrasos()` é chamado para atualizar inadimplência (FR-008).
- Campos não enviados pelo chatbot assumem defaults do banco (FR-013).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Endpoints públicos NÃO DEVEM expor CPF, e-mail ou dados bancários.
- **FR-002**: Endpoints `*/ativo` e `*/ativa` DEVEM retornar apenas um boolean.
- **FR-003**: O endpoint de status DEVE retornar apenas `{id, nome, status}`.
- **FR-004**: A lista de ativos DEVE expor apenas `{id, nome, foto, telefone, status}` (telefone é necessário ao chatbot).
- **FR-005**: Parâmetros de telefone DEVEM ser normalizados (só dígitos) antes da busca.
- **FR-006**: O telefone DEVE ser normalizado também na escrita do cadastro do associado.
- **FR-007**: `POST .../telefone/:tel/produto` DEVE ser o único endpoint público de escrita.
- **FR-008**: Antes do cadastro, o sistema DEVE chamar `sincronizarAtrasos()`.
- **FR-009**: O produto só DEVE ser cadastrado se o pescador estiver `ativo` E tiver loja `aprovada`.
- **FR-010**: Com uma única loja aprovada, `lojaId` PODE ser omitido (resolvido automaticamente).
- **FR-011**: Com mais de uma loja aprovada, `lojaId` DEVE ser obrigatório.
- **FR-012**: Toda escrita via chatbot DEVE gerar auditoria com `canal: "chatbot_whatsapp"`.
- **FR-013**: O produto do chatbot recebe apenas `especie`, `precoPorKg`, `pesoDisponivel`; o resto usa defaults.

### Key Entities

- **Associado** (`status`, `telefone`, `nome`, `foto`), **Loja** (`status`), **Produto**, **LogAuditoria**.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma resposta pública contém CPF/e-mail/dados bancários.
- **SC-002**: 100% das buscas por telefone funcionam independente da máscara enviada.
- **SC-003**: Nenhum produto é cadastrado por pescador inapto (inadimplente/sem loja aprovada).

## Assumptions

- O chatbot WhatsApp é um sistema externo confiável na borda (não há auth por token público).
- Mudanças incompatíveis exigem versionamento (`/v2/publico/...`) — ver *Alerta de Estabilidade*.

## Alerta de Estabilidade

Este contrato **não deve** ser alterado sem: (1) notificar o time do chatbot, (2) versionar a API
se incompatível, (3) manter o endpoint antigo durante a transição. Retornos booleanos são
especialmente sensíveis: mudar o tipo quebra o chatbot silenciosamente.
