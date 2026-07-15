import { auth } from "@wse/core/auth"
import { redirect } from "next/navigation"
import { redirectTBookAfterAdminLogin } from "@wse/plugin-t-book/lib/post-login-redirect"

export default async function AdminAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/admin-login")
  }
  const params = await searchParams
  await redirectTBookAfterAdminLogin(params.callbackUrl ?? "/admin")
}
