# 🌊 Sistema de Associação de Pescadores (Maré Manguinhos)

Este projeto é uma solução fullstack completa desenvolvida para a gestão administrativa de uma associação de pescadores. O painel oferece controle total sobre associados, finanças, vendas e auditoria.

## 👥 Equipe

| Integrante |
|---|
| Diego Rangel |
| Caio Chiabai |
| Arthur Valentim |
| Pedro Albani |

## 🔗 Links de Acesso
*   **Aplicação (Fullstack):** [associacao-mare-manguinhos.onrender.com](https://associacao-mare-manguinhos.onrender.com)
*   **API (Backend):** [mare-manguinhos-associacao.onrender.com](https://mare-manguinhos-associacao.onrender.com)
*   **Documentação (MkDocs):** [mare-de-manguinhos.github.io/mare-manguinhos-associacao](https://mare-de-manguinhos.github.io/mare-manguinhos-associacao/)

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
*   **React + Vite:** Interface moderna, rápida e responsiva.
*   **TypeScript:** Garantia de tipagem e maior segurança no desenvolvimento.

### **Backend**
*   **Node.js + Fastify:** Framework de alto desempenho e baixa sobrecarga.
*   **Prisma ORM:** Gerenciamento de banco de dados com produtividade.
*   **PostgreSQL:** Banco de dados relacional robusto e pronto para produção.
*   **JWT (JSON Web Token):** Autenticação segura de usuários.

---

## 🚀 Funcionalidades Principais

### **Gestão Administrativa**
*   **Associados:** Cadastro e controle completo de membros.
*   **Permissões:** Controle de acesso baseado em cargos (RBAC).
*   **Mensalidades:** Gestão financeira de contribuições.
*   **Reuniões:** Agendamento e histórico de assembleias.
*   **Auditoria:** Log de ações para transparência administrativa.
*   **Dashboard:** Visão analítica dos dados da associação.

### **Operacional & Comercial**
*   **Lojas & Produtos:** Gestão de inventário e pontos de venda.
*   **Vendas:** Fluxo completo de comercialização.
*   **Transportes:** Monitoramento logístico.
*   **App de Delivery:** API dedicada ao consumidor final (vitrine, pedidos, perfil, endereços, pagamento Pix/cartão e cálculo de frete).
*   **Integração:** Endpoints públicos mínimos para sistemas externos.

---

## 📂 Estrutura do Projeto

O repositório está dividido em duas frentes principais:

*   📂 [`/frontend`](frontend): Código fonte da interface do usuário.
*   📂 [`/backend`](backend): Estrutura da API, modelos do banco e regras de negócio.

---

## 📚 Documentação

A documentação técnica é escrita em Markdown na pasta [`/docs`](docs) e publicada com [MkDocs](https://www.mkdocs.org/) (tema *Material*).

Para visualizar localmente:

```bash
pip install mkdocs-material
mkdocs serve
```

A documentação ficará disponível em `http://localhost:8000`. Para gerar o site estático, use `mkdocs build` (saída em `site/`).

### Conteúdo
1.  📖 [**Como Usar**](docs/COMO_USAR.md) - Instalação, execução e **guia de operação do sistema** (por tela e perfil).
2.  🏗️ [**Arquitetura**](docs/ARQUITETURA.md) - Design do sistema com diagramas (contexto, containers, ER e sequência).
3.  🗺️ [**Épicos & Histórias de Usuário**](docs/EPICS.md) - Visão de produto ligada às specs.
4.  🔌 [**API**](docs/API.md) - Endpoints (painel administrativo, app do consumidor e integrações públicas).
5.  📐 [**Constituições & Boas Práticas**](docs/CONSTITUTIONS.md) - Regras e padrões de desenvolvimento.
6.  🗺️ [**Planejamento do Sistema**](Planejamento_Sistema_Associacao.md) - Visão de planejamento do projeto.

---

## 🧭 Spec-Driven Development (GitHub Spec Kit)

As regras de negócio críticas são desenvolvidas com o **[GitHub Spec Kit](https://github.com/github/spec-kit)**,
a ferramenta oficial de *Spec-Driven Development* (SDD). O fluxo é
`Constitution → Specify → Plan → Tasks → Implement`.

- 📐 [`.specify/memory/constitution.md`](.specify/memory/constitution.md) - a constituição (princípios do projeto).
- 📁 [`specs/`](specs/README.md) - as 6 features especificadas (`spec.md` + `plan.md` + `tasks.md`).
- 🧪 [`backend/src/__tests__/`](backend/src/__tests__) - testes Vitest derivados dos critérios de aceitação.

> O ferramental do Spec Kit (templates, scripts e skills `/speckit-*`) fica fora do repositório
> — é gerado localmente pelo `specify init`, comando abaixo.

Inicialização usada no projeto:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init --here --integration claude
```

---

## 📝 Notas de Instalação Rápida

1.  Clone o repositório.
2.  Instale as dependências em ambas as pastas (`npm install`).
3.  No backend, copie `.env.example` para `.env` e configure `DATABASE_URL` (PostgreSQL) e `JWT_SEGREDO`.
4.  Prepare o banco no backend (`npm run preparar` — gera o client, aplica migrações e popula dados de demonstração).
5.  Inicie os serviços com `npm run dev`.

> Consulte o [guia completo de instalação](docs/COMO_USAR.md) para a lista de variáveis de ambiente e detalhes.
