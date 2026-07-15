"use client"
/* eslint-disable react-hooks/set-state-in-effect -- admin panels fetch lists on mount */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { tBookAdminApi, TBOOK_STATUS_LABELS, type AdminGroup } from "./t-book-api"
import {
  tBookGhostButtonSmClass,
  tBookListRowClass,
  TBookLoading,
  TBookPageHeader,
  TBookPrimaryButton,
  TBookStatusBadge,
} from "./t-book-admin-ui"

function ApiKeyRevealDialog({
  apiKey,
  onClose,
}: {
  apiKey: string | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(apiKey)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>API kulcs</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-amber-800">
            Ez a kulcs csak most látható — mentsd el biztonságos helyre. A rendszer csak a
            hash-ét tárolja.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm break-all">
              {apiKey}
            </code>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => {
                if (apiKey) void navigator.clipboard.writeText(apiKey)
                toast.success("Kulcs vágólapra másolva")
              }}
            >
              Másolás
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function GroupsAdmin() {
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    tBookAdminApi<{ groups: AdminGroup[] }>("groups")
      .then((d) => setGroups(d.groups))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rotateKey = async (group: AdminGroup) => {
    if (
      !window.confirm(
        `Biztosan új API kulcsot generálsz ehhez: ${group.name}? A régi kulcs azonnal érvénytelen lesz.`
      )
    ) {
      return
    }
    try {
      const result = await tBookAdminApi<{ apiKey: string }>(`groups/${group.id}/rotate-key`, {
        method: "POST",
      })
      setRevealedKey(result.apiKey)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    }
  }

  const remove = async (group: AdminGroup) => {
    if (!window.confirm(`Biztosan törlöd: ${group.name}?`)) return
    try {
      await tBookAdminApi(`groups/${group.id}`, { method: "DELETE" })
      toast.success("Csoport törölve")
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <TBookPageHeader
        title="Eseménycsoportok"
        description="Csoportonként külön API-kulcs, közös szállások és események. A tBook listához a csoport beállításainál add meg a linket és képet."
        actions={
          <TBookPrimaryButton asChild>
            <Link href="/admin/plugins/t-book/groups/new">+ Új csoport</Link>
          </TBookPrimaryButton>
        }
      />

      {loading ? (
        <TBookLoading />
      ) : groups.length === 0 ? (
        <p className="text-neutral-500 text-sm">Még nincs eseménycsoport. Hozz létre egyet.</p>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li
              key={g.id}
              className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${tBookListRowClass}`}
            >
              <Link href={`/admin/plugins/t-book/groups/${g.id}`} className="min-w-0 flex-1 group">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {g.name}
                  </p>
                  <TBookStatusBadge status={g.status} labels={TBOOK_STATUS_LABELS} />
                </div>
                {g.description ? (
                  <p
                    className="text-sm text-neutral-500 mt-1 line-clamp-1"
                    dangerouslySetInnerHTML={{ __html: g.description }}
                  />
                ) : null}
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  API: {g.apiKeyHint}
                  {g.listOnTBookSite ? " · tBook listán" : ""}
                  {g.listingUrl ? ` · ${g.listingUrl}` : ""}
                </p>
              </Link>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href={`/admin/plugins/t-book/groups/${g.id}`}
                  className="inline-flex h-9 items-center px-3 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5"
                >
                  Megnyitás →
                </Link>
                <Link
                  href={`/admin/plugins/t-book/groups/${g.id}/edit`}
                  className={tBookGhostButtonSmClass}
                >
                  Beállítások
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() => void rotateKey(g)}
                >
                  Új API kulcs
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/10"
                  onClick={() => void remove(g)}
                >
                  Törlés
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ApiKeyRevealDialog apiKey={revealedKey} onClose={() => setRevealedKey(null)} />
    </div>
  )
}
