import { Prisma } from "../../generated/prisma/index.js";
import bcrypt from "bcryptjs";
import { prisma } from "../../infraestrutura/prisma/cliente.js";
import { ErroConflito, ErroNaoAutorizado, ErroNaoEncontrado } from "../../compartilhado/erros.js";
import { registrarAuditoria } from "../../compartilhado/auditoria.js";
import type {
  EntradaCadastro,
  EntradaCriarPedido,
  EntradaLoginApp,
  EntradaAtualizarPerfil,
  EntradaCriarEndereco,
} from "./app.esquemas.js";

function parseJsonArray(valor: string | null): string[] {
  if (!valor) return [];
  try {
    return JSON.parse(valor);
  } catch {
    return [];
  }
}

export const appServico = {
  // ── Auth ──────────────────────────────────────────────────────────────

  async cadastrarConsumidor(dados: EntradaCadastro) {
    const emailExiste = await prisma.consumidor.findUnique({ where: { email: dados.email } });
    if (emailExiste) throw new ErroConflito("E-mail já cadastrado");

    const telefoneExiste = await prisma.consumidor.findUnique({ where: { telefone: dados.telefone } });
    if (telefoneExiste) throw new ErroConflito("Telefone já cadastrado");

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const consumidor = await prisma.consumidor.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        senhaHash,
      },
    });

    await registrarAuditoria({
      acao: "cadastrar",
      entidade: "consumidor",
      entidadeId: consumidor.id,
      detalhes: { email: consumidor.email, nome: consumidor.nome },
    });

    return {
      id: consumidor.id,
      nome: consumidor.nome,
      email: consumidor.email,
    };
  },

  async autenticarConsumidor(dados: EntradaLoginApp) {
    const consumidor = await prisma.consumidor.findUnique({ where: { email: dados.email } });
    if (!consumidor) throw new ErroNaoAutorizado("Credenciais inválidas");

    const senhaValida = await bcrypt.compare(dados.senha, consumidor.senhaHash);
    if (!senhaValida) throw new ErroNaoAutorizado("Credenciais inválidas");

    return {
      id: consumidor.id,
      nome: consumidor.nome,
      email: consumidor.email,
    };
  },

  async buscarConsumidor(id: string) {
    const consumidor = await prisma.consumidor.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, telefone: true, criadoEm: true },
    });
    if (!consumidor) throw new ErroNaoEncontrado("Consumidor");
    return consumidor;
  },

  async atualizarConsumidor(id: string, dados: EntradaAtualizarPerfil) {
    const existente = await prisma.consumidor.findUnique({ where: { id } });
    if (!existente) throw new ErroNaoEncontrado("Consumidor");

    if (dados.telefone && dados.telefone !== existente.telefone) {
      const telefoneExiste = await prisma.consumidor.findUnique({ where: { telefone: dados.telefone } });
      if (telefoneExiste) throw new ErroConflito("Telefone já cadastrado");
    }

    const atualizado = await prisma.consumidor.update({
      where: { id },
      data: dados,
      select: { id: true, nome: true, email: true, telefone: true, criadoEm: true },
    });

    return atualizado;
  },

  // ── Endereços ─────────────────────────────────────────────────────────

  async listarEnderecos(consumidorId: string) {
    return prisma.endereco.findMany({
      where: { consumidorId },
      orderBy: [{ principal: "desc" }, { id: "asc" }],
    });
  },

  async criarEndereco(consumidorId: string, dados: EntradaCriarEndereco) {
    if (dados.principal) {
      await prisma.endereco.updateMany({
        where: { consumidorId, principal: true },
        data: { principal: false },
      });
    }

    const endereco = await prisma.endereco.create({
      data: {
        ...dados,
        consumidorId,
      },
    });

    return endereco;
  },

  async removerEndereco(consumidorId: string, enderecoId: string) {
    const endereco = await prisma.endereco.findFirst({
      where: { id: enderecoId, consumidorId },
    });
    if (!endereco) throw new ErroNaoEncontrado("Endereço");

    await prisma.endereco.delete({ where: { id: enderecoId } });
  },

  // ── Vitrine ───────────────────────────────────────────────────────────

  async montarVitrine() {
    const banner = {
      titulo: "Fresco hoje!",
      subtitulo: "Direto do pescador",
      descricao: "Capturado esta manhã em Manguinhos",
      imagem: "https://loremflickr.com/800/400/fishmonger,fish,store?seed=banner",
    };

    const pescadores = await prisma.associado.findMany({
      where: { status: "ativo" },
      select: { id: true, nome: true, foto: true, telefone: true },
      orderBy: { nome: "asc" },
    });

    const categorias = [
      { id: "todos", nome: "Todos" },
      { id: "peixe", nome: "Peixes" },
      { id: "crustaceo", nome: "Crustáceos" },
    ];

    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      include: {
        loja: {
          select: {
            associado: {
              select: { id: true, nome: true },
            },
          },
        },
      },
      orderBy: { criadoEm: "desc" },
      take: 50,
    });

    const produtosVitrine = produtos.map((p) => ({
      id: p.id,
      especie: p.especie || p.nome,
      foto: p.foto || "",
      precoPorKg: p.precoPorKg ?? p.preco,
      pesoDisponivel: p.pesoDisponivel ?? p.estoque,
      categoria: p.categoria || "peixe",
      badges: parseJsonArray(p.badges),
      pescador: {
        id: p.loja.associado.id,
        nome: p.loja.associado.nome,
      },
    }));

    return {
      banner,
      pescadores: pescadores.map((p) => ({
        id: p.id,
        nome: p.nome,
        foto: p.foto || "",
        telefone: p.telefone,
      })),
      categorias,
      produtos: produtosVitrine,
    };
  },

  // ── Produtos ──────────────────────────────────────────────────────────

  async listarProdutosApp(filtros: { busca?: string; categoria?: string; pescador_id?: string }) {
    const where: Prisma.ProdutoWhereInput = { ativo: true };

    if (filtros.categoria && filtros.categoria !== "todos") {
      where.categoria = filtros.categoria;
    }

    if (filtros.busca) {
      where.OR = [
        { especie: { contains: filtros.busca } },
        { nome: { contains: filtros.busca } },
        { descricao: { contains: filtros.busca } },
      ];
    }

    if (filtros.pescador_id) {
      const lojas = await prisma.loja.findMany({
        where: { associadoId: filtros.pescador_id, status: "aprovada" },
        select: { id: true },
      });
      where.lojaId = { in: lojas.map((l) => l.id) };
    }

    const produtos = await prisma.produto.findMany({
      where,
      include: {
        loja: {
          select: {
            associado: {
              select: { id: true, nome: true, foto: true, telefone: true },
            },
          },
        },
      },
      orderBy: { criadoEm: "desc" },
    });

    return produtos.map((p) => ({
      id: p.id,
      especie: p.especie || p.nome,
      foto: p.foto || "",
      precoPorKg: p.precoPorKg ?? p.preco,
      pesoDisponivel: p.pesoDisponivel ?? p.estoque,
      cortesDisponiveis: parseJsonArray(p.cortesDisponiveis) as Array<"inteiro" | "limpo" | "file">,
      badges: parseJsonArray(p.badges),
      categoria: p.categoria || "peixe",
      descricao: p.descricao || undefined,
      pescador: {
        id: p.loja.associado.id,
        nome: p.loja.associado.nome,
        foto: p.loja.associado.foto || "",
        telefone: p.loja.associado.telefone,
      },
    }));
  },

  async buscarProdutoApp(id: string) {
    const p = await prisma.produto.findUnique({
      where: { id },
      include: {
        loja: {
          select: {
            associado: {
              select: { id: true, nome: true, foto: true, telefone: true },
            },
          },
        },
      },
    });

    if (!p || !p.ativo) throw new ErroNaoEncontrado("Produto");

    return {
      id: p.id,
      especie: p.especie || p.nome,
      foto: p.foto || "",
      precoPorKg: p.precoPorKg ?? p.preco,
      pesoDisponivel: p.pesoDisponivel ?? p.estoque,
      cortesDisponiveis: parseJsonArray(p.cortesDisponiveis) as Array<"inteiro" | "limpo" | "file">,
      badges: parseJsonArray(p.badges),
      categoria: p.categoria || "peixe",
      descricao: p.descricao || undefined,
      pescador: {
        id: p.loja.associado.id,
        nome: p.loja.associado.nome,
        foto: p.loja.associado.foto || "",
        telefone: p.loja.associado.telefone,
      },
    };
  },

  // ── Pedidos ───────────────────────────────────────────────────────────

  async criarPedido(consumidorId: string, dados: EntradaCriarPedido) {
    const consumidor = await prisma.consumidor.findUnique({ where: { id: consumidorId } });
    if (!consumidor) throw new ErroNaoEncontrado("Consumidor");

    const produtosIds = [...new Set(dados.itens.map((i) => i.produtoId))];
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtosIds }, ativo: true },
      select: { id: true, precoPorKg: true, preco: true, pesoDisponivel: true, estoque: true },
    });

    if (produtos.length !== produtosIds.length) {
      throw new ErroNaoEncontrado("Um ou mais produtos não encontrados ou inativos");
    }

    const produtoMap = new Map(produtos.map((p) => [p.id, p]));

    for (const item of dados.itens) {
      const prod = produtoMap.get(item.produtoId)!;
      const pesoDisponivel = prod.pesoDisponivel ?? prod.estoque;
      if (pesoDisponivel < item.pesoKg) {
        throw new ErroConflito(
          `Peso indisponível para o produto ${item.produtoId}. Disponível: ${pesoDisponivel}kg`,
        );
      }
    }

    const pedido = await prisma.pedido.create({
      data: {
        consumidorId,
        status: "confirmado",
        enderecoEntrega: dados.enderecoEntrega,
        janelaEntrega: dados.janelaEntrega,
        frete: dados.frete,
        valorTotal: dados.valorTotal,
        formaPagamento: dados.formaPagamento,
        itens: {
          create: dados.itens.map((item) => {
            const prod = produtoMap.get(item.produtoId)!;
            const precoPorKg = prod.precoPorKg ?? prod.preco;
            return {
              produtoId: item.produtoId,
              corte: item.corte,
              pesoKg: item.pesoKg,
              precoPorKg,
            };
          }),
        },
      },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                especie: true,
                nome: true,
                foto: true,
                pesoDisponivel: true,
                cortesDisponiveis: true,
                badges: true,
                categoria: true,
                loja: {
                  select: {
                    associado: { select: { id: true, nome: true, foto: true, telefone: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const itensFormatados = pedido.itens.map((item) => ({
      produto: {
        id: item.produto.id,
        especie: item.produto.especie || item.produto.nome,
        foto: item.produto.foto || "",
        precoPorKg: item.precoPorKg,
        pesoDisponivel: item.produto.pesoDisponivel ?? 0,
        cortesDisponiveis: parseJsonArray(item.produto.cortesDisponiveis) as Array<"inteiro" | "limpo" | "file">,
        badges: parseJsonArray(item.produto.badges),
        categoria: (item.produto.categoria || "peixe") as "peixe" | "crustaceo",
        pescador: {
          id: item.produto.loja.associado.id,
          nome: item.produto.loja.associado.nome,
          foto: item.produto.loja.associado.foto || "",
          telefone: item.produto.loja.associado.telefone,
        },
      },
      corte: item.corte as "inteiro" | "limpo" | "file",
      pesoKg: item.pesoKg,
    }));

    const valorTotalItens = itensFormatados.reduce(
      (acc, i) => acc + i.produto.precoPorKg * i.pesoKg,
      0,
    );

    await registrarAuditoria({
      acao: "criar_pedido",
      entidade: "pedido",
      entidadeId: pedido.id,
      detalhes: { consumidorId, total: dados.valorTotal, itens: dados.itens.length },
    });

    return {
      id: pedido.id,
      itens: itensFormatados,
      status: pedido.status,
      enderecoEntrega: pedido.enderecoEntrega,
      janelaEntrega: pedido.janelaEntrega,
      frete: pedido.frete,
      valorTotal: pedido.valorTotal,
      formaPagamento: pedido.formaPagamento,
      criadoEm: pedido.criadoEm.toISOString(),
      atualizadoEm: pedido.atualizadoEm.toISOString(),
    };
  },

  async buscarPedido(consumidorId: string, pedidoId: string) {
    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, consumidorId },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                especie: true,
                nome: true,
                foto: true,
                precoPorKg: true,
                preco: true,
                pesoDisponivel: true,
                cortesDisponiveis: true,
                badges: true,
                categoria: true,
                loja: {
                  select: {
                    associado: { select: { id: true, nome: true, foto: true, telefone: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pedido) throw new ErroNaoEncontrado("Pedido");

    return {
      id: pedido.id,
      itens: pedido.itens.map((item) => ({
        produto: {
          id: item.produto.id,
          especie: item.produto.especie || item.produto.nome,
          foto: item.produto.foto || "",
          precoPorKg: item.precoPorKg,
          pesoDisponivel: item.produto.pesoDisponivel ?? 0,
          cortesDisponiveis: parseJsonArray(item.produto.cortesDisponiveis) as Array<"inteiro" | "limpo" | "file">,
          badges: parseJsonArray(item.produto.badges),
          categoria: (item.produto.categoria || "peixe") as "peixe" | "crustaceo",
          pescador: {
            id: item.produto.loja.associado.id,
            nome: item.produto.loja.associado.nome,
            foto: item.produto.loja.associado.foto || "",
            telefone: item.produto.loja.associado.telefone,
          },
        },
        corte: item.corte as "inteiro" | "limpo" | "file",
        pesoKg: item.pesoKg,
      })),
      status: pedido.status,
      enderecoEntrega: pedido.enderecoEntrega,
      janelaEntrega: pedido.janelaEntrega,
      frete: pedido.frete,
      valorTotal: pedido.valorTotal,
      formaPagamento: pedido.formaPagamento,
      criadoEm: pedido.criadoEm.toISOString(),
      atualizadoEm: pedido.atualizadoEm.toISOString(),
    };
  },

  async listarPedidosConsumidor(consumidorId: string, pagina: number, limite: number) {
    const where = { consumidorId };

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          itens: {
            include: {
              produto: {
                select: {
                    id: true,
                    especie: true,
                    nome: true,
                    foto: true,
                    pesoDisponivel: true,
                    cortesDisponiveis: true,
                    badges: true,
                    categoria: true,
                    loja: {
                    select: {
                      associado: { select: { id: true, nome: true, foto: true, telefone: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { criadoEm: "desc" },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.pedido.count({ where }),
    ]);

    return {
      pedidos: pedidos.map((pedido) => ({
        id: pedido.id,
        itens: pedido.itens.map((item) => ({
          produto: {
            id: item.produto.id,
            especie: item.produto.especie || item.produto.nome,
            foto: item.produto.foto || "",
            precoPorKg: item.precoPorKg,
            pesoDisponivel: item.produto.pesoDisponivel ?? 0,
            cortesDisponiveis: parseJsonArray(item.produto.cortesDisponiveis) as Array<"inteiro" | "limpo" | "file">,
            badges: parseJsonArray(item.produto.badges),
            categoria: (item.produto.categoria || "peixe") as "peixe" | "crustaceo",
            pescador: {
              id: item.produto.loja.associado.id,
              nome: item.produto.loja.associado.nome,
              foto: item.produto.loja.associado.foto || "",
              telefone: item.produto.loja.associado.telefone,
            },
          },
          corte: item.corte as "inteiro" | "limpo" | "file",
          pesoKg: item.pesoKg,
        })),
        status: pedido.status,
        enderecoEntrega: pedido.enderecoEntrega,
        janelaEntrega: pedido.janelaEntrega,
        frete: pedido.frete,
        valorTotal: pedido.valorTotal,
        formaPagamento: pedido.formaPagamento,
          criadoEm: pedido.criadoEm.toISOString(),
          atualizadoEm: pedido.atualizadoEm.toISOString(),
        })),
      totalPaginas: Math.ceil(total / limite),
      paginaAtual: pagina,
    };
  },

  // ── Frete ─────────────────────────────────────────────────────────────

  async calcularFrete(_dados: { endereco: string }) {
    return {
      valorFrete: 8.0,
      prazoEstimadoMinutos: 45,
    };
  },

  // ── Pagamento ─────────────────────────────────────────────────────────

  async gerarPix(pedidoId: string, valor: number) {
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) throw new ErroNaoEncontrado("Pedido");

    return {
      qrCode: `000201010212261060014br.gov.bcb.pix2558api.pix.example.com/pix/v2/${pedidoId}5204000053039865406${valor.toFixed(2)}5802BR5925MareManguinhosApp6009SAOPAULO62070503***6304E2A9`,
      codigo: pedidoId.slice(0, 8).toUpperCase(),
      expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  },

  async processarCartao(pedidoId: string, valor: number, _tokenCartao: string) {
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) throw new ErroNaoEncontrado("Pedido");

    return {
      status: "aprovado",
      transacaoId: `tx-${pedidoId.slice(0, 8)}-${Date.now()}`,
    };
  },
};
