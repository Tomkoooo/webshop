import Link from "next/link"
import { auth, signOut } from "@wse/core/auth"
import { redirect } from "next/navigation"
import { resolveAdminAccess } from "@wse/core/lib/admin-access"
import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import { Button } from "@wse/core/components/ui/button"

export default async function NoAdminAccessPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/admin-login")
  }

  if (!isMultiTenantAdminEnabled()) {
    redirect("/admin")
  }

  const access = await resolveAdminAccess()
  if (access.allowed) {
    redirect("/admin")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Nincs admin hozzáférésed
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A bejelentkezett Google-fiókod ({session.user.email}) nincs hozzárendelve egyetlen
          tBook szervezethez sem. Kérd meg a szervezet adminját, hogy küldjön meghívót, vagy
          jelentkezz be egy másik fiókkal.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/auth/admin-login" })
            }}
          >
            <Button type="submit" variant="default">
              Másik fiók
            </Button>
          </form>
          <Button variant="outline" asChild>
            <Link href="/">Vissza a főoldalra</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
