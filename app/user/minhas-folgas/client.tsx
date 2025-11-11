"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface MinhasFolgasData {
  colaborador: {
    nome: string
    chapa: string
    funcao: string | null
  }
  diasTrabalho: string[]
  diasFolga: string[]
  temAgendamento: boolean
}

const DIAS_PERIODO = [
  { data: "2024-12-22", label: "22/12", nome: "Domingo" },
  { data: "2024-12-23", label: "23/12", nome: "Segunda-feira" },
  { data: "2024-12-29", label: "29/12", nome: "Domingo" },
  { data: "2024-12-30", label: "30/12", nome: "Segunda-feira" },
]

export default function MinhasFolgasClient() {
  const [dados, setDados] = useState<MinhasFolgasData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    carregarFolgas()
  }, [])

  const carregarFolgas = async () => {
    try {
      setCarregando(true)
      setErro(null)
      
      const response = await fetch("/api/folgas/minhas")
      
      if (!response.ok) {
        throw new Error("Erro ao carregar folgas")
      }

      const data = await response.json()
      setDados(data)
    } catch (error) {
      console.error("Erro ao carregar folgas:", error)
      setErro("Erro ao carregar suas folgas. Por favor, tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  const verificarFolga = (data: string): boolean => {
    return dados?.diasFolga.includes(data) || false
  }

  const verificarTrabalho = (data: string): boolean => {
    return dados?.diasTrabalho.includes(data) || false
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-[#1e7b4f]">Minhas Folgas</h1>
        <p className="mt-2 text-gray-600">
          Visualize suas folgas programadas para o período de fim de ano.
        </p>
      </header>

      {carregando ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Carregando suas folgas...</p>
          </CardContent>
        </Card>
      ) : erro ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{erro}</p>
          </CardContent>
        </Card>
      ) : !dados?.temAgendamento ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Ainda não há folgas programadas para você no período de 22/12 a 30/12.
              Aguarde a definição da sua chefia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Dias de Folga</CardTitle>
                <CardDescription>Dias em que você não trabalhará</CardDescription>
              </CardHeader>
              <CardContent>
                {dados.diasFolga.length === 0 ? (
                  <p className="text-sm text-gray-600">Você trabalhará todos os dias do período.</p>
                ) : (
                  <div className="space-y-2">
                    {DIAS_PERIODO.filter(dia => verificarFolga(dia.data)).map((dia) => (
                      <div key={dia.data} className="flex items-center justify-between p-3 bg-white rounded border border-green-200">
                        <span className="font-medium">{dia.label}</span>
                        <span className="text-sm text-gray-600">{dia.nome}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Dias de Trabalho</CardTitle>
                <CardDescription>Dias em que você trabalhará</CardDescription>
              </CardHeader>
              <CardContent>
                {dados.diasTrabalho.length === 0 ? (
                  <p className="text-sm text-gray-600">Você estará de folga em todos os dias do período.</p>
                ) : (
                  <div className="space-y-2">
                    {DIAS_PERIODO.filter(dia => verificarTrabalho(dia.data)).map((dia) => (
                      <div key={dia.data} className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                        <span className="font-medium">{dia.label}</span>
                        <span className="text-sm text-gray-600">{dia.nome}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  )
}

