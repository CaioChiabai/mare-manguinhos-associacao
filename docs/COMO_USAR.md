# Como Usar

## Visão geral

O projeto está dividido em duas aplicações:

- `frontend/`: painel web em React
- `backend/`: API REST com autenticação, regras de negócio e persistência em PostgreSQL

## Requisitos

- Node.js 20+ recomendado
- npm 10+ recomendado
- PostgreSQL (local ou em nuvem, ex.: Render)

## 1. Subir o backend

No diretório [backend](backend):

```bash
npm install
cp .env.example .env   # configure DATABASE_URL e JWT_SEGREDO
npm run preparar
npm run dev
```

Antes de rodar, edite o `.env` com os dados do seu banco. As variáveis obrigatórias são:

| Variável             | Obrigatória | Padrão                    | Descrição                                          |
|----------------------|-------------|---------------------------|----------------------------------------------------|
| `DATABASE_URL`       | sim         | —                         | String de conexão PostgreSQL                       |
| `JWT_SEGREDO`        | sim         | —                         | Segredo do JWT (mínimo de 8 caracteres)            |
| `PORTA`              | não         | `3333`                    | Porta da API                                       |
| `HOST`               | não         | `0.0.0.0`                 | Host de bind                                       |
| `ORIGEM_PERMITIDA`   | não         | `http://localhost:5173`   | Origens liberadas no CORS (separadas por vírgula)  |
| `ADMIN_EMAIL_PADRAO` | não         | `admin@pescadores.local`  | E-mail do admin criado no seed                     |
| `ADMIN_SENHA_PADRAO` | não         | `admin123`                | Senha do admin criado no seed                      |
| `ADMIN_NOME_PADRAO`  | não         | `Administrador`           | Nome do admin criado no seed                       |

O comando `npm run preparar` irá:

- gerar o client do Prisma
- aplicar as migrações no banco PostgreSQL
- popular o banco com usuário admin e dados de demonstração
- em seguida, `npm run dev` sobe a API em `http://localhost:3333`

## 2. Subir o frontend

No diretório [frontend](frontend):

```bash
npm install
npm run dev
```

O painel abrirá, por padrão, em `http://localhost:5173`.

Se a API estiver em outra URL, crie um arquivo `.env` dentro da pasta do frontend com:

```bash
VITE_API_URL=http://localhost:3333
```

## 3. Login padrão

- E-mail: `admin@pescadores.local`
- Senha: `admin123`

## 4. O que já está funcional

- login com JWT
- dashboard integrado com indicadores reais
- CRUD de associados
- fluxo de lojas com aprovação/rejeição
- CRUD de permissões com ativação/desativação
- criação e condução de reuniões com presença
- cadastro de mensalidades e baixa de pagamento
- atualização automática de inadimplência
- endpoints públicos para integração externa
- módulos de produtos, vendas e transportes no backend
- logs de auditoria acessíveis pela API

## 5. Integração externa

Para sistemas como vendas, chatbot ou rotas, a integração pública deve preferir os endpoints de leitura abaixo:

- `GET /api/publico/associados/ativos`
- `GET /api/publico/lojas/aprovadas`
- `GET /api/publico/pescador/:id/ativo`
- `GET /api/publico/pescador/:id/pode-vender`
- `GET /api/publico/pescador/:id/status`
- `GET /api/publico/pescador/telefone/:telefone/ativo` (consumido pelo chatbot)
- `GET /api/publico/pescador/telefone/:telefone/pode-vender` (consumido pelo chatbot)
- `GET /api/publico/loja/:id/ativa`

Esses retornos foram mantidos enxutos para não expor CPF, e-mail, telefone ou outros dados sensíveis. As variantes por telefone aceitam o número em qualquer formato — o servidor normaliza removendo espaços e caracteres especiais antes da busca.

## 6. Dados importantes para demo

- O banco é PostgreSQL, configurado via `DATABASE_URL`.
- O mesmo schema vale para desenvolvimento e produção; basta apontar o `DATABASE_URL` para o banco desejado.
- Em produção (ex.: Render), use a *External Database URL* do banco PostgreSQL provisionado.
