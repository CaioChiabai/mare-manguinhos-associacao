# Arquitetura

## Stack escolhida

### Frontend

- React 18
- Vite
- React Router
- shadcn/ui
- Tailwind CSS

### Backend

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- JWT para autenticação

## Estrutura do repositório

```text
.
├── Planejamento_Sistema_Associacao.md
├── backend/
│   ├── prisma/
│   └── src/
└── frontend/
    └── src/
```

## Organização do backend

O backend foi separado por módulos de domínio:

- `autenticacao`
- `associados`
- `lojas`
- `permissoes`
- `reunioes`
- `mensalidades`
- `dashboard`
- `api-publica`
- `auditoria`

Cada módulo segue o padrão:

- `*.esquemas.ts`: validação de entrada com Zod
- `*.servico.ts`: regras de negócio e persistência
- `*.rotas.ts`: exposição HTTP via Fastify

Além dos módulos administrativos, o backend agora inclui módulos operacionais para o ciclo comercial:

- `produtos`
- `vendas`
- `transportes`

Esses módulos cuidam do catálogo de loja, registro de vendas, controle de estoque e acompanhamento de entregas.

O backend também expõe módulos voltados ao aplicativo de delivery do consumidor final:

- `app`: autenticação própria do consumidor (JWT tipo `consumidor`), vitrine, catálogo, pedidos, perfil, endereços e pagamento (Pix e cartão)
- `app-frete`: cálculo de frete para as entregas do app

Esses módulos têm fluxo de autenticação separado do painel administrativo.

Arquivos compartilhados:

- [backend/src/aplicacao.ts](backend/src/aplicacao.ts): composição da API
- [backend/src/middlewares/autenticar.ts](backend/src/middlewares/autenticar.ts): proteção por JWT
- [backend/src/compartilhado/auditoria.ts](backend/src/compartilhado/auditoria.ts): registro de logs
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma): modelo de dados

## Organização do frontend

No frontend, a integração foi separada em camadas:

- `contexts/`: estado global de autenticação
- `hooks/`: hooks de acesso ao contexto
- `servicos/`: chamadas HTTP para a API
- `tipos/`: contratos compartilhados com a camada visual
- `pages/`: telas do painel
- `components/`: layout e componentes reutilizáveis

## Fluxos principais

### Autenticação

1. Usuário faz login.
2. API devolve `token` JWT + perfil.
3. Token é salvo no `localStorage`.
4. Rotas protegidas só renderizam com sessão válida.

### Status do associado

O status do associado afeta diretamente o restante do sistema:

- `ativo`: pode manter loja aprovada e permissões ativas
- `inadimplente`: perde elegibilidade comercial
- `suspenso` / `bloqueado`: exigem atuação administrativa

### Mensalidades

O backend recalcula atrasos e sincroniza o status do associado:

- mensalidade vencida e sem pagamento vira `atrasado`
- associado com débito vira `inadimplente`
- ao regularizar, volta para `ativo`, se não estiver suspenso ou bloqueado

### Lojas

Uma loja só pode ser aprovada se o associado estiver `ativo`.

### Integração pública

O módulo `api-publica` concentra dados de leitura para consumo por sistemas externos.

Regras de segurança aplicadas:

- respostas públicas devem expor apenas o necessário para o uso operacional
- os endpoints `.../ativo` e `.../ativa` devolvem somente `true` ou `false`
- listas públicas não retornam CPF, e-mail, telefone ou outros dados sensíveis
- o endpoint de status devolve apenas `id`, `nome` e `status`

## Specs de domínio (SDD)

As regras de negócio críticas do sistema estão formalizadas em [`docs/specs/`](specs/README.md).

| Spec | O que cobre |
|---|---|
| [SPEC-001](specs/SPEC-001-ciclo-vida-associado.md) | Máquina de estados do associado (ativo / suspenso / inadimplente / bloqueado) |
| [SPEC-002](specs/SPEC-002-inadimplencia-mensalidades.md) | Inadimplência automática via mensalidades |
| [SPEC-003](specs/SPEC-003-aprovacao-loja.md) | Fluxo de aprovação de loja |
| [SPEC-004](specs/SPEC-004-estoque-vendas.md) | Controle transacional de estoque em vendas |
| [SPEC-005](specs/SPEC-005-api-publica-chatbot.md) | Contrato público da API (chatbot WhatsApp) |

Testes derivados das specs ficam em `backend/src/__tests__/`. Execute com:

```bash
cd backend && npm test
```

## Motivos da arquitetura

- `Fastify` foi escolhido por simplicidade, velocidade e boa ergonomia para MVP.
- `Prisma + PostgreSQL` oferecem persistência robusta e pronta para produção, com migrações versionadas.
- O frontend foi mantido próximo da estrutura original, mas com camada de serviços e autenticação real.
- A separação por módulos reduz acoplamento e facilita a evolução do sistema.
