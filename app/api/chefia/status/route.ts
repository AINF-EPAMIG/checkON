import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { obterStatusChefia } from "@/lib/services/chefia"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 },
    )
  }

  try {
    const statusChefia = await obterStatusChefia(session.user?.colaborador)

    return NextResponse.json(statusChefia)
  } catch (error) {
    console.error("Erro ao verificar status de chefia:", error)

    return NextResponse.json(
      { error: "Erro ao verificar status de chefia" },
      { status: 500 },
    )
  }
}


