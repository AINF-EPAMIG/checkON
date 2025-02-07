"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";
import { MobileAccessBlock } from "@/components/MobileAccessBlock";
import { cn } from "@/lib/utils";
import { useDeviceCheck } from "@/hooks/useDeviceCheck";
import type { DateRange } from "react-day-picker";

interface UserInfo {
  NOME_COMPLETO: string;
  CHAPA: string;
  FILIAL: string;
  SECAO: string;
}

interface FilialSetor {
  FILIAL: string;
  SETOR: string;
  DESCRICAO: string;
}

interface TOTVSUser {
  NOME: string;
  EMAIL: string;
  SECAO: string;
  FILIAL: string;
}

interface NextSchedule {
  primeira_data: string | null;
  ultima_data: string | null;
  message?: string;
}

export default function ProgramarPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [scheduledDates, setScheduledDates] = useState<NextSchedule | null>(
    null
  );

  const [filiaisSetores, setFiliaisSetores] = useState<FilialSetor[]>([]);
  const [selectedFiliais, setSelectedFiliais] = useState<string[]>([]);
  const [selectedSetores, setSelectedSetores] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { shouldBlockAccess } = useDeviceCheck();

  useEffect(() => {
    if (selectedFiliais.length === 0) {
      setSelectedSetores([]);
    }
  }, [selectedFiliais]);

  const fetchNextScheduledDate = async () => {
    try {
      const response = await fetch(
        "https://epamig.tech/novo_checkon/consulta_prox.php"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: NextSchedule = await response.json();
      setScheduledDates(data);
    } catch (error) {
      console.error("Error fetching scheduled dates:", error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      if (session?.user?.role !== "Administrador") {
        router.push("/access-denied");
        return;
      }

      if (session?.user?.email) {
        fetchUserInfo(session.user.email);
        fetchFiliaisSetores();
        fetchNextScheduledDate();
      }
    }
  }, [status, session, router]);

  const fetchUserInfo = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/AINF22012025.02/1/P/?parameters=email=${email}`,
        {
          headers: {
            Authorization: "Basic " + btoa("arthur.souza" + ":" + "4518Adz74$"),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.length > 0) {
        setUserInfo(data[0]);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setSubmitStatus({
        message: "Erro ao buscar informações do usuário",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiliaisSetores = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/AINF22012025.04/1/P/",
        {
          headers: {
            Authorization: "Basic " + btoa("arthur.souza" + ":" + "4518Adz74$"),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FilialSetor[] = await response.json();
      setFiliaisSetores(data);
    } catch (error) {
      console.error("Error fetching filiais e setores:", error);
      setSubmitStatus({
        message: "Erro ao buscar filiais e setores",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const formattedFiliais = selectedFiliais.join("|");
    const formattedSetores = selectedSetores.join("|");

    try {
      console.log("Iniciando busca de usuários na API TOTVS...");
      const totvsResponse = await fetch(
        `https://empresade125373.rm.cloudtotvs.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/AINF22012025.01/1/P/?parameters=secoes=${formattedSetores};filiais=${formattedFiliais}`,
        {
          headers: {
            Authorization: "Basic " + btoa("arthur.souza" + ":" + "4518Adz74$"),
          },
        }
      );

      if (!totvsResponse.ok) {
        throw new Error(`Erro na API TOTVS: ${totvsResponse.status}`);
      }

      const users: TOTVSUser[] = await totvsResponse.json();
      console.log("Usuários encontrados:", users);

      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          if (!dateRange || !dateRange.from || !dateRange.to)
            throw new Error("Data não selecionada");

          // Gerar uma lista de datas entre dateRange.from e dateRange.to
          const startDate = new Date(dateRange.from);
          const endDate = new Date(dateRange.to);
          const dateArray = [];

          for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
            dateArray.push(new Date(d));
          }

          for (const date of dateArray) {
            const selectedDate = format(date, "yyyy-MM-dd");
            console.log(
              `Processando usuário: ${user.EMAIL} para a data ${selectedDate}`
            );

            // Gerar horários aleatórios dentro dos intervalos especificados
            const morningHour = 9 + Math.floor(Math.random() * 2); // 9-10h
            const morningMinute = Math.floor(Math.random() * 60);
            const afternoonHour = 15; // Definindo a hora fixa para 15h
            const afternoonMinute = 10 + Math.floor(Math.random() * 20); // 10-30 minutos

            const morningTime = `${selectedDate} ${String(morningHour).padStart(
              2,
              "0"
            )}:${String(morningMinute).padStart(2, "0")}:00`;
            const afternoonTime = `${selectedDate} ${String(
              afternoonHour
            ).padStart(2, "0")}:${String(afternoonMinute).padStart(2, "0")}:00`;

            console.log(
              `Horários gerados para ${user.EMAIL}: Manhã - ${morningTime}, Tarde - ${afternoonTime}`
            );

            // Enviar ambos períodos em uma única requisição
            const response = await fetch(
              "https://epamig.tech/novo_checkon/novo_disparo.php",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: user.EMAIL,
                  nome: user.NOME,
                  setor: user.SECAO,
                  filial: user.FILIAL,
                  morningTime,
                  afternoonTime,
                }),
              }
            );

            const responseData = await response.json();
            console.log(
              `Resposta do servidor para ${user.EMAIL}:`,
              responseData
            );

            if (!response.ok) {
              throw new Error(
                responseData.error || `Erro no usuário ${user.EMAIL}`
              );
            }

            successCount += 2;
          }
        } catch (error) {
          console.error(`Erro processando usuário ${user.EMAIL}:`, error);
          errorCount += 2;
        }
      }

      setSubmitStatus({
        message: `${successCount} registros processados com sucesso. ${errorCount} erros.`,
        type: errorCount > 0 ? "error" : "success",
      });

      // Atualiza as datas programadas após o envio bem-sucedido
      fetchNextScheduledDate();
    } catch (error) {
      console.error("Erro:", error);
      setSubmitStatus({
        message: "Erro ao processar usuários",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uniqueFiliais = Array.from(
    new Set(filiaisSetores.map((item) => item.FILIAL))
  );

  const handleSelectAllFiliais = (checked: boolean) => {
    if (checked) {
      setSelectedFiliais(uniqueFiliais);
    } else {
      setSelectedFiliais([]);
      setSelectedSetores([]);
    }
  };

  const handleSelectAllSetores = (checked: boolean) => {
    if (checked) {
      const allSetores = filiaisSetores
        .filter((item) => selectedFiliais.includes(item.FILIAL))
        .map((item) => item.SETOR);
      setSelectedSetores(Array.from(new Set(allSetores)));
    } else {
      setSelectedSetores([]);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <Header userInfo={null} />
        <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white shadow-lg rounded-lg p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (shouldBlockAccess) {
    return <MobileAccessBlock />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header userInfo={userInfo} />

      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-6xl bg-white shadow-lg rounded-lg">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-zinc-800 text-center">
              Programar CheckON
            </h2>
            {scheduledDates && scheduledDates.primeira_data ? (
              <div className="mt-4 text-center text-sm text-zinc-600">
                {format(new Date(scheduledDates.primeira_data), "dd/MM/yyyy", {
                  locale: ptBR,
                }) ===
                format(new Date(scheduledDates.ultima_data!), "dd/MM/yyyy", {
                  locale: ptBR,
                }) ? (
                  // Quando é a mesma data
                  <>
                    Próximo CheckON programado para{" "}
                    {format(
                      new Date(scheduledDates.primeira_data),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )}
                  </>
                ) : (
                  // Quando são datas diferentes
                  <>
                    Próximo CheckON programado entre{" "}
                    {format(
                      new Date(scheduledDates.primeira_data),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )}{" "}
                    e{" "}
                    {format(
                      new Date(scheduledDates.ultima_data!),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )}
                  </>
                )}
              </div>
            ) : scheduledDates?.message ? (
              <div className="mt-4 text-center text-sm text-zinc-600">
                {scheduledDates.message}
              </div>
            ) : null}
            {submitStatus && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  submitStatus.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {submitStatus.message}
              </div>
            )}
          </div>

          <ScrollArea className="h-[calc(100vh-24rem)]">
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-8">
                {/* Passo 1 - Seleção de Data */}
                <div className="w-full lg:w-72 flex-shrink-0">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Período</h3>
                        <span className="text-sm text-muted-foreground">Selecione o intervalo de datas</span>
                      </div>
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal h-12 sm:h-16",
                            !dateRange?.from && "text-muted-foreground",
                            dateRange?.from && "border-2 border-primary"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                <span className="block text-sm">
                                  De: {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <span className="block text-sm ml-2">
                                  Até: {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm">
                                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm">
                              <span>De: --/--/----</span>
                              <span>Até: --/--/----</span>
                            </div>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Selecione a data inicial e depois a final
                          </p>
                          <Calendar
                            initialFocus
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={1}
                            locale={ptBR}
                            classNames={{
                              day_range_middle: "bg-accent/50",
                              day_today: "border border-primary"
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Passo 2 - Filiais */}
                <div className={cn(
                  "w-full lg:w-96 flex-shrink-0 transition-all duration-300",
                  dateRange?.from && dateRange?.to ? "opacity-100" : "opacity-50"
                )}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        2
                      </div>
                        <h3 className="text-lg font-semibold">Filiais</h3>
                    </div>
                    
                    {dateRange?.from && dateRange?.to ? (
                      <div className="ml-4 sm:ml-10 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-filiais"
                              checked={selectedFiliais.length === uniqueFiliais.length}
                              onCheckedChange={handleSelectAllFiliais}
                            />
                            <label 
                              htmlFor="select-all-filiais" 
                              className="font-bold"
                            >
                              Selecionar todos
                            </label>
                          </div>
                          {uniqueFiliais.map((filial) => (
                            <div key={filial} className="flex items-center space-x-2">
                              <Checkbox
                                id={`filial-${filial}`}
                                checked={selectedFiliais.includes(filial)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedFiliais([...selectedFiliais, filial]);
                                  } else {
                                    setSelectedFiliais(
                                      selectedFiliais.filter((f) => f !== filial)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`filial-${filial}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {filial}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="ml-4 sm:ml-10 text-sm text-muted-foreground">
                        Selecione as datas primeiro
                      </span>
                    )}
                  </div>
                </div>

                {/* Passo 3 - Setores */}
                <div className={cn(
                  "w-full lg:w-96 flex-shrink-0 transition-all duration-300",
                  selectedFiliais.length > 0 ? "opacity-100" : "opacity-50"
                )}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        3
                      </div>
                        <h3 className="text-lg font-semibold">Setores</h3>
                    </div>

                    {selectedFiliais.length > 0 ? (
                      <div className="ml-4 sm:ml-10 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all-setores"
                              checked={selectedSetores.length === filiaisSetores.filter(item => 
                                selectedFiliais.includes(item.FILIAL)).length}
                              onCheckedChange={handleSelectAllSetores}
                            />
                            <label 
                              htmlFor="select-all-setores" 
                              className="font-bold"
                            >
                              Selecionar todos
                            </label>
                          </div>
                          {filiaisSetores
                            .filter((item) => selectedFiliais.includes(item.FILIAL))
                            .map((item) => (
                              <div
                                key={`${item.FILIAL}-${item.SETOR}`}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`setor-${item.SETOR}`}
                                  checked={selectedSetores.includes(item.SETOR)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSetores([
                                        ...selectedSetores,
                                        item.SETOR,
                                      ]);
                                    } else {
                                      setSelectedSetores(
                                        selectedSetores.filter(
                                          (s) => s !== item.SETOR
                                        )
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`setor-${item.SETOR}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {item.DESCRICAO}
                                </label>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <span className="ml-4 sm:ml-10 text-sm text-muted-foreground">
                        Selecione filiais primeiro
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </ScrollArea>

          {/* Botão de envio */}
          <div className="p-6 border-t">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={
                !(dateRange?.from && dateRange?.to) ||
                selectedSetores.length === 0 ||
                isSubmitting
              }
              onClick={handleSubmit}
            >
              {isSubmitting ? "Processando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
