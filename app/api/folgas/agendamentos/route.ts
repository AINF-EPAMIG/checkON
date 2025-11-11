import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { obterStatusChefia } from "@/lib/services/chefia"
import {
  getSubordinados,
  salvarAgendamentos,
  AgendamentoFolga,
  getAgendamentosExistentes,
  detectarTipoFolga,
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
    const subordinadosComAgendamentos = subordinados.map(sub => {
      const diasTrabalho = agendamentosExistentes.get(sub.chapa) || new Set()
      const temAgendamento = diasTrabalho.size > 0
      const { tipoFolga, diasEspecificos } = detectarTipoFolga(diasTrabalho, temAgendamento)
      
      return {
        ...sub,
        tipoFolga,
        diasEspecificos,
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
      if (!agendamento.chapa || !agendamento.tipoFolga) {
        return NextResponse.json(
          { erro: "Cada agendamento deve ter 'chapa' e 'tipoFolga'" },
          { status: 400 },
        )
      }

      if (
        agendamento.tipoFolga === "especifico" &&
        (!agendamento.diasEspecificos ||
          agendamento.diasEspecificos.length === 0)
      ) {
        return NextResponse.json(
          {
            erro: "Para tipo 'especifico', é necessário informar 'diasEspecificos'",
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

