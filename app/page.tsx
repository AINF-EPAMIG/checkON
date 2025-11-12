"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function HomeContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    // Reseta o estado toda vez que o efeito roda
    setIsChecking(true)

    // Função assíncrona para lidar com o redirecionamento
    const checkAndRedirect = async () => {
      if (status === "unauthenticated") {
        router.push("/login")
        return
      }

      if (status === "loading") {
        return
      }

      if (status === "authenticated" && session?.user?.colaborador && isMounted) {
        const hasVisitedHome = sessionStorage.getItem('hasVisitedHome')
        
        if (hasVisitedHome !== 'true') {
          // Marca que o usuário já visitou a home nesta sessão
          sessionStorage.setItem('hasVisitedHome', 'true')
          
          try {
            // Obter a URL de redirecionamento baseada no nível do usuário
            const res = await fetch("/api/auth/redirect-url")
            const data = await res.json()
            
            if (data.redirectUrl && isMounted) {
              router.push(data.redirectUrl)
              return // Mantém em "checking" enquanto redireciona
            }
          } catch (error) {
            console.error("Erro ao obter URL de redirecionamento:", error)
          }
        }
        
        // Se já visitou ou não vai redirecionar, para de checar
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    checkAndRedirect()

    return () => {
      isMounted = false
    }
  }, [status, session, router, pathname])

  if (status === "loading" || (status === "authenticated" && isChecking)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#1e7b4f] mb-2">
        Bem-vindo ao Sistema CheckON!
      </h1>
      <p className="text-gray-600 mb-8">
        Olá, {session.user?.name?.split(' ')[0]}! Use o menu de navegação acima para acessar as funcionalidades do sistema.
      </p>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
