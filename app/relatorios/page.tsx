"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { MobileAccessBlock } from "@/components/MobileAccessBlock"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeviceCheck } from "@/hooks/useDeviceCheck"

interface UserInfo {
  NOME_COMPLETO: string
  CHAPA: string
  FILIAL: string
  SECAO: string
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
    </TableRow>
  )
}

function RelatoriosSkeleton() {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="mb-5">
        <Skeleton className="h-10 w-[300px]" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Hora de Disparo</TableHead>
            <TableHead>Hora de Validação</TableHead>
            <TableHead>Status</TableHead>
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

// Mock data for the table
const mockData = [
  { date: "01/05/2023", dispatchTime: "09:00", validationTime: "09:05", status: "Validado" },
  { date: "02/05/2023", dispatchTime: "10:00", validationTime: "10:10", status: "Validado" },
  { date: "03/05/2023", dispatchTime: "11:00", validationTime: "-", status: "Pendente" },
]

export default function RelatoriosPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  })
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
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
    if (status === "authenticated" && session?.user?.email) {
      fetchUserInfo(session.user.email)
    }
  }, [status, session])

  // Simulate loading
  useState(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  })

  if (shouldBlockAccess) {
    return <MobileAccessBlock />
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header userInfo={null} />
        <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <RelatoriosSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header userInfo={userInfo} />

      {/* Main Content */}
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-zinc-800 mb-6">Relatórios</h2>
          <div className="mb-5">
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
                />
              </PopoverContent>
            </Popover>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora de Disparo</TableHead>
                <TableHead>Hora de Validação</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.dispatchTime}</TableCell>
                  <TableCell>{row.validationTime}</TableCell>
                  <TableCell>{row.status}</TableCell>
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

