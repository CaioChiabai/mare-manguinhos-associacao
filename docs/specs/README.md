# Specs de Domínio — Maré Manguinhos

Este diretório contém as especificações formais das regras de negócio do sistema.  
O objetivo é tornar regras implícitas **explícitas e rastreáveis**.

---

## Por que este diretório existe

O sistema já funcionava antes das specs. As specs não descrevem o que será feito — elas **descrevem o que já existe e por quê**, como fonte de verdade para:

- Evitar regressões ao alterar fluxos críticos
- Orientar novos desenvolvedores sem precisar ler todo o código
- Dar base para os testes (cada teste cita a regra que valida)
- Documentar decisões que não cabem em comentários de código

---

## Padrão de uma spec

Cada arquivo segue exatamente este template:

```
SPEC-NNN — Título
Domínio: entidades envolvidas
Status: ativo | depreciado

Objetivo
  Descrição em 2–4 linhas do que esta spec cobre.

Regras de Negócio
  R001 — Regra objetiva em uma linha.
  R002 — ...

Pré-condições
  O que deve ser verdadeiro antes que o fluxo se inicie.

Pós-condições
  O que deve ser verdadeiro após o fluxo concluir.

Casos de Aceitação
  AC-001 | Dado X → quando Y → então Z  (vincula a R001)
  AC-002 | ...

Rastreabilidade
  Serviços   : modulo/modulo.servico.ts → função()
  Endpoints  : MÉTODO /rota
  Entidades  : Modelo Prisma
  Testes     : src/__tests__/SPEC-NNN-*.test.ts
  Docs rel.  : outros arquivos relevantes
```

### Regras do template

- **R** numera regras de negócio (R001, R002…).
- **AC** numera casos de aceitação e sempre cita qual R valida.
- Um AC deve ser testável em isolamento — se precisar do banco inteiro rodando, deixe explícito.
- Não invente requisitos. Extraia do comportamento já implementado.

---

## Índice

| Spec | Título | Status |
|---|---|---|
| [SPEC-001](SPEC-001-ciclo-vida-associado.md) | Ciclo de Vida do Status do Associado | ativo |
| [SPEC-002](SPEC-002-inadimplencia-mensalidades.md) | Inadimplência Automática por Mensalidades | ativo |
| [SPEC-003](SPEC-003-aprovacao-loja.md) | Fluxo de Aprovação de Loja | ativo |
| [SPEC-004](SPEC-004-estoque-vendas.md) | Controle Transacional de Estoque em Vendas | ativo |
| [SPEC-005](SPEC-005-api-publica-chatbot.md) | Contrato Público da API (Chatbot WhatsApp) | ativo |
| [SPEC-006](SPEC-006-pedidos-app-delivery.md) | Pedidos do App Delivery (Consumidor) | ativo ⚠️ gaps |

---

## Rastreabilidade

Para a matriz bidirecional completa (Feature → Spec e Spec → Arquivo/Linha), incluindo gaps identificados:

→ [`docs/specs/RASTREABILIDADE.md`](RASTREABILIDADE.md)

---

## Relação com outros documentos

- [`docs/ARQUITETURA.md`](../ARQUITETURA.md) — fluxos de alto nível (complementar, não substituto)
- [`docs/API.md`](../API.md) — inventário de endpoints
- [`SDD_RESUMO_FINANCEIRO_MENSALIDADES.md`](../../SDD_RESUMO_FINANCEIRO_MENSALIDADES.md) — SDD retrospectivo da feature de resumo financeiro (precede este padrão; mantido como registro histórico)
- [`AUDITORIA_TECNICA.md`](../../AUDITORIA_TECNICA.md) — achados arquiteturais e de segurança

---

## Como criar uma nova spec

1. Copie o template acima.
2. Numere sequencialmente (`SPEC-006`, etc.).
3. Extraia as regras do código — não invente.
4. Adicione ao índice acima.
5. Crie o arquivo de teste correspondente em `backend/src/__tests__/`.
