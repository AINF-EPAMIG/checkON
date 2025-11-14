import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { obterStatusChefia } from "@/lib/services/chefia"
import { RowDataPacket } from "mysql2"
import {
  getSubordinados,
  salvarAgendamentos,
  AgendamentoFolga,
  getAgendamentosExistentes,
} from "@/lib/data/folgas"

/**
 * GET - Retorna a lista de subordinados do chefe logado com seus agendamentos existentes
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { erro: "Não autenticado" },
        { status: 401 },
      )
    }

    const statusChefia = await obterStatusChefia(session.user?.colaborador)

    if (!statusChefia.isChefe) {
      return NextResponse.json(
        { erro: "Acesso negado. Usuário não é chefia." },
        { status: 403 },
      )
    }

    const nomeChefe = session.user?.colaborador?.nome
    const chapaChefe = session.user?.colaborador?.chapa
    
    if (!nomeChefe) {
      return NextResponse.json(
        { erro: "Nome do chefe não encontrado" },
        { status: 400 },
      )
    }

    const subordinadosBase = await getSubordinados(nomeChefe)

    // Exceção: Chapa 012307 pode agendar para chapas específicas além dos subordinados normais
    let subordinados = subordinadosBase
    if (chapaChefe === "012307") {
      const chapasExtras = ["005217", "006664", "099993"]
      
      // Buscar dados das chapas extras do banco de dados
      const { query } = await import("@/lib/db/funcionarios")
      
      const subordinadosExtras = await query<{
        id: number
        chapa: string
        nome: string
        cpf: string | null
        email: string | null
        cargo: string | null
        funcao: string | null
      } & RowDataPacket>(
        `SELECT id, chapa, nome, cpf, email, cargo, funcao
         FROM vw_colaboradores_completos
         WHERE chapa IN (?, ?, ?)
         AND status_colaborador = 'ATIVO'`,
        chapasExtras
      )
      
      // Adicionar as chapas extras aos subordinados (sem duplicar se já estiverem)
      const chapasExistentes = new Set(subordinadosBase.map(s => s.chapa))
      const extrasUnicos = subordinadosExtras.filter(extra => !chapasExistentes.has(extra.chapa))
      
      // Reatribuir com spread operator (imutável e detectável pelo ESLint)
      subordinados = [...subordinadosBase, ...extrasUnicos]
    }

    // Buscar agendamentos existentes
    const chapas = subordinados.map(s => s.chapa)
    const agendamentosExistentes = await getAgendamentosExistentes(chapas)

    // Adicionar informação de agendamentos para cada subordinado
    const TODOS_DIAS = ["2025-12-22", "2025-12-23", "2025-12-29", "2025-12-30"]
    const subordinadosComAgendamentos = subordinados.map(sub => {
      const agendamentosChapa = agendamentosExistentes.get(sub.chapa)
      const temAgendamento = agendamentosChapa !== undefined && agendamentosChapa.size > 0
      
      // Se NÃO tem agendamento, estado padrão é TRABALHO em todos os dias
      // Se TEM agendamento, usa o que está salvo
      const diasTrabalho = temAgendamento 
        ? Array.from(agendamentosChapa!) 
        : [...TODOS_DIAS]
      
      const diasFolga = TODOS_DIAS.filter(dia => !diasTrabalho.includes(dia))
      
      return {
        ...sub,
        diasTrabalho,
        diasFolga,
        temAgendamento,
      }
    })

    return NextResponse.json({
      sucesso: true,
      subordinados: subordinadosComAgendamentos,
      total: subordinadosComAgendamentos.length,
    })
  } catch (error) {
    console.error("Erro ao buscar subordinados:", error)
    return NextResponse.json(
      { erro: "Erro ao buscar subordinados" },
      { status: 500 },
    )
  }
}

/**
 * POST - Salva os agendamentos de folga
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { erro: "Não autenticado" },
        { status: 401 },
      )
    }

    const statusChefia = await obterStatusChefia(session.user?.colaborador)

    if (!statusChefia.isChefe) {
      return NextResponse.json(
        { erro: "Acesso negado. Usuário não é chefia." },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { agendamentos } = body as { agendamentos: AgendamentoFolga[] }

    if (!agendamentos || !Array.isArray(agendamentos)) {
      return NextResponse.json(
        { erro: "Dados inválidos. 'agendamentos' deve ser um array." },
        { status: 400 },
      )
    }

    // Validar que todos os agendamentos têm os campos obrigatórios
    for (const agendamento of agendamentos) {
      if (!agendamento.chapa) {
        return NextResponse.json(
          { erro: "Cada agendamento deve ter 'chapa'" },
          { status: 400 },
        )
      }

      if (!agendamento.diasTrabalho || !Array.isArray(agendamento.diasTrabalho)) {
        return NextResponse.json(
          {
            erro: "Cada agendamento deve ter 'diasTrabalho' como array",
          },
          { status: 400 },
        )
      }
    }

    const resultado = await salvarAgendamentos(agendamentos)

    if (resultado.sucesso) {
      return NextResponse.json({
        sucesso: true,
        mensagem: resultado.mensagem,
        disparosCriados: resultado.disparosCriados,
      })
    } else {
      return NextResponse.json(
        {
          sucesso: false,
          erro: resultado.mensagem,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao salvar agendamentos:", error)
    return NextResponse.json(
      { erro: "Erro ao salvar agendamentos" },
      { status: 500 },
    )
  }
}

