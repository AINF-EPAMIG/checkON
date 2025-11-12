'use client'

import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { Header } from '@/components/Layout/header'
import { MobileBlocker } from '@/components/MobileBlocker'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  return (
    <html lang="pt-BR">
      <body className={GeistSans.className}>
        <AuthProvider>
          <MobileBlocker>
            <div className="min-h-screen flex flex-col">
              {!isLoginPage && <Header />}

              <main className="flex-1">
                {children}
              </main>
            </div>
          </MobileBlocker>
        </AuthProvider>
      </body>
    </html>
  )
}

