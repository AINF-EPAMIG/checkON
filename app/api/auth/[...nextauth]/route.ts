import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Arrays para armazenar emails de administradores e chefes
const adminEmails = [
  "arthur.souza@epamig.br",
  "rodolfo.fernandes@epamig.br",
  "andrezza.fernandes@epamig.br",
];
const chiefEmails = ["andrezza.fernandes@epamig.br"];

// Função para determinar o papel do usuário
function getUserRole(email: string) {
  if (adminEmails.includes(email)) {
    return "Administrador";
  } else if (chiefEmails.includes(email)) {
    return "Chefia";
  }
  return "Usuário";
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.role = getUserRole(user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as
          | "Administrador"
          | "Chefia"
          | "Usuário";
      }
      return session;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/validar`;
    },
  },
  pages: {
    signIn: "/",
  },
});

export { handler as GET, handler as POST };
