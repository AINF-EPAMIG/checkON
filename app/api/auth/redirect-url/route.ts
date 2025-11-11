import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isNivelChefia } from "@/lib/data/colaboradores"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.colaborador) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      )
    }

    const colaborador = session.user.colaborador
    const ehChefia = isNivelChefia(colaborador.nivel)

    // Se for chefia, redireciona para agendar-folga
    // Se for colaborador comum, redireciona para minhas-folgas
    const redirectUrl = ehChefia ? "/user/agendar-folga" : "/user/minhas-folgas"

    return NextResponse.json({ redirectUrl })
  } catch (error) {
    console.error("Erro ao obter URL de redirecionamento:", error)
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    )
  }
}

