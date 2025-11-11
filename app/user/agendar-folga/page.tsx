import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { obterStatusChefia } from "@/lib/services/chefia"
import AgendarFolgaClient from "./client"

export default async function AgendarFolgaPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const statusChefia = await obterStatusChefia(session.user?.colaborador)

  if (!statusChefia.isChefe) {
    redirect("/user/minhas-folgas")
  }

  return <AgendarFolgaClient />
}

