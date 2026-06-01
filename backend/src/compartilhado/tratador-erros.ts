import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { ErroAplicacao } from "./erros.js";

function isPrismaError(erro: FastifyError): erro is FastifyError & { meta?: Record<string, unknown> } {
  return typeof erro === "object" && erro !== null && "code" in erro && typeof (erro as { code: unknown }).code === "string";
}

export function tratadorDeErros(
  erro: FastifyError,
  _requisicao: FastifyRequest,
  resposta: FastifyReply,
) {
  if (erro instanceof ZodError) {
    return resposta.status(400).send({
      mensagem: "Dados de entrada inválidos",
      erros: erro.flatten().fieldErrors,
    });
  }

  if (erro instanceof ErroAplicacao) {
    return resposta.status(erro.statusCode).send({ mensagem: erro.mensagem });
  }

  if (isPrismaError(erro)) {
    if (erro.code === "P2002") {
      const campo = (erro.meta?.target as string[] | undefined)?.[0] ?? "campo";
      return resposta.status(409).send({ mensagem: `${campo} já cadastrado` });
    }
    if (erro.code === "P2025") {
      return resposta.status(404).send({ mensagem: "Registro não encontrado" });
    }
    if (erro.code === "P2003") {
      return resposta.status(409).send({ mensagem: "Registro referenciado não existe" });
    }
  }

  if (erro.statusCode && erro.statusCode < 500) {
    return resposta.status(erro.statusCode).send({ mensagem: erro.message });
  }

  console.error("[ERRO INTERNO]", erro);
  return resposta.status(500).send({ mensagem: "Erro interno do servidor" });
}
