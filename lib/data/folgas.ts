import { RowDataPacket } from "mysql2"
import { query } from "@/lib/db/funcionarios"
import { query as checkonQuery } from "@/lib/db/checkon"
import { randomUUID } from "crypto"

export interface Subordinado {
  id: number
  chapa: string
  nome: string
  cpf: string | null
  email: string | null
  cargo: string | null
  funcao: string | null
}

export type TipoFolga = "semana1" | "semana2" | "nenhuma" | "ambas" | "especifico" | ""

export interface AgendamentoFolga {
  chapa: string
  nome: string
  tipoFolga: TipoFolga
  diasEspecificos?: string[] // Array de datas no formato YYYY-MM-DD
}

interface DisparoListagem {
  chapa: string
  codigo: string
  data_disparo: string | Date
  periodo: string
  status: string
  data_validacao: Date | null
}

// Dias de trabalho disponíveis - apenas 2 dias por semana
const DIAS_SEMANA1 = ["2024-12-22", "2024-12-23"] // Domingo e Segunda
const DIAS_SEMANA2 = ["2024-12-29", "2024-12-30"] // Domingo e Segunda

// Todos os dias de trabalho possíveis
const TODOS_DIAS_TRABALHO = [...DIAS_SEMANA1, ...DIAS_SEMANA2]

/**
 * Busca todos os subordinados ativos de um chefe
 */
export async function getSubordinados(
  nomeChefe: string,
): Promise<Subordinado[]> {
  if (!nomeChefe) {
    return []
  }

  const rows = await query<Subordinado & RowDataPacket>(
    `
      SELECT
        id,
        chapa,
        nome,
        cpf,
        email,
        cargo,
        funcao
      FROM vw_colaboradores_completos
      WHERE chefe = ?
        AND status_colaborador = 'ATIVO'
      ORDER BY nome ASC
    `,
    [nomeChefe.trim()],
  )

  return rows
}

/**
 * Calcula as datas de disparo (dias que o colaborador VAI TRABALHAR) baseado nos dias de FOLGA selecionados
 */
function calcularDatasDisparo(agendamento: AgendamentoFolga): string[] {
  switch (agendamento.tipoFolga) {
    case "semana1":
      // Folga na semana 1 (22 e 23/12) → Trabalha na semana 2 (29 e 30/12)
      return DIAS_SEMANA2
    
    case "semana2":
      // Folga na semana 2 (29 e 30/12) → Trabalha na semana 1 (22 e 23/12)
      return DIAS_SEMANA1
    
    case "ambas":
      // Folga em ambas as semanas → Não trabalha nenhum dia
      return []
    
    case "nenhuma":
      // Nenhuma folga → Trabalha todos os dias
      return TODOS_DIAS_TRABALHO
    
    case "especifico":
      // Dias específicos de folga → Trabalha nos outros dias
      const diasFolga = agendamento.diasEspecificos || []
      return TODOS_DIAS_TRABALHO.filter(dia => !diasFolga.includes(dia))
    
    default:
      return []
  }
}

/**
 * Salva os agendamentos de folga criando os disparos na tabela lista_disparo
 */
export async function salvarAgendamentos(
  agendamentos: AgendamentoFolga[],
): Promise<{ sucesso: boolean; mensagem: string; disparosCriados: number }> {
  try {
    // Primeiro, limpar TODOS os disparos existentes para essas chapas nesse período
    // Isso garante que não haverá duplicatas e permite edição completa
    const chapas = agendamentos.map(a => a.chapa)
    
    if (chapas.length > 0) {
      const placeholders = chapas.map(() => "?").join(",")
      const datasPlaceholders = TODOS_DIAS_TRABALHO.map(() => "?").join(",")
      
      // DELETE com verificação adicional de período para evitar remoção acidental
      await checkonQuery(
        `DELETE FROM lista_disparo 
         WHERE chapa IN (${placeholders}) 
         AND DATE(data_disparo) IN (${datasPlaceholders})
         AND periodo IN ('manha', 'tarde')`,
        [...chapas, ...TODOS_DIAS_TRABALHO],
      )
    }

    // Criar novos disparos (substitui completamente os anteriores)
    let disparosCriados = 0

    for (const agendamento of agendamentos) {
      const datasDisparo = calcularDatasDisparo(agendamento)

      for (const data of datasDisparo) {
        // Criar 2 registros: manhã e tarde
        const periodos = ["manha", "tarde"]

        for (const periodo of periodos) {
          const codigo = randomUUID()
          
          await checkonQuery(
            `INSERT INTO lista_disparo 
             (chapa, codigo, data_disparo, periodo, status, data_validacao) 
             VALUES (?, ?, DATE(?), ?, 'pendente', NULL)`,
            [agendamento.chapa, codigo, data, periodo],
          )

          disparosCriados++
        }
      }
    }

    return {
      sucesso: true,
      mensagem: "Agendamentos salvos com sucesso!",
      disparosCriados,
    }
  } catch (error) {
    console.error("Erro ao salvar agendamentos:", error)
    return {
      sucesso: false,
      mensagem: "Erro ao salvar agendamentos. Por favor, tente novamente.",
      disparosCriados: 0,
    }
  }
}

/**
 * Busca os agendamentos existentes para um conjunto de subordinados
 */
export async function getAgendamentosExistentes(
  chapas: string[],
): Promise<Map<string, Set<string>>> {
  if (chapas.length === 0) {
    return new Map()
  }

  const placeholders = chapas.map(() => "?").join(",")
  const datasPlaceholders = TODOS_DIAS_TRABALHO.map(() => "?").join(",")

  const disparos = await checkonQuery<DisparoListagem & RowDataPacket>(
    `SELECT DISTINCT chapa, DATE(data_disparo) as data_disparo 
     FROM lista_disparo 
     WHERE chapa IN (${placeholders}) 
     AND DATE(data_disparo) IN (${datasPlaceholders})`,
    [...chapas, ...TODOS_DIAS_TRABALHO],
  )

  // Mapear chapa -> Set de datas que TÊM disparo (dias de trabalho)
  const mapaDisparos = new Map<string, Set<string>>()
  
  for (const disparo of disparos) {
    if (!mapaDisparos.has(disparo.chapa)) {
      mapaDisparos.set(disparo.chapa, new Set())
    }
    // Garantir que a data está no formato YYYY-MM-DD
    const dataStr = typeof disparo.data_disparo === 'string' 
      ? disparo.data_disparo 
      : disparo.data_disparo.toISOString().split('T')[0]
    mapaDisparos.get(disparo.chapa)!.add(dataStr)
  }

  return mapaDisparos
}

/**
 * Detecta o tipo de folga baseado nos dias de trabalho agendados
 * Retorna vazio ("") se não houver agendamentos (não tem disparos)
 */
export function detectarTipoFolga(diasTrabalho: Set<string>, temAgendamento: boolean): {
  tipoFolga: TipoFolga
  diasEspecificos: string[]
} {
  const diasArray = Array.from(diasTrabalho)
  
  // Se não tem agendamento no banco, retorna vazio (sem pré-seleção)
  if (!temAgendamento) {
    return { tipoFolga: "", diasEspecificos: [] }
  }
  
  // Nenhum dia de trabalho (mas tem agendamento) = folga em ambas as semanas
  if (diasArray.length === 0) {
    return { tipoFolga: "ambas", diasEspecificos: [] }
  }
  
  // Todos os 4 dias = sem folga
  if (diasArray.length === 4) {
    return { tipoFolga: "nenhuma", diasEspecificos: [] }
  }
  
  // Apenas dias da semana 1 (22 e 23) = folga na semana 2
  const temSemana1 = DIAS_SEMANA1.every(dia => diasArray.includes(dia))
  const temSemana2 = DIAS_SEMANA2.every(dia => diasArray.includes(dia))
  
  if (temSemana1 && !temSemana2) {
    return { tipoFolga: "semana2", diasEspecificos: [] }
  }
  
  if (temSemana2 && !temSemana1) {
    return { tipoFolga: "semana1", diasEspecificos: [] }
  }
  
  // Dias específicos: inverter para mostrar dias de FOLGA
  const diasFolga = TODOS_DIAS_TRABALHO.filter(dia => !diasArray.includes(dia))
  return { tipoFolga: "especifico", diasEspecificos: diasFolga }
}

