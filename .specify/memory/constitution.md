# Constituição — Sistema Maré de Manguinhos

Princípios inegociáveis que governam o desenvolvimento do sistema da Associação de
Pescadores Maré de Manguinhos. Toda spec, plano, tarefa e PR é avaliado contra esta
constituição. Em caso de conflito entre esta constituição e qualquer outra prática,
**esta constituição prevalece**.

## Princípios Fundamentais

### I. Domínio Explícito e Rastreável (Spec-Driven Development)

Toda regra de negócio crítica DEVE existir como especificação em `specs/` **antes** de
ser considerada verdade do sistema. O código implementa a spec; a spec não documenta o
código *a posteriori* sem número, dono e testes.

- Cada feature vive em `specs/NNN-nome-da-feature/` com `spec.md`, `plan.md` e `tasks.md`.
- Cada regra de negócio recebe um identificador estável (`FR-NNN` / `R-NNN`).
- Cada critério de aceitação (`Given/When/Then`) cita a regra que valida.
- Nenhuma regra "implícita no código" é aceitável: se importa, vira spec.

**Justificativa:** evita regressões em fluxos financeiros e de elegibilidade, e permite
que qualquer pessoa entenda *por que* o sistema se comporta assim sem ler todo o código.

### II. Tipagem Estrita (NON-NEGOTIABLE)

O uso de `any` é proibido no frontend e no backend. Tipos vêm do domínio (Prisma, Zod)
e fluem até a borda HTTP. Validação de entrada é feita com **Zod** em `*.esquemas.ts` —
nada entra num serviço sem passar por um schema.

**Justificativa:** o TypeScript perde o propósito sem tipagem estrita; ela previne
null-reference em runtime e torna a refatoração segura.

### III. Arquitetura Modular por Domínio

Funcionalidades são separadas em módulos de domínio dentro de `modulos/`, cada um com a
tríade fixa:

- `*.rotas.ts` — protocolo HTTP (Fastify), sem regra de negócio.
- `*.servico.ts` — regras de negócio e persistência (Prisma).
- `*.esquemas.ts` — validação e contrato de dados (Zod).

Proibido "arquivo-Deus" ou regra de negócio dentro de rota. O frontend espelha a
separação: `pages/`, `components/`, `hooks/`, `contexts/`, `servicos/`, `tipos/`.

**Justificativa:** reduz acoplamento, isola responsabilidades e acelera o onboarding.

### IV. Erros Centralizados e Sem Vazamento

Rotas nunca montam resposta de erro manualmente com `try/catch` repetido. Erros de
domínio usam as classes de `compartilhado/erros.ts` e sobem para o `tratador-erros.ts`,
que uniformiza o JSON e **nunca** vaza stacktrace ao cliente em produção.

**Justificativa:** feedback consistente para o frontend e superfície de log única para
auditoria e monitoramento.

### V. Consistência Transacional e Segurança de Dados

- Operações que tocam estoque, status e histórico DEVEM ser atômicas (`prisma.$transaction`).
  Não pode existir estado intermediário (venda criada, estoque não ajustado).
- Concorrência em recursos disputados usa *optimistic locking* (`updateMany` com o estado
  anterior como filtro).
- A API pública expõe o **mínimo necessário**: nunca CPF, e-mail, senha ou dado bancário.
  Endpoints booleanos (`/ativo`, `/ativa`) retornam apenas `true`/`false`.
- Toda ação crítica gera registro de auditoria (`LogAuditoria`).

**Justificativa:** o sistema é fonte oficial de elegibilidade comercial de pescadores;
inconsistência ou vazamento tem impacto real.

## Restrições Tecnológicas

- **Backend:** Node.js + TypeScript + Fastify + Prisma ORM + PostgreSQL, autenticação JWT.
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui. Estilo via utilitários
  Tailwind — `style={{...}}` inline e CSS global solto são evitados ao máximo.
- **Idioma:** código, pastas e domínio em português, mantido consistentemente.
- **Testes:** Vitest no backend, derivados das specs (`backend/src/__tests__/SPEC-*`).

## Fluxo de Desenvolvimento (Spec-Driven)

O ciclo oficial usa o **GitHub Spec Kit**:

1. `/speckit-constitution` — princípios do projeto (este arquivo).
2. `/speckit-specify` — o *quê* e o *porquê* da feature (`spec.md`), sem tecnologia.
3. `/speckit-clarify` *(opcional)* — remove ambiguidades antes do plano.
4. `/speckit-plan` — o *como*: stack, estrutura, decisões técnicas (`plan.md`).
5. `/speckit-tasks` — quebra em tarefas rastreáveis por história (`tasks.md`).
6. `/speckit-analyze` *(opcional)* — consistência cruzada entre spec, plan e tasks.
7. `/speckit-implement` — execução, com testes derivados da spec.

Regras de gate:

- Nenhum PR de feature entra sem a spec correspondente atualizada.
- Commits seguem **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- Todo critério de aceitação relevante tem teste correspondente antes do merge.

## Governança

Esta constituição supera práticas informais. Emendas exigem: (1) registro no histórico
abaixo, (2) justificativa, e (3) revisão do impacto nas specs existentes. Complexidade
adicional (novo módulo, novo padrão) precisa ser justificada na seção *Complexity Tracking*
do `plan.md` da feature. Toda revisão de PR verifica conformidade com os princípios acima.

**Versão**: 1.0.0 | **Ratificada em**: 2026-07-06 | **Última emenda**: 2026-07-06
