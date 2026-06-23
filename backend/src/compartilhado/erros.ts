export class ErroAplicacao extends Error {
  constructor(public mensagem: string, public statusCode: number = 400) {
    super(mensagem);
    this.name = "ErroAplicacao";
  }
}

export class ErroNaoAutorizado extends ErroAplicacao {
  constructor(mensagem = "Não autorizado") {
    super(mensagem, 401);
    this.name = "ErroNaoAutorizado";
  }
}

export class ErroNaoEncontrado extends ErroAplicacao {
  constructor(entidade: string) {
    super(`${entidade} não encontrado(a)`, 404);
    this.name = "ErroNaoEncontrado";
  }
}

export class ErroConflito extends ErroAplicacao {
  constructor(mensagem: string) {
    super(mensagem, 409);
    this.name = "ErroConflito";
  }
}

export class ErroProibido extends ErroAplicacao {
  constructor(mensagem = "Acesso proibido") {
    super(mensagem, 403);
    this.name = "ErroProibido";
  }
}
