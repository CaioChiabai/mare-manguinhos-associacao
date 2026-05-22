# Sistema Web da Associação de Pescadores
**Documentação de Planejamento do Projeto**

---

## Sumário

1. [Objetivo do Projeto](#1-objetivo-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Plano de Implementação por Fases](#3-plano-de-implementação-por-fases)
4. [Estrutura do Banco de Dados](#4-estrutura-do-banco-de-dados)
5. [Papéis e Permissões](#5-papéis-e-permissões)
6. [Fluxo Principal do Sistema](#6-fluxo-principal-do-sistema)
7. [Ordem de Implementação](#7-ordem-de-implementação)
8. [Estimativa de Prazo](#8-estimativa-de-prazo)

---

## 1. Objetivo do Projeto

Desenvolver um **Sistema Web para a Associação de Pescadores**, com as seguintes responsabilidades:

- Gerenciar associados e seus dados cadastrais
- Controlar status de cada associado (ativo, suspenso, inadimplente, bloqueado)
- Aprovar lojas dos pescadores cadastradas na plataforma
- Definir e controlar permissões de venda
- Fornecer API REST para integração com o aplicativo marketplace
- Centralizar os dados oficiais da associação

---

## 2. Arquitetura do Sistema

### 2.1 Componentes

| Componente | Descrição |
|---|---|
| Frontend Web | Painel administrativo da associação |
| Backend API REST | Camada de negócio e exposição de dados |
| Banco de Dados | Persistência central das informações |
| App Mobile (consumidor) | Aplicativo marketplace integrado via API |

### 2.2 Fluxo de Dados

```
Painel Admin (Web)
       │
       ▼
  Backend API REST
       │
       ├──▶ Banco de Dados
       │
       └──▶ App Mobile
```

---

## 3. Plano de Implementação por Fases

### Fase 1 — Fundação do Sistema

**Duração estimada:** 1–2 semanas

**Objetivo:** Criar a estrutura inicial da aplicação, autenticação e base de usuários administrativos.

**Funcionalidades:**
- Sistema de login com autenticação segura
- Cadastro de usuários administradores
- Controle de permissões por papel (`ADMIN`)
- Layout base e estrutura de navegação do sistema
- Modelagem e criação da estrutura do banco de dados
- Configuração da API base

**Critérios de Aceite:**
- [ ] Login funcional com autenticação
- [ ] Dashboard básico acessível após login
- [ ] Usuário administrador inicial criado

---

### Fase 2 — Módulo de Associados

**Duração estimada:** 1 semana

**Objetivo:** Implementar o cadastro e gestão completa de pescadores associados.

**Dados cadastrais do associado:**

| Campo | Tipo |
|---|---|
| Nome completo | Texto |
| CPF | Texto (formatado) |
| Telefone | Texto |
| Endereço | Texto |
| Data de entrada | Data |
| Status | Enumerado |
| Observações | Texto longo |

**Operações disponíveis:**
- Criar associado
- Editar dados cadastrais
- Inativar associado
- Listar associados com paginação
- Buscar por nome, CPF ou status

**Critérios de Aceite:**
- [ ] Tela de cadastro e edição completa e funcional
- [ ] Listagem com filtros e busca operacionais

---

### Fase 3 — Controle de Status e Permissões

**Duração estimada:** 3–5 dias

**Objetivo:** Implementar o ciclo de vida de status dos associados e as regras de negócio de permissão de venda.

**Status disponíveis:**

| Status | Pode vender? |
|---|---|
| Ativo | ✅ Sim |
| Inadimplente | ❌ Não |
| Suspenso | ❌ Não |
| Bloqueado | ❌ Não |

> **Regra de negócio:** Somente associados com status **Ativo** têm permissão de venda habilitada.

**Funcionalidades:**
- Alteração manual de status pelo administrador
- Registro de motivo obrigatório para bloqueios e suspensões
- Histórico completo de alterações de status por associado

**Critérios de Aceite:**
- [ ] Controle de permissão de venda funcionando conforme regras de negócio
- [ ] Histórico de status acessível por associado

---

### Fase 4 — Módulo de Lojas

**Duração estimada:** 1 semana

**Objetivo:** Permitir o cadastro e o fluxo de aprovação das lojas vinculadas aos pescadores.

**Dados da loja:**

| Campo | Tipo |
|---|---|
| Nome da loja | Texto |
| Descrição | Texto longo |
| Proprietário (associado) | Relacionamento |
| Status | Enumerado |
| Data de aprovação | Data |

**Status possíveis da loja:** `Pendente` → `Aprovada` / `Rejeitada` / `Suspensa`

**Operações disponíveis:**
- Criar loja vinculada a um associado
- Aprovar loja
- Rejeitar loja (com motivo)
- Suspender loja

**Critérios de Aceite:**
- [ ] Fluxo completo de aprovação de loja funcionando
- [ ] Somente associados ativos podem ter lojas aprovadas

---

### Fase 5 — Módulo Financeiro / Mensalidades

**Duração estimada:** 1 semana

**Objetivo:** Controlar o pagamento de mensalidades e automatizar a atualização de status por inadimplência.

**Funcionalidades:**
- Registro de pagamentos realizados
- Listagem de associados inadimplentes
- Histórico de pagamentos por associado
- Atualização automática de status por inadimplência

> **Regra de negócio:** Associados com mensalidade em aberto têm o status alterado para **Inadimplente** e perdem a permissão de venda automaticamente.

**Critérios de Aceite:**
- [ ] Controle financeiro básico operacional
- [ ] Status de inadimplência atualizado automaticamente conforme regras

---

### Fase 6 — API para Integração com o App

**Duração estimada:** 1 semana

**Objetivo:** Expor endpoints REST para consumo pelo aplicativo mobile marketplace.

**Endpoints:**

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/publico/associados/ativos` | Retorna associados ativos com dados operacionais mínimos |
| `GET` | `/api/publico/lojas/aprovadas` | Retorna lojas aprovadas com dados operacionais mínimos |
| `GET` | `/api/publico/pescador/{id}/ativo` | Retorna `true` quando o pescador está ativo, `false` caso contrário |
| `GET` | `/api/publico/pescador/{id}/pode-vender` | Verifica se o pescador está habilitado para venda |
| `GET` | `/api/publico/pescador/{id}/status` | Retorna o status atual do pescador |
| `GET` | `/api/publico/pescador/telefone/{telefone}/ativo` | Variante por telefone, consumida pelo chatbot. O servidor normaliza o telefone (remove tudo que não for dígito) antes da busca |
| `GET` | `/api/publico/pescador/telefone/{telefone}/pode-vender` | Variante por telefone para o chatbot, com a mesma normalização |
| `GET` | `/api/publico/loja/{id}/ativa` | Retorna `true` quando a loja está ativa, `false` caso contrário |

**Critérios de Aceite:**
- [ ] Todos os endpoints documentados e funcionais
- [ ] API autenticada e consumível pelo aplicativo mobile

---

### Fase 7 — Dashboard Administrativo

**Duração estimada:** 3 dias

**Objetivo:** Fornecer uma visão consolidada dos dados operacionais da associação.

**Indicadores exibidos:**
- Total de associados cadastrados
- Total de associados ativos
- Total de associados inadimplentes
- Total de lojas aprovadas
- Total de lojas com aprovação pendente

**Critérios de Aceite:**
- [ ] Dashboard exibindo todos os indicadores em tempo real

---

### Fase 8 — Auditoria e Logs

**Duração estimada:** 3 dias

**Objetivo:** Garantir rastreabilidade de todas as ações críticas realizadas no sistema.

**Eventos registrados:**

| Evento | Dados registrados |
|---|---|
| Aprovação de loja | Usuário, data, loja |
| Rejeição de loja | Usuário, data, loja, motivo |
| Bloqueio de pescador | Usuário, data, associado, motivo |
| Alteração de status | Usuário, data, associado, status anterior, status novo |

**Critérios de Aceite:**
- [ ] Log de auditoria acessível pelo administrador
- [ ] Registros imutáveis e com data e autoria

---

## 4. Estrutura do Banco de Dados

### 4.1 Tabela `users`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID / INT | Identificador único |
| `nome` | VARCHAR | Nome completo |
| `email` | VARCHAR | E-mail (único) |
| `senha` | VARCHAR | Hash da senha |
| `role` | ENUM | Papel do usuário (`ADMIN`, etc.) |

### 4.2 Tabela `associados`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID / INT | Identificador único |
| `user_id` | FK → users | Referência ao usuário |
| `cpf` | VARCHAR | CPF do pescador (único) |
| `telefone` | VARCHAR | Telefone de contato (único; armazenado apenas com dígitos — a normalização é feita na escrita) |
| `status` | ENUM | Status atual (`ativo`, `inadimplente`, `suspenso`, `bloqueado`) |
| `data_entrada` | DATE | Data de associação |

### 4.3 Tabela `lojas`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID / INT | Identificador único |
| `associado_id` | FK → associados | Dono da loja |
| `nome` | VARCHAR | Nome da loja |
| `descricao` | TEXT | Descrição da loja |
| `status` | ENUM | Status (`pendente`, `aprovada`, `rejeitada`, `suspensa`) |
| `data_aprovacao` | DATE | Data da aprovação (nullable) |

### 4.4 Tabela `mensalidades`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID / INT | Identificador único |
| `associado_id` | FK → associados | Associado pagador |
| `valor` | DECIMAL | Valor da mensalidade |
| `data_pagamento` | DATE | Data do pagamento |
| `status` | ENUM | Status (`pago`, `pendente`, `atrasado`) |

### 4.5 Tabela `logs`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID / INT | Identificador único |
| `usuario` | FK → users | Usuário que realizou a ação |
| `acao` | VARCHAR | Descrição da ação |
| `entidade` | VARCHAR | Entidade afetada |
| `data` | TIMESTAMP | Data e hora do evento |

---

## 5. Papéis e Permissões

| Papel | Descrição | Permissões |
|---|---|---|
| `ADMIN` | Gestor da associação | Gerenciamento completo do sistema |
| `ASSOCIADO` | Pescador associado | Proprietário de loja, habilitado para venda conforme status |
| `APP (API)` | Aplicativo mobile | Consulta de dados via endpoints públicos da API |

---

## 6. Fluxo Principal do Sistema

```
1. Cadastro do pescador
         │
         ▼
2. Associação aprova o cadastro
         │
         ▼
3. Pescador solicita abertura de loja
         │
         ▼
4. Administrador aprova a loja
         │
         ▼
5. Sistema libera a permissão de venda
         │
         ▼
6. App marketplace exibe a loja
```

---

## 7. Ordem de Implementação

| Prioridade | Módulo |
|---|---|
| 1 | Autenticação e usuários |
| 2 | Cadastro de associados |
| 3 | Controle de status dos associados |
| 4 | Cadastro de lojas |
| 5 | Fluxo de aprovação de lojas |
| 6 | Módulo financeiro (mensalidades) |
| 7 | API para integração com o app |
| 8 | Dashboard administrativo |
| 9 | Auditoria e logs |

---

## 8. Estimativa de Prazo

| Escopo | Prazo estimado |
|---|---|
| MVP (integração com app) | 2–3 semanas |
| Projeto completo | 4–6 semanas (equipe pequena) |

### 8.1 Escopo do MVP

O MVP mínimo para integração com o aplicativo compreende:

1. Login administrativo
2. Cadastro de associados
3. Controle de status do associado
4. Cadastro de lojas
5. Aprovação de lojas
6. Endpoints da API para dados ativos

### 8.2 Próximos Passos

Para geração do backlog detalhado (Jira), user stories e tasks técnicas, informar:

- **Tamanho da equipe** — número de desenvolvedores disponíveis
- **Stack tecnológica** — TypeScript/ Vue.JS
- **Acesso do associado** — o associado terá login próprio no sistema ou apenas o admin gerencia?

---

*Documento gerado para entrega de planejamento técnico — revisão sujeita a alinhamento com a equipe de desenvolvimento.*
