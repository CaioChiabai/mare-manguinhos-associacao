# Implementation Plan: Contrato Público da API (Chatbot WhatsApp)

**Branch**: `005-api-publica-chatbot` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)

## Summary

API pública mínima e sem autenticação para consulta de elegibilidade e um único endpoint de
escrita (cadastro de produto por telefone), com normalização de telefone e proteção de dados
sensíveis.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20+
**Primary Dependencies**: Fastify, Prisma ORM, Zod
**Storage**: PostgreSQL
**Testing**: Vitest — `backend/src/__tests__/SPEC-005-normalizacao-telefone.test.ts` (testes puros)
**Project Type**: Web (backend)
**Constraints**: Contrato externo estável; exposição mínima de dados; normalização determinística.

## Constitution Check

- **V. Segurança de dados**: ✅ princípio central — exposição mínima, booleanos, auditoria de canal.
- **I/II/III/IV**: ✅ regras numeradas, Zod inline, `tratador-erros.ts`.

## Project Structure

```text
backend/src/modulos/api-publica/api-publica.rotas.ts   # lógica inline (sem servico.ts)
│   ├── contarLojasAprovadas()   # auxiliar (FR-010/011)
│   ├── usa mensalidadesServico.sincronizarAtrasos()   # FR-008
│   └── usa registrarAuditoria()                        # FR-012
backend/src/compartilhado/telefone.ts   # normalizarTelefone() (FR-005/006)
```

**Structure Decision**: Módulo público isolado, com a normalização de telefone extraída para
`compartilhado/` por ser reutilizada na escrita do associado. A lógica é inline nas rotas por ser
enxuta e específica do contrato externo.

## Complexity Tracking

Sem violações.
