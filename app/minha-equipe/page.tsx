"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { MobileAccessBlock } from "@/components/MobileAccessBlock"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeviceCheck } from "@/hooks/useDeviceCheck"

interface UserInfo {
  NOME_COMPLETO: string
  CHAPA: string
  FILIAL: string
  SECAO: string
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
    </TableRow>
  )
}

function MinhaEquipeSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="mb-5">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Última Validação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verificações Completas</TableHead>
            <TableHead>Tempo de Atraso (min)</TableHead>
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

// Mock data for the table and charts
const mockData = [
  { name: "João Silva", lastValidation: "01/05/2023", status: "Ativo", completedVerifications: true, delayTime: 5 },
  { name: "Maria Santos", lastValidation: "02/05/2023", status: "Ativo", completedVerifications: true, delayTime: 3 },
  {
    name: "Pedro Oliveira",
    lastValidation: "30/04/2023",
    status: "Inativo",
    completedVerifications: false,
    delayTime: 15,
  },
  { name: "Ana Rodrigues", lastValidation: "03/05/2023", status: "Ativo", completedVerifications: true, delayTime: 2 },
  {
    name: "Carlos Ferreira",
    lastValidation: "01/05/2023",
    status: "Ativo",
    completedVerifications: true,
    delayTime: 7,
  },
  {
    name: "Mariana Costa",
    lastValidation: "29/04/2023",
    status: "Inativo",
    completedVerifications: false,
    delayTime: 20,
  },
  {
    name: "Ricardo Almeida",
    lastValidation: "02/05/2023",
    status: "Ativo",
    completedVerifications: true,
    delayTime: 4,
  },
  { name: "Sofia Martins", lastValidation: "03/05/2023", status: "Ativo", completedVerifications: true, delayTime: 6 },
  {
    name: "André Sousa",
    lastValidation: "28/04/2023",
    status: "Inativo",
    completedVerifications: false,
    delayTime: 25,
  },
  { name: "Beatriz Lima", lastValidation: "01/05/2023", status: "Ativo", completedVerifications: true, delayTime: 8 },
]

const verificationStatusData = [
  { name: "Completas", value: mockData.filter((item) => item.completedVerifications).length },
  { name: "Incompletas", value: mockData.filter((item) => !item.completedVerifications).length },
]

const COLORS = ["#0088FE", "#00C49F"]

export default function MinhaEquipePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [filterName, setFilterName] = useState("")
  const { data: session, status } = useSession()
  const router = useRouter()
  const { shouldBlockAccess } = useDeviceCheck()

  const fetchUserInfo = async (email: string) => {
    try {
      const response = await fetch(
        `https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/AINF22012025.02/1/P/?parameters=email=${email}`,
        {
          headers: {
            Authorization: "Basic " + btoa("arthur.souza" + ":" + "4518Adz74$"),
          },
        },
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
    }
  }

  useEffect(() => {
    // Verificação rigorosa de autenticação e papel
    if (status === "unauthenticated") {
      router.push("/")
      return
    }
    
    if (status === "authenticated") {
      if (session?.user?.role !== "Administrador" && session?.user?.role !== "Chefia") {
        router.push("/access-denied")
        return
      }
      
      if (session?.user?.email) {
        fetchUserInfo(session.user.email)
      }
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header userInfo={null} />
        <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <MinhaEquipeSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  if (shouldBlockAccess) {
    return <MobileAccessBlock />
  }

  const filteredData = mockData.filter((item) => item.name.toLowerCase().includes(filterName.toLowerCase()))

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header userInfo={userInfo} />

      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-zinc-800 mb-6">Minha Equipe</h2>
          <div className="mb-5">
            <Input placeholder="Filtrar por nome" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Status de Verificações</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    Completas: {
                      label: "Completas",
                      color: "#0088FE",
                    },
                    Incompletas: {
                      label: "Incompletas",
                      color: "#00C49F",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={verificationStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {verificationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tempo de Atraso na Validação (minutos)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    delayTime: {
                      label: "Tempo de Atraso",
                      color: "#8884D8",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="delayTime" fill="#8884D8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Última Validação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verificações Completas</TableHead>
                <TableHead>Tempo de Atraso (min)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.lastValidation}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.completedVerifications ? "Sim" : "Não"}</TableCell>
                  <TableCell>{row.delayTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <Footer />
    </div>
  )
}

