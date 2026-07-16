"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminDataTable } from "@wse/core/components/admin/AdminDataTable"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@wse/core/components/ui/select"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { TBOOK_PERMISSION_LABELS, permissionGroups, type TBookPermission } from "../lib/permissions"
import { tbookOrgApi } from "./org-api"

type MemberRow = {
  id: string
  userId: string
  status: string
  user: { name?: string; email?: string } | null
  roles: Array<{ id: string; name: string }>
}

type RoleRow = {
  id: string
  name: string
  description: string
  permissions: string[]
  isBuiltIn: boolean
}

export function TBookOrgMembersScreen() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [membersRes, rolesRes] = await Promise.all([tbookOrgApi.members(), tbookOrgApi.roles()])
      setMembers(membersRes.members)
      setRoles(rolesRes.roles)
      const viewer = rolesRes.roles.find((r) => r.name === "Viewer")
      const defaultRoleId = viewer?.id ?? rolesRes.roles[0]?.id ?? ""
      setRoleId((current) => current || defaultRoleId)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function inviteOrAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await tbookOrgApi.createInvite({ email, roleIds: roleId ? [roleId] : [] })
      setEmail("")
      await load()
    } catch {
      try {
        await tbookOrgApi.addMember({ email, roleIds: roleId ? [roleId] : [] })
        setEmail("")
        await load()
      } catch (inner) {
        setError(inner instanceof Error ? inner.message : "Hiba")
      }
    }
  }

  async function changeMemberRole(membershipId: string, nextRoleId: string) {
    setBusyId(membershipId)
    setError(null)
    try {
      await tbookOrgApi.updateMember(membershipId, { roleIds: [nextRoleId] })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setBusyId(null)
    }
  }

  async function removeMember(membershipId: string) {
    if (!window.confirm("Biztosan eltávolítod ezt a tagot a szervezetből?")) return
    setBusyId(membershipId)
    setError(null)
    try {
      await tbookOrgApi.removeMember(membershipId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <AdminPageScaffold
      title="Szervezet tagjai"
      description="Meghívás e-mailben, szerepkör módosítás vagy tag eltávolítása."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/org/roles">Szerepkörök</Link>
        </Button>
      }
    >
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <form onSubmit={(e) => void inviteOrAdd(e)} className="grid max-w-lg gap-3">
        <div className="grid gap-2">
          <Label htmlFor="member-email">E-mail</Label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>Szerepkör</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger>
              <SelectValue placeholder="Válassz szerepkört" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Meghívás / hozzáadás</Button>
      </form>

      <AdminDataTable
        columns={[
          {
            id: "user",
            header: "Felhasználó",
            cell: (row) => row.user?.name || row.user?.email || row.userId,
          },
          { id: "email", header: "E-mail", cell: (row) => row.user?.email ?? "—" },
          {
            id: "roles",
            header: "Szerepkör",
            cell: (row) => {
              const current = row.roles[0]?.id ?? ""
              return (
                <Select
                  value={current}
                  disabled={busyId === row.id || roles.length === 0}
                  onValueChange={(value) => void changeMemberRole(row.id, value)}
                >
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue placeholder="Szerepkör" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            },
          },
          { id: "status", header: "Státusz", cell: (row) => row.status },
          {
            id: "actions",
            header: "",
            cell: (row) => (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                disabled={busyId === row.id}
                onClick={() => void removeMember(row.id)}
              >
                Eltávolítás
              </Button>
            ),
          },
        ]}
        rows={members}
        getRowKey={(row) => row.id}
        emptyMessage="Még nincs tag."
      />
    </AdminPageScaffold>
  )
}

export function TBookOrgRolesScreen() {
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  async function load() {
    setLoading(true)
    try {
      const res = await tbookOrgApi.roles()
      setRoles(res.roles)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function togglePerm(perm: string) {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  function startCreate() {
    setEditingId(null)
    setName("")
    setDescription("")
    setSelectedPerms([])
    setOk(null)
    setError(null)
  }

  function startEdit(role: RoleRow) {
    setEditingId(role.id)
    setName(role.name)
    setDescription(role.description || "")
    setSelectedPerms([...role.permissions])
    setOk(null)
    setError(null)
  }

  async function saveRole(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      if (editingId) {
        const role = roles.find((r) => r.id === editingId)
        await tbookOrgApi.updateRole(editingId, {
          name: role?.isBuiltIn ? undefined : name,
          description,
          permissions: selectedPerms,
        })
        setOk("Szerepkör frissítve.")
      } else {
        await tbookOrgApi.createRole({ name, description, permissions: selectedPerms })
        setOk("Szerepkör létrehozva.")
        startCreate()
      }
      await load()
      if (editingId) {
        const refreshed = (await tbookOrgApi.roles()).roles.find((r) => r.id === editingId)
        if (refreshed) startEdit(refreshed)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  async function deleteRole(role: RoleRow) {
    if (role.isBuiltIn) {
      setError("Beépített szerepkör nem törölhető.")
      return
    }
    if (!window.confirm(`Törlöd a(z) „${role.name}” szerepkört?`)) return
    setError(null)
    setOk(null)
    try {
      await tbookOrgApi.deleteRole(role.id)
      if (editingId === role.id) startCreate()
      setOk("Szerepkör törölve.")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  const editingRole = editingId ? roles.find((r) => r.id === editingId) : null

  return (
    <AdminPageScaffold
      title="Szerepkörök"
      description="Szerepkörök létrehozása, jogosultságok szerkesztése és törlése."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" type="button" onClick={startCreate}>
            Új szerepkör
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/org/members">Tagok</Link>
          </Button>
        </div>
      }
    >
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}

      <AdminDataTable
        columns={[
          { id: "name", header: "Név", cell: (row) => row.name },
          {
            id: "perms",
            header: "Jogosultságok",
            cell: (row) => `${row.permissions.length} db`,
          },
          {
            id: "builtIn",
            header: "Típus",
            cell: (row) => (row.isBuiltIn ? "Beépített" : "Egyedi"),
          },
          {
            id: "actions",
            header: "",
            cell: (row) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant={editingId === row.id ? "default" : "outline"}
                  size="sm"
                  type="button"
                  onClick={() => startEdit(row)}
                >
                  Szerkesztés
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  disabled={row.isBuiltIn}
                  onClick={() => void deleteRole(row)}
                >
                  Törlés
                </Button>
              </div>
            ),
          },
        ]}
        rows={roles}
        getRowKey={(row) => row.id}
      />

      <form onSubmit={(e) => void saveRole(e)} className="grid max-w-3xl gap-4">
        <h3 className="text-lg font-semibold">
          {editingId
            ? `Szerkesztés: ${editingRole?.name ?? ""}`
            : "Új szerepkör létrehozása"}
        </h3>
        <div className="grid gap-2">
          <Label htmlFor="role-name">Név</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={!editingRole?.isBuiltIn}
            disabled={Boolean(editingRole?.isBuiltIn)}
          />
          {editingRole?.isBuiltIn ? (
            <p className="text-muted-foreground text-xs">
              Beépített szerepkör neve nem módosítható; a jogosultságok igen.
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role-desc">Leírás</Label>
          <Input
            id="role-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {permissionGroups().map((group) => (
          <div key={group.label} className="grid gap-2">
            <p className="text-sm font-medium">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.permissions.map((perm) => (
                <Button
                  key={perm}
                  type="button"
                  size="sm"
                  variant={selectedPerms.includes(perm) ? "default" : "outline"}
                  onClick={() => togglePerm(perm)}
                  title={TBOOK_PERMISSION_LABELS[perm as TBookPermission]}
                >
                  {TBOOK_PERMISSION_LABELS[perm as TBookPermission] || perm}
                </Button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Mentés…" : editingId ? "Változtatások mentése" : "Szerepkör létrehozása"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={startCreate}>
              Mégse
            </Button>
          ) : null}
        </div>
      </form>
    </AdminPageScaffold>
  )
}

export { TBookOrgSettingsScreen } from "./TBookOrgSettingsScreen"
