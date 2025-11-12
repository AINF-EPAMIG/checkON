"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { isNivelChefia } from "@/lib/utils/nivel"

interface MobileBlockerProps {
  children: React.ReactNode
}

export function MobileBlocker({ children }: MobileBlockerProps) {
  const { data: session, status } = useSession()
  const [isMobile, setIsMobile] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [secondsUntilLogout, setSecondsUntilLogout] = useState(5)

  // Detectar se é mobile de forma mais robusta
  useEffect(() => {
    const checkIfMobile = () => {
      // Verificar se já foi detectado como mobile anteriormente nesta sessão
      const wasMobileDetected = sessionStorage.getItem('isMobileDevice') === 'true'
      
      // 1. Verificar user agent (pode ser burlado com "site para computador")
      const windowWithOpera = window as typeof window & { opera?: string }
      const userAgent = navigator.userAgent || navigator.vendor || windowWithOpera.opera || ''
      const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      
      // 2. Verificar largura da tela FÍSICA (screen.width não muda com modo desktop)
      const isSmallPhysicalScreen = screen.width <= 768 || screen.height <= 1024
      const isSmallViewport = window.innerWidth <= 768
      
      // 3. Verificar suporte a toque (dispositivos móveis têm tela touch)
      const msMaxTouchPoints = (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints
      const hasTouchScreen = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (msMaxTouchPoints !== undefined && msMaxTouchPoints > 0)
      )
      
      // 4. Verificar orientação (característica de dispositivos móveis)
      const hasOrientation = 'orientation' in window || 'orientation' in screen
      
      // 5. Verificar se a proporção da tela FÍSICA é típica de mobile
      const physicalAspectRatio = screen.height / screen.width
      const viewportAspectRatio = window.innerHeight / window.innerWidth
      const isMobileAspectRatio = physicalAspectRatio > 1.3 || viewportAspectRatio > 1.3 || screen.width < 768
      
      // 6. Verificar capacidades de toque do navegador
      const touchPoints = navigator.maxTouchPoints || 0
      const hasMultiTouch = touchPoints > 1
      
      // Combinar múltiplas verificações para detecção mais precisa
      // É considerado mobile se:
      // - Foi detectado anteriormente como mobile nesta sessão (não pode ser burlado)
      // - OU tem tela touch E (tela física pequena OU proporção mobile OU user agent mobile)
      // - OU tem múltiplos pontos de toque E tela física pequena
      // - OU tem tela física pequena E tem touch E orientação
      const isMobileByTouch = hasTouchScreen && (isSmallPhysicalScreen || isMobileAspectRatio || isMobileUserAgent)
      const isMobileByMultiTouch = hasMultiTouch && isSmallPhysicalScreen
      const isMobileByCombination = hasTouchScreen && hasOrientation && (isMobileAspectRatio || isSmallPhysicalScreen)
      
      const mobile = wasMobileDetected || isMobileByTouch || isMobileByMultiTouch || isMobileByCombination
      
      // Persistir detecção para prevenir burla com "site para computador"
      if (mobile && !wasMobileDetected) {
        sessionStorage.setItem('isMobileDevice', 'true')
      }
      
      console.log('[MobileBlocker] Detecção robusta anti-burla:', { 
        wasMobileDetected,
        isMobileUserAgent,
        isSmallPhysicalScreen,
        isSmallViewport,
        hasTouchScreen,
        hasOrientation,
        touchPoints,
        hasMultiTouch,
        physicalAspectRatio: physicalAspectRatio.toFixed(2),
        viewportAspectRatio: viewportAspectRatio.toFixed(2),
        isMobileAspectRatio,
        screenWidth: screen.width,
        screenHeight: screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        mobile,
        motivo: mobile ? (
          wasMobileDetected ? 'Detectado anteriormente (sessão - anti-burla)' :
          isMobileByTouch ? 'Touch + características mobile' :
          isMobileByMultiTouch ? 'Multi-touch + tela física pequena' :
          isMobileByCombination ? 'Touch + orientação + proporção mobile' :
          'Múltiplos fatores'
        ) : 'Desktop detectado'
      })
      
      setIsMobile(mobile)
      setIsChecking(false)
    }

    checkIfMobile()
    
    // Adicionar listeners para múltiplos eventos
    window.addEventListener('resize', checkIfMobile)
    window.addEventListener('orientationchange', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
      window.removeEventListener('orientationchange', checkIfMobile)
    }
  }, [])

  // Efeito para logout automático após 5 segundos quando bloqueado
  useEffect(() => {
    // Verificar se é colaborador (não chefia)
    const colaborador = session?.user?.colaborador
    const ehChefia = colaborador ? isNivelChefia(colaborador.nivel) : false
    const isColaborador = !ehChefia

    if (status === "authenticated" && isMobile && isColaborador && !isChecking) {
      console.warn('[MobileBlocker] Iniciando contagem regressiva para logout...')
      
      // Contagem regressiva
      const countdown = setInterval(() => {
        setSecondsUntilLogout((prev) => {
          if (prev <= 1) {
            clearInterval(countdown)
            console.error('[MobileBlocker] Fazendo logout por acesso mobile bloqueado')
            
            // Limpar o storage de detecção mobile antes do logout
            sessionStorage.removeItem('isMobileDevice')
            sessionStorage.removeItem('hasVisitedHome')
            console.log('[MobileBlocker] SessionStorage limpo')
            
            signOut({ callbackUrl: '/login' })
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(countdown)
    } else {
      // Resetar contador se não estiver bloqueado
      setSecondsUntilLogout(5)
    }
  }, [isMobile, status, session, isChecking])

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
        <div className="text-center px-4">
          <svg 
            className="mx-auto h-24 w-24 text-gray-600 mb-6" 
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
          <p className="text-xl text-gray-600 font-medium mb-4">Acesso mobile</p>
          <div className="mt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-3">
              <span className="text-2xl font-bold text-red-600">{secondsUntilLogout}</span>
            </div>
            <p className="text-sm text-gray-500">Redirecionando para login...</p>
          </div>
        </div>
      </div>
    )
  }
  
  console.log('[MobileBlocker] Acesso permitido')

  return <>{children}</>
}

