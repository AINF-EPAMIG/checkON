import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
        <h1 className="text-2xl font-bold text-zinc-800 mb-4">
          Acesso Negado
        </h1>
        <p className="text-zinc-600 mb-6">
          Você não tem permissão para acessar esta página. Por favor, entre em contato com o administrador se acredita que isso é um erro.
        </p>
        <Link 
          href="/validar"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  )
} 