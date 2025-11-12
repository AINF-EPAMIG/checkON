import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { obterStatusChefia } from "@/lib/services/chefia"
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
    if (!nomeChefe) {
      return NextResponse.json(
        { erro: "Nome do chefe não encontrado" },
        { status: 400 },
      )
    }

    const subordinados = await getSubordinados(nomeChefe)

    // Buscar agendamentos existentes
    const chapas = subordinados.map(s => s.chapa)
    const agendamentosExistentes = await getAgendamentosExistentes(chapas)

    // Adicionar informação de agendamentos para cada subordinado
    const TODOS_DIAS = ["2024-12-22", "2024-12-23", "2024-12-29", "2024-12-30"]
    const subordinadosComAgendamentos = subordinados.map(sub => {
      const diasTrabalho = Array.from(agendamentosExistentes.get(sub.chapa) || [])
      const diasFolga = TODOS_DIAS.filter(dia => !diasTrabalho.includes(dia))
      const temAgendamento = diasTrabalho.length > 0
      
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

