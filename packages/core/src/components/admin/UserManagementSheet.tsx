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
import { formatOrderNumberLabel } from "@wse/core/lib/order-number"
import { formatHuf, totalsBreakdownFromGross } from "@wse/core/lib/pricing"

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
          className="rounded-none text-neutral-400 hover:text-white hover:bg-white/5"
          title="Részletek"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="border-b border-white/10 p-8">
          <SheetTitle>{user.name || "Névtelen felhasználó"}</SheetTitle>
          <p className="text-sm text-neutral-500 font-bold">{user.email || "Nincs email"}</p>
        </SheetHeader>
        <div className="p-8 space-y-8">
          <form action={handleProfileSubmit} className="space-y-4" noValidate>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] admin-text-accent">Fiók adatok</h3>
            <input
              name="name"
              defaultValue={user.name || ""}
              placeholder="Név"
              required
              minLength={1}
              className="w-full h-12 bg-black border border-white/10 px-4 text-sm text-white rounded-none"
            />
            <input
              name="email"
              type="email"
              defaultValue={user.email || ""}
              placeholder="Email"
              required
              className="w-full h-12 bg-black border border-white/10 px-4 text-sm text-white rounded-none"
            />
            <select
              name="role"
              defaultValue={user.role || "USER"}
              className="w-full h-12 bg-black border border-white/10 px-4 text-sm text-white rounded-none uppercase"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            {profileError && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400">{profileError}</p>
            )}
            {profileMessage && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">{profileMessage}</p>
            )}
            <Button
              type="submit"
              disabled={profilePending}
              className="w-full h-12 rounded-none bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
            >
              {profilePending ? "Mentés..." : "Mentés"}
            </Button>
          </form>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] admin-text-accent">Jelszó kezelése</h3>
            <div className="grid grid-cols-1 gap-3">
              <form action={handlePasswordSubmit} className="space-y-3" noValidate>
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Új jelszó (min. 8 karakter)"
                  className="w-full h-12 bg-black border border-white/10 px-4 text-sm text-white rounded-none"
                />
                {passwordError && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400">{passwordError}</p>
                )}
                {passwordMessage && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">{passwordMessage}</p>
                )}
                <Button
                  type="submit"
                  disabled={passwordPending}
                  className="w-full h-12 rounded-none border border-white/15 bg-transparent hover:bg-white/5 text-white font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {passwordPending ? "Mentés..." : "Új jelszó beállítása"}
                </Button>
              </form>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Önkiszolgáló reset link küldése — a felhasználó maga állítja be az új jelszót.
                </p>
                {resetError && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400">{resetError}</p>
                )}
                {resetMessage && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">{resetMessage}</p>
                )}
                <Button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={resetPending || !user.email}
                  className="w-full h-12 rounded-none admin-action-outline font-black uppercase tracking-widest text-[10px] disabled:opacity-50"
                >
                  {resetPending ? "Küldés..." : "Reset email küldése"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] admin-text-accent">Rendelések</h3>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-neutral-500 italic">Nincs rendelése.</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center justify-between border border-white/10 bg-white/5 p-3 hover:border-white/30 transition-colors"
                  >
                    <div>
                      <p className="text-white font-black uppercase tracking-widest text-sm">{formatOrderNumberLabel(order._id)}</p>
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                        {new Date(order.createdAt).toLocaleDateString("hu-HU")} · {order.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="admin-value font-black">{formatHuf(order.total)}</p>
                      <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">
                        Nettó {formatHuf(totalsBreakdownFromGross(order.total).net)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              href={`/admin/users/${user._id}`}
              className="inline-flex text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
            >
              Teljes adatlap megnyitása
            </Link>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-400">Veszélyes zóna</h3>
            {deleteError ? (
              <p className="text-[11px] font-bold uppercase tracking-widest text-rose-400">{deleteError}</p>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending}
              onClick={handleDeleteUser}
              className="w-full h-12 rounded-none font-black uppercase tracking-widest text-[10px]"
            >
              {deletePending ? "Törlés…" : "Felhasználó törlése"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
