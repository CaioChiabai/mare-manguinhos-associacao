# API

## Base local

- API administrativa: `http://localhost:3333`
- Healthcheck: `GET /saude`

## Autenticação

### `POST /auth/login`

Body:

```json
{
  "email": "admin@pescadores.local",
  "senha": "admin123"
}
```

### `GET /auth/eu`

Retorna o usuário autenticado. Requer header:

```text
Authorization: Bearer <token>
```

## Endpoints autenticados

Todos abaixo exigem JWT.

### Associados

- `GET /api/associados`
- `GET /api/associados/:id`
- `POST /api/associados`
- `PUT /api/associados/:id`
- `PATCH /api/associados/:id/status`
- `DELETE /api/associados/:id`

### Lojas

- `GET /api/lojas`
- `GET /api/lojas/:id`
- `POST /api/lojas`
- `PUT /api/lojas/:id`
- `PATCH /api/lojas/:id/status`
- `DELETE /api/lojas/:id`

### Permissões

- `GET /api/permissoes`
- `GET /api/permissoes/:id`
- `POST /api/permissoes`
- `PUT /api/permissoes/:id`
- `PATCH /api/permissoes/:id/ativa`
- `DELETE /api/permissoes/:id`

### Reuniões

- `GET /api/reunioes`
- `GET /api/reunioes/:id`
- `POST /api/reunioes`
- `PUT /api/reunioes/:id`
- `PATCH /api/reunioes/:id/status`
- `PATCH /api/reunioes/:id/presenca`
- `DELETE /api/reunioes/:id`

### Mensalidades

- `GET /api/mensalidades`
- `GET /api/mensalidades/:id`
- `POST /api/mensalidades`
- `PUT /api/mensalidades/:id`
- `PATCH /api/mensalidades/:id/pagamento`
- `DELETE /api/mensalidades/:id`

### Dashboard e auditoria

- `GET /api/dashboard`
- `GET /api/auditoria`

O endpoint `GET /api/dashboard` retorna também um resumo financeiro calculado a partir das mensalidades:

```json
{
  "resumoFinanceiro": {
    "valorEmAberto": 1500,
    "valorAtrasado": 500,
    "valorRecebidoMesAtual": 1000,
    "mensalidadesPendentes": 20,
    "mensalidadesAtrasadas": 10
  }
}
```

## Endpoints públicos

Esses endpoints foram preparados para integração externa:

- `GET /api/publico/associados/ativos`
- `GET /api/publico/lojas/aprovadas`
- `GET /api/publico/pescador/:id/ativo`
- `GET /api/publico/loja/:id/ativa`
- `GET /api/publico/pescador/:id/pode-vender`
- `GET /api/publico/pescador/:id/status`

Retorno esperado:

- os endpoints `.../ativo` e `.../ativa` retornam apenas `true` ou `false`
- os endpoints de listas públicas retornam somente dados operacionais mínimos, sem CPF, e-mail, telefone ou outros dados sensíveis
- o endpoint `.../status` devolve apenas `id`, `nome` e `status`

## Regras principais

- loja só pode ser aprovada se o associado estiver `ativo`
- permissão ativa só pode existir para associado `ativo`
- mensalidade vencida e sem pagamento vira `atrasado`
- associado com pendências pode virar `inadimplente`
- ações críticas geram log em auditoria
