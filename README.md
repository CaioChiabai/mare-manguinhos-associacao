# 🌊 Sistema de Associação de Pescadores (Maré Manguinhos)

Este projeto é uma solução fullstack completa desenvolvida para a gestão administrativa de uma associação de pescadores. O painel oferece controle total sobre associados, finanças, vendas e auditoria.

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
*   **SQLite:** Banco de dados local para facilidade de deploy e testes.
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
1.  📖 [**Como Usar**](docs/COMO_USAR.md) - Instruções de instalação e execução.
2.  🏗️ [**Arquitetura**](docs/ARQUITETURA.md) - Detalhes sobre o design do sistema e organização dos módulos.
3.  🔌 [**API**](docs/API.md) - Documentação dos endpoints (painel administrativo, app do consumidor e integrações públicas).
4.  📐 [**Constituições & Boas Práticas**](docs/CONSTITUTIONS.md) - Regras e padrões de desenvolvimento.
5.  🗺️ [**Planejamento do Sistema**](Planejamento_Sistema_Associacao.md) - Visão de planejamento do projeto.

---

## 📝 Notas de Instalação Rápida

1.  Clone o repositório.
2.  Instale as dependências em ambas as pastas (`npm install`).
3.  Rode as migrações do Prisma no backend (`npx prisma migrate dev`).
4.  Inicie os serviços com `npm run dev`.
