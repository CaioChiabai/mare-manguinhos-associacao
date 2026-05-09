# SDD - Resumo Financeiro de Mensalidades

## Visao geral

Esta feature adiciona ao dashboard um resumo financeiro das mensalidades da associacao. O objetivo e permitir que a administracao enxergue rapidamente quanto ainda esta em aberto, quanto esta atrasado e quanto foi recebido no mes atual.

A implementacao foi guiada por Spec-Driven Development (SDD): antes de alterar o codigo, a feature foi descrita em termos de contrato, regras de negocio, interface esperada, testes e limites de escopo.

## Especificacao da feature

### Problema

O sistema ja registrava mensalidades, pagamentos e inadimplencia, mas o dashboard mostrava apenas a quantidade de mensalidades em aberto. Faltava uma visao financeira consolidada para apoiar decisoes administrativas.

### Contrato da API

O endpoint autenticado `GET /api/dashboard` passa a retornar o objeto `resumoFinanceiro`:

```ts
resumoFinanceiro: {
  valorEmAberto: number;
  valorAtrasado: number;
  valorRecebidoMesAtual: number;
  mensalidadesPendentes: number;
  mensalidadesAtrasadas: number;
}
```

### Regras de calculo

- `valorEmAberto`: soma de mensalidades com status `pendente` ou `atrasado`.
- `valorAtrasado`: soma de mensalidades com status `atrasado`.
- `valorRecebidoMesAtual`: soma de mensalidades com status `pago` e `dataPagamento` dentro do mes atual.
- `mensalidadesPendentes`: quantidade de mensalidades com status `pendente`.
- `mensalidadesAtrasadas`: quantidade de mensalidades com status `atrasado`.
- Quando uma agregacao do Prisma retornar `null`, o valor apresentado deve ser `0`.

## Como o SDD guiou a implementacao

No SDD, a especificacao funciona como fonte de verdade antes do codigo. Para esta feature, isso evitou decisoes implicitas durante a implementacao:

- o formato do retorno da API foi definido antes da tela;
- as regras de soma foram separadas por status;
- o periodo de "mes atual" foi definido como intervalo entre o primeiro dia do mes e o primeiro dia do proximo mes;
- a feature ficou limitada ao dashboard, sem criar rota nova ou alterar o banco.

Com isso, a implementacao ficou pequena e verificavel: o backend calcula os dados, o frontend apenas renderiza o contrato e a documentacao registra a decisao.

## Implementacao

### Backend

O arquivo `backend/src/modulos/dashboard/dashboard.rotas.ts` foi estendido para calcular o resumo financeiro durante a montagem do dashboard.

Antes dos indicadores serem retornados, o backend continua chamando `mensalidadesServico.sincronizarAtrasos()`. Isso garante que mensalidades vencidas sejam marcadas como `atrasado` antes das somas.

Os valores financeiros usam `prisma.mensalidade.aggregate`, evitando buscar todas as mensalidades para somar em memoria. As contagens usam `prisma.mensalidade.count`.

### Frontend

O tipo `DashboardResumo`, em `frontend/src/app/tipos/api.ts`, passou a refletir o novo contrato da API.

A tela `frontend/src/app/pages/Dashboard.tsx` ganhou a secao "Resumo financeiro", com tres cards:

- valor em aberto;
- valor atrasado;
- recebido no mes.

Os valores monetarios usam o helper existente `formatarMoeda`, mantendo o padrao visual do sistema.

### Documentacao

O arquivo `API.md` foi atualizado para registrar que `GET /api/dashboard` agora retorna `resumoFinanceiro`.

Este arquivo documenta a feature como artefato de SDD, explicando a especificacao, as regras, a implementacao e o motivo da abordagem.

## Por que esta feature e adequada para SDD

Esta funcionalidade tem regras objetivas e contrato claro, por isso e um bom exemplo de SDD. A especificacao define exatamente:

- quais dados entram no calculo;
- quais campos saem da API;
- onde o usuario visualiza o resultado;
- o que fica fora do escopo.

Isso reduz ambiguidade, facilita revisao e permite validar a entrega comparando codigo e comportamento com a especificacao original.

## Criterios de aceite

- O dashboard deve continuar carregando os indicadores existentes.
- O retorno de `GET /api/dashboard` deve incluir `resumoFinanceiro`.
- Valores sem mensalidades correspondentes devem aparecer como `0`.
- A interface deve exibir valores monetarios formatados em reais.
- A feature nao deve alterar o schema do banco.
- A documentacao deve explicar o uso de SDD e a implementacao da feature.
