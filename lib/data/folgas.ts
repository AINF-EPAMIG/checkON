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

export interface AgendamentoFolga {
  chapa: string
  nome: string
  diasTrabalho: string[] // Array de datas no formato YYYY-MM-DD que o colaborador VAI TRABALHAR
}

// Todos os dias de trabalho possíveis
const TODOS_DIAS_TRABALHO = ["2025-12-22", "2025-12-23", "2025-12-29", "2025-12-30"]

interface DisparoListagem {
  chapa: string
  data_disparo: string | Date
}

/**
 * Busca todos os subordinados ativos de um chefe + o próprio chefe
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
      WHERE (chefe = ? OR nome = ?)
        AND status_colaborador = 'ATIVO'
      ORDER BY nome ASC
    `,
    [nomeChefe.trim(), nomeChefe.trim()],
  )

  return rows
}

/**
 * Retorna os dias de trabalho diretamente do agendamento
 */
function calcularDatasDisparo(agendamento: AgendamentoFolga): string[] {
  // Agora recebemos diretamente os dias de trabalho
  return agendamento.diasTrabalho || []
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
 * Busca os agendamentos existentes (disparos) para um conjunto de subordinados
 * Retorna um Map com chapa -> Set de datas que o colaborador VAI TRABALHAR
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

