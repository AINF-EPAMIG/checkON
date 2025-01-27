import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

export function useDeviceCheck() {
  const [isMobile, setIsMobile] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "Administrador"

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    // Verificação inicial
    if (typeof window !== "undefined") {
      checkDevice()
    }

    // Listener para mudanças de tamanho
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  // Se for admin, nunca bloqueia o acesso
  return {
    isMobile,
    shouldBlockAccess: isMobile && !isAdmin
  }
} 