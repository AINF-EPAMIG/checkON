import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { obterStatusChefia } from "@/lib/services/chefia"
import MinhasFolgasClient from "./client"

export default async function MinhasFolgasPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const statusChefia = await obterStatusChefia(session.user?.colaborador)

  if (statusChefia.isChefe) {
    redirect("/user/agendar-folga")
  }

  return <MinhasFolgasClient />
}


