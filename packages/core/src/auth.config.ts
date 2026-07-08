import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

type Role = "ADMIN" | "USER"

export const authConfig = {
  providers: [
    Google({
      /** Same email may exist from a prior manual/seed user row without a linked OAuth account. */
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub
        }
        session.user.role = (token.role as Role) || "USER"
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as Role
      }
      return token
    },
  },
} satisfies NextAuthConfig

