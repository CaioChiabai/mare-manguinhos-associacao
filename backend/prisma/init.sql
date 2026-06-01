PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "usuarios" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "senhaHash" TEXT NOT NULL,
  "papel" TEXT NOT NULL DEFAULT 'ADMIN',
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "associados" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "cpf" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "telefone" TEXT NOT NULL,
  "foto" TEXT,
  "embarcacao" TEXT,
  "numeroCarteira" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ativo',
  "dataCadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "observacoes" TEXT,
  "atualizadoEm" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "historico_status_associado" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "associadoId" TEXT NOT NULL,
  "statusAnterior" TEXT NOT NULL,
  "statusNovo" TEXT NOT NULL,
  "motivo" TEXT,
  "alteradoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "alteradoPor" TEXT,
  FOREIGN KEY ("associadoId") REFERENCES "associados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "lojas" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "associadoId" TEXT NOT NULL,
  "nomeLoja" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pendente',
  "dataSolicitacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dataAprovacao" DATETIME,
  "motivoRejeicao" TEXT,
  "produtos" INTEGER NOT NULL DEFAULT 0,
  "atualizadoEm" DATETIME NOT NULL,
  FOREIGN KEY ("associadoId") REFERENCES "associados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "permissoes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "associadoId" TEXT NOT NULL,
  "tipoPermissao" TEXT NOT NULL,
  "ativa" BOOLEAN NOT NULL DEFAULT true,
  "dataInicio" DATETIME NOT NULL,
  "dataFim" DATETIME,
  "quota" INTEGER,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  FOREIGN KEY ("associadoId") REFERENCES "associados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "reunioes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "data" DATETIME NOT NULL,
  "horario" TEXT NOT NULL,
  "local" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'agendada',
  "pautaJson" TEXT NOT NULL DEFAULT '[]',
  "ata" TEXT,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "presencas_reuniao" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reuniaoId" TEXT NOT NULL,
  "associadoId" TEXT NOT NULL,
  "presente" BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY ("reuniaoId") REFERENCES "reunioes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("associadoId") REFERENCES "associados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "mensalidades" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "associadoId" TEXT NOT NULL,
  "competencia" TEXT NOT NULL,
  "valor" REAL NOT NULL,
  "dataVencimento" DATETIME NOT NULL,
  "dataPagamento" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'pendente',
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  FOREIGN KEY ("associadoId") REFERENCES "associados" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "logs_auditoria" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "usuarioId" TEXT,
  "acao" TEXT NOT NULL,
  "entidade" TEXT NOT NULL,
  "entidadeId" TEXT,
  "detalhes" TEXT,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabelas do App Delivery
CREATE TABLE IF NOT EXISTS "consumidores" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "telefone" TEXT NOT NULL,
  "senhaHash" TEXT NOT NULL,
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "enderecos" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "consumidorId" TEXT NOT NULL,
  "label" TEXT NOT NULL DEFAULT 'Casa',
  "logradouro" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "bairro" TEXT NOT NULL,
  "cidade" TEXT NOT NULL,
  "estado" TEXT NOT NULL,
  "cep" TEXT NOT NULL,
  "complemento" TEXT,
  "principal" BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY ("consumidorId") REFERENCES "consumidores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "pedidos" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "consumidorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'confirmado',
  "enderecoEntrega" TEXT NOT NULL,
  "janelaEntrega" TEXT NOT NULL,
  "frete" REAL NOT NULL,
  "valorTotal" REAL NOT NULL,
  "formaPagamento" TEXT NOT NULL DEFAULT 'pix',
  "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" DATETIME NOT NULL,
  FOREIGN KEY ("consumidorId") REFERENCES "consumidores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "pedido_itens" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pedidoId" TEXT NOT NULL,
  "produtoId" TEXT NOT NULL,
  "corte" TEXT NOT NULL DEFAULT 'inteiro',
  "pesoKg" REAL NOT NULL,
  "precoPorKg" REAL NOT NULL,
  FOREIGN KEY ("pedidoId") REFERENCES "pedidos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "associados_cpf_key" ON "associados"("cpf");
CREATE UNIQUE INDEX IF NOT EXISTS "associados_email_key" ON "associados"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "associados_telefone_key" ON "associados"("telefone");
CREATE UNIQUE INDEX IF NOT EXISTS "associados_numeroCarteira_key" ON "associados"("numeroCarteira");
CREATE UNIQUE INDEX IF NOT EXISTS "consumidores_email_key" ON "consumidores"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "consumidores_telefone_key" ON "consumidores"("telefone");
CREATE UNIQUE INDEX IF NOT EXISTS "presencas_reuniao_reuniaoId_associadoId_key" ON "presencas_reuniao"("reuniaoId", "associadoId");
CREATE UNIQUE INDEX IF NOT EXISTS "mensalidades_associadoId_competencia_key" ON "mensalidades"("associadoId", "competencia");
