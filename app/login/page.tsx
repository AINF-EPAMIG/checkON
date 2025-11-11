"use client"

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { signIn } from "next-auth/react"

function LoginForm() {
  const searchParams = useSearchParams()
  const [cpf, setCpf] = useState("")
  const [chapa, setChapa] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      OAuthLogin: "Não foi possível realizar o login. Tente novamente.",
      OAuthAccountNotLinked:
        "Esse e-mail já está vinculado a outro método de login. Use o método original.",
      COLABORADOR_NAO_ENCONTRADO:
        "Seu e-mail corporativo não foi localizado. Informe CPF e chapa para acessar.",
      CREDENCIAIS_INVALIDAS: "CPF ou chapa inválidos. Verifique os dados e tente novamente.",
      CredentialsSignin: "CPF ou chapa inválidos. Verifique os dados e tente novamente.",
    }),
    [],
  )

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(errorMessages[errorParam] ?? errorMessages.OAuthLogin)
    }
  }, [errorMessages, searchParams])

  const handleGoogleLogin = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      const response = await signIn("google", {
        callbackUrl: "/",
        redirect: false,
      })

      if (response?.error) {
        setError("Falha ao autenticar com o Google.")
        setIsLoading(false)
        return
      }

      if (response?.ok) {
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
      setError("Ocorreu um erro inesperado. Tente novamente.")
      setIsLoading(false)
    }
  }, [])

  const handleCredentialsLogin = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setCredentialsError(null)
      setError(null)
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
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-slate-700 border border-slate-200 shadow-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Redirecionando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Entrar com Google</span>
                    </div>
                  )}
                </Button>

                <div className="text-center text-xs uppercase text-slate-400 tracking-wide">
                  ou
                </div>

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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e7b4f]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
