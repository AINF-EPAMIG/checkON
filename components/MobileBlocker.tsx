"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { isNivelChefia } from "@/lib/utils/nivel"

interface MobileBlockerProps {
  children: React.ReactNode
}

export function MobileBlocker({ children }: MobileBlockerProps) {
  const { data: session, status } = useSession()
  const [isMobile, setIsMobile] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Detectar se é mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const windowWithOpera = window as typeof window & { opera?: string }
      const userAgent = navigator.userAgent || navigator.vendor || windowWithOpera.opera || ''
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      const isSmallScreen = window.innerWidth <= 768
      const mobile = isMobileDevice || isSmallScreen
      
      console.log('[MobileBlocker] Detecção:', { 
        isMobileDevice, 
        isSmallScreen, 
        width: window.innerWidth,
        userAgent: userAgent.substring(0, 50) + '...',
        mobile 
      })
      
      setIsMobile(mobile)
      setIsChecking(false)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Aguardar verificação inicial
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Verificando dispositivo...</p>
        </div>
      </div>
    )
  }

  // Aguardar sessão carregar
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando sessão...</p>
        </div>
      </div>
    )
  }

  // Não bloquear se não estiver autenticado (deixar a página de login lidar com isso)
  if (status === "unauthenticated" || !session) {
    console.log('[MobileBlocker] Não autenticado, permitindo acesso')
    return <>{children}</>
  }

  // Verificar se é colaborador (não chefia) em mobile
  const colaborador = session.user?.colaborador
  const nivel = colaborador?.nivel
  
  // Se não houver colaborador ou nível, considerar como colaborador por segurança
  const ehChefia = colaborador ? isNivelChefia(nivel) : false
  const isColaborador = !ehChefia
  
  console.log('[MobileBlocker] Verificação completa:', {
    isMobile,
    temColaborador: !!colaborador,
    nivel: nivel,
    ehChefia,
    isColaborador,
    userName: session.user?.name,
    bloqueado: isMobile && isColaborador
  })

  // Bloquear colaboradores em dispositivos móveis
  if (isMobile && isColaborador) {
    console.error('[MobileBlocker] ACESSO BLOQUEADO - Colaborador tentando acessar via mobile')
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg 
            className="mx-auto h-24 w-24 text-gray-600 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
          <p className="text-xl text-gray-600 font-medium">Acesso mobile</p>
        </div>
      </div>
    )
  }
  
  console.log('[MobileBlocker] Acesso permitido')

  return <>{children}</>
}

