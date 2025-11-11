import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { obterStatusChefia } from "@/lib/services/chefia"
import { getSubordinados } from "@/lib/data/folgas"
import { query as checkonQuery } from "@/lib/db/checkon"
import { RowDataPacket } from "mysql2"

interface DisparoAgendado {
  chapa: string
  data_disparo: string | Date
}

/**
 * GET - Retorna os agendamentos de trabalho dos subordinados
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

    // Buscar subordinados
    const subordinados = await getSubordinados(nomeChefe)

    if (subordinados.length === 0) {
      return NextResponse.json({
        sucesso: true,
        subordinados: [],
        agendamentos: [],
      })
    }

    // Buscar disparos agendados para os subordinados
    const chapas = subordinados.map(s => s.chapa)
    const placeholders = chapas.map(() => "?").join(",")

    const disparos = await checkonQuery<DisparoAgendado & RowDataPacket>(
      `SELECT DISTINCT chapa, DATE(data_disparo) as data_disparo
       FROM lista_disparo
       WHERE chapa IN (${placeholders})
         AND DATE(data_disparo) IN ('2024-12-22', '2024-12-23', '2024-12-29', '2024-12-30')
       ORDER BY chapa, data_disparo`,
      chapas,
    )

    // Organizar os dados para facilitar a visualização
    const agendamentosPorSubordinado = subordinados.map(sub => {
      const diasTrabalho = disparos
        .filter(d => d.chapa === sub.chapa)
        .map(d => {
          const dataStr = typeof d.data_disparo === 'string'
            ? d.data_disparo
            : d.data_disparo.toISOString().split('T')[0]
          return dataStr
        })

      return {
        chapa: sub.chapa,
        nome: sub.nome,
        funcao: sub.funcao,
        diasTrabalho,
      }
    })

    return NextResponse.json({
      sucesso: true,
      subordinados: agendamentosPorSubordinado,
    })
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error)
    return NextResponse.json(
      { erro: "Erro ao buscar agendamentos" },
      { status: 500 },
    )
  }
}

