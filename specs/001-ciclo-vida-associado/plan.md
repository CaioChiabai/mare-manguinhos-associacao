# Implementation Plan: Ciclo de Vida do Status do Associado

**Branch**: `001-ciclo-vida-associado` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

## Summary

Máquina de estados do associado (`ativo`/`suspenso`/`inadimplente`/`bloqueado`) com
transições manuais (admin, exigem motivo) e automáticas (inadimplência). Todo estado
protegido (`suspenso`/`bloqueado`) é imune à sincronização automática. Cada transição é
auditada e historiada.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Fastify, Prisma ORM, Zod, JWT
**Storage**: PostgreSQL (Prisma)
**Testing**: Vitest — `backend/src/__tests__/SPEC-001-validacao-associado.test.ts`
**Project Type**: Web (backend API + frontend React)
**Constraints**: Transições auditáveis; histórico imutável; idempotência em transição repetida.

## Constitution Check

- **I. Domínio explícito**: ✅ regras FR-001..FR-009 numeradas e testadas.
- **II. Tipagem estrita**: ✅ `statusAssociado` validado via Zod em `associados.esquemas.ts`.
- **III. Modular**: ✅ lógica isolada em `associados.servico.ts`.
- **IV. Erros centralizados**: ✅ `ErroValidacao`/`ErroConflito` → `tratador-erros.ts`.
- **V. Consistência/auditoria**: ✅ histórico + `LogAuditoria` a cada transição.

## Project Structure

```text
backend/src/modulos/associados/
├── associados.rotas.ts       # PATCH /api/associados/:id/status
├── associados.servico.ts     # alterarStatus()
└── associados.esquemas.ts    # statusAssociado, esquemaAlterarStatus
backend/src/modulos/mensalidades/mensalidades.servico.ts  # sincronizarStatusAssociado()
backend/src/modulos/lojas/lojas.servico.ts                # atualizarStatus() (FR-008)
backend/src/modulos/permissoes/permissoes.servico.ts      # criar()/alternar() (FR-009)
```

**Structure Decision**: Web app modular por domínio. A regra de proteção de estados vive no
serviço de mensalidades (onde a sincronização ocorre), enquanto a transição manual vive no
serviço de associados. Lojas e permissões consultam o status como pré-condição.

## Complexity Tracking

Sem violações. Nenhuma abstração adicional além dos módulos de domínio já existentes.
