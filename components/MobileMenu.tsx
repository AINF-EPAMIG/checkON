"use client"

import { Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface UserInfo {
  NOME_COMPLETO: string;
  CHAPA: string;
  SECAO: string;
  FILIAL: string;
}

interface MobileMenuProps {
  userInfo: UserInfo | null;
}

export function MobileMenu({ userInfo }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  return (
    <div className="md:hidden">
      {/* Botão do Menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white p-2"
        aria-label="Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Menu Lateral */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-primary transform transition-transform duration-200 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Cabeçalho do Menu */}
          <div className="flex justify-between items-center p-4 border-b border-primary-foreground/10">
            <span className="text-white font-semibold">Menu</span>
            <button onClick={() => setIsOpen(false)} className="text-white p-2">
              <X size={24} />
            </button>
          </div>

          {/* Informações do Usuário */}
          <div className="p-4 border-b border-primary-foreground/10">
            {userInfo && (
              <div className="text-white">
                <p className="font-semibold truncate">{userInfo.NOME_COMPLETO}</p>
                <p className="text-sm opacity-90 truncate">
                  Chapa: {userInfo.CHAPA}
                </p>
                <p className="text-sm opacity-90 truncate">
                  Setor: {userInfo.SECAO}
                </p>
              </div>
            )}
          </div>

          {/* Links de Navegação */}
          <nav className="flex-1 p-4">
            <ul className="space-y-4">
              <li>
                <Link
                  href="/validar"
                  className="text-white hover:text-zinc-200 block transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/relatorios"
                  className="text-white hover:text-zinc-200 block transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Relatórios
                </Link>
              </li>
              {(session?.user?.role === "Chefia" || session?.user?.role === "Administrador") && (
                <li>
                  <Link
                    href="/minha-equipe"
                    className="text-white hover:text-zinc-200 block transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Minha Equipe
                  </Link>
                </li>
              )}
              {session?.user?.role === "Administrador" && (
                <li>
                  <Link
                    href="/programar"
                    className="text-white hover:text-zinc-200 block transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Programar
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
} 