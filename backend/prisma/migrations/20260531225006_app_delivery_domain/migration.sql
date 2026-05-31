/*
  Warnings:

  - Added the required column `nome` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preco` to the `produtos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "associados" ADD COLUMN     "foto" TEXT;

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "badges" TEXT DEFAULT '[]',
ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "cortesDisponiveis" TEXT DEFAULT '[]',
ADD COLUMN     "estoque" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "foto" TEXT,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "preco" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "especie" DROP NOT NULL,
ALTER COLUMN "precoPorKg" DROP NOT NULL,
ALTER COLUMN "pesoDisponivel" DROP NOT NULL;

-- CreateTable
CREATE TABLE "consumidores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumidores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "consumidorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "enderecoEntrega" TEXT NOT NULL,
    "janelaEntrega" TEXT NOT NULL,
    "frete" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "formaPagamento" TEXT NOT NULL DEFAULT 'pix',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_itens" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "corte" TEXT NOT NULL DEFAULT 'inteiro',
    "pesoKg" DOUBLE PRECISION NOT NULL,
    "precoPorKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "pedido_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consumidores_email_key" ON "consumidores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "consumidores_telefone_key" ON "consumidores"("telefone");

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_consumidorId_fkey" FOREIGN KEY ("consumidorId") REFERENCES "consumidores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_consumidorId_fkey" FOREIGN KEY ("consumidorId") REFERENCES "consumidores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
