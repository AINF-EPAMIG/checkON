"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"

interface RoleProviderProps {
  children: ReactNode
}

export function RoleProvider({ children }: RoleProviderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Verifica se está em uma página pública
    const isPublicPage = window.location.pathname === "/" || 
                        window.location.pathname === "/validar"

    // Redireciona para home se não estiver autenticado
    if (status === "unauthenticated" && !isPublicPage) {
      router.push("/")
      return
    }

    // Verifica permissões de acesso para páginas protegidas
    if (status === "authenticated" && !isPublicPage) {
      const currentPath = window.location.pathname
      const userRole = session?.user?.role

      // Verifica acesso à página de programação (apenas admin)
      if (currentPath === "/programar" && userRole !== "Administrador") {
        router.push("/access-denied")
        return
      }

      // Verifica acesso à página da equipe (admin ou chefia)
      if (currentPath === "/minha-equipe" && 
          userRole !== "Administrador" && 
          userRole !== "Chefia") {
        router.push("/access-denied")
        return
      }
    }
  }, [status, session, router])

  if (status === "loading") {
    return null
  }

  return <>{children}</>
} 