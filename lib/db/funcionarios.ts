import mysql, { Pool } from "mysql2/promise"

const requiredEnv = {
  DB_FUNCIONARIOS_HOST: process.env.DB_FUNCIONARIOS_HOST,
  DB_FUNCIONARIOS_USER: process.env.DB_FUNCIONARIOS_USER,
  DB_FUNCIONARIOS_PASSWORD: process.env.DB_FUNCIONARIOS_PASSWORD,
  DB_FUNCIONARIOS_DATABASE: process.env.DB_FUNCIONARIOS_DATABASE,
}

type EnvVar = keyof typeof requiredEnv

function ensureEnv(name: EnvVar): string {
  const value = requiredEnv[name]

  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. Verifique o arquivo .env`,
    )
  }

  return value
}

const poolConfig = {
  host: ensureEnv("DB_FUNCIONARIOS_HOST"),
  user: ensureEnv("DB_FUNCIONARIOS_USER"),
  password: ensureEnv("DB_FUNCIONARIOS_PASSWORD"),
  database: ensureEnv("DB_FUNCIONARIOS_DATABASE"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "-03:00", // Timezone de Brasília/São Paulo
}

const globalForPool = globalThis as unknown as {
  funcionariosPool?: Pool
}

export const funcionariosPool =
  globalForPool.funcionariosPool ?? mysql.createPool(poolConfig)

if (process.env.NODE_ENV !== "production") {
  globalForPool.funcionariosPool = funcionariosPool
}

export async function query<T extends mysql.RowDataPacket>(
  sql: string,
  values?: unknown[],
): Promise<T[]> {
  const [rows] = await funcionariosPool.query<T[]>(sql, values)
  return rows
}

