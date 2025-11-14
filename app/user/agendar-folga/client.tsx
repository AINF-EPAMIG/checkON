"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Lazy load com SSR desabilitado para evitar ChunkLoadError
const CalendarioFolgasInterativo = dynamic(
  () => import("@/components/CalendarioFolgasInterativo"),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e7b4f]"></div>
          <p className="mt-4 text-gray-600">Carregando calendário de folgas...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function AgendarFolgaClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e7b4f]"></div>
            <p className="mt-4 text-gray-600">Preparando página...</p>
          </div>
        </div>
      }
    >
      <CalendarioFolgasInterativo />
    </Suspense>
  )
}

