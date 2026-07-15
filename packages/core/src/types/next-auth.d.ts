import { DefaultSession } from "next-auth"

// Define Role type since Prisma is removed
type Role = "USER" | "ADMIN"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      role: Role
      isSystemAdmin?: boolean
      organizationIds?: string[]
      activeOrganizationId?: string
    } & DefaultSession["user"]
  }
 
  interface User {
    id?: string
    role: Role
    isSystemAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    sub?: string
    role?: Role
    isSystemAdmin?: boolean
  }
}


declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: "USER" | "ADMIN"
  }
}

