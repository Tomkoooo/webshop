"use client"

import { useCallback, useEffect, useState } from "react"
import { pressKitAdminApi, type PressContactDto } from "./press-api"
import {
  PressAdminInput,
  PressAdminLoading,
  PressAdminPageHeader,
  PressAdminPrimaryButton,
} from "./press-admin-ui"
import { Button } from "@wse/core/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"

export function PressContactsAdmin() {
  const [contacts, setContacts] = useState<PressContactDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [plainPassword, setPlainPassword] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", outlet: "", email: "", notes: "" })
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    pressKitAdminApi
      .listContacts()
      .then((res) => setContacts(res.contacts))
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate() {
    try {
      const res = await pressKitAdminApi.createContact(form)
      setPlainPassword(res.plainPassword)
      setCreateOpen(false)
      setForm({ name: "", outlet: "", email: "", notes: "" })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Létrehozás sikertelen")
    }
  }

  async function handleInvite(ids: string[]) {
    if (ids.length === 0) return
    setSending(true)
    setError(null)
    try {
      const res = await pressKitAdminApi.sendInvites(ids)
      if (res.failed.length > 0) {
        setError(`Nem sikerült: ${res.failed.join(", ")}`)
      }
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Küldés sikertelen")
    } finally {
      setSending(false)
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const origin = typeof window !== "undefined" ? window.location.origin : ""

  if (loading) return <PressAdminLoading />

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PressAdminPageHeader
        title="Sajtós"
        accent="kapcsolatok"
        description="Minden meghívó külön e-mailben megy — a címzettek nem látják egymást."
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-none border-white/10 h-11 uppercase text-[10px] font-black tracking-widest"
              onClick={() => setCreateOpen(true)}
            >
              Új kapcsolat
            </Button>
            <PressAdminPrimaryButton
              disabled={sending || selected.size === 0}
              onClick={() => handleInvite([...selected])}
            >
              {sending ? "Küldés…" : `Meghívó (${selected.size})`}
            </PressAdminPrimaryButton>
          </>
        }
      />

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
      {plainPassword ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Generált jelszó (másold el most): <strong>{plainPassword}</strong>
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => setPlainPassword(null)}>
            Bezár
          </Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-white/60 uppercase text-xs">
              <tr>
                <th className="p-3 w-10" />
                <th className="p-3">Név</th>
                <th className="p-3">Szerkesztőség</th>
                <th className="p-3">E-mail</th>
                <th className="p-3">Link</th>
                <th className="p-3">Meghívó</th>
                <th className="p-3">Utolsó belépés</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td className="p-3 text-white">{c.name}</td>
                  <td className="p-3 text-white/80">{c.outlet}</td>
                  <td className="p-3 text-white/80">{c.email}</td>
                  <td className="p-3">
                    <code className="text-xs text-white/60 break-all">
                      {origin}/sajto/{c.accessToken}
                    </code>
                  </td>
                  <td className="p-3 text-white/60">
                    {c.inviteSentAt ? new Date(c.inviteSentAt).toLocaleString("hu-HU") : "—"}
                  </td>
                  <td className="p-3 text-white/60">
                    {c.lastAccessAt ? new Date(c.lastAccessAt).toLocaleString("hu-HU") : "—"}
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const res = await pressKitAdminApi.updateContact(c.id, {
                          regeneratePassword: true,
                        })
                        if (res.plainPassword) setPlainPassword(res.plainPassword)
                      }}
                    >
                      Új jelszó
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Új sajtós kapcsolat</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <PressAdminInput
              placeholder="Név"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <PressAdminInput
              placeholder="Szerkesztőség / médium"
              value={form.outlet}
              onChange={(e) => setForm((f) => ({ ...f, outlet: e.target.value }))}
            />
            <PressAdminInput
              placeholder="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <PressAdminInput
              placeholder="Megjegyzés (belső)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>Létrehozás</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
