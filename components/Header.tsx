"use client"

import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import { MobileMenu } from "./MobileMenu"

interface UserInfo {
  NOME_COMPLETO: string
  CHAPA: string
  FILIAL: string
  SECAO: string
}

interface HeaderProps {
  userInfo: UserInfo | null
}

function UserInfoSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  )
}

export function Header({ userInfo }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
        {/* User Info - Visível apenas em desktop */}
        <div className="hidden md:block text-left flex-1">
          {userInfo === null ? (
            <UserInfoSkeleton />
          ) : userInfo ? (
            <>
              <h1 className="text-xl font-bold truncate">
                {userInfo.NOME_COMPLETO}
              </h1>
              <p className="text-sm opacity-90 truncate">
                Chapa: {userInfo.CHAPA}
              </p>
            </>
          ) : (
            <h1 className="text-xl font-bold">Bem-vindo</h1>
          )}
        </div>

        {/* Espaçador para mobile */}
        <div className="w-8 md:hidden" />

        {/* Logo - Centralizado */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-[250px] md:w-[300px] h-[42px] md:h-[52px]">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/epamig_logo-2vMg7oM4pTh8E3aN8ywr6xeKCiKxLh.svg"
              alt="EPAMIG Logo"
              fill
              priority
              className="brightness-0 invert"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Menu Desktop */}
        <nav className="hidden md:flex flex-1 justify-end">
          <ul className="flex space-x-4">
            <li>
              <Link href="/validar" className="hover:text-zinc-200 transition-colors">
                Início
              </Link>
            </li>
            <li>
              <Link href="/relatorios" className="hover:text-zinc-200 transition-colors">
                Relatórios
              </Link>
            </li>
            {(session?.user?.role === "Chefia" || session?.user?.role === "Administrador") && (
              <li>
                <Link href="/minha-equipe" className="hover:text-zinc-200 transition-colors">
                  Minha Equipe
                </Link>
              </li>
            )}
            {session?.user?.role === "Administrador" && (
              <li>
                <Link href="/programar" className="hover:text-zinc-200 transition-colors">
                  Programar
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Menu Mobile */}
        <div className="md:hidden flex-1 flex justify-end">
          <MobileMenu userInfo={userInfo} />
        </div>
      </div>
    </header>
  )
}

