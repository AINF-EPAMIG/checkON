"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && session?.user?.colaborador && !isRedirecting) {
      setIsRedirecting(true)
      
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
  }, [status, session, router, isRedirecting])

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
      <h1 className="text-3xl font-bold text-[#1e7b4f] mb-6">
        Bem-vindo, {session.user?.name}!
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Adicione aqui os cards ou conteúdo da página inicial */}
      </div>
    </div>
  )
}
