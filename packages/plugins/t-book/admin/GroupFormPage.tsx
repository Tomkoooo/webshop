"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { tBookAdminApi, type AdminGroup } from "./t-book-api"
import {
  TBookField,
  tBookFormShellClass,
  tBookGhostButtonClass,
  TBookInput,
  TBookLoading,
  TBookPageHeader,
  TBookSelect,
} from "./t-book-admin-ui"
import { TBookWizard } from "./TBookWizard"
import { TBookRichTextField } from "./TBookRichTextField"
import { TBookSingleMediaField } from "./TBookMediaField"

type GroupDraft = {
  name: string
  description: string
  status: AdminGroup["status"]
  listOnTBookSite: boolean
  listingTitle: string
  listingUrl: string
  listingImage: string
}

const STEPS = [
  { id: "basics", title: "Alapadatok" },
  { id: "description", title: "Leírás" },
  { id: "listing", title: "tBook megjelenés" },
]

export function GroupFormPage({ groupId }: { groupId?: string }) {
  const router = useRouter()
  const isEdit = Boolean(groupId)
  const [loading, setLoading] = useState(isEdit)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<GroupDraft>({
    name: "",
    description: "",
    status: "draft",
    listOnTBookSite: false,
    listingTitle: "",
    listingUrl: "",
    listingImage: "",
  })

  useEffect(() => {
    if (!groupId) return
    tBookAdminApi<{ group: AdminGroup }>(`groups/${groupId}`)
      .then((res) => {
        setDraft({
          name: res.group.name,
          description: res.group.description,
          status: res.group.status,
          listOnTBookSite: res.group.listOnTBookSite ?? false,
          listingTitle: res.group.listingTitle ?? "",
          listingUrl: res.group.listingUrl ?? "",
          listingImage: res.group.listingImage ?? "",
        })
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [groupId])

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("A csoport neve kötelező.")
      setStep(0)
      return
    }
    setSaving(true)
    const payload = {
      name: draft.name.trim(),
      description: draft.description,
      status: draft.status,
      defaultBookingOptions: [],
      defaultPriceBasis: "net" as const,
      defaultVatPercent: 27,
      listOnTBookSite: draft.listOnTBookSite,
      listingTitle: draft.listingTitle.trim(),
      listingUrl: draft.listingUrl.trim(),
      listingImage: draft.listingImage.trim(),
    }
    try {
      if (isEdit && groupId) {
        await tBookAdminApi(`groups/${groupId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        toast.success("Csoport mentve")
        router.push(`/admin/plugins/t-book/groups/${groupId}`)
      } else {
        const result = await tBookAdminApi<{ apiKey: string; id: string }>("groups", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        toast.success("Csoport létrehozva — add hozzá a szállásokat")
        if (result.apiKey) {
          sessionStorage.setItem(`tbook_api_key_${result.id}`, result.apiKey)
        }
        router.push(`/admin/plugins/t-book/groups/${result.id}/hotels`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hiba")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <TBookLoading />

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <TBookPageHeader
        title={isEdit ? "Csoport szerkesztése" : "Új eseménycsoport"}
        description="A szállásokat és szobatípusokat a csoport létrehozása után a Szállások fülön adod hozzá."
        actions={
          <Link
            href={isEdit && groupId ? `/admin/plugins/t-book/groups/${groupId}` : "/admin/plugins/t-book/groups"}
            className={tBookGhostButtonClass}
          >
            Mégse
          </Link>
        }
      />

      <div className={tBookFormShellClass}>
        <TBookWizard
          steps={STEPS}
          currentStep={step}
          onStepChange={setStep}
          onSubmit={() => void save()}
          submitting={saving}
          submitLabel={isEdit ? "Mentés" : "Létrehozás és szállások →"}
        >
          {step === 0 ? (
            <div className="space-y-4">
              <TBookField label="Csoport neve (belső admin név)">
                <TBookInput
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Nyári fesztiválok 2026"
                  autoFocus
                />
              </TBookField>
              <TBookField label="Státusz">
                <TBookSelect
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, status: e.target.value as GroupDraft["status"] }))
                  }
                >
                  <option value="draft">Vázlat</option>
                  <option value="active">Aktív</option>
                  <option value="archived">Archivált</option>
                </TBookSelect>
              </TBookField>
            </div>
          ) : null}
          {step === 1 ? (
            <TBookRichTextField
              label="Leírás (opcionális)"
              value={draft.description}
              onChange={(description) => setDraft((d) => ({ ...d, description }))}
            />
          ) : null}
          {step === 2 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ha bekapcsolod, az aktív eseményekkel rendelkező csoport megjelenhet a nyilvános
                tBook integrációs listán (kép, cím, link a foglaló oldalra).
              </p>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={draft.listOnTBookSite}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, listOnTBookSite: e.target.checked }))
                  }
                />
                Megjelenés a tBook nyilvános listáján
              </label>
              <TBookField label="Nyilvános megjelenő név (opcionális)">
                <TBookInput
                  value={draft.listingTitle}
                  onChange={(e) => setDraft((d) => ({ ...d, listingTitle: e.target.value }))}
                  placeholder={draft.name || "Pl. Sziget Fesztivál 2026"}
                />
              </TBookField>
              <TBookField label="Foglaló oldal linkje">
                <TBookInput
                  value={draft.listingUrl}
                  onChange={(e) => setDraft((d) => ({ ...d, listingUrl: e.target.value }))}
                  placeholder="https://pelda.hu/foglalas"
                />
              </TBookField>
              <TBookSingleMediaField
                label="Borítókép"
                value={draft.listingImage}
                onChange={(listingImage) => setDraft((d) => ({ ...d, listingImage }))}
              />
            </div>
          ) : null}
        </TBookWizard>
      </div>
    </div>
  )
}
