/**
 * Utilitários para verificação de nível de usuário
 * Este arquivo não tem dependências de servidor e pode ser usado no client
 */

const NIVEL_COLABORADOR = "COLABORADOR"

export function isNivelChefia(nivel: string | null | undefined): boolean {
  if (!nivel) {
    return false
  }

  return nivel.trim().toUpperCase() !== NIVEL_COLABORADOR
}

