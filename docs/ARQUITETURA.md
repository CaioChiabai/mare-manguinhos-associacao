# Arquitetura

Documento técnico da arquitetura do sistema da Associação de Pescadores Maré de Manguinhos.
Cobre visão de alto nível, containers, modelo de dados, fluxos críticos (com diagramas de
sequência) e as decisões arquiteturais que os sustentam.

> As regras de negócio referenciadas aqui são formalizadas via *Spec-Driven Development* em
> [`specs/`](../specs/README.md) (GitHub Spec Kit). Os épicos que as originam estão em
> [`EPICS.md`](EPICS.md).

---

## 1. Visão de contexto (C4 — nível 1)

Quem usa o sistema e com o que ele conversa.

```mermaid
flowchart TB
    admin([Administrador da Associação])
    pescador([Pescador / Associado])
    consumidor([Consumidor final])
    chatbot[["Chatbot WhatsApp<br/>(sistema externo)"]]

    subgraph SIS[Sistema Maré de Manguinhos]
        painel[Painel Web Admin]
        api[API REST]
        app[App Delivery]
    end

    admin --> painel
    consumidor --> app
    pescador -. cadastra produto .-> chatbot
    chatbot -->|API pública| api
    painel --> api
    app --> api
    api --> db[(PostgreSQL)]
```

- **Administrador** opera o painel web (gestão completa).
- **Pescador** cadastra produtos via WhatsApp (chatbot → API pública).
- **Consumidor** compra pelo app de delivery.
- **Chatbot** e outros sistemas externos consomem a **API pública** (sem autenticação, dados mínimos).

---

## 2. Containers (C4 — nível 2)

```mermaid
flowchart LR
    subgraph FE[Frontend - React + Vite]
        pages[Pages] --> services[Camada de serviços HTTP]
        ctx[AuthContext] --> services
    end

    subgraph BE[Backend - Fastify + TypeScript]
        rotas[Rotas HTTP] --> mw[Middleware autenticar JWT]
        mw --> servicos[Serviços de domínio]
        servicos --> prisma[Prisma Client]
        rotas --> esquemas[Schemas Zod]
        servicos --> erros[tratador-erros + auditoria]
    end

    db[(PostgreSQL)]

    services -->|REST + JWT| rotas
    prisma --> db
```

### Stack

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 18, Vite, React Router, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, TypeScript, Fastify, Prisma ORM, Zod, JWT |
| **Banco** | PostgreSQL |
| **Docs** | MkDocs Material |
| **Testes** | Vitest |
| **SDD** | GitHub Spec Kit (`.specify/`, `specs/`) |

---

## 3. Organização do código

### Backend — módulos de domínio

Cada módulo em `backend/src/modulos/<dominio>/` segue a **tríade** fixa:

- `*.rotas.ts` — protocolo HTTP (Fastify); sem regra de negócio.
- `*.servico.ts` — regras de negócio e persistência (Prisma).
- `*.esquemas.ts` — validação/contrato de entrada (Zod).

```mermaid
flowchart TB
    subgraph Admin[Domínio administrativo]
        autenticacao & associados & lojas & permissoes & reunioes & mensalidades & dashboard & auditoria
    end
    subgraph Comercial[Domínio comercial]
        produtos & vendas & transportes
    end
    subgraph Consumidor[Domínio do consumidor]
        app & app-frete
    end
    subgraph Externo[Integração]
        api-publica
    end
```

Arquivos compartilhados:

- [backend/src/aplicacao.ts](../backend/src/aplicacao.ts) — composição da API.
- [backend/src/middlewares/autenticar.ts](../backend/src/middlewares/autenticar.ts) — proteção por JWT.
- [backend/src/compartilhado/tratador-erros.ts](../backend/src/compartilhado/tratador-erros.ts) — erros centralizados.
- [backend/src/compartilhado/erros.ts](../backend/src/compartilhado/erros.ts) — classes de erro de domínio.
- [backend/src/compartilhado/auditoria.ts](../backend/src/compartilhado/auditoria.ts) — registro de logs.
- [backend/src/compartilhado/telefone.ts](../backend/src/compartilhado/telefone.ts) — normalização de telefone.
- [backend/prisma/schema.prisma](../backend/prisma/schema.prisma) — modelo de dados.

### Frontend — camadas

- `contexts/` — estado global de autenticação (`AuthContext`).
- `hooks/` — acesso ao contexto (`useAutenticacao`).
- `servicos/` — chamadas HTTP à API (uma por domínio).
- `tipos/` — contratos compartilhados com a UI.
- `pages/` — telas do painel.
- `components/` — layout e componentes reutilizáveis (shadcn/ui).

---

## 4. Modelo de dados (ER)

```mermaid
erDiagram
    Usuario ||--o{ LogAuditoria : registra
    Associado ||--o{ Loja : possui
    Associado ||--o{ Mensalidade : deve
    Associado ||--o{ Permissao : tem
    Associado ||--o{ HistoricoStatusAssociado : historia
    Associado ||--o{ PresencaReuniao : comparece
    Associado ||--o{ Venda : realiza
    Reuniao ||--o{ PresencaReuniao : lista
    Loja ||--o{ Produto : oferta
    Loja ||--o{ Venda : registra
    Venda ||--o{ ItemVenda : contem
    Venda ||--o| Transporte : entrega
    Produto ||--o{ ItemVenda : compoe
    Produto ||--o{ PedidoItem : compoe
    Consumidor ||--o{ Endereco : cadastra
    Consumidor ||--o{ Pedido : faz
    Pedido ||--o{ PedidoItem : contem

    Associado {
        string id PK
        string cpf UK
        string telefone UK
        string numeroCarteira UK
        string status
    }
    Loja {
        string id PK
        string associadoId FK
        string status
        datetime dataAprovacao
    }
    Produto {
        string id PK
        string lojaId FK
        float precoPorKg
        float pesoDisponivel
        boolean ativo
    }
    Mensalidade {
        string id PK
        string associadoId FK
        string competencia
        datetime dataVencimento
        datetime dataPagamento
        string status
    }
    Venda {
        string id PK
        string lojaId FK
        float total
        string status
    }
    Pedido {
        string id PK
        string consumidorId FK
        float valorTotal
        float frete
        string status
    }
```

Três identidades **separadas** (não compartilham tabela nem credencial): `Usuario` (admin),
`Associado` (pescador), `Consumidor` (app). Ver [SPEC-006 FR-001](../specs/006-pedidos-app-delivery/spec.md).

---

## 5. Autenticação e autorização

Dois contextos de JWT distintos, ambos verificados pelo middleware `autenticar`:

| Token | Emitido em | Campo distintivo | Usado por |
|---|---|---|---|
| Admin | `autenticacao` | `papel = ADMIN` | Painel web |
| Consumidor | `app` | `tipo = consumidor` | App delivery |

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant A as API (/autenticacao)
    participant DB as PostgreSQL

    U->>F: e-mail + senha
    F->>A: POST /api/autenticacao/login
    A->>DB: busca usuário + compara hash (bcrypt)
    DB-->>A: usuário válido
    A-->>F: { token JWT, perfil }
    F->>F: salva token no localStorage
    F->>A: requisições com Authorization: Bearer <token>
    A->>A: middleware autenticar valida assinatura + expiração
```

A **API pública** (`api-publica`) é a exceção: não exige token e expõe apenas o mínimo
(booleanos e projeções sem dados sensíveis) — ver [SPEC-005](../specs/005-api-publica-chatbot/spec.md).

---

## 6. Fluxos críticos

### 6.1 Ciclo de vida do associado

```mermaid
stateDiagram-v2
    [*] --> ativo
    ativo --> suspenso: manual (motivo)
    ativo --> bloqueado: manual (motivo)
    ativo --> inadimplente: automático (mensalidade vencida)
    inadimplente --> ativo: automático (quitação)
    suspenso --> ativo: manual
    bloqueado --> ativo: manual
    note right of suspenso
        Estados protegidos:
        a sincronização automática
        NÃO os altera
    end note
```

Regras em [SPEC-001](../specs/001-ciclo-vida-associado/spec.md). O status governa a elegibilidade
comercial (loja aprovada, permissão ativa, venda, cadastro via chatbot).

### 6.2 Inadimplência automática

Toda operação de mensalidade dispara a sincronização do status do associado:

```mermaid
sequenceDiagram
    participant Admin
    participant R as mensalidades.rotas
    participant S as mensalidades.servico
    participant DB as PostgreSQL

    Admin->>R: PATCH /api/mensalidades/:id/pagamento
    R->>S: registrarPagamento()
    S->>DB: atualiza mensalidade (dataPagamento)
    S->>S: sincronizarStatusAssociado(associadoId)
    S->>DB: há débito vencido?
    alt sem débito e não protegido
        S->>DB: status = ativo + histórico "Regularização financeira"
    else com débito e não protegido
        S->>DB: status = inadimplente + histórico "Mensalidades em aberto"
    end
    S-->>Admin: mensalidade + status sincronizado
```

Regras em [SPEC-002](../specs/002-inadimplencia-mensalidades/spec.md).

### 6.3 Venda com estoque transacional

Venda e ajuste de estoque ocorrem na **mesma transação**, com *optimistic locking*:

```mermaid
sequenceDiagram
    participant Op as Operador
    participant S as vendas.servico
    participant DB as PostgreSQL (transação)

    Op->>S: POST /api/vendas (status=concluida)
    S->>DB: BEGIN $transaction
    S->>DB: cria venda + itens (total calculado no backend)
    loop cada item
        S->>DB: updateMany produto WHERE ativo=true AND pesoDisponivel>=pesoKg
        alt count = 0
            DB-->>S: estoque insuficiente / concorrência
            S->>DB: ROLLBACK
            S-->>Op: 409 Conflito
        end
    end
    S->>DB: COMMIT
    S-->>Op: venda criada + estoque abatido
```

Regras em [SPEC-004](../specs/004-estoque-vendas/spec.md). O mesmo padrão é reutilizado nos
pedidos do app ([SPEC-006](../specs/006-pedidos-app-delivery/spec.md)).

### 6.4 Cadastro de produto via chatbot (fluxo público de escrita)

```mermaid
sequenceDiagram
    participant P as Pescador (WhatsApp)
    participant C as Chatbot
    participant API as api-publica
    participant DB as PostgreSQL

    P->>C: "quero vender tilápia a R$ 25/kg"
    C->>API: POST /api/publico/pescador/telefone/:tel/produto
    API->>API: normalizarTelefone(tel)
    API->>API: sincronizarAtrasos() (atualiza inadimplência)
    API->>DB: pescador ativo? tem loja aprovada?
    alt inapto
        API-->>C: 403 "Pescador não pode vender"
    else 1 loja aprovada
        API->>DB: cria produto na loja + auditoria (canal chatbot_whatsapp)
        API-->>C: produto cadastrado
    else >1 loja e sem lojaId
        API-->>C: 409 "informe lojaId"
    end
```

Regras em [SPEC-005](../specs/005-api-publica-chatbot/spec.md).

---

## 7. Decisões arquiteturais (ADRs resumidas)

| Decisão | Motivo | Trade-off aceito |
|---|---|---|
| **Fastify** em vez de Express | Baixa sobrecarga, boa ergonomia para MVP | Ecossistema de middlewares menor |
| **Prisma + PostgreSQL** | Migrações versionadas, tipagem ponta a ponta | Menos controle fino sobre SQL |
| **Módulos por domínio** (tríade) | Baixo acoplamento, onboarding rápido | Mais arquivos por feature |
| **Zod na borda** | Validação declarativa e tipada | Duplicação leve com tipos Prisma |
| **Erros centralizados** | JSON de erro uniforme, sem vazar stacktrace | Requer disciplina de `throw`/`next` |
| **`$transaction` + optimistic lock** | Consistência de estoque sob concorrência | Retentativas em conflito (409) |
| **Identidades separadas** (admin/pescador/consumidor) | Isolamento de credenciais e contextos | Sem SSO único entre eles |
| **API pública mínima** | Segurança de dados (LGPD) e contrato estável | Menos flexível para novos consumidores |
| **GitHub Spec Kit (SDD)** | Regras críticas explícitas e rastreáveis | Custo de manter specs atualizadas |

---

## 8. Preocupações transversais

- **Auditoria:** ações críticas gravam `LogAuditoria` (`acao`, `entidade`, `entidadeId`, `detalhes`).
- **Validação:** nenhum dado chega ao serviço sem passar por schema Zod.
- **Configuração:** variáveis de ambiente centralizadas em `configuracao/ambiente.ts` (ver [Como Usar](COMO_USAR.md)).
- **CORS:** origens liberadas via `ORIGEM_PERMITIDA`.
- **Testes:** Vitest, derivados dos critérios de aceitação das specs (`backend/src/__tests__/`).

```bash
cd backend && npm test
```
