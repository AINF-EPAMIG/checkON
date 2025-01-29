"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

interface RoleProviderProps {
  children: ReactNode
}

const SESSION_TIMEOUT = 900000;
const LOADING_TIMEOUT = 500;

export function RoleProvider({ children }: RoleProviderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

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

    if (status === "loading") {
      // Enquanto a sessão está sendo carregada, mantenha o loading
      return
    }

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

    if (status === "authenticated") {
      // Redireciona para a página /validar se não estiver na página /validar
      if (currentPath !== "/validar") {
        router.push("/validar")
      }

      // Configura um timeout para desconectar o usuário após o tempo de sessão
      const timeout = setTimeout(() => {
        signOut({ callbackUrl: "/" }) // Desconecta o usuário e redireciona para a página inicial
      }, SESSION_TIMEOUT)

      // Finaliza o loading após a verificação
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, LOADING_TIMEOUT);

      return () => {
        clearTimeout(timeout) // Limpa o timeout de desconexão
        clearTimeout(loadingTimeout) // Limpa o timeout de loading
      }
    }

    // Adiciona um atraso antes de finalizar o loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false)
    }, LOADING_TIMEOUT);

    return () => {
      clearTimeout(loadingTimeout) // Limpa o timeout de loading se o componente for desmontado
    }
  }, [status, session, router])

  // Adiciona log do estado atual
  console.log('RoleProvider State:', { status, role: session?.user?.role })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        {/* Você pode ajustar a classe para estilizar o ícone conforme necessário */}
      </div>
    )
  }

  return <>{children}</>
}