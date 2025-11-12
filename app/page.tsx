"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

function HomeContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    // Verifica se o parâmetro 'stay' está presente ou se já redirecionou nesta sessão
    const shouldStay = searchParams.get('stay') === 'true' || sessionStorage.getItem('hasVisitedHome') === 'true'

    if (status === "authenticated" && session?.user?.colaborador && !isRedirecting && !hasRedirected && !shouldStay) {
      setIsRedirecting(true)
      setHasRedirected(true)
      
      // Marca que o usuário já visitou a home nesta sessão
      sessionStorage.setItem('hasVisitedHome', 'true')
      
      // Obter a URL de redirecionamento baseada no nível do usuário
      fetch("/api/auth/redirect-url")
        .then(res => res.json())
        .then(data => {
          if (data.redirectUrl) {
            router.push(data.redirectUrl)
          }
        })
        .catch(() => {
          // Em caso de erro, manter na página inicial
          setIsRedirecting(false)
        })
    }
  }, [status, session, router, isRedirecting, hasRedirected, searchParams])

  if (status === "loading" || isRedirecting) {
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
