import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@wse/core/lib/mongodb"
import { authConfig } from "./auth.config"
import { maybeBootstrapAdmin } from "@wse/core/lib/bootstrap-admin"
import { ensureUserProfile } from "@wse/core/lib/ensure-user-profile"
import { OrderGuestAccessService } from "@wse/core/services/order-guest-access"

const trustHost = process.env.AUTH_TRUST_HOST
  ? process.env.AUTH_TRUST_HOST === "true"
  : process.env.NODE_ENV !== "production"

function safeOrigin(value?: string) {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function safeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return undefined
  }

  const candidate = metadata as Record<string, unknown>
  return {
    provider: typeof candidate.provider === "string" ? candidate.provider : undefined,
    message: typeof candidate.message === "string" ? candidate.message : undefined,
    name: typeof candidate.name === "string" ? candidate.name : undefined,
    type: typeof candidate.type === "string" ? candidate.type : undefined,
    callbackUrlOrigin: safeOrigin(
      typeof candidate.callbackUrl === "string" ? candidate.callbackUrl : undefined
    ),
  }
}

function formatAuthCause(cause: unknown) {
  if (cause instanceof Error) {
    return {
      message: cause.message,
      name: cause.name,
      stack: cause.stack,
    }
  }
  return cause
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  trustHost,
  ...authConfig,
  logger: {
    error(error) {
      const authError = error as Error & {
        type?: string
        code?: string
        cause?: unknown
      }
      const errorCode = authError.type || authError.code || authError.name
      const metadata = safeMetadata(authError.cause)

      if (errorCode === "InvalidCheck") {
        console.error("[auth][diagnostic] InvalidCheck during OAuth check", {
          code: errorCode,
          trustHost,
          authUrlOrigin: safeOrigin(process.env.AUTH_URL),
          nextauthUrlOrigin: safeOrigin(process.env.NEXTAUTH_URL),
          ...metadata,
        })
        return
      }

      console.error("[auth][error]", errorCode, metadata, {
        cause: formatAuthCause(authError.cause),
        authUrlOrigin: safeOrigin(process.env.AUTH_URL),
        nextauthUrlOrigin: safeOrigin(process.env.NEXTAUTH_URL),
        trustHost,
      })
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await ensureUserProfile({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        })
      } catch (error) {
        console.error("[auth] ensure user profile on createUser failed", error)
      }
    },
    async signIn({ user }) {
      const userId = user.id?.trim()
      const email = user.email?.trim()
      try {
        await ensureUserProfile({
          id: userId,
          email,
          name: user.name,
          image: user.image,
        })
      } catch (error) {
        console.error("[auth] ensure user profile on signIn failed", error)
      }
      if (!userId || !email) return
      try {
        await OrderGuestAccessService.linkGuestOrdersToUser(userId, email)
      } catch (error) {
        console.error("[auth] link guest orders failed", error)
      }
      try {
        await maybeBootstrapAdmin(email)
      } catch (error) {
        console.error("[auth] bootstrap admin on signIn failed", error)
      }
      if (userId && email) {
        try {
          const { isMultiTenantAdminEnabled } = await import("@wse/core/lib/site-features")
          if (isMultiTenantAdminEnabled()) {
            const { TBookOrgService } = await import("@wse/plugin-t-book/services/org-service")
            await TBookOrgService.processPendingInvitesForEmail(email, userId)
          }
        } catch (error) {
          console.error("[auth] process org invites failed", error)
        }
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: "ADMIN" | "USER" }).role ?? "USER"
      }

      const lookupEmail =
        typeof token.email === "string" ? token.email.trim().toLowerCase() : ""
      if (lookupEmail) {
        try {
          const client = await clientPromise
          const dbUser = await client.db().collection("users").findOne({ email: lookupEmail })
          if (dbUser?.role) {
            token.role = dbUser.role as "ADMIN" | "USER"
          }
        } catch (error) {
          console.error("[auth] Failed to sync role into JWT:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      // Fetch the latest user data from the database to ensure the role is up to date
      // even if the JWT token is old.
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub
        }

        session.user.role = (token.role as "ADMIN" | "USER") || "USER"

        const lookupEmail = typeof token.email === "string" ? token.email : session.user.email

        if (!lookupEmail) {
          return session
        }

        try {
          const client = await clientPromise;
          const db = client.db();
          const dbUser = await db.collection("users").findOne({ email: lookupEmail });
          
          if (dbUser) {
            if (dbUser._id) {
              session.user.id = String(dbUser._id)
            }
            if (dbUser.role) {
              session.user.role = dbUser.role as "ADMIN" | "USER"
            }
            session.user.isSystemAdmin = dbUser.isSystemAdmin === true

            try {
              const { isMultiTenantAdminEnabled } = await import("@wse/core/lib/site-features")
              if (isMultiTenantAdminEnabled() && session.user.id) {
                const { listUserOrganizationIds } = await import("@wse/plugin-t-book/lib/org-auth")
                const { getActiveOrganizationIdFromCookie } = await import(
                  "@wse/plugin-t-book/lib/org-cookie"
                )
                session.user.organizationIds = await listUserOrganizationIds(session.user.id)
                session.user.activeOrganizationId =
                  (await getActiveOrganizationIdFromCookie()) ?? undefined
              }
            } catch (error) {
              console.error("[auth] Failed to load org session fields:", error)
            }
          }
        } catch (error) {
          console.error("Error fetching user role from DB:", error);
        }
      }
      return session;
    },
  },
})



