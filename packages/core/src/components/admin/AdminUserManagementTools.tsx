"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import { createAdminUser, syncAuthUserProfiles } from "@wse/core/actions/admin-users"

export function AdminCreateUserForm() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] bg-muted/40 p-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setPending(true)
        const formData = new FormData(event.currentTarget)
        try {
          await createAdminUser(formData)
          toast.success("Felhasználó mentve.")
          event.currentTarget.reset()
          router.refresh()
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Mentés sikertelen.")
        } finally {
          setPending(false)
        }
      }}
    >
      <input
        name="name"
        placeholder="Név (opcionális)"
        className="h-11 bg-background border border-border px-3 text-sm text-foreground rounded-md"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email *"
        className="h-11 bg-background border border-border px-3 text-sm text-foreground rounded-md"
      />
      <select
        name="role"
        defaultValue="ADMIN"
        className="h-11 bg-background border border-border px-3 text-sm text-foreground rounded-md uppercase"
      >
        <option value="ADMIN">ADMIN</option>
        <option value="USER">USER</option>
      </select>
      <Button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-primary hover:bg-primary/80 text-primary-foreground text-xs font-medium text-muted-foreground"
      >
        {pending ? "Mentés…" : "Hozzáadás"}
      </Button>
      <p className="md:col-span-4 text-xs text-muted-foreground">
        Google bejelentkezésnél ugyanazzal az email címmel a fiók automatikusan összekapcsolódik. Ha csak
        az <code className="text-muted-foreground">accounts</code> gyűjteményben szerepel a felhasználó, kattints
        a „Profil szinkron” gombra, vagy kérd meg, hogy jelentkezzen be újra.
      </p>
    </form>
  )
}

export function AdminSyncAuthProfilesButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        try {
          const result = await syncAuthUserProfiles()
          toast.success(
            `Szinkron kész: ${result.profilesEnsured} profil frissítve, ${result.orphanedAccountsRemoved} árva OAuth kapcsolat törölve.`
          )
          router.refresh()
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Szinkron sikertelen.")
        } finally {
          setPending(false)
        }
      }}
      className="h-11 rounded-md border-border text-foreground text-xs font-medium text-muted-foreground"
    >
      {pending ? "Szinkron…" : "Profil szinkron"}
    </Button>
  )
}
