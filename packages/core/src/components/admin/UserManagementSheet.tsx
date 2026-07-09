"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"

import { Button } from "@wse/core/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@wse/core/components/ui/sheet"
import {
  sendAdminPasswordReset,
  updateAdminUserPassword,
  updateAdminUserProfile,
  deleteAdminUser,
} from "@wse/core/actions/admin-users"
import { AdminOrderStatusBadge } from "@wse/core/components/admin/AdminOrderStatusBadge"
import { adminFieldHint, adminFieldLabel, adminInputClass } from "@wse/core/lib/admin-ui"
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { formatHuf, totalsBreakdownFromGross } from "@wse/core/lib/pricing"
import { cn } from "@wse/core/lib/utils"

type RecentOrder = {
  _id: string
  total: number
  status: string
  createdAt: string | Date
}

type UserManagementSheetProps = {
  user: {
    _id: string
    name?: string
    email?: string
    role?: "ADMIN" | "USER"
  }
  recentOrders: RecentOrder[]
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function UserManagementSheet({ user, recentOrders }: UserManagementSheetProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [profileError, setProfileError] = React.useState<string | null>(null)
  const [profileMessage, setProfileMessage] = React.useState<string | null>(null)
  const [profilePending, setProfilePending] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null)
  const [passwordPending, setPasswordPending] = React.useState(false)
  const [resetError, setResetError] = React.useState<string | null>(null)
  const [resetMessage, setResetMessage] = React.useState<string | null>(null)
  const [resetPending, setResetPending] = React.useState(false)
  const [deletePending, setDeletePending] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setProfileError(null)
      setProfileMessage(null)
      setPasswordError(null)
      setPasswordMessage(null)
      setResetError(null)
      setResetMessage(null)
      setDeleteError(null)
    }
  }, [open])

  async function handleProfileSubmit(formData: FormData) {
    setProfileMessage(null)
    setProfileError(null)

    const name = String(formData.get("name") || "").trim()
    const email = String(formData.get("email") || "").trim()

    if (!email) {
      setProfileError("Az email mező nem lehet üres.")
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      setProfileError("Adj meg egy érvényes email címet.")
      return
    }
    if (!name) {
      setProfileError("A név mező nem lehet üres.")
      return
    }

    setProfilePending(true)
    try {
      await updateAdminUserProfile(user._id, formData)
      setProfileMessage("A fiók adatai mentve.")
      router.refresh()
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Nem sikerült menteni a profilt.")
    } finally {
      setProfilePending(false)
    }
  }

  async function handlePasswordSubmit(formData: FormData) {
    setPasswordMessage(null)
    setPasswordError(null)

    const password = String(formData.get("password") || "")

    if (!password.trim()) {
      setPasswordError("A jelszó nem lehet üres.")
      return
    }
    if (password.length < 8) {
      setPasswordError("A jelszónak legalább 8 karakter hosszúnak kell lennie.")
      return
    }

    const target = user.email || user.name || "felhasználó"
    if (!window.confirm(`Biztosan beállítasz egy új jelszót a(z) ${target} fiókhoz? A felhasználónak el kell mondani az új jelszót.`)) {
      return
    }

    setPasswordPending(true)
    try {
      await updateAdminUserPassword(user._id, formData)
      setPasswordMessage("Az új jelszó mentve.")
      router.refresh()
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Nem sikerült menteni a jelszót.")
    } finally {
      setPasswordPending(false)
    }
  }

  async function handlePasswordReset() {
    setResetMessage(null)
    setResetError(null)

    if (!user.email) {
      setResetError("A felhasználóhoz nincs email cím rögzítve.")
      return
    }
    if (!window.confirm(`Biztosan elküldjük a jelszó visszaállító linket a(z) ${user.email} címre? Ez lehetővé teszi a felhasználónak az új jelszó beállítását.`)) {
      return
    }

    setResetPending(true)
    try {
      await sendAdminPasswordReset(user._id)
      setResetMessage("A reset email kiküldve.")
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Nem sikerült elküldeni a reset emailt.")
    } finally {
      setResetPending(false)
    }
  }

  async function handleDeleteUser() {
    setDeleteError(null)
    const target = user.email || user.name || "felhasználó"
    if (
      !window.confirm(
        `Biztosan törlöd a(z) ${target} fiókot? A Google bejelentkezéshez tartozó kapcsolat is törlődik.`
      )
    ) {
      return
    }
    setDeletePending(true)
    try {
      await deleteAdminUser(user._id)
      setOpen(false)
      router.refresh()
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Törlés sikertelen.")
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          title="Részletek"
        >
          <Eye className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border/60 p-6">
          <SheetTitle>{user.name || "Névtelen felhasználó"}</SheetTitle>
          <p className="text-sm text-muted-foreground">{user.email || "Nincs email"}</p>
        </SheetHeader>
        <div className="space-y-8 p-6">
          <form action={handleProfileSubmit} className="space-y-4" noValidate>
            <h3 className={adminFieldLabel}>Fiók adatok</h3>
            <div className="space-y-1.5">
              <label htmlFor="user-name" className={adminFieldLabel}>
                Név
              </label>
              <input
                id="user-name"
                name="name"
                defaultValue={user.name || ""}
                placeholder="Név"
                required
                minLength={1}
                className={cn(adminInputClass, "h-10")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="user-email" className={adminFieldLabel}>
                Email
              </label>
              <input
                id="user-email"
                name="email"
                type="email"
                defaultValue={user.email || ""}
                placeholder="Email"
                required
                className={cn(adminInputClass, "h-10")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="user-role" className={adminFieldLabel}>
                Szerepkör
              </label>
              <select
                id="user-role"
                name="role"
                defaultValue={user.role || "USER"}
                className={cn(adminInputClass, "h-10")}
              >
                <option value="USER">Felhasználó</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
            {profileMessage ? <p className="text-sm text-emerald-700">{profileMessage}</p> : null}
            <Button type="submit" disabled={profilePending} className="w-full">
              {profilePending ? "Mentés..." : "Mentés"}
            </Button>
          </form>

          <div className="space-y-4">
            <h3 className={adminFieldLabel}>Jelszó kezelése</h3>
            <div className="grid grid-cols-1 gap-3">
              <form action={handlePasswordSubmit} className="space-y-3" noValidate>
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Új jelszó (min. 8 karakter)"
                  className={cn(adminInputClass, "h-10")}
                />
                {passwordError ? <p className="text-sm text-destructive">{passwordError}</p> : null}
                {passwordMessage ? <p className="text-sm text-emerald-700">{passwordMessage}</p> : null}
                <Button type="submit" variant="outline" disabled={passwordPending} className="w-full">
                  {passwordPending ? "Mentés..." : "Új jelszó beállítása"}
                </Button>
              </form>

              <div className="space-y-2 border-t border-border/60 pt-4">
                <p className={adminFieldHint}>
                  Önkiszolgáló reset link küldése — a felhasználó maga állítja be az új jelszót.
                </p>
                {resetError ? <p className="text-sm text-destructive">{resetError}</p> : null}
                {resetMessage ? <p className="text-sm text-emerald-700">{resetMessage}</p> : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePasswordReset}
                  disabled={resetPending || !user.email}
                  className="w-full"
                >
                  {resetPending ? "Küldés..." : "Reset email küldése"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className={adminFieldLabel}>Rendelések</h3>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nincs rendelése.</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between rounded-lg bg-muted/40 p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{formatOrderNumberLabel(order._id)}</p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(order.createdAt).toLocaleDateString("hu-HU")}</span>
                        <AdminOrderStatusBadge status={order.status} className="text-xs" />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{formatHuf(order.total)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Nettó {formatHuf(totalsBreakdownFromGross(order.total).net)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href={`/admin/users/${user._id}`}
              className="inline-flex text-sm text-muted-foreground hover:text-foreground"
            >
              Teljes adatlap megnyitása
            </Link>
          </div>

          <div className="space-y-4 border-t border-border/60 pt-6">
            <h3 className="text-sm font-medium text-destructive">Veszélyes zóna</h3>
            {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending}
              onClick={handleDeleteUser}
              className="w-full"
            >
              {deletePending ? "Törlés…" : "Felhasználó törlése"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
