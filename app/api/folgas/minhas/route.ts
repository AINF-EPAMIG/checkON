import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { query as checkonQuery } from "@/lib/db/checkon"
import { RowDataPacket } from "mysql2"

interface DisparoAgendado {
  data_disparo: string | Date
}

const TODOS_DIAS_PERIODO = ["2024-12-22", "2024-12-23", "2024-12-29", "2024-12-30"]

/**
 * GET - Retorna as folgas do colaborador logado
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

    const colaborador = session.user?.colaborador
    if (!colaborador || !colaborador.chapa) {
      return NextResponse.json(
        { erro: "Colaborador não encontrado" },
        { status: 400 },
      )
    }

    // Buscar dias de trabalho agendados
    const disparos = await checkonQuery<DisparoAgendado & RowDataPacket>(
      `SELECT DISTINCT DATE(data_disparo) as data_disparo
       FROM lista_disparo
       WHERE chapa = ?
         AND DATE(data_disparo) IN (?, ?, ?, ?)
       ORDER BY data_disparo`,
      [colaborador.chapa, ...TODOS_DIAS_PERIODO],
    )

    // Dias que tem disparo = dias de trabalho
    const diasTrabalho = disparos.map(d => {
      const dataStr = typeof d.data_disparo === 'string'
        ? d.data_disparo
        : d.data_disparo.toISOString().split('T')[0]
      return dataStr
    })

    // Dias de folga = dias que NÃO têm disparo
    const diasFolga = TODOS_DIAS_PERIODO.filter(dia => !diasTrabalho.includes(dia))

    return NextResponse.json({
      sucesso: true,
      colaborador: {
        nome: colaborador.nome,
        chapa: colaborador.chapa,
        funcao: colaborador.funcao,
      },
      diasTrabalho,
      diasFolga,
      temAgendamento: diasTrabalho.length > 0 || diasFolga.length > 0,
    })
  } catch (error) {
    console.error("Erro ao buscar folgas:", error)
    return NextResponse.json(
      { erro: "Erro ao buscar folgas" },
      { status: 500 },
    )
  }
}

