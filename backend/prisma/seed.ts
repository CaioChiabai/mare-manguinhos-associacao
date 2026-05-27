/// <reference types="node" />

import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function principal() {
  console.log("🌱 Iniciando seed...");

  const emailAdmin = process.env.ADMIN_EMAIL_PADRAO ?? "admin@pescadores.local";
  const senhaAdmin = process.env.ADMIN_SENHA_PADRAO ?? "admin123";
  const nomeAdmin = process.env.ADMIN_NOME_PADRAO ?? "Administrador";

  const senhaHash = await bcrypt.hash(senhaAdmin, 10);

  const admin = await prisma.usuario.upsert({
    where: { email: emailAdmin },
    update: {},
    create: {
      nome: nomeAdmin,
      email: emailAdmin,
      senhaHash,
      papel: "ADMIN",
    },
  });
  console.log(`✅ Admin pronto: ${admin.email}`);

  const dadosAssociados = [
    {
      nome: "João da Silva",
      cpf: "123.456.789-00",
      email: "joao@email.com",
      telefone: "27987654321",
      foto: "https://i.pravatar.cc/100?u=joao-silva",
      embarcacao: "Maré Alta I",
      numeroCarteira: "AP-001234",
      status: "ativo" as const,
    },
    {
      nome: "Maria Santos",
      cpf: "234.567.890-11",
      email: "maria@email.com",
      telefone: "27987654322",
      foto: "https://i.pravatar.cc/100?u=maria-santos",
      embarcacao: "Pescador II",
      numeroCarteira: "AP-001235",
      status: "ativo" as const,
    },
    {
      nome: "Pedro Costa",
      cpf: "345.678.901-22",
      email: "pedro@email.com",
      telefone: "27987654323",
      foto: "https://i.pravatar.cc/100?u=pedro-costa",
      embarcacao: "Onda Azul",
      numeroCarteira: "AP-001236",
      status: "inadimplente" as const,
    },
    {
      nome: "Ana Oliveira",
      cpf: "456.789.012-33",
      email: "ana@email.com",
      telefone: "27987654324",
      foto: "https://i.pravatar.cc/100?u=ana-oliveira",
      embarcacao: "Correnteza",
      numeroCarteira: "AP-001237",
      status: "suspenso" as const,
    },
    {
      nome: "Carlos Ferreira",
      cpf: "567.890.123-44",
      email: "carlos@email.com",
      telefone: "27987654325",
      foto: "https://i.pravatar.cc/100?u=carlos-ferreira",
      embarcacao: "Horizonte",
      numeroCarteira: "AP-001238",
      status: "ativo" as const,
    },
    {
      nome: "Dona Francisca",
      cpf: "678.901.234-55",
      email: "francisca@email.com",
      telefone: "27987654326",
      foto: "https://i.pravatar.cc/100?u=francisca",
      embarcacao: "Estrela do Mar",
      numeroCarteira: "AP-001239",
      status: "ativo" as const,
    },
    {
      nome: "Seu Raimundo",
      cpf: "789.012.345-66",
      email: "raimundo@email.com",
      telefone: "27987654327",
      foto: "https://i.pravatar.cc/100?u=raimundo",
      embarcacao: "Tubarão Branco",
      numeroCarteira: "AP-001240",
      status: "ativo" as const,
    },
  ];

  const associadosCriados: Record<string, string> = {};

  for (const dados of dadosAssociados) {
    const associado = await prisma.associado.upsert({
      where: { cpf: dados.cpf },
      update: dados,
      create: dados,
    });
    associadosCriados[dados.nome] = associado.id;
  }
  console.log(`✅ ${dadosAssociados.length} associados prontos`);

  const lojasCriadas: Record<string, string> = {};

  const dadosLojas = [
    {
      donoNome: "João da Silva",
      nomeLoja: "Peixes Frescos João",
      descricao: "Pescados frescos direto do mar",
      status: "aprovada" as const,
      dataAprovacao: new Date("2024-06-10"),
    },
    {
      donoNome: "João da Silva",
      nomeLoja: "Fish Express",
      descricao: "Entrega rápida de pescados",
      status: "aprovada" as const,
      dataAprovacao: new Date("2024-08-20"),
    },
    {
      donoNome: "Maria Santos",
      nomeLoja: "Empório do Mar",
      descricao: "Variedade de peixes e frutos do mar",
      status: "aprovada" as const,
      dataAprovacao: new Date("2024-07-15"),
    },
    {
      donoNome: "Dona Francisca",
      nomeLoja: "Peixe da Dona",
      descricao: "Peixe fresco toda semana",
      status: "aprovada" as const,
      dataAprovacao: new Date("2024-09-01"),
    },
    {
      donoNome: "Seu Raimundo",
      nomeLoja: "Raimundo Pescados",
      descricao: "Frutos do mar selecionados",
      status: "aprovada" as const,
      dataAprovacao: new Date("2024-09-10"),
    },
    {
      donoNome: "Carlos Ferreira",
      nomeLoja: "Pescados Horizonte",
      descricao: "Qualidade e frescor garantidos",
      status: "pendente" as const,
    },
  ];

  for (const dados of dadosLojas) {
    const donoId = associadosCriados[dados.donoNome];
    if (!donoId) continue;
    const existente = await prisma.loja.findFirst({
      where: { nomeLoja: dados.nomeLoja, associadoId: donoId },
    });
    if (existente) {
      lojasCriadas[dados.nomeLoja] = existente.id;
      continue;
    }
    const loja = await prisma.loja.create({
      data: {
        associadoId: donoId,
        nomeLoja: dados.nomeLoja,
        descricao: dados.descricao,
        status: dados.status,
        dataAprovacao: dados.dataAprovacao,
      },
    });
    lojasCriadas[dados.nomeLoja] = loja.id;
  }
  console.log(`✅ ${dadosLojas.length} lojas prontas`);

  const dadosPermissoes = [
    {
      donoNome: "João da Silva",
      tipoPermissao: "Pesca de Arrasto",
      ativa: true,
      dataInicio: new Date("2024-01-01"),
      dataFim: new Date("2024-12-31"),
      quota: 500,
    },
    {
      donoNome: "Maria Santos",
      tipoPermissao: "Pesca Artesanal",
      ativa: true,
      dataInicio: new Date("2024-01-01"),
      dataFim: new Date("2024-12-31"),
      quota: 300,
    },
    {
      donoNome: "Pedro Costa",
      tipoPermissao: "Venda no Marketplace",
      ativa: false,
      dataInicio: new Date("2023-06-01"),
      dataFim: new Date("2024-03-01"),
    },
    {
      donoNome: "Carlos Ferreira",
      tipoPermissao: "Pesca Costeira",
      ativa: true,
      dataInicio: new Date("2024-02-01"),
      dataFim: new Date("2025-02-01"),
      quota: 400,
    },
    {
      donoNome: "João da Silva",
      tipoPermissao: "Venda no Marketplace",
      ativa: true,
      dataInicio: new Date("2023-06-15"),
    },
  ];

  for (const dados of dadosPermissoes) {
    const donoId = associadosCriados[dados.donoNome];
    if (!donoId) continue;
    const existente = await prisma.permissao.findFirst({
      where: { associadoId: donoId, tipoPermissao: dados.tipoPermissao },
    });
    if (existente) continue;
    await prisma.permissao.create({
      data: {
        associadoId: donoId,
        tipoPermissao: dados.tipoPermissao,
        ativa: dados.ativa,
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim,
        quota: dados.quota,
      },
    });
  }
  console.log(`✅ ${dadosPermissoes.length} permissões prontas`);

  const todosIds = Object.values(associadosCriados);

  async function criarReuniao(args: {
    titulo: string;
    descricao: string;
    data: Date;
    horario: string;
    local: string;
    status: "agendada" | "em_andamento" | "concluida" | "cancelada";
    pauta: string[];
    participantes: string[];
    presentes?: string[];
    ata?: string;
  }) {
    const existente = await prisma.reuniao.findFirst({
      where: { titulo: args.titulo },
    });
    if (existente) return;

    const reuniao = await prisma.reuniao.create({
      data: {
        titulo: args.titulo,
        descricao: args.descricao,
        data: args.data,
        horario: args.horario,
        local: args.local,
        status: args.status,
        pautaJson: JSON.stringify(args.pauta),
        ata: args.ata,
      },
    });

    for (const nomeAssociado of args.participantes) {
      const associadoId = associadosCriados[nomeAssociado];
      if (!associadoId) continue;
      await prisma.presencaReuniao.create({
        data: {
          reuniaoId: reuniao.id,
          associadoId,
          presente: args.presentes?.includes(nomeAssociado) ?? false,
        },
      });
    }
  }

  await criarReuniao({
    titulo: "Assembleia Geral Ordinária",
    descricao: "Discussão sobre novas regulamentações e aprovação de contas",
    data: new Date("2024-04-15"),
    horario: "14:00",
    local: "Sede da Associação - Sala Principal",
    status: "agendada",
    pauta: [
      "Aprovação das contas do trimestre",
      "Discussão sobre novas quotas de pesca",
      "Eleição de novos membros da diretoria",
      "Melhorias na infraestrutura do porto",
    ],
    participantes: Object.keys(associadosCriados),
  });

  await criarReuniao({
    titulo: "Reunião sobre Sustentabilidade",
    descricao: "Práticas de pesca sustentável e preservação ambiental",
    data: new Date("2024-04-10"),
    horario: "16:00",
    local: "Auditório Maré Alta",
    status: "concluida",
    pauta: [
      "Apresentação de práticas sustentáveis",
      "Discussão sobre áreas de preservação",
      "Parceria com ONGs ambientais",
    ],
    participantes: ["João da Silva", "Maria Santos", "Pedro Costa", "Carlos Ferreira"],
    presentes: ["João da Silva", "Maria Santos", "Carlos Ferreira"],
    ata: "Reunião realizada com sucesso. Foram aprovadas novas diretrizes de pesca sustentável e estabelecida parceria com a ONG Mar Limpo.",
  });

  await criarReuniao({
    titulo: "Capacitação - Marketplace Digital",
    descricao: "Treinamento para venda online e uso do aplicativo",
    data: new Date("2024-04-20"),
    horario: "09:00",
    local: "Centro de Treinamento",
    status: "agendada",
    pauta: [
      "Como usar o aplicativo marketplace",
      "Gestão de vendas online",
      "Fotografia de produtos",
      "Atendimento ao cliente digital",
    ],
    participantes: ["João da Silva", "Maria Santos", "Carlos Ferreira"],
  });

  await criarReuniao({
    titulo: "Reunião Emergencial - Defeso",
    descricao: "Discussão sobre período de defeso e compensações",
    data: new Date("2024-03-25"),
    horario: "10:00",
    local: "Sede da Associação",
    status: "concluida",
    pauta: [
      "Informações sobre período de defeso",
      "Auxílio emergencial para associados",
      "Atividades alternativas durante defeso",
    ],
    participantes: Object.keys(associadosCriados),
    presentes: ["João da Silva", "Maria Santos", "Pedro Costa", "Carlos Ferreira"],
    ata: "Definidas estratégias de suporte durante o período de defeso. Aprovado auxílio emergencial para todos os associados ativos.",
  });
  console.log(`✅ Reuniões prontas`);

  const agora = new Date();
  const competenciaAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;

  const cenariosMensalidade: Record<string, { status: "pago" | "pendente" | "atrasado"; diasOffset: number }> = {
    "João da Silva": { status: "pago", diasOffset: 10 },
    "Maria Santos": { status: "pendente", diasOffset: 10 },
    "Pedro Costa": { status: "atrasado", diasOffset: -10 },
    "Ana Oliveira": { status: "pendente", diasOffset: 10 },
    "Carlos Ferreira": { status: "pago", diasOffset: 5 },
  };

  for (const [nomeAssociado, associadoId] of Object.entries(associadosCriados)) {
    const cenario = cenariosMensalidade[nomeAssociado] ?? { status: "pendente" as const, diasOffset: 10 };
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + cenario.diasOffset);

    const dataPagamento =
      cenario.status === "pago"
        ? new Date()
        : null;

    await prisma.mensalidade.upsert({
      where: { associadoId_competencia: { associadoId, competencia: competenciaAtual } },
      update: {
        valor: 50,
        dataVencimento,
        dataPagamento,
        status: cenario.status,
      },
      create: {
        associadoId,
        competencia: competenciaAtual,
        valor: 50,
        dataVencimento,
        dataPagamento,
        status: cenario.status,
      },
    });
  }
  console.log(`✅ Mensalidades de ${competenciaAtual} prontas`);

  // ── Produtos para o App Delivery ───────────────────────────────────────

  interface DadoProduto {
    lojaNome: string;
    nome: string;
    especie: string;
    preco: number;
    estoque: number;
    descricao: string;
    categoria: string;
    foto: string;
    cortes: string;
    badges: string;
  }

  const dadosProdutos: DadoProduto[] = [
    {
      lojaNome: "Peixes Frescos João",
      nome: "Robalo Fresco",
      especie: "Robalo",
      preco: 38.0,
      estoque: 20,
      descricao: "Robalo fresco capturado hoje. Ideal para grelhados e assados.",
      categoria: "peixe",
      foto: "https://loremflickr.com/400/400/fish,seabass?seed=robalo",
      cortes: '["inteiro","limpo","file"]',
      badges: '["Hoje","Premium"]',
    },
    {
      lojaNome: "Peixes Frescos João",
      nome: "Camarão Rosa",
      especie: "Camarão Rosa",
      preco: 65.0,
      estoque: 10,
      descricao: "Camarão rosa selecionado. Perfeito para moquecas e frituras.",
      categoria: "crustaceo",
      foto: "https://loremflickr.com/400/400/shrimp?seed=camarao",
      cortes: '["inteiro","limpo"]',
      badges: '["Premium"]',
    },
    {
      lojaNome: "Peixes Frescos João",
      nome: "Corvina",
      especie: "Corvina",
      preco: 32.0,
      estoque: 15,
      descricao: "Corvina fresca. Excelente para filés grelhados.",
      categoria: "peixe",
      foto: "https://loremflickr.com/400/400/fish?seed=corvina",
      cortes: '["inteiro","file"]',
      badges: '["Hoje"]',
    },
    {
      lojaNome: "Fish Express",
      nome: "Tilápia",
      especie: "Tilápia",
      preco: 25.0,
      estoque: 30,
      descricao: "Tilápia de cativeiro, cortes especiais para o dia a dia.",
      categoria: "peixe",
      foto: "https://loremflickr.com/400/400/tilapia?seed=tilapia",
      cortes: '["inteiro","limpo","file"]',
      badges: '["Econômico"]',
    },
    {
      lojaNome: "Fish Express",
      nome: "Sardinha",
      especie: "Sardinha",
      preco: 15.0,
      estoque: 40,
      descricao: "Sardinha fresca. Ótima para fritar ou assar.",
      categoria: "peixe",
      foto: "https://loremflickr.com/400/400/sardine?seed=sardinha",
      cortes: '["inteiro"]',
      badges: '["Hoje","Econômico"]',
    },
    {
      lojaNome: "Empório do Mar",
      nome: "Lagosta",
      especie: "Lagosta",
      preco: 89.0,
      estoque: 5,
      descricao: "Lagosta fresca. Para ocasiões especiais.",
      categoria: "crustaceo",
      foto: "https://loremflickr.com/400/400/lobster?seed=lagosta",
      cortes: '["inteiro","limpo"]',
      badges: '["Premium"]',
    },
    {
      lojaNome: "Empório do Mar",
      nome: "Polvo",
      especie: "Polvo",
      preco: 55.0,
      estoque: 8,
      descricao: "Polvo fresco e macio. Perfeito para saladas e grelhados.",
      categoria: "crustaceo",
      foto: "https://loremflickr.com/400/400/octopus?seed=polvo",
      cortes: '["inteiro","file"]',
      badges: '["Premium"]',
    },
    {
      lojaNome: "Peixe da Dona",
      nome: "Pargo",
      especie: "Pargo",
      preco: 42.0,
      estoque: 12,
      descricao: "Pargo vermelho fresco. Sabor inconfundível.",
      categoria: "peixe",
      foto: "https://loremflickr.com/400/400/snapper?seed=pargo",
      cortes: '["inteiro","file"]',
      badges: '["Hoje"]',
    },
    {
      lojaNome: "Peixe da Dona",
      nome: "Dourado",
      especie: "Dourado",
      preco: 45.0,
      estoque: 10,
      descricao: "Dourado fresco. Ótimo para grelhados.",
      categoria: "peixe",
      foto: "https://loremflickr.com/400/400/dorado?seed=dourado",
      cortes: '["inteiro","file"]',
      badges: '["Premium"]',
    },
    {
      lojaNome: "Raimundo Pescados",
      nome: "Siri Mole",
      especie: "Siri Mole",
      preco: 50.0,
      estoque: 6,
      descricao: "Siri mole crocante. Iguaria capixaba.",
      categoria: "crustaceo",
      foto: "https://loremflickr.com/400/400/crab?seed=siri",
      cortes: '["inteiro"]',
      badges: '["Hoje","Premium"]',
    },
    {
      lojaNome: "Raimundo Pescados",
      nome: "Lula",
      especie: "Lula",
      preco: 35.0,
      estoque: 14,
      descricao: "Lula fresca. Ideal para frituras e moquecas.",
      categoria: "crustaceo",
      foto: "https://loremflickr.com/400/400/squid?seed=lula",
      cortes: '["inteiro","limpo"]',
      badges: '["Econômico"]',
    },
    {
      lojaNome: "Raimundo Pescados",
      nome: "Anchova",
      especie: "Anchova",
      preco: 28.0,
      estoque: 18,
      descricao: "Anchova fresca. Perfeita para assar na brasa.",
      categoria: "peixe",
      foto: "https://loremflickr.com/400/400/anchovy?seed=anchova",
      cortes: '["inteiro","file"]',
      badges: '["Econômico"]',
    },
  ];

  let produtosCriados = 0;
  for (const dados of dadosProdutos) {
    const lojaId = lojasCriadas[dados.lojaNome];
    if (!lojaId) continue;

    const existente = await prisma.produto.findFirst({
      where: { lojaId, nome: dados.nome },
    });
    if (existente) continue;

    await prisma.produto.create({
      data: {
        lojaId,
        nome: dados.nome,
        especie: dados.especie,
        preco: dados.preco,
        precoPorKg: dados.preco,
        estoque: dados.estoque,
        pesoDisponivel: dados.estoque,
        descricao: dados.descricao,
        categoria: dados.categoria,
        foto: dados.foto,
        cortesDisponiveis: dados.cortes,
        badges: dados.badges,
      },
    });
    produtosCriados++;
  }
  console.log(`✅ ${produtosCriados} produtos criados`);

  console.log("🎉 Seed concluído.");
}

principal()
  .catch((erro) => {
    console.error("❌ Erro no seed:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
