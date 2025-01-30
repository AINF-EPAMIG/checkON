"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2, Users, Clock, CheckCircle, AlertCircle } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { MobileAccessBlock } from "@/components/MobileAccessBlock"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeviceCheck } from "@/hooks/useDeviceCheck"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

interface UserInfo {
  NOME_COMPLETO: string
  CHAPA: string
  FILIAL: string
  SECAO: string
}

interface Subordinado {
  NOME_SUBORDINADO: string
  CHAPA_SUBORDINADO: string
  FILIAL: string
  SECAO: string
  CARGO_SUBORDINADO: string
  EMAIL_SUBORDINADO: string
}

interface RelatorioItem {
  data_disparo: string
  hora_disparo: string
  hora_validacao: string | null
  valido_ate: string | null
}

interface RelatoriosData {
  [email: string]: RelatorioItem[]
}

interface APIResponse {
  success: boolean
  data?: RelatoriosData
  error?: string
}

type StatusType = "validado" | "expirado" | "pendente"

type ValidacaoDia = {
  manha: RelatorioItem | null
  tarde: RelatorioItem | null
}

type RelatoriosAgrupados = {
  [funcionario: string]: {
    [data: string]: ValidacaoDia
  }
}

const getStatus = (relatorio: RelatorioItem): StatusType => {
  // Se tem data de validação, sempre será validado
  if (relatorio.hora_validacao) {
    return "validado"
  }

  // Se tem data limite, verifica se expirou
  if (relatorio.valido_ate) {
    const dataDisparo = new Date(`${relatorio.data_disparo}T${relatorio.hora_disparo}`)

    // Adiciona 30 minutos ao horário do disparo
    const limiteValidacao = new Date(dataDisparo.getTime() + 30 * 60000)

    // Se já passou do limite de 30 minutos, está expirado
    if (new Date() > limiteValidacao) {
      return "expirado"
    }
  }

  return "pendente"
}

const ValidacaoCell = ({ validacao }: { validacao: RelatorioItem | null }) => {
  if (!validacao) return <span>-</span>

  const status = getStatus(validacao)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {getStatusIcon(status)}
        <span
          className={cn("text-sm", status === "expirado" && "text-red-600", status === "validado" && "text-green-600")}
        >
          {status === "validado"
            ? `Validado às ${validacao.hora_validacao}`
            : status === "expirado"
              ? "Expirado"
              : "Aguardando"}
        </span>
      </div>
      {status !== "validado" && (
        <span className={cn("text-xs", status === "expirado" ? "text-red-500" : "text-gray-500")}></span>
      )}
    </div>
  )
}

const getStatusIcon = (status: StatusType): string => {
  switch (status) {
    case "validado":
      return "✅"
    case "expirado":
      return "❌"
    default:
      return "⏳"
  }
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
    </TableRow>
  )
}

function RelatoriosEquipeSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="mb-5 flex gap-4">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Manhã</TableHead>
            <TableHead>Tarde</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRowSkeleton key={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default function RelatoriosEquipePage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  })
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [subordinados, setSubordinados] = useState<Subordinado[]>([])
  const [relatorios, setRelatorios] = useState<RelatoriosData>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [filterName, setFilterName] = useState("")
  const { data: session, status } = useSession()
  const router = useRouter()
  const { shouldBlockAccess } = useDeviceCheck()
  const [dataConsulta, setDataConsulta] = useState<string | null>(null)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false) // Added initialDataLoaded state

  const [metrics, setMetrics] = useState({
    totalFuncionarios: 0,
    totalValidados: 0,
    totalPendentes: 0,
    totalExpirados: 0,
  })

  const agruparRelatorios = (relatorios: RelatoriosData, subordinados: Subordinado[]): RelatoriosAgrupados => {
    const agrupados: RelatoriosAgrupados = {}

    // Cria um mapa de email para nome de funcionário
    const emailParaNome = subordinados.reduce(
      (acc, sub) => {
        acc[sub.EMAIL_SUBORDINADO] = sub.NOME_SUBORDINADO
        return acc
      },
      {} as { [email: string]: string },
    )

    // Processa os relatórios
    Object.entries(relatorios).forEach(([email, items]) => {
      const nomeFuncionario = emailParaNome[email]
      if (!nomeFuncionario) return

      if (!agrupados[nomeFuncionario]) {
        agrupados[nomeFuncionario] = {}
      }

      items.forEach((item) => {
        const data = item.data_disparo // Update: Using item.data_disparo directly

        if (!agrupados[nomeFuncionario][data]) {
          agrupados[nomeFuncionario][data] = {
            manha: null,
            tarde: null,
          }
        }

        // Determina se é manhã ou tarde baseado na hora do disparo
        const hora = Number.parseInt(item.hora_disparo.split(":")[0])
        if (hora < 12) {
          agrupados[nomeFuncionario][data].manha = item
        } else {
          agrupados[nomeFuncionario][data].tarde = item
        }
      })
    })

    return agrupados
  }

  const fetchUserInfo = async (email: string) => {
    try {
      const encodedEmail = encodeURIComponent(email)
      console.log("Buscando informações do usuário:", email)

      const response = await fetch(
        `https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/AINF22012025.02/1/P/?parameters=email=${encodedEmail}`,
        {
          headers: {
            Authorization: "Basic " + btoa("arthur.souza" + ":" + "4518Adz74$"),
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Erro ao buscar informações do usuário: ${response.status}`)
      }

      const data = await response.json()
      console.log("Resposta da API de usuário:", data)

      if (data && data.length > 0) {
        setUserInfo(data[0])
      }
    } catch (error) {
      console.error("Erro ao buscar informações do usuário:", error)
      setError("Não foi possível carregar as informações do usuário.")
    }
  }

  const fetchSubordinados = async (email: string) => {
    try {
      const encodedEmail = encodeURIComponent(email)
      console.log("Buscando subordinados para:", email)

      const response = await fetch(
        `https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/AINF22012025.03/1/P/?parameters=email=${encodedEmail}`,
        {
          headers: {
            Authorization: "Basic " + btoa("arthur.souza" + ":" + "4518Adz74$"),
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Erro ao buscar subordinados: ${response.status}`)
      }

      const data = await response.json()
      console.log("Resposta da API de subordinados:", data)

      if (data && Array.isArray(data)) {
        setSubordinados(data)
      }
    } catch (error) {
      console.error("Erro ao buscar subordinados:", error)
      setError("Não foi possível carregar a lista de subordinados.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRelatorios = async () => {
    if (!date?.from || !date?.to || subordinados.length === 0) {
      console.log("Condições não atendidas para buscar relatórios:", {
        date,
        subordinadosCount: subordinados.length,
      })
      return
    }

    try {
      setIsFetching(true)
      setError(null)

      const startDate = format(date.from, "yyyy-MM-dd")
      const endDate = format(date.to, "yyyy-MM-dd")

      // Coleta todos os emails dos subordinados
      const allEmails = subordinados.map((sub) => sub.EMAIL_SUBORDINADO).join(",")
      console.log("Parâmetros da consulta:", {
        emails: allEmails,
        startDate,
        endDate,
      })

      const url = `https://epamig.tech/novo_checkon/subordinados.php?emails=${allEmails}&startDate=${startDate}&endDate=${endDate}`
      console.log("URL da requisição:", url)

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Erro ao buscar relatórios: ${response.status}`)
      }

      const result: APIResponse = await response.json()
      console.log("Resposta da API de relatórios:", result)

      if (result.success && result.data) {
        setRelatorios(result.data)
      } else {
        setRelatorios({})
      }
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error)
      setError("Não foi possível carregar os relatórios da equipe.")
      setRelatorios({})
    } finally {
      setIsFetching(false)
    }
  }

  const fetchData = async () => {
    try {
      const response = await fetch("https://epamig.tech/novo_checkon/consulta_prox.php")
      if (!response.ok) {
        throw new Error("Erro ao buscar dados")
      }
      const data = await response.json()
      const primeiraData = new Date(data.primeira_data)
      const ultimaData = new Date(data.ultima_data)

      // Formata as datas
      const primeiraDataFormatada = format(primeiraData, "dd/MM")
      const ultimaDataFormatada = format(ultimaData, "dd/MM")

      // Define a dataConsulta com o formato desejado
      if (primeiraDataFormatada === ultimaDataFormatada) {
        setDataConsulta(primeiraDataFormatada) // Se as datas forem iguais
      } else {
        setDataConsulta(`${primeiraDataFormatada} a ${ultimaDataFormatada}`) // Se as datas forem diferentes
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    }
  }

  const calculateMetrics = (relatoriosData: RelatoriosData) => {
    let validados = 0
    let pendentes = 0
    let expirados = 0

    Object.values(relatoriosData).forEach((relatorios) => {
      relatorios.forEach((relatorio) => {
        if (relatorio.hora_validacao) validados++
        else if (new Date() > new Date(relatorio.valido_ate || "")) expirados++
        else pendentes++
      })
    })

    setMetrics({
      totalFuncionarios: subordinados.length,
      totalValidados: validados,
      totalPendentes: pendentes,
      totalExpirados: expirados,
    })
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (status === "authenticated" && session?.user?.email) {
      console.log("Usuário autenticado:", session.user)

      fetchUserInfo(session.user.email)
      fetchSubordinados(session.user.email)
    }
  }, [status, session]) // Removed fetchSubordinados from dependencies

  useEffect(() => {
    if (subordinados.length > 0 && date?.from && date?.to) {
      console.log("Iniciando busca de relatórios:", {
        subordinadosCount: subordinados.length,
        dateRange: `${format(date.from, "yyyy-MM-dd")} até ${format(date.to, "yyyy-MM-dd")}`,
      })
      fetchRelatorios()
    }
  }, [subordinados, date])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email && !initialDataLoaded) {
      // Modified useEffect
      console.log("Carregando dados iniciais")
      fetchData()
      setInitialDataLoaded(true)
    }
  }, [status, session, initialDataLoaded]) // Added initialDataLoaded to dependencies

  useEffect(() => {
    if (Object.keys(relatorios).length > 0) {
      calculateMetrics(relatorios)
    }
  }, [relatorios, subordinados])

  if (shouldBlockAccess) {
    return <MobileAccessBlock />
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header userInfo={null} />
        <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <RelatoriosEquipeSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  const filteredSubordinados = subordinados.filter((sub) =>
    sub.NOME_SUBORDINADO.toLowerCase().includes(filterName.toLowerCase()),
  )

  const relatoriosAgrupados = agruparRelatorios(relatorios, filteredSubordinados)

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header userInfo={userInfo} />

      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-800">Relatório da Equipe</h2>
            {isFetching && (
              <div className="flex items-center text-sm text-zinc-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </div>
            )}
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalFuncionarios}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Validados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.totalValidados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{metrics.totalPendentes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expirados</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.totalExpirados}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Status */}
          <div className="mb-6 bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Status das Validações</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Validados", value: metrics.totalValidados, color: "#22c55e" },
                    { name: "Pendentes", value: metrics.totalPendentes, color: "#eab308" },
                    { name: "Expirados", value: metrics.totalExpirados, color: "#ef4444" },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar
                    dataKey="value"
                    fill="#8884d8"
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props
                      return <rect x={x} y={y} width={width} height={height} fill={payload.color} />
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex gap-4 mb-5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(date.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Escolha um intervalo de datas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Input
              placeholder="Filtrar por nome do funcionário"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="flex-1"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Manhã</TableHead>
                  <TableHead>Tarde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(relatoriosAgrupados).map(([funcionario, datas]) =>
                  Object.entries(datas).map(([data, validacoes], index) => (
                    <TableRow key={`${funcionario}-${data}`} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      {index === 0 && (
                        <TableCell className="font-medium" rowSpan={Object.keys(datas).length}>
                          {funcionario}
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">{data.split("-").reverse().join("/")}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <ValidacaoCell validacao={validacoes.manha} />
                            </TooltipTrigger>
                            <TooltipContent>
                              {validacoes.manha?.hora_validacao
                                ? `Validado em ${format(new Date(validacoes.manha.data_disparo + "T" + validacoes.manha.hora_validacao), "dd/MM HH:mm", { locale: ptBR })}`
                                : validacoes.manha?.valido_ate
                                  ? `Válido até ${format(new Date(validacoes.manha.valido_ate), "HH:mm", { locale: ptBR })}`
                                  : "Sem registro"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <ValidacaoCell validacao={validacoes.tarde} />
                            </TooltipTrigger>
                            <TooltipContent>
                              {validacoes.tarde?.hora_validacao
                                ? `Validado em ${format(new Date(validacoes.tarde.data_disparo + "T" + validacoes.tarde.hora_validacao), "dd/MM HH:mm", { locale: ptBR })}`
                                : validacoes.tarde?.valido_ate
                                  ? `Válido até ${format(new Date(validacoes.tarde.valido_ate), "HH:mm", { locale: ptBR })}`
                                  : "Sem registro"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )),
                )}
                {Object.keys(relatoriosAgrupados).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-zinc-500">
                      {isFetching ? (
                        <span>Carregando dados...</span>
                      ) : (
                        <span>
                          {filterName
                            ? "Nenhum funcionário encontrado com o filtro aplicado"
                            : "Nenhum registro encontrado para o período selecionado"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

