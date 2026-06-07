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

### Dashboard

- `GET /api/dashboard`

Sincroniza atrasos de mensalidades e retorna três blocos:

```json
{
  "indicadores": {
    "totalAssociados": 50,
    "associadosAtivos": 40,
    "associadosInadimplentes": 5,
    "associadosSuspensos": 3,
    "associadosBloqueados": 2,
    "lojasAprovadas": 10,
    "lojasPendentes": 3,
    "reunioesAgendadas": 2,
    "permissoesAtivas": 15,
    "mensalidadesPendentes": 20
  },
  "resumoFinanceiro": {
    "valorEmAberto": 1500,
    "valorAtrasado": 500,
    "valorRecebidoMesAtual": 1000,
    "mensalidadesPendentes": 20,
    "mensalidadesAtrasadas": 10
  },
  "atividadeRecente": []
}
```

`atividadeRecente` retorna os últimos 8 registros de auditoria com dados do usuário que executou a ação.

### Auditoria

- `GET /api/auditoria`

Parâmetros de consulta (query):

| Parâmetro  | Tipo   | Padrão | Descrição                          |
|------------|--------|--------|------------------------------------|
| `entidade` | string | —      | Filtra por tipo de entidade        |
| `pagina`   | number | 1      | Página atual                       |
| `porPagina`| number | 20     | Itens por página (máx. 100)        |

Retorna resultado paginado: `itens`, `total`, `pagina`, `porPagina`, `totalPaginas`.

### Produtos

Catálogo de produtos das lojas. Todas exigem JWT.

- `GET /api/produtos`
- `GET /api/produtos/:id`
- `POST /api/produtos`
- `PUT /api/produtos/:id`
- `DELETE /api/produtos/:id`

### Vendas

Registro e acompanhamento do ciclo comercial. Todas exigem JWT.

- `GET /api/vendas`
- `GET /api/vendas/:id`
- `POST /api/vendas`
- `PATCH /api/vendas/:id/status`
- `DELETE /api/vendas/:id`

### Transportes

Controle logístico das entregas. Todas exigem JWT.

- `GET /api/transportes`
- `GET /api/transportes/:id`
- `POST /api/transportes`
- `PUT /api/transportes/:id`
- `PATCH /api/transportes/:id/status`
- `DELETE /api/transportes/:id`

## App do consumidor (`/api/app`)

Módulo que atende o aplicativo de delivery para o consumidor final. Possui autenticação própria por JWT (tipo `consumidor`), separada do painel administrativo.

### Autenticação (públicas)

- `POST /api/app/auth/cadastro` — cadastra um consumidor e retorna o perfil com `token`
- `POST /api/app/auth/login` — autentica e retorna o perfil com `token`
- `GET /api/app/auth/eu` — retorna o consumidor autenticado (requer `Authorization: Bearer <token>`)

### Vitrine e produtos (públicas)

- `GET /api/app/vitrine` — monta a vitrine inicial do app
- `GET /api/app/produtos` — lista produtos disponíveis (aceita filtros via query)
- `GET /api/app/produtos/:id` — detalha um produto

### Pedidos (autenticadas)

- `POST /api/app/pedidos`
- `GET /api/app/pedidos/meus`
- `GET /api/app/pedidos/:id`

### Perfil e endereços (autenticadas)

- `GET /api/app/perfil`
- `PUT /api/app/perfil`
- `GET /api/app/enderecos`
- `POST /api/app/enderecos`
- `DELETE /api/app/enderecos/:id`

### Pagamento (autenticadas)

- `POST /api/app/pagamento/pix` — gera cobrança Pix para um pedido
- `POST /api/app/pagamento/cartao` — processa pagamento por cartão

## Cálculo de frete (`/api/app-frete`)

Endpoint público usado pelo app para estimar o frete de uma entrega.

### `POST /api/app-frete/calcular`

Body:

```json
{
  "endereco": "Rua Exemplo, 123 - Manguinhos",
  "latitude": -22.88,
  "longitude": -43.24
}
```

`latitude` e `longitude` são opcionais; `endereco` é obrigatório (mínimo de 5 caracteres).

## Endpoints públicos

Esses endpoints foram preparados para integração externa:

- `GET /api/publico/associados/ativos`
- `GET /api/publico/lojas/aprovadas`
- `GET /api/publico/pescador/:id/ativo`
- `GET /api/publico/pescador/:id/pode-vender`
- `GET /api/publico/pescador/:id/status`
- `GET /api/publico/pescador/telefone/:telefone/ativo`
- `GET /api/publico/pescador/telefone/:telefone/pode-vender`
- `GET /api/publico/loja/:id/ativa`

### Cadastro de produto via chatbot

- `POST /api/publico/pescador/telefone/:telefone/produto`

Endpoint de escrita consumido pelo chatbot WhatsApp. Cadastra um produto na loja do pescador.

Body:

```json
{
  "especie": "Robalo",
  "precoPorKg": 45.00,
  "pesoDisponivel": 10.5,
  "lojaId": "uuid-opcional"
}
```

- `lojaId` é opcional quando o pescador tem apenas uma loja aprovada; obrigatório se tiver mais de uma.
- Valida se o pescador está `ativo` e possui ao menos uma loja aprovada antes de cadastrar.
- Gera log de auditoria com canal `chatbot_whatsapp`.

### Retorno esperado

- os endpoints `.../ativo` e `.../ativa` retornam apenas `true` ou `false`
- os endpoints de listas públicas retornam dados operacionais mínimos, sem CPF ou e-mail (o endpoint `/associados/ativos` retorna `telefone` para uso operacional)
- o endpoint `.../status` devolve apenas `id`, `nome` e `status`
- as variantes `/pescador/telefone/:telefone/...` aceitam o telefone em qualquer formato (com ou sem máscara) — o servidor remove caracteres não numéricos antes da busca. O telefone é único por associado.

## Regras principais

- loja só pode ser aprovada se o associado estiver `ativo`
- permissão ativa só pode existir para associado `ativo`
- mensalidade vencida e sem pagamento vira `atrasado`
- associado com pendências pode virar `inadimplente`
- ações críticas geram log em auditoria
