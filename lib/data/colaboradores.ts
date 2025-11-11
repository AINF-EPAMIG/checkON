import { RowDataPacket } from "mysql2"
import { query } from "@/lib/db/funcionarios"

export interface ColaboradorCompleto extends RowDataPacket {
  id: number
  chapa: string | null
  nome: string | null
  cpf: string | null
  email: string | null
  cargo: string | null
  funcao: string | null
  data_admissao: Date | null
  data_demissao: Date | null
  chefe: string | null
  chefe_substituto: string | null
  status_colaborador: string | null
  regional: string | null
  departamento: string | null
  divisao: string | null
  assessoria: string | null
  fazenda: string | null
  diretoria: string | null
  gabinete: string | null
  nivel: string | null
}

const NIVEL_COLABORADOR = "COLABORADOR"

export function isNivelChefia(nivel: string | null | undefined): boolean {
  if (!nivel) {
    return false
  }

  return nivel.trim().toUpperCase() !== NIVEL_COLABORADOR
}

const BASE_SELECT = `
  SELECT
    id,
    chapa,
    nome,
    cpf,
    email,
    cargo,
    funcao,
    data_admissao,
    data_demissao,
    chefe,
    chefe_substituto,
    status_colaborador,
    regional,
    departamento,
    divisao,
    assessoria,
    fazenda,
    diretoria,
    gabinete,
    nivel
  FROM vw_colaboradores_completos
`

export async function getColaboradorPorEmail(
  email: string,
): Promise<ColaboradorCompleto | null> {
  if (!email) {
    return null
  }

  const rows = await query<ColaboradorCompleto>(
    `${BASE_SELECT} WHERE email = ? LIMIT 1`,
    [email.trim().toLowerCase()],
  )

  return rows[0] ?? null
}

export async function contarSubordinadosPorChefe(
  nomeChefe: string | null | undefined,
): Promise<number> {
  if (!nomeChefe) {
    return 0
  }

  const [result] = await query<{ total: number } & RowDataPacket>(
    `
      SELECT COUNT(*) AS total
      FROM vw_colaboradores_completos
      WHERE chefe = ?
    `,
    [nomeChefe.trim()],
  )

  return result?.total ?? 0
}

export async function getColaboradorPorCpfChapa({
  cpf,
  chapa,
}: {
  cpf: string
  chapa: string
}): Promise<ColaboradorCompleto | null> {
  if (!cpf || !chapa) {
    return null
  }

  const normalizadoCpf = cpf.replace(/\D/g, "")
  const normalizadoChapa = chapa.trim()

  const rows = await query<ColaboradorCompleto>(
    `${BASE_SELECT} WHERE cpf = ? AND chapa = ? LIMIT 1`,
    [normalizadoCpf, normalizadoChapa],
  )

  return rows[0] ?? null
}

