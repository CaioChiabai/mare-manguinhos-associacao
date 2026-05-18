# Constituições e Boas Práticas do Projeto

Este documento define as regras fundamentais e as boas práticas de desenvolvimento para o sistema Maré de Manguinhos. O objetivo destas regras é manter o código coeso, seguro e fácil de manter por toda a equipe.

---

## 1. Regras Globais (Aplicáveis a todo o repositório)

### 1.1. Tipagem Estrita (TypeScript)
- **Regra:** O uso de `any` é terminantemente proibido tanto no Front-end quanto no Back-end.
- **Justificativa:** O TypeScript perde o seu propósito sem a tipagem. A tipagem estrita garante segurança, previne erros de referência nula (*Null Reference*) em tempo de execução e facilita muito a refatoração do código.

### 1.2. Idioma e Nomenclatura
- **Regra:** Códigos, variáveis, pastas e arquivos devem adotar a padronização em português (ou inglês, desde que seja mantido consistentemente em todo o projeto, conforme foi iniciado). Pastas do backend sugerem português (ex: `modulos/associados`, `tratador-erros.ts`).
- **Justificativa:** Manter a consistência na nomenclatura facilita a busca de arquivos, o entendimento do domínio e ajuda novos desenvolvedores a se contextualizarem mais rápido.

### 1.3. Padrão de Commits e PRs
- **Regra:** Usar sempre *Conventional Commits* (ex: `feat: add nova rota de associados`, `fix: corrige validacao de cpf`, `docs: atualiza readme`).
- **Justificativa:** Permite gerar *changelogs* automáticos e entender rapidamente através do histórico do Git o que cada commit modificou sem precisar inspecionar os arquivos.

---

## 2. Back-end (Node.js + Prisma)

### 2.1. Arquitetura Modular
- **Regra:** Funcionalidades devem sempre ser separadas por módulos de domínio dentro da pasta `modulos/` (ex: `associados.rotas.ts`, `associados.servico.ts`, `associados.esquemas.ts`).
- **Justificativa:** Evita "arquivos gigantes" ou "classes Deus" e separa responsabilidades. As rotas lidam com o protocolo HTTP; os serviços lidam com regras de negócios; os esquemas lidam com as validações de dados (Zod/Yup).

### 2.2. Tratamento Global de Erros
- **Regra:** Nunca retorne Respostas HTTP com `try/catch` manuais dentro de toda rota se repetindo. Use o arquivo central `tratador-erros.ts` repassando o erro (usando `next(error)` ou `throw`). 
- **Justificativa:** Uniformiza o JSON de feedback para o frontend. Facilita o log de erros em tela ou em serviços de monitoramento para auditoria, além de não vazar *stacktraces* ao cliente final em produção.

---

## 3. Front-end (React + Vite + Tailwind)

### 3.1. Organização de Componentes
- **Regra:** Componentes, páginas, serviços e hooks devem estar organizados em suas próprias faixas dentro de `src/app/` (ex: `components/`, `pages/`, `hooks/`).
- **Justificativa:** Deixa claro onde buscar cada peça do quebra-cabeça na interface (UI vs Lógica de Negócios no Front).

### 3.2. Estilização e Tailwind
- **Regra:** O uso de estilos em linha (`style={{...}}`) ou arquivos genéricos CSS soltos pela aplicação deve ser evitado ao máximo. Utilize o padrão de utilitários do **Tailwind CSS**.
- **Justificativa:** Facilita a previsibilidade de regras e garante que o design siga o "Design System" unificado na configuração do Tailwind (`tailwind.config.ts`), como paletas de cor e espaçamentos, sem duplicação ou colisões no CSS global.

---

*Nota: Esta constituição deve ser lida, entendida e aceita por qualquer pessoa colaboradora (interna ou externa) que vá inserir código no repositório principal.*