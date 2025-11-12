"use client"

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { signIn } from "next-auth/react"
import Link from "next/link"

function LoginChapaForm() {
  const searchParams = useSearchParams()
  const [cpf, setCpf] = useState("")
  const [chapa, setChapa] = useState("")
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false)
  const [credentialsError, setCredentialsError] = useState<string | null>(null)

  const isCredentialsDisabled = useMemo(
    () =>
      isCredentialsLoading ||
      cpf.replace(/\D/g, "").length !== 11 ||
      chapa.trim().length === 0,
    [cpf, chapa, isCredentialsLoading],
  )

  const errorMessages = useMemo<Record<string, string>>(
    () => ({
      CREDENCIAIS_INVALIDAS: "CPF ou chapa inválidos. Verifique os dados e tente novamente.",
      CredentialsSignin: "CPF ou chapa inválidos. Verifique os dados e tente novamente.",
    }),
    [],
  )

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setCredentialsError(errorMessages[errorParam] ?? "Erro ao realizar login.")
    }
  }, [errorMessages, searchParams])

  const handleCredentialsLogin = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setCredentialsError(null)
      setIsCredentialsLoading(true)

      try {
        const formattedCpf = cpf.replace(/\D/g, "")
        const response = await signIn("credentials", {
          cpf: formattedCpf,
          chapa: chapa.trim(),
          redirect: false,
          callbackUrl: "/",
        })

        if (response?.error) {
          setCredentialsError(
            errorMessages[response.error] ?? "Não foi possível validar as credenciais.",
          )
          setIsCredentialsLoading(false)
          return
        }

        // Login bem-sucedido - redirecionar
        if (response?.ok) {
          // Limpar o sessionStorage para permitir redirecionamento automático
          sessionStorage.removeItem('hasVisitedHome')
          
          // Aguardar um momento para garantir que a sessão foi criada
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Obter a URL de redirecionamento baseada no nível do usuário
          const redirectResponse = await fetch("/api/auth/redirect-url")
          if (redirectResponse.ok) {
            const { redirectUrl } = await redirectResponse.json()
            window.location.href = redirectUrl
          } else {
            window.location.href = "/"
          }
          return
        }
      } catch {
        setCredentialsError("Ocorreu um erro inesperado. Tente novamente.")
        setIsCredentialsLoading(false)
      }
    },
    [cpf, chapa, errorMessages],
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url(/bg-reserva.svg)",
          backgroundPosition: "center 20%",
        }}
      />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-lg bg-white/70 backdrop-blur">
            <CardHeader className="text-center space-y-8">
              <div className="flex justify-center">
                <Image
                  src="/epamig_logo.svg"
                  alt="EPAMIG Logo"
                  width={280}
                  height={120}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-700">Login com CPF e Chapa</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Área de acesso especial. Para login padrão,{" "}
                  <Link href="/login" className="text-epamig-primary hover:underline">
                    clique aqui
                  </Link>
                  .
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="cpf"
                    className="block text-sm font-medium text-slate-600"
                  >
                    CPF
                  </label>
                  <input
                    id="cpf"
                    name="cpf"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={11}
                    value={cpf}
                    onChange={(event) => {
                      const onlyDigits = event.target.value.replace(/\D/g, "")
                      setCpf(onlyDigits)
                      if (credentialsError) {
                        setCredentialsError(null)
                      }
                    }}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-epamig-accent-1"
                    placeholder="Somente números"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="chapa"
                    className="block text-sm font-medium text-slate-600"
                  >
                    Chapa
                  </label>
                  <input
                    id="chapa"
                    name="chapa"
                    autoComplete="off"
                    value={chapa}
                    onChange={(event) => {
                      setChapa(event.target.value)
                      if (credentialsError) {
                        setCredentialsError(null)
                      }
                    }}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-epamig-accent-1"
                    placeholder="Informe a chapa"
                  />
                </div>

                {credentialsError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{credentialsError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isCredentialsDisabled}
                  className="w-full h-12 bg-epamig-primary text-white hover:bg-epamig-secondary"
                >
                  {isCredentialsLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <span>Entrar com CPF e chapa</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginChapaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e7b4f]" />
      </div>
    }>
      <LoginChapaForm />
    </Suspense>
  )
}

