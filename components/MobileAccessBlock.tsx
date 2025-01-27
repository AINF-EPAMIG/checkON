import { AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"

export function MobileAccessBlock() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "Administrador"

  if (isAdmin) return null

  return (
    <div className="fixed inset-0 bg-zinc-900 text-white flex flex-col items-center justify-center p-4 z-50">
      <AlertCircle className="w-16 h-16 mb-4 text-yellow-400" />
      <h1 className="text-2xl font-bold mb-2 text-center">Acesso Bloqueado</h1>
      <p className="text-center max-w-md">
        Este site só pode ser acessado em computadores. Por favor, utilize um dispositivo desktop para continuar.
      </p>
    </div>
  )
}

