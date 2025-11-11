import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { Header } from '@/components/Layout/header'


export const metadata: Metadata = {
  title: 'Sistema CheckON',
  description: 'Sistema CheckON EPAMIG - Empresa de Pesquisa Agropecuária de Minas Gerais',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={GeistSans.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

