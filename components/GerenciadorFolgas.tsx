"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Subordinado {
  id: number
  chapa: string
  nome: string
  cpf: string | null
  email: string | null
  cargo: string | null
  funcao: string | null
  temAgendamento?: boolean
  tipoFolga?: TipoFolga
  diasEspecificos?: string[]
}

type TipoFolga = "semana1" | "semana2" | "nenhuma" | "ambas" | "especifico" | ""

interface AgendamentoState {
  chapa: string
  nome: string
  tipoFolga: TipoFolga
  diasEspecificos: Set<string>
}

// Dias de trabalho disponíveis - apenas 2 dias por semana
const DIAS_TRABALHO = [
  { data: "2024-12-22", label: "22/12" },
  { data: "2024-12-23", label: "23/12" },
  { data: "2024-12-29", label: "29/12" },
  { data: "2024-12-30", label: "30/12" },
]

interface GerenciadorFolgasProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GerenciadorFolgas({ open, onOpenChange }: GerenciadorFolgasProps) {
  const [subordinados, setSubordinados] = useState<Subordinado[]>([])
  const [agendamentos, setAgendamentos] = useState<Map<string, AgendamentoState>>(new Map())
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(
    null,
  )

  useEffect(() => {
    if (open) {
      carregarSubordinados()
      setMensagem(null) // Limpar mensagem ao abrir
    }
  }, [open])

  const carregarSubordinados = async () => {
    try {
      setCarregando(true)
      const response = await fetch("/api/folgas/agendamentos")
      
      if (!response.ok) {
        throw new Error("Erro ao carregar subordinados")
      }

      const data = await response.json()
      setSubordinados(data.subordinados)

      // Inicializar agendamentos com valores existentes ou vazio (sem pré-seleção)
      const novosAgendamentos = new Map<string, AgendamentoState>()
      data.subordinados.forEach((sub: Subordinado) => {
        novosAgendamentos.set(sub.chapa, {
          chapa: sub.chapa,
          nome: sub.nome,
          tipoFolga: sub.tipoFolga || "",
          diasEspecificos: new Set(sub.diasEspecificos || []),
        })
      })
      setAgendamentos(novosAgendamentos)
    } catch (error) {
      console.error("Erro ao carregar subordinados:", error)
      setMensagem({
        tipo: "erro",
        texto: "Erro ao carregar lista de subordinados",
      })
    } finally {
      setCarregando(false)
    }
  }

  const atualizarTipoFolga = (chapa: string, tipoFolga: TipoFolga) => {
    const novosAgendamentos = new Map(agendamentos)
    const agendamento = novosAgendamentos.get(chapa)
    
    if (agendamento) {
      agendamento.tipoFolga = tipoFolga
      // Limpar dias específicos se mudar para outro tipo
      if (tipoFolga !== "especifico") {
        agendamento.diasEspecificos.clear()
      }
      novosAgendamentos.set(chapa, agendamento)
      setAgendamentos(novosAgendamentos)
    }
  }

  const toggleDiaEspecifico = (chapa: string, data: string) => {
    const novosAgendamentos = new Map(agendamentos)
    const agendamento = novosAgendamentos.get(chapa)
    
    if (agendamento) {
      if (agendamento.diasEspecificos.has(data)) {
        agendamento.diasEspecificos.delete(data)
      } else {
        agendamento.diasEspecificos.add(data)
      }
      novosAgendamentos.set(chapa, agendamento)
      setAgendamentos(novosAgendamentos)
    }
  }

  const salvarAgendamentos = async () => {
    try {
      setSalvando(true)
      setMensagem(null)

      // Validar se todos os subordinados têm uma opção selecionada
      const subordinadosSemSelecao = Array.from(agendamentos.values()).filter(
        (ag) => !ag.tipoFolga
      )

      if (subordinadosSemSelecao.length > 0) {
        const nomes = subordinadosSemSelecao.map((s) => s.nome).join(", ")
        setMensagem({
          tipo: "erro",
          texto: `Por favor, selecione uma opção de folga para: ${nomes}`,
        })
        setSalvando(false)
        return
      }

      // Validar dias específicos
      const subordinadosEspecificosSemDias = Array.from(agendamentos.values()).filter(
        (ag) => ag.tipoFolga === "especifico" && ag.diasEspecificos.size === 0
      )

      if (subordinadosEspecificosSemDias.length > 0) {
        const nomes = subordinadosEspecificosSemDias.map((s) => s.nome).join(", ")
        setMensagem({
          tipo: "erro",
          texto: `Por favor, selecione pelo menos um dia específico para: ${nomes}`,
        })
        setSalvando(false)
        return
      }

      // Converter Map para array para enviar para API
      const agendamentosArray = Array.from(agendamentos.values()).map((ag) => ({
        chapa: ag.chapa,
        nome: ag.nome,
        tipoFolga: ag.tipoFolga,
        diasEspecificos: Array.from(ag.diasEspecificos),
      }))

      const response = await fetch("/api/folgas/agendamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agendamentos: agendamentosArray }),
      })

      const data = await response.json()

      if (response.ok && data.sucesso) {
        setMensagem({
          tipo: "sucesso",
          texto: data.mensagem,
        })
      } else {
        throw new Error(data.erro || "Erro ao salvar agendamentos")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMensagem({
        tipo: "erro",
        texto: error instanceof Error ? error.message : "Erro ao salvar agendamentos",
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Gerenciar Folgas</DialogTitle>
          <DialogDescription>
            Defina os dias de folga para cada colaborador.
          </DialogDescription>
        </DialogHeader>

        {carregando ? (
          <div className="py-8">
            <p className="text-center text-gray-600">Carregando subordinados...</p>
          </div>
        ) : subordinados.length === 0 ? (
          <div className="py-8">
            <p className="text-center text-gray-600">
              Nenhum subordinado ativo encontrado para gerenciar.
            </p>
          </div>
        ) : (
          <>
            {subordinados.some(s => s.temAgendamento) && (
              <div className="flex-shrink-0 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Modo de edição:</strong> Alguns colaboradores já possuem agendamentos. 
                  Ao salvar, os agendamentos existentes serão substituídos pelos novos.
                </p>
              </div>
            )}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {subordinados.map((subordinado) => {
                const agendamento = agendamentos.get(subordinado.chapa)
                if (!agendamento) return null

                return (
                  <div key={subordinado.chapa} className="border-b pb-6 last:border-b-0">
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{subordinado.nome}</h3>
                        {subordinado.temAgendamento && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Editando
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Chapa: {subordinado.chapa} | {subordinado.funcao || "N/A"}
                      </p>
                    </div>

                    <RadioGroup
                      value={agendamento.tipoFolga}
                      onValueChange={(value) =>
                        atualizarTipoFolga(subordinado.chapa, value as TipoFolga)
                      }
                    >
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="semana1" id={`${subordinado.chapa}-semana1`} />
                          <Label htmlFor={`${subordinado.chapa}-semana1`}>
                            Folga na Semana 1 (22 e 23/12)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="semana2" id={`${subordinado.chapa}-semana2`} />
                          <Label htmlFor={`${subordinado.chapa}-semana2`}>
                            Folga na Semana 2 (29 e 30/12)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ambas" id={`${subordinado.chapa}-ambas`} />
                          <Label htmlFor={`${subordinado.chapa}-ambas`}>
                            Folga em ambas as semanas
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nenhuma" id={`${subordinado.chapa}-nenhuma`} />
                          <Label htmlFor={`${subordinado.chapa}-nenhuma`}>
                            Sem folga (trabalhará todos os dias)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="especifico"
                            id={`${subordinado.chapa}-especifico`}
                          />
                          <Label htmlFor={`${subordinado.chapa}-especifico`}>
                            Dias específicos de folga
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>

                    {agendamento.tipoFolga === "especifico" && (
                      <div className="mt-4 ml-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-3">Selecione os dias de folga:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {DIAS_TRABALHO.map((dia) => (
                            <div key={dia.data} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${subordinado.chapa}-${dia.data}`}
                                checked={agendamento.diasEspecificos.has(dia.data)}
                                onCheckedChange={() =>
                                  toggleDiaEspecifico(subordinado.chapa, dia.data)
                                }
                              />
                              <Label
                                htmlFor={`${subordinado.chapa}-${dia.data}`}
                                className="text-sm cursor-pointer"
                              >
                                {dia.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex-shrink-0 pt-4 space-y-4 border-t">
              {mensagem && (
                <div
                  className={`p-4 rounded-lg ${
                    mensagem.tipo === "sucesso"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {mensagem.texto}
                </div>
              )}

              <DialogFooter className="flex flex-row items-center justify-end gap-3">
                {(() => {
                  const pendentes = Array.from(agendamentos.values()).filter(ag => !ag.tipoFolga).length
                  if (pendentes > 0) {
                    return (
                      <p className="text-sm text-gray-500">
                        Selecione uma opção para todos os colaboradores antes de salvar
                      </p>
                    )
                  }
                  return null
                })()}
                <Button
                  onClick={salvarAgendamentos}
                  disabled={salvando || Array.from(agendamentos.values()).some(ag => !ag.tipoFolga)}
                  className="bg-[#1e7b4f] hover:bg-[#165c3c] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

