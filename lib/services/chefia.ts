import { ColaboradorCompleto, contarSubordinadosPorChefe, isNivelChefia } from "@/lib/data/colaboradores"

export interface ChefiaStatus {
  isChefe: boolean
  subordinados: number
}

export async function obterStatusChefia(
  colaborador: ColaboradorCompleto | null | undefined,
): Promise<ChefiaStatus> {
  if (!colaborador) {
    return { isChefe: false, subordinados: 0 }
  }

  // Qualquer nível diferente de "COLABORADOR" é considerado chefia
  const ehChefia = isNivelChefia(colaborador.nivel)

  if (!ehChefia) {
    return { isChefe: false, subordinados: 0 }
  }

  // Se é chefia, conta subordinados (mas não exige que tenha subordinados para ser chefia)
  const totalSubordinados = await contarSubordinadosPorChefe(colaborador.nome)

  return {
    isChefe: true,
    subordinados: totalSubordinados,
  }
}


