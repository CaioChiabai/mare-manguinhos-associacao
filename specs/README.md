# Specs — Spec-Driven Development com GitHub Spec Kit

Este diretório é gerenciado pelo **[GitHub Spec Kit](https://github.com/github/spec-kit)**, a
ferramenta oficial de *Spec-Driven Development* (SDD). Cada feature vive em uma pasta
`NNN-nome-da-feature/` com os artefatos gerados pelo fluxo do Spec Kit.

## Como o Spec Kit está instalado

- `.specify/` — motor do Spec Kit: `memory/constitution.md` (princípios do projeto),
  `templates/` (spec/plan/tasks/checklist) e `scripts/`.
- `.claude/skills/speckit-*` — comandos do fluxo (`/speckit-constitution`, `/speckit-specify`,
  `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, e os opcionais
  `/speckit-clarify`, `/speckit-analyze`, `/speckit-checklist`).
- `specs/NNN-*/` — as features especificadas (abaixo).

Inicializado com:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration claude
```

## Fluxo (SDD)

`Constitution → Specify → (Clarify) → Plan → Tasks → (Analyze) → Implement`

Cada pasta de feature contém:

| Artefato | Origem | Conteúdo |
|---|---|---|
| `spec.md` | `/speckit-specify` | O *quê* e o *porquê*: histórias, requisitos (FR), critérios de aceitação |
| `plan.md` | `/speckit-plan` | O *como*: stack, estrutura, decisões técnicas, checagem da constituição |
| `tasks.md` | `/speckit-tasks` | Tarefas rastreáveis por história de usuário |

## Índice de features

| Feature | Título | Status |
|---|---|---|
| [001](001-ciclo-vida-associado/spec.md) | Ciclo de Vida do Status do Associado | Implementada |
| [002](002-inadimplencia-mensalidades/spec.md) | Inadimplência Automática por Mensalidades | Implementada |
| [003](003-aprovacao-loja/spec.md) | Fluxo de Aprovação de Loja | Implementada |
| [004](004-estoque-vendas/spec.md) | Controle Transacional de Estoque em Vendas | Implementada |
| [005](005-api-publica-chatbot/spec.md) | Contrato Público da API (Chatbot WhatsApp) | Implementada |
| [006](006-pedidos-app-delivery/spec.md) | Pedidos do App Delivery (Consumidor) | Implementada |

## Relação com `docs/`

- **[docs/EPICS.md](../docs/EPICS.md)** — épicos e histórias de usuário que originam estas specs.
- **[docs/specs/](../docs/specs/)** — versão narrativa/histórica das mesmas regras (mantida como
  referência de leitura na documentação MkDocs; a fonte de verdade do fluxo SDD é este diretório).
- **[backend/src/\_\_tests\_\_/](../backend/src/__tests__/)** — testes Vitest derivados dos critérios de aceitação.
