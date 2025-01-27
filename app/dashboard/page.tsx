"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Dashboard() {
  const [code, setCode] = useState("")

  const validateCode = (e: React.FormEvent) => {
    e.preventDefault()
    // Add code validation logic here
    console.log("Validating code:", code)
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold">João da Silva</h1>
            <p className="text-sm opacity-90">Setor: Pesquisa</p>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="#" className="hover:text-zinc-200 transition-colors">
                  Relatórios
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-zinc-200 transition-colors">
                  Minha Equipe
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <form onSubmit={validateCode} className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-zinc-800 mb-6 text-center">Validar Código</h2>
          <div className="space-y-4">
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o código recebido por e-mail"
              className="w-full"
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Validar
            </Button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-800 text-zinc-200 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="flex justify-center md:justify-start">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/epamig_logo-2vMg7oM4pTh8E3aN8ywr6xeKCiKxLh.svg"
                alt="EPAMIG Logo"
                width={120}
                height={50}
                className="brightness-0 invert"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm">
                © Todos os direitos reservados - EPAMIG - Empresa de Pesquisa Agropecuária de Minas Gerais
              </p>
              <p className="text-sm mt-2">Desenvolvimento: AINF - Assessoria de Informática</p>
            </div>
            <div className="text-sm text-center md:text-right">
              <p className="font-semibold">Contato:</p>
              <p>Email: contato@epamig.br</p>
              <p>Telefone: (31) 3489-5000</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

