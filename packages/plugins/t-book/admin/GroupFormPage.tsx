"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import { tBookAdminApi, type AdminGroup } from "./t-book-api"
import { TBookField, TBookInput, TBookLoading, TBookPageHeader, TBookSelect } from "./t-book-admin-ui"
import { TBookWizard } from "./TBookWizard"
import { TBookRichTextField } from "./TBookRichTextField"

const STEPS = [
  { id: "basics", title: "Alapadatok" },
  { id: "description", title: "Leírás" },
]

type GroupDraft = {
  name: string
  description: string
  status: AdminGroup["status"]
}

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
  })

  useEffect(() => {
    if (!groupId) return
    tBookAdminApi<{ group: AdminGroup }>(`groups/${groupId}`)
      .then((res) => {
        setDraft({
          name: res.group.name,
          description: res.group.description,
          status: res.group.status,
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
            className="inline-flex h-10 items-center px-4 border border-white/10 rounded-lg text-white text-sm"
          >
            Mégse
          </Link>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
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
              <TBookField label="Csoport neve">
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
        </TBookWizard>
      </div>
    </div>
  )
}
