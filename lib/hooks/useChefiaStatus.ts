import { useEffect, useState } from "react"

import type { ChefiaStatus } from "@/lib/services/chefia"

interface UseChefiaStatusState extends ChefiaStatus {
  loading: boolean
  error: Error | null
}

const initialState: UseChefiaStatusState = {
  isChefe: false,
  subordinados: 0,
  loading: true,
  error: null,
}

export function useChefiaStatus(enabled = true): UseChefiaStatusState {
  const [state, setState] = useState<UseChefiaStatusState>(initialState)

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    let isMounted = true

    async function fetchStatus() {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const response = await fetch("/api/chefia/status")

        if (!response.ok) {
          throw new Error(`Erro ao consultar status (${response.status})`)
        }

        const data = (await response.json()) as ChefiaStatus

        if (isMounted) {
          setState({ ...data, loading: false, error: null })
        }
      } catch (error) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error : new Error("Erro desconhecido"),
          }))
        }
      }
    }

    fetchStatus()

    return () => {
      isMounted = false
    }
  }, [enabled])

  return state
}


