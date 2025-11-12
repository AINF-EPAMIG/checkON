"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface SubordinadoAgendamento {
  chapa: string
  nome: string
  funcao: string | null
  diasTrabalho: string[]
  diasFolga: string[]
  temAgendamento?: boolean
}

const DIAS_PERIODO = [
  { data: "2024-12-22", label: "22/12" },
  { data: "2024-12-23", label: "23/12" },
  { data: "2024-12-29", label: "29/12" },
  { data: "2024-12-30", label: "30/12" },
]

export default function CalendarioFolgasInterativo() {
  const [subordinados, setSubordinados] = useState<SubordinadoAgendamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(
    null,
  )
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false)

  useEffect(() => {
    carregarSubordinados()
  }, [])

  const carregarSubordinados = async () => {
    try {
      setCarregando(true)
      setErro(null)
      
      const response = await fetch("/api/folgas/agendamentos")
      
      if (!response.ok) {
        throw new Error("Erro ao carregar subordinados")
      }

      const data = await response.json()
      // Usar os dados vindos do backend (com agendamentos existentes ou vazios)
      const subordinadosCarregados = data.subordinados.map((sub: { 
        chapa: string
        nome: string
        funcao: string | null
        diasTrabalho?: string[]
        diasFolga?: string[]
        temAgendamento?: boolean
      }) => ({
        chapa: sub.chapa,
        nome: sub.nome,
        funcao: sub.funcao,
        diasTrabalho: sub.diasTrabalho || [],
        diasFolga: sub.diasFolga || [],
        temAgendamento: sub.temAgendamento || false,
      }))
      setSubordinados(subordinadosCarregados)
    } catch (error) {
      console.error("Erro ao carregar subordinados:", error)
      setErro("Erro ao carregar subordinados. Por favor, tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  const obterEstadoDia = (chapa: string, data: string): "trabalho" | "folga" => {
    const subordinado = subordinados.find(s => s.chapa === chapa)
    if (!subordinado) return "folga"
    
    if (subordinado.diasTrabalho.includes(data)) return "trabalho"
    return "folga"
  }

  const toggleDiaStatus = (chapa: string, data: string) => {
    setSubordinados((prevSubordinados) => {
      const novosSubordinados = prevSubordinados.map(sub => {
        if (sub.chapa === chapa) {
          const estadoAtual = obterEstadoDia(chapa, data)
          let diasTrabalho = [...sub.diasTrabalho]
          let diasFolga = [...sub.diasFolga]
          
          // Ciclo: trabalho ↔ folga
          if (estadoAtual === "trabalho") {
            // Muda de trabalho para folga
            diasTrabalho = diasTrabalho.filter(d => d !== data)
            if (!diasFolga.includes(data)) {
              diasFolga.push(data)
            }
          } else {
            // Muda de folga para trabalho
            diasFolga = diasFolga.filter(d => d !== data)
            if (!diasTrabalho.includes(data)) {
              diasTrabalho.push(data)
            }
          }
          
          return { ...sub, diasTrabalho, diasFolga }
        }
        return sub
      })
      
      setAlteracoesPendentes(true)
      return novosSubordinados
    })
  }

  const salvarAlteracoes = async () => {
    try {
      setSalvando(true)
      setMensagem(null)

      // Converter subordinados para formato de agendamentos
      // Agora enviamos diretamente os dias de trabalho
      const agendamentos = subordinados.map(sub => ({
        chapa: sub.chapa,
        nome: sub.nome,
        diasTrabalho: sub.diasTrabalho, // Envia os dias que vão trabalhar
      }))

      const response = await fetch("/api/folgas/agendamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agendamentos }),
      })

      const data = await response.json()

      if (response.ok && data.sucesso) {
        setMensagem({
          tipo: "sucesso",
          texto: "Agendamentos salvos com sucesso!",
        })
        setAlteracoesPendentes(false)
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

  const contarTrabalhandoPorDia = (data: string): number => {
    return subordinados.filter(sub => sub.diasTrabalho.includes(data)).length
  }

  const contarFolgaPorDia = (data: string): number => {
    return subordinados.filter(sub => sub.diasFolga.includes(data)).length
  }


  const marcarColunaComoTrabalho = (data: string) => {
    setSubordinados((prevSubordinados) => {
      return prevSubordinados.map(sub => ({
        ...sub,
        diasTrabalho: sub.diasTrabalho.includes(data) 
          ? sub.diasTrabalho 
          : [...sub.diasTrabalho.filter(d => d !== data), data],
        diasFolga: sub.diasFolga.filter(d => d !== data),
      }))
    })
    setAlteracoesPendentes(true)
  }

  const marcarColunaComoFolga = (data: string) => {
    setSubordinados((prevSubordinados) => {
      return prevSubordinados.map(sub => ({
        ...sub,
        diasTrabalho: sub.diasTrabalho.filter(d => d !== data),
        diasFolga: sub.diasFolga.includes(data) 
          ? sub.diasFolga 
          : [...sub.diasFolga.filter(d => d !== data), data],
      }))
    })
    setAlteracoesPendentes(true)
  }


  if (carregando) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <p className="text-center text-gray-600">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <p className="text-center text-red-600">{erro}</p>
          <div className="flex justify-center mt-4">
            <Button onClick={carregarSubordinados} className="bg-[#1e7b4f] hover:bg-[#165c3c]">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (subordinados.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <p className="text-center text-gray-600">
            Nenhum subordinado encontrado para gerenciar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1e7b4f]">Calendário de Folgas</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Preencha o calendário clicando nos botões abaixo
        </p>
      </header>

      {/* Instruções de uso */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-blue-700">
              <strong>Como usar:</strong> Clique nos botões para alternar entre <span className="font-semibold text-green-700">Trabalho</span> e <span className="font-semibold text-red-700">Folga</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Container para mensagens sticky */}
      <div className="sticky top-0 z-50 space-y-2">
        {mensagem && (
          <div
            className={`p-3 sm:p-4 rounded-lg shadow-lg border-2 ${
              mensagem.tipo === "sucesso"
                ? "bg-green-50 text-green-800 border-green-400"
                : "bg-red-50 text-red-800 border-red-400"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs sm:text-sm flex-1">{mensagem.texto}</p>
              <button
                onClick={() => setMensagem(null)}
                className="flex-shrink-0 text-gray-500 hover:text-gray-700"
                aria-label="Fechar mensagem"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {alteracoesPendentes && (
          <div className="p-3 sm:p-4 rounded-lg bg-yellow-50 text-yellow-800 border-2 border-yellow-400 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm flex-1">
                <strong>Você tem alterações não salvas.</strong> 
                <span className="hidden sm:inline"> Clique em &quot;Salvar Alterações&quot; para confirmar.</span>
              </p>
              <Button
                onClick={salvarAlteracoes}
                disabled={salvando}
                className="bg-[#1e7b4f] hover:bg-[#165c3c] w-full sm:w-auto text-sm"
                size="sm"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Resumo por dia */}
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h3 className="font-semibold text-base sm:text-lg mb-3 text-blue-900">Resumo por Dia</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {DIAS_PERIODO.map((dia) => {
              const trabalhando = contarTrabalhandoPorDia(dia.data)
              const folga = contarFolgaPorDia(dia.data)
              return (
                <div key={dia.data} className="bg-white p-2 sm:p-3 rounded border">
                  <p className="font-medium text-xs sm:text-sm text-gray-700">{dia.label}</p>
                  <p className="text-[10px] sm:text-xs text-green-600 mt-1">
                    {trabalhando} trabalhando
                  </p>
                  <p className="text-[10px] sm:text-xs text-red-600">
                    {folga} de folga
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabela de agendamentos - Desktop */}
        <div className="hidden md:block">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-r">
                      Colaborador
                    </th>
                    {DIAS_PERIODO.map((dia) => (
                      <th
                        key={dia.data}
                        className="px-4 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-r last:border-r-0"
                      >
                        <div className="space-y-2">
                          <div className="font-bold text-base">{dia.label}</div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => marcarColunaComoTrabalho(dia.data)}
                              className="px-2 py-1 text-[10px] rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors whitespace-nowrap"
                              title={`Marcar todos como Trabalho em ${dia.label}`}
                            >
                              ↓ Trabalho
                            </button>
                            <button
                              onClick={() => marcarColunaComoFolga(dia.data)}
                              className="px-2 py-1 text-[10px] rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors whitespace-nowrap"
                              title={`Marcar todos como Folga em ${dia.label}`}
                            >
                              ↓ Folga
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subordinados.map((subordinado) => (
                  <tr key={subordinado.chapa} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-r">
                      <div>
                        <p className="font-medium text-sm text-gray-900 leading-tight">
                          {subordinado.nome}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {subordinado.funcao || "N/A"}
                        </p>
                      </div>
                    </td>
                      {DIAS_PERIODO.map((dia) => {
                        const estado = obterEstadoDia(subordinado.chapa, dia.data)
                        
                        let bgColor: string
                        let buttonBg: string
                        let buttonColor: string
                        let buttonText: string
                        let tooltip: string
                        let iconColor: string
                        let IconComponent: React.FC
                        
                        if (estado === "trabalho") {
                          bgColor = "bg-green-50"
                          buttonBg = "rgb(220 252 231)"
                          buttonColor = "rgb(22 101 52)"
                          buttonText = "Trabalho"
                          tooltip = "Clique para mudar para Folga"
                          iconColor = "rgb(22 101 52)"
                          const IconTrabalho = () => (
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8" fill={iconColor}/>
                              <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )
                          IconTrabalho.displayName = "IconTrabalho"
                          IconComponent = IconTrabalho
                        } else {
                          bgColor = "bg-red-50"
                          buttonBg = "rgb(254 226 226)"
                          buttonColor = "rgb(153 27 27)"
                          buttonText = "Folga"
                          tooltip = "Clique para mudar para Trabalho"
                          iconColor = "rgb(153 27 27)"
                          const IconFolga = () => (
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8" fill={iconColor}/>
                              <path d="M7 7L13 13M13 7L7 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )
                          IconFolga.displayName = "IconFolga"
                          IconComponent = IconFolga
                        }
                        
                        return (
                          <td
                            key={dia.data}
                            className={`px-4 py-3 text-center border-r last:border-r-0 ${bgColor}`}
                          >
                            <button
                              onClick={() => toggleDiaStatus(subordinado.chapa, dia.data)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-md active:scale-95 border-2"
                              style={{
                                backgroundColor: buttonBg,
                                color: buttonColor,
                                borderColor: buttonColor,
                              }}
                              title={tooltip}
                            >
                              <IconComponent />
                              <span>{buttonText}</span>
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cards de agendamentos - Mobile */}
        <div className="md:hidden space-y-3">
          {/* Cards dos colaboradores */}
          {subordinados.map((subordinado) => (
            <div key={subordinado.chapa} className="border rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Cabeçalho do card */}
              <div className="bg-gray-50 px-3 py-2 border-b">
                <p className="font-semibold text-sm text-gray-900">{subordinado.nome}</p>
                <p className="text-xs text-gray-500">{subordinado.funcao || "N/A"}</p>
              </div>

              {/* Dias */}
              <div className="p-3 space-y-2">
                {DIAS_PERIODO.map((dia) => {
                  const estado = obterEstadoDia(subordinado.chapa, dia.data)
                  
                  let buttonBg: string
                  let buttonColor: string
                  let buttonText: string
                  let iconColor: string
                  let IconComponent: React.FC
                  
                  if (estado === "trabalho") {
                    buttonBg = "rgb(220 252 231)"
                    buttonColor = "rgb(22 101 52)"
                    buttonText = "Trabalho"
                    iconColor = "rgb(22 101 52)"
                    const IconTrabalho = () => (
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="8" fill={iconColor}/>
                        <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )
                    IconTrabalho.displayName = "IconTrabalhoMobile"
                    IconComponent = IconTrabalho
                  } else {
                    buttonBg = "rgb(254 226 226)"
                    buttonColor = "rgb(153 27 27)"
                    buttonText = "Folga"
                    iconColor = "rgb(153 27 27)"
                    const IconFolga = () => (
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="8" fill={iconColor}/>
                        <path d="M7 7L13 13M13 7L7 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )
                    IconFolga.displayName = "IconFolgaMobile"
                    IconComponent = IconFolga
                  }

                  return (
                    <div key={dia.data} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{dia.label}</span>
                      <button
                        onClick={() => toggleDiaStatus(subordinado.chapa, dia.data)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all active:scale-95 border-2"
                        style={{
                          backgroundColor: buttonBg,
                          color: buttonColor,
                          borderColor: buttonColor,
                        }}
                      >
                        <IconComponent />
                        <span>{buttonText}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

         {/* Legenda */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="rgb(22 101 52)"/>
                <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-gray-700 font-medium">Dia de Trabalho</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="rgb(153 27 27)"/>
                <path d="M7 7L13 13M13 7L7 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-gray-700 font-medium">Dia de Folga</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

