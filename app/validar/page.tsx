"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { useRouter } from "next/navigation"
import { MobileAccessBlock } from "@/components/MobileAccessBlock"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeviceCheck } from "@/hooks/useDeviceCheck"
import { Lock } from "lucide-react"

interface UserInfo {
  NOME_COMPLETO: string
  CHAPA: string
  FILIAL: string
  SECAO: string
}

function ValidarSkeleton() {
  return <Skeleton className="h-10 w-full" />
}

export default function ValidarPage() {
  const [code, setCode] = useState("")
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { shouldBlockAccess } = useDeviceCheck()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    } else if (status === "authenticated" && session?.user?.email) {
      fetchUserInfo(session.user.email)
    }
  }, [status, router, session])

  const fetchUserInfo = async (email: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/AINF22012025.02/1/P/?parameters=email=${email}`,
        {
          headers: {
            Authorization: "Basic " + btoa("arthur.souza" + ":" + "4518Adz74$"),
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data && data.length > 0) {
        setUserInfo(data[0])
      }
    } catch (error) {
      console.error("Error fetching user info:", error)
      setMessage({
        type: 'error',
        text: 'Não foi possível carregar as informações do usuário.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !session?.user?.email) {
      setMessage({
        type: 'error',
        text: 'Por favor, insira o código de validação.'
      })
      return
    }

    try {
      setIsValidating(true)
      setMessage(null)

      const response = await fetch('https://epamig.tech/novo_checkon/validar_code.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          email: session.user.email.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Código validado com sucesso!'
        })
        setIsValidated(true)
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Código inválido, já utilizado ou expirado.'
        })
      }
    } catch (error) {
      console.error('Erro ao validar código:', error)
      setMessage({
        type: 'error',
        text: 'Ocorreu um erro ao validar o código. Tente novamente.'
      })
    } finally {
      setIsValidating(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header userInfo={null} />
        <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <ValidarSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (shouldBlockAccess) {
    return <MobileAccessBlock />
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header userInfo={userInfo} />

      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-zinc-800 mb-6 text-center">
            Validar código CheckON
          </h2>
          
          {message && (
            <div 
              className={`mb-4 p-3 rounded text-sm ${
                message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digite o código recebido por e-mail"
                className="w-full pl-10"
                disabled={isValidating || isValidated}
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ width: '16px', height: '16px' }} />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!code || isValidating || isValidated}
            >
              {isValidating ? 'Validando...' : 'Validar'}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}