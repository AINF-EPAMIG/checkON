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
  { data: "2025-12-22", label: "22/12" },
  { data: "2025-12-23", label: "23/12" },
  { data: "2025-12-29", label: "29/12" },
  { data: "2025-12-30", label: "30/12" },
]

export default function CalendarioFolgasInterativo() {
  const [subordinados, setSubordinados] = useState<SubordinadoAgendamento[]>([])
  const [subordinadosFiltrados, setSubordinadosFiltrados] = useState<SubordinadoAgendamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvandoIndividual, setSalvandoIndividual] = useState<Set<string>>(new Set())
  const [colaboradoresPendentes, setColaboradoresPendentes] = useState<Set<string>>(new Set())
  const [colaboradoresConfirmados, setColaboradoresConfirmados] = useState<Set<string>>(new Set())
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(
    null,
  )
  const [filtroNome, setFiltroNome] = useState("")

  useEffect(() => {
    carregarSubordinados()
  }, [])

  // Efeito para filtrar colaboradores
  useEffect(() => {
    if (!filtroNome.trim()) {
      setSubordinadosFiltrados(subordinados)
    } else {
      const filtrados = subordinados.filter(sub => 
        sub.nome.toLowerCase().includes(filtroNome.toLowerCase()) ||
        sub.chapa.toLowerCase().includes(filtroNome.toLowerCase())
      )
      setSubordinadosFiltrados(filtrados)
    }
  }, [filtroNome, subordinados])

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
      setSubordinadosFiltrados(subordinadosCarregados)
      
      // Marcar como confirmados os que já têm agendamento
      const confirmados = new Set<string>(subordinadosCarregados.filter((s: SubordinadoAgendamento) => s.temAgendamento).map((s: SubordinadoAgendamento) => s.chapa))
      setColaboradoresConfirmados(confirmados)
    } catch (error) {
      console.error("Erro ao carregar subordinados:", error)
      setErro("Erro ao carregar subordinados. Por favor, tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  const obterEstadoDia = (chapa: string, data: string): "trabalho" | "folga" => {
    const subordinado = subordinados.find(s => s.chapa === chapa)
    if (!subordinado) return "trabalho" // Padrão: trabalho
    
    if (subordinado.diasTrabalho.includes(data)) return "trabalho"
    return "folga"
  }

  const contarFolgasColaborador = (chapa: string): number => {
    const subordinado = subordinados.find(s => s.chapa === chapa)
    if (!subordinado) return 0
    return subordinado.diasFolga.length
  }

  const toggleDiaStatus = (chapa: string, data: string) => {
    const estadoAtual = obterEstadoDia(chapa, data)
    const folgasAtuais = contarFolgasColaborador(chapa)
    
    // Se está tentando mudar de TRABALHO para FOLGA e já tem 2 folgas
    if (estadoAtual === "trabalho" && folgasAtuais >= 2) {
      setMensagem({
        tipo: "erro",
        texto: "Limite atingido: cada colaborador pode ter no máximo 2 dias de folga.",
      })
      
      // Auto-fechar mensagem após 4 segundos
      setTimeout(() => {
        setMensagem(null)
      }, 4000)
      
      return // Não permite a alteração
    }
    
    setSubordinados((prevSubordinados) => {
      const novosSubordinados = prevSubordinados.map(sub => {
        if (sub.chapa === chapa) {
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
      
      // Marcar colaborador como pendente
      setColaboradoresPendentes(prev => new Set(prev).add(chapa))
      setColaboradoresConfirmados(prev => {
        const novo = new Set(prev)
        novo.delete(chapa)
        return novo
      })
      
      return novosSubordinados
    })
  }

  const salvarColaboradorIndividual = async (chapa: string) => {
    try {
      setSalvandoIndividual(prev => new Set(prev).add(chapa))

      const colaborador = subordinados.find(sub => sub.chapa === chapa)
      if (!colaborador) return

      const agendamentos = [{
        chapa: colaborador.chapa,
        nome: colaborador.nome,
        diasTrabalho: colaborador.diasTrabalho,
      }]

      const response = await fetch("/api/folgas/agendamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agendamentos }),
      })

      const data = await response.json()

      if (response.ok && data.sucesso) {
        // Marcar como confirmado e remover de pendentes
        setColaboradoresConfirmados(prev => new Set(prev).add(chapa))
        setColaboradoresPendentes(prev => {
          const novo = new Set(prev)
          novo.delete(chapa)
          return novo
        })
        
        setMensagem({
          tipo: "sucesso",
          texto: `Agendamento de ${colaborador?.nome} salvo com sucesso!`,
        })
        setTimeout(() => setMensagem(null), 3000)
      } else {
        throw new Error(data.erro || "Erro ao salvar agendamento")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setMensagem({
        tipo: "erro",
        texto: "Erro ao salvar agendamento. Tente novamente.",
      })
      setTimeout(() => setMensagem(null), 4000)
    } finally {
      setSalvandoIndividual(prev => {
        const newSet = new Set(prev)
        newSet.delete(chapa)
        return newSet
      })
    }
  }

  const contarTrabalhandoPorDia = (data: string): number => {
    return subordinados.filter(sub => sub.diasTrabalho.includes(data)).length
  }

  const contarFolgaPorDia = (data: string): number => {
    return subordinados.filter(sub => sub.diasFolga.includes(data)).length
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
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1e7b4f]"><center>Calendário de Folgas</center></h1>
        
      </header>

      {/* Instruções de uso - Minimalista */}


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
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 space-y-4">
        {/* Resumo por dia - cards visíveis */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-sm text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
            Resumo por Dia
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DIAS_PERIODO.map((dia) => {
              const trabalhando = contarTrabalhandoPorDia(dia.data)
              const folga = contarFolgaPorDia(dia.data)
              return (
                <div key={dia.data} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-bold text-sm text-gray-800 mb-2">{dia.label}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Trabalho:</span>
                      <span className="text-sm font-semibold text-green-600">{trabalhando}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Folga:</span>
                      <span className="text-sm font-semibold text-red-600">{folga}</span>
                    </div>
                  </div>
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
                    <th className="px-3 py-3 text-left border-r w-56">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Colaborador
                        </div>
                        {/* Campo de busca integrado no cabeçalho */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            value={filtroNome}
                            onChange={(e) => setFiltroNome(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-[#1e7b4f] focus:border-transparent outline-none bg-white"
                          />
                          {filtroNome && (
                            <button
                              onClick={() => setFiltroNome("")}
                              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                              aria-label="Limpar"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {filtroNome && (
                          <p className="text-[10px] text-gray-500">
                            {subordinadosFiltrados.length}/{subordinados.length}
                          </p>
                        )}
                      </div>
                    </th>
                    {DIAS_PERIODO.map((dia) => (
                      <th
                        key={dia.data}
                        className="px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider border-r"
                      >
                        <div className="font-bold text-base">{dia.label}</div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subordinadosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {filtroNome ? (
                          <div className="space-y-2">
                            <p className="font-medium">Nenhum colaborador encontrado</p>
                            <p className="text-sm">Tente ajustar sua busca</p>
                          </div>
                        ) : (
                          <p>Nenhum colaborador disponível</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    subordinadosFiltrados.map((subordinado) => {
                    const folgasColaborador = contarFolgasColaborador(subordinado.chapa)
                    const estaSalvando = salvandoIndividual.has(subordinado.chapa)
                    return (
                  <tr key={subordinado.chapa} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 border-r">
                      <div className="flex items-start gap-2">
                        {/* Indicador de status */}
                        <div className="mt-1 flex-shrink-0">
                          {colaboradoresConfirmados.has(subordinado.chapa) ? (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100" title="Confirmado - Salvo no banco">
                              <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : colaboradoresPendentes.has(subordinado.chapa) ? (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100" title="Pendente - Alterações não salvas">
                              <svg className="w-3.5 h-3.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100" title="Sem alterações">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs text-gray-900 leading-tight truncate">
                            {subordinado.nome}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                            {subordinado.funcao || "N/A"}
                          </p>
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                              folgasColaborador >= 2 
                                ? "bg-red-100 text-red-700" 
                                : folgasColaborador === 1 
                                ? "bg-yellow-100 text-yellow-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {folgasColaborador >= 2 && (
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              )}
                              {folgasColaborador}/2
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                      {DIAS_PERIODO.map((dia) => {
                        const estado = obterEstadoDia(subordinado.chapa, dia.data)
                        const folgasColaborador = contarFolgasColaborador(subordinado.chapa)
                        const limiteAtingido = folgasColaborador >= 2 && estado === "trabalho"
                        
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
                          tooltip = limiteAtingido 
                            ? "Limite de folgas atingido (2/2)" 
                            : "Clique para mudar para Folga"
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
                            className={`px-3 py-2.5 text-center border-r ${bgColor}`}
                          >
                            <button
                              onClick={() => toggleDiaStatus(subordinado.chapa, dia.data)}
                              disabled={limiteAtingido}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                                limiteAtingido 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95"
                              }`}
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
                      {/* Coluna de Ações */}
                      <td className="px-3 py-2.5 text-center">
                        <Button
                          onClick={() => salvarColaboradorIndividual(subordinado.chapa)}
                          disabled={estaSalvando}
                          size="sm"
                          className="bg-[#1e7b4f] hover:bg-[#165c3c] text-white px-3 py-1 h-8 text-xs font-medium disabled:opacity-50"
                        >
                          {estaSalvando ? (
                            <div className="flex items-center gap-1.5">
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>...</span>
                            </div>
                          ) : (
                            "Salvar"
                          )}
                        </Button>
                      </td>
                    </tr>
                  )}))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cards de agendamentos - Mobile */}
        <div className="md:hidden space-y-3">
          {/* Campo de busca mobile */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              placeholder="Buscar colaborador..."
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e7b4f] focus:border-transparent outline-none bg-white"
            />
            {filtroNome && (
              <button
                onClick={() => setFiltroNome("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label="Limpar busca"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {filtroNome && (
            <p className="text-xs text-gray-500 -mt-1 mb-2">
              {subordinadosFiltrados.length} de {subordinados.length} colaborador(es)
            </p>
          )}
          
          {/* Cards dos colaboradores */}
          {subordinadosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filtroNome ? (
                <div className="space-y-2">
                  <p className="font-medium">Nenhum colaborador encontrado</p>
                  <p className="text-sm">Tente ajustar sua busca</p>
                </div>
              ) : (
                <p>Nenhum colaborador disponível</p>
              )}
            </div>
          ) : (
            subordinadosFiltrados.map((subordinado) => {
            const folgasColaborador = contarFolgasColaborador(subordinado.chapa)
            return (
            <div key={subordinado.chapa} className="border rounded-lg overflow-hidden bg-white shadow-sm">
              {/* Cabeçalho do card */}
              <div className="bg-gray-50 px-3 py-2 border-b">
                <div className="flex items-start gap-2">
                  {/* Indicador de status */}
                  <div className="mt-0.5 flex-shrink-0">
                    {colaboradoresConfirmados.has(subordinado.chapa) ? (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100" title="Confirmado - Salvo no banco">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : colaboradoresPendentes.has(subordinado.chapa) ? (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100" title="Pendente - Alterações não salvas">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100" title="Sem alterações">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{subordinado.nome}</p>
                      <p className="text-xs text-gray-500">{subordinado.funcao || "N/A"}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                      folgasColaborador >= 2 
                        ? "bg-red-100 text-red-700" 
                        : folgasColaborador === 1 
                        ? "bg-yellow-100 text-yellow-700" 
                        : "bg-green-100 text-green-700"
                    }`}>
                      {folgasColaborador >= 2 && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      {folgasColaborador}/2
                    </span>
                  </div>
                </div>
              </div>

              {/* Dias */}
              <div className="p-3 space-y-2">
                {DIAS_PERIODO.map((dia) => {
                  const estado = obterEstadoDia(subordinado.chapa, dia.data)
                  const limiteAtingido = folgasColaborador >= 2 && estado === "trabalho"
                  
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
                        disabled={limiteAtingido}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                          limiteAtingido 
                            ? "opacity-50 cursor-not-allowed" 
                            : "cursor-pointer active:scale-95"
                        }`}
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
              
              {/* Botão Salvar Individual Mobile */}
              <div className="px-3 pb-3">
                <Button
                  onClick={() => salvarColaboradorIndividual(subordinado.chapa)}
                  disabled={salvandoIndividual.has(subordinado.chapa)}
                  size="sm"
                  className="w-full bg-[#1e7b4f] hover:bg-[#166239] text-white disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {salvandoIndividual.has(subordinado.chapa) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
            )
          }))
          }
        </div>
      </div>
    </div>
  )
}

