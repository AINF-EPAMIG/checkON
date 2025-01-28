import "./globals.css"
import { Nunito } from "next/font/google"
import ClientWrapper from "@/components/ClientWrapper"
import { RoleProvider } from "@/components/RoleProvider"

const nunito = Nunito({ subsets: ["latin"] })

export const metadata = {
  title: "Check ON",
  description: "Authentication system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={nunito.className}>
        <ClientWrapper>
          <RoleProvider>
            {children}
          </RoleProvider>
        </ClientWrapper>
      </body>
    </html>
  )
}

