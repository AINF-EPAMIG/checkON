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
    // Array de páginas públicas
    const publicPages = ["/", "/validar"]
    
    // Array de páginas restritas a admin
    const adminOnlyPages = ["/programar"]
    
    // Array de páginas permitidas para admin e chefia
    const adminAndChiefPages = ["/minha-equipe"]

    const currentPath = window.location.pathname
    const isPublicPage = publicPages.includes(currentPath)
    const userRole = session?.user?.role

    // Adiciona logs para debug
    console.log('Current Path:', currentPath)
    console.log('User Role:', userRole)
    console.log('Auth Status:', status)

    // Redireciona para home se não estiver autenticado
    if (status === "unauthenticated" && !isPublicPage) {
      console.log('Redirecting to home: unauthenticated')
      router.push("/")
      return
    }

    // Verifica permissões de acesso para páginas protegidas
    if (status === "authenticated" && !isPublicPage) {
      // Verifica páginas exclusivas de admin
      if (adminOnlyPages.includes(currentPath) && userRole !== "Administrador") {
        console.log('Redirecting to access-denied: admin only')
        router.push("/access-denied")
        return
      }

      // Verifica páginas de admin e chefia
      if (adminAndChiefPages.includes(currentPath) && 
          userRole !== "Administrador" && 
          userRole !== "Chefia") {
        console.log('Redirecting to access-denied: admin and chief only')
        router.push("/access-denied")
        return
      }
    }
  }, [status, session, router])

  // Adiciona log do estado atual
  console.log('RoleProvider State:', { status, role: session?.user?.role })

  if (status === "loading") {
    return null
  }

  return <>{children}</>
}