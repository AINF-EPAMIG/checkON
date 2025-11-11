import { DefaultSession } from "next-auth"

import { ColaboradorCompleto } from "@/lib/data/colaboradores"

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      colaborador?: ColaboradorCompleto | null
    }
  }

  interface User {
    colaborador?: ColaboradorCompleto | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    colaborador?: ColaboradorCompleto | null
    picture?: string
  }
}

