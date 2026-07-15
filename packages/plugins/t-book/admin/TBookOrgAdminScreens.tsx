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
import { permissionGroups } from "../lib/permissions"
import { tbookOrgApi } from "./org-api"
import { CurrencySelect } from "./CurrencySelect"

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
    try {
      await tbookOrgApi.createInvite({ email, roleIds: roleId ? [roleId] : [] })
      setEmail("")
      await load()
    } catch (err) {
      try {
        await tbookOrgApi.addMember({ email, roleIds: roleId ? [roleId] : [] })
        setEmail("")
        await load()
      } catch (inner) {
        setError(inner instanceof Error ? inner.message : "Hiba")
      }
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
      description="Meghívás e-mailben vagy meglévő felhasználó hozzáadása."
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
            header: "Szerepkörök",
            cell: (row) => row.roles.map((r) => r.name).join(", ") || "—",
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
                onClick={() =>
                  void tbookOrgApi.removeMember(row.id).then(() => load())
                }
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
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
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

  async function createRole(e: React.FormEvent) {
    e.preventDefault()
    try {
      await tbookOrgApi.createRole({ name, permissions: selectedPerms })
      setName("")
      setSelectedPerms([])
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

  return (
    <AdminPageScaffold
      title="Szerepkörök"
      description="Egyedi szerepkörök jogosultságokkal."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/org/members">Tagok</Link>
        </Button>
      }
    >
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

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
        ]}
        rows={roles}
        getRowKey={(row) => row.id}
      />

      <form onSubmit={(e) => void createRole(e)} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="role-name">Új szerepkör neve</Label>
          <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} required />
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
                >
                  {perm}
                </Button>
              ))}
            </div>
          </div>
        ))}
        <Button type="submit">Szerepkör létrehozása</Button>
      </form>
    </AdminPageScaffold>
  )
}

export function TBookOrgSettingsScreen() {
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState("HUF")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void tbookOrgApi
      .settings()
      .then((res) => {
        setName(res.organization.name)
        setCurrency(res.organization.settings.currency || "HUF")
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    try {
      await tbookOrgApi.updateSettings({ name, currency })
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

  return (
    <AdminPageScaffold title="Szervezet beállítások" description="Név és alapértelmezett pénznem.">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="grid max-w-lg gap-4">
        <div className="grid gap-2">
          <Label htmlFor="org-name">Név</Label>
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currency">Alapértelmezett pénznem (új eseményekhez és szállásokhoz)</Label>
          <CurrencySelect id="currency" value={currency} onValueChange={setCurrency} />
        </div>
        <Button type="button" onClick={() => void save()}>
          Mentés
        </Button>
      </div>
    </AdminPageScaffold>
  )
}
