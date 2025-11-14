import mysql, { Pool } from "mysql2/promise"

const requiredEnv = {
  DB_CHECKON_HOST: process.env.DB_CHECKON_HOST,
  DB_CHECKON_USER: process.env.DB_CHECKON_USER,
  DB_CHECKON_PASSWORD: process.env.DB_CHECKON_PASSWORD,
  DB_CHECKON_DATABASE: process.env.DB_CHECKON_DATABASE,
}

type EnvVar = keyof typeof requiredEnv

function ensureEnv(name: EnvVar, allowEmpty: boolean = false): string {
  const value = requiredEnv[name]

  if (!value && !allowEmpty) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. Verifique o arquivo .env`,
    )
  }

  return value || ""
}

const poolConfig = {
  host: ensureEnv("DB_CHECKON_HOST"),
  user: ensureEnv("DB_CHECKON_USER"),
  password: ensureEnv("DB_CHECKON_PASSWORD", true),
  database: ensureEnv("DB_CHECKON_DATABASE"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "-03:00", // Timezone de Brasília/São Paulo
}

const globalForPool = globalThis as unknown as {
  checkonPool?: Pool
}

export const checkonPool =
  globalForPool.checkonPool ?? mysql.createPool(poolConfig)

if (process.env.NODE_ENV !== "production") {
  globalForPool.checkonPool = checkonPool
}

export async function query<T extends mysql.RowDataPacket>(
  sql: string,
  values?: unknown[],
): Promise<T[]> {
  const [rows] = await checkonPool.query<T[]>(sql, values)
  return rows
}

