"use client";

import { useState, useEffect } from "react";
import { format, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileAccessBlock } from "@/components/MobileAccessBlock";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceCheck } from "@/hooks/useDeviceCheck";

interface UserInfo {
  NOME_COMPLETO: string;
  CHAPA: string;
  FILIAL: string;
  SECAO: string;
}

interface ReportData {
  data_disparo: string;
  hora_disparo: string;
  hora_validacao: string | null;
  valido_ate: string | null;
}

interface APIResponse {
  success: boolean;
  data?: ReportData[];
  error?: string;
}

type StatusType = "validado" | "expirado";

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
  );
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
  );
}

export default function RelatoriosPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { data: session, status } = useSession();
  const { shouldBlockAccess } = useDeviceCheck();

  const getStatus = (row: ReportData): StatusType | null => {
    if (row.hora_validacao) {
      return "validado";
    }

    if (row.valido_ate) {
      const validoAteDate = new Date(`${row.valido_ate}`);
      const now = new Date();
      if (isBefore(validoAteDate, now)) {
        return "expirado";
      }
    }

    return null;
  };

  const getStatusStyle = (status: StatusType) => {
    switch (status) {
      case "validado":
        return "bg-green-100 text-green-800";
      case "expirado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const fetchUserInfo = async (email: string) => {
    try {
      const response = await fetch(
        `https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/AINF22012025.02/1/P/?parameters=email=${encodeURIComponent(
          email
        )}`,
        {
          headers: {
            Authorization: "Basic " + btoa("arthur.souza" + ":" + "4518Adz74$"),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar informações do usuário: ${response.status}`
        );
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setUserInfo(data[0]);
      }
    } catch (error) {
      console.error("Erro ao buscar informações do usuário:", error);
      setError("Não foi possível carregar as informações do usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReportData = async () => {
    if (!session?.user?.email || !date?.from || !date?.to) {
      console.log("Dados necessários ausentes:", {
        email: session?.user?.email,
        dateFrom: date?.from,
        dateTo: date?.to,
      });
      return;
    }

    try {
      setIsFetching(true);
      setError(null);
      const startDate = format(date.from, "yyyy-MM-dd");
      const endDate = format(date.to, "yyyy-MM-dd");

      const url = `https://epamig.tech/novo_checkon/relatorios.php?email=${encodeURIComponent(
        session.user.email
      )}&startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const result: APIResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao carregar os dados");
      }

      const filteredAndSortedData = (result.data || [])
        .filter((row) => {
          const status = getStatus(row);
          return status === "validado" || status === "expirado";
        })
        .sort((a, b) => {
          const dateA = `${a.data_disparo}T${a.hora_disparo}`;
          const dateB = `${b.data_disparo}T${b.hora_disparo}`;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

      setReportData(filteredAndSortedData);
    } catch (error) {
      console.error("Erro ao buscar dados do relatório:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao carregar os dados do relatório"
      );
      setReportData([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchUserInfo(session.user.email);
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "authenticated" && date?.from && date?.to) {
      fetchReportData();
    }
  }, [status, date]);

  if (shouldBlockAccess) {
    return <MobileAccessBlock />;
  }

  if (status === "loading" || isLoading || !userInfo) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header userInfo={null} />
        <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <RelatoriosSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header userInfo={userInfo} />

      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-zinc-800">
              Relatório de Validações
            </h2>
            {isFetching && (
              <div className="flex items-center text-sm text-zinc-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </div>
            )}
          </div>

          <div className="mb-5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
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
                  <TableHead>Data</TableHead>
                  <TableHead>Hora de Disparo</TableHead>
                  <TableHead>Hora de Validação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length > 0 ? (
                  reportData.map((row, index) => {
                    const status = getStatus(row);
                    if (!status) return null; // Não renderiza itens pendentes

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {format(
                            new Date(`${row.data_disparo}T${row.hora_disparo}`),
                            "dd/MM/yyyy"
                          )}
                        </TableCell>
                        <TableCell>{row.hora_disparo}</TableCell>
                        <TableCell>{row.hora_validacao || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getStatusStyle(status)
                            )}
                          >
                            {status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-4 text-zinc-500"
                    >
                      {isFetching ? (
                        <span>Carregando dados...</span>
                      ) : (
                        <span>
                          Nenhum registro validado ou expirado encontrado para o
                          período selecionado
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
  );
}
