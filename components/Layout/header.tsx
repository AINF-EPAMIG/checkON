"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu, X, Mail, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { useChefiaStatus } from "@/lib/hooks/useChefiaStatus";

const getInitials = (name: string | null | undefined): string => {
  if (!name) return "??";
  
  const parts = name.trim().split(" ").filter(n => n.length > 0);
  
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  // Pega primeira letra do primeiro e último nome
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const getFirstAndLastName = (name: string | null | undefined): string => {
  if (!name) return "Usuário";
  
  const parts = name.trim().split(" ").filter(n => n.length > 0);
  
  if (parts.length === 0) return "Usuário";
  if (parts.length === 1) return capitalizeFirstLetter(parts[0]);
  
  // Retorna primeiro e último nome capitalizados
  const firstName = capitalizeFirstLetter(parts[0]);
  const lastName = capitalizeFirstLetter(parts[parts.length - 1]);
  
  return `${firstName} ${lastName}`;
};

const capitalizeFullName = (name: string | null | undefined): string => {
  if (!name) return "Usuário";
  
  const parts = name.trim().split(" ").filter(n => n.length > 0);
  
  if (parts.length === 0) return "Usuário";
  
  // Capitaliza todas as partes do nome
  return parts.map(part => capitalizeFirstLetter(part)).join(" ");
};

const censurarCPF = (cpf: string | null | undefined): string | null => {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  // Formato: ***.123.456-**
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
};

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isChefe, loading: chefiaLoading } = useChefiaStatus(!!session);
  const pathname = usePathname();

  return (
    <>
  <header className="w-full py-3 px-6 bg-gray-100/30">
  <div className="w-full flex justify-between items-center">
          {/* Logo e Informações */}
          <div className="flex items-center gap-4">
            <Image
              src="/epamig_logo.svg"
              alt="EPAMIG Logo"
              width={120}
              height={50}
              className="h-auto"
            />
            <div className="hidden md:block h-12 w-px bg-gray-300"></div>
            <div className="hidden md:block">
              <h1 className="text-[#1e7b4f] font-semibold text-base leading-tight">
                Empresa de Pesquisa Agropecuária de Minas Gerais
              </h1>
              <p className="text-gray-600 text-sm leading-tight">
                Secretaria de Estado de Agricultura, Pecuária e Abastecimento
              </p>
            </div>
          </div>

          {/* Menu de Ações - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-[#1e7b4f] hover:text-[#165c3c]"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm">Site Oficial</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-[#1e7b4f] hover:text-[#165c3c]"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm">E-mail</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-[#1e7b4f] hover:text-[#165c3c]"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span className="text-sm">Portal ADM</span>
            </Button>

            {/* Informações do Usuário e Botão Sair */}
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-300">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 pl-2 pr-3 hover:bg-gray-100"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session?.user?.image || null}
                        alt={session?.user?.name || "Usuário"}
                      />
                      <AvatarFallback className="bg-[#1e7b4f] text-white">
                        {session?.user?.name ? (
                          getInitials(session?.user?.name)
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">
                      {getFirstAndLastName(session?.user?.name)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-medium">{capitalizeFullName(session?.user?.name)}</span>
                      {session?.user?.email && (
                        <span className="text-sm text-gray-500">
                          {session?.user?.email}
                        </span>
                      )}
                      {session?.user?.colaborador?.chapa && (
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Chapa:</span>{" "}
                          {session.user.colaborador.chapa}
                        </span>
                      )}
                      {session?.user?.colaborador?.cpf && (
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">CPF:</span>{" "}
                          {censurarCPF(session.user.colaborador.cpf)}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botão Sair Visível */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  sessionStorage.removeItem('hasVisitedHome');
                  sessionStorage.removeItem('isMobileDevice');
                  signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Sair</span>
              </Button>
            </div>
          </div>

          {/* Menu Mobile Toggle */}
          <Button
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile User Info */}
        <div className="md:hidden mt-4 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={session?.user?.image || null}
              alt={session?.user?.name || "Usuário"}
            />
            <AvatarFallback className="bg-[#1e7b4f] text-white">
              {session?.user?.name ? (
                getInitials(session?.user?.name)
              ) : (
                <User className="h-5 w-5" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-base font-medium text-[#1e7b4f]">
              {getFirstAndLastName(session?.user?.name)}
            </span>
            {session?.user?.email && (
              <span className="text-xs text-gray-500">
                {session?.user?.email}
              </span>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-[#1e7b4f] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Menu Mobile */}
          <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === "/" 
                    ? "bg-[#165c3c]" 
                    : "hover:bg-[#165c3c]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Início
              </Link>
              {!chefiaLoading && isChefe && (
                <Link
                  href="/user/agendar-folga"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === "/user/agendar-folga" 
                      ? "bg-[#165c3c]" 
                      : "hover:bg-[#165c3c]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Agendar Folga
                </Link>
              )}
              {!chefiaLoading && !isChefe && (
                <Link
                  href="/user/minhas-folgas"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === "/user/minhas-folgas" 
                      ? "bg-[#165c3c]" 
                      : "hover:bg-[#165c3c]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Minhas Folgas
                </Link>
              )}
              <button
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 text-red-200"
                onClick={() => {
                  setMobileMenuOpen(false);
                  sessionStorage.removeItem('hasVisitedHome');
                  sessionStorage.removeItem('isMobileDevice');
                  signOut();
                }}
              >
                <LogOut className="inline mr-2 h-4 w-4" />
                Sair
              </button>
            </div>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center h-14">
            <div className="flex items-center space-x-1">
              <Link
                href="/"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/" 
                    ? "bg-[#165c3c]" 
                    : "hover:bg-[#165c3c]"
                }`}
              >
                Início
              </Link>
              {!chefiaLoading && isChefe && (
                <Link
                  href="/user/agendar-folga"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/user/agendar-folga" 
                      ? "bg-[#165c3c]" 
                      : "hover:bg-[#165c3c]"
                  }`}
                >
                  Agendar Folga
                </Link>
              )}
              {!chefiaLoading && !isChefe && (
                <Link
                  href="/user/minhas-folgas"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/user/minhas-folgas" 
                      ? "bg-[#165c3c]" 
                      : "hover:bg-[#165c3c]"
                  }`}
                >
                  Minhas Folgas
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
