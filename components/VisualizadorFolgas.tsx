"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SubordinadoAgendamento {
  chapa: string
  nome: string
  funcao: string | null
  diasTrabalho: string[]
}

interface VisualizadorFolgasProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DIAS_PERIODO = [
  { data: "2024-12-22", label: "22/12" },
  { data: "2024-12-23", label: "23/12" },
  { data: "2024-12-29", label: "29/12" },
  { data: "2024-12-30", label: "30/12" },
]

export default function VisualizadorFolgas({ open, onOpenChange }: VisualizadorFolgasProps) {
  const [subordinados, setSubordinados] = useState<SubordinadoAgendamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      carregarAgendamentos()
    }
  }, [open])

  const carregarAgendamentos = async () => {
    try {
      setCarregando(true)
      setErro(null)
      
      const response = await fetch("/api/folgas/visualizar")
      
      if (!response.ok) {
        throw new Error("Erro ao carregar agendamentos")
      }

      const data = await response.json()
      setSubordinados(data.subordinados || [])
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
      setErro("Erro ao carregar agendamentos. Por favor, tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  const verificarTrabalho = (chapa: string, data: string): boolean => {
    const subordinado = subordinados.find(s => s.chapa === chapa)
    return subordinado?.diasTrabalho.includes(data) || false
  }

  const contarTrabalhandoPorDia = (data: string): number => {
    return subordinados.filter(sub => sub.diasTrabalho.includes(data)).length
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Calendário de Folgas</DialogTitle>
          <DialogDescription>
            Visualização dos agendamentos realizados para o período de fim de ano
          </DialogDescription>
        </DialogHeader>

        {carregando ? (
          <div className="py-8">
            <p className="text-center text-gray-600">Carregando agendamentos...</p>
          </div>
        ) : erro ? (
          <div className="py-8">
            <p className="text-center text-red-600">{erro}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={carregarAgendamentos}>Tentar novamente</Button>
            </div>
          </div>
        ) : subordinados.length === 0 ? (
          <div className="py-8">
            <p className="text-center text-gray-600">
              Nenhum agendamento encontrado para seus subordinados.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Resumo por dia */}
            <div className="bg-blue-50 p-4 rounded-lg flex-shrink-0">
              <h3 className="font-semibold text-lg mb-3 text-blue-900">Resumo por Dia</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {DIAS_PERIODO.map((dia) => {
                  const trabalhando = contarTrabalhandoPorDia(dia.data)
                  const folga = subordinados.length - trabalhando
                  return (
                    <div key={dia.data} className="bg-white p-3 rounded border">
                      <p className="font-medium text-sm text-gray-700">{dia.label}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {trabalhando} trabalhando
                      </p>
                      <p className="text-xs text-red-600">
                        {folga} de folga
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tabela de agendamentos */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r">
                        Colaborador
                      </th>
                      {DIAS_PERIODO.map((dia) => (
                        <th
                          key={dia.data}
                          className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r last:border-r-0"
                        >
                          {dia.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subordinados.map((subordinado) => (
                      <tr key={subordinado.chapa} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-r">
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {subordinado.nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {subordinado.funcao || "N/A"}
                            </p>
                          </div>
                        </td>
                        {DIAS_PERIODO.map((dia) => {
                          const trabalha = verificarTrabalho(subordinado.chapa, dia.data)
                          return (
                            <td
                              key={dia.data}
                              className={`px-4 py-3 text-center border-r last:border-r-0 ${
                                trabalha ? "bg-green-50" : "bg-red-50"
                              }`}
                            >
                              {trabalha ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Trabalho
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Folga
                                </span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-gray-600">Dia de trabalho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-gray-600">Dia de folga</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

