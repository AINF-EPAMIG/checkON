import { AuthOptions, DefaultUser } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import {
  ColaboradorCompleto,
  getColaboradorPorCpfChapa,
  getColaboradorPorEmail,
} from "@/lib/data/colaboradores"

type AppUser = DefaultUser & {
  colaborador?: ColaboradorCompleto | null
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    CredentialsProvider({
      name: "Credenciais corporativas",
      credentials: {
        cpf: {
          label: "CPF",
          type: "text",
          placeholder: "Somente números",
        },
        chapa: {
          label: "Chapa",
          type: "text",
          placeholder: "Informe a chapa",
        },
      },
      async authorize(credentials) {
        const cpf = credentials?.cpf?.trim() ?? ""
        const chapa = credentials?.chapa?.trim() ?? ""

        if (!cpf || !chapa) {
          throw new Error("CREDENCIAIS_INVALIDAS")
        }

        const colaborador = await getColaboradorPorCpfChapa({ cpf, chapa })

        if (!colaborador) {
          throw new Error("CREDENCIAIS_INVALIDAS")
        }

        return {
          id: String(colaborador.id),
          name: colaborador.nome ?? colaborador.chapa ?? "Colaborador",
          email: colaborador.email ?? undefined,
          colaborador,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email ?? ""
        const colaborador = await getColaboradorPorEmail(email)

        if (!colaborador) {
          return "/login?error=COLABORADOR_NAO_ENCONTRADO"
        }

        ;(user as AppUser).colaborador = colaborador
      }

      return true
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.picture) {
          session.user.image = token.picture as string
        }

        session.user.colaborador =
          (token.colaborador as ColaboradorCompleto | null) ?? null
      }

      return session
    },
    async jwt({ token, user, account, profile }) {
      if (profile && "picture" in profile) {
        token.picture = profile.picture as string
      }

      if (user && "colaborador" in user) {
        token.colaborador = (user as AppUser).colaborador ?? null
      }

      if (!token.colaborador && account?.provider === "google" && user?.email) {
        const colaborador = await getColaboradorPorEmail(user.email)
        token.colaborador = colaborador ?? null
      }

      return token
    },
  },
}

