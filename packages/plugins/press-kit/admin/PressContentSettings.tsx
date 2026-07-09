"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { pressKitAdminApi, type PressKitSettingsDto } from "./press-api"
import { PressPdfUploadField } from "./PressPdfUploadField"
import {
  PressAdminField,
  PressAdminInput,
  PressAdminLoading,
  PressAdminPageHeader,
  PressAdminPanel,
  PressAdminPrimaryButton,
  pressAdminSelectClass,
} from "./press-admin-ui"
import { Button } from "@wse/core/components/ui/button"

export function PressContentSettings() {
  const [settings, setSettings] = useState<PressKitSettingsDto | null>(null)
  const [sharedPassword, setSharedPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    pressKitAdminApi
      .getSettings()
      .then((res) => setSettings(res.settings))
      .catch((e) => setError(e instanceof Error ? e.message : "Hiba"))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const body: Record<string, unknown> = {
        accessMode: settings.accessMode,
        pdfMediaFilename: settings.pdfMediaFilename,
        pdfSettings: settings.pdfSettings,
      }
      if (sharedPassword.trim()) body.sharedPassword = sharedPassword.trim()
      const res = await pressKitAdminApi.updateSettings(body)
      setSettings(res.settings)
      setSharedPassword("")
      setMessage("Beállítások mentve.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mentés sikertelen")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PressAdminLoading />
  if (!settings) return <p className="text-destructive">{error}</p>

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500">
      <PressAdminPageHeader
        title="Oldal"
        accent="beállítások"
        description="Belépési mód, PDF védelem és vízjel — a tartalmat a vizuális szerkesztőben módosíthatod."
        backHref="/admin/plugins/press-kit/content"
        backLabel="← Vizuális szerkesztő"
        actions={
          <Button asChild variant="outline" className="rounded-md">
            <Link href="/admin/plugins/press-kit/content">Vizuális szerkesztő</Link>
          </Button>
        }
      />

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {message ? <p className="text-emerald-800 text-sm">{message}</p> : null}

      <PressAdminPanel title="Belépés">
        <PressAdminField label="Hozzáférési mód">
          <select
            className={pressAdminSelectClass}
            value={settings.accessMode}
            onChange={(e) =>
              setSettings((s) =>
                s ? { ...s, accessMode: e.target.value as PressKitSettingsDto["accessMode"] } : s
              )
            }
          >
            <option value="unique_link">Egyedi link kapcsolatonként</option>
            <option value="password_per_contact">Egyedi jelszó kapcsolatonként</option>
            <option value="shared_password">Közös jelszó + e-mail azonosítás</option>
          </select>
        </PressAdminField>
        {settings.accessMode === "shared_password" ? (
          <PressAdminField label="Közös jelszó">
            <PressAdminInput
              type="password"
              placeholder={
                settings.hasSharedPassword
                  ? "Új jelszó (üresen hagyva nem változik)"
                  : "Közös jelszó beállítása"
              }
              value={sharedPassword}
              onChange={(e) => setSharedPassword(e.target.value)}
            />
          </PressAdminField>
        ) : null}
      </PressAdminPanel>

      <PressAdminPanel title="Képregény PDF">
        <PressPdfUploadField
          value={settings.pdfMediaFilename}
          onChange={(v) => setSettings((s) => (s ? { ...s, pdfMediaFilename: v } : s))}
        />
        <label className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            className="accent-primary"
            checked={settings.pdfSettings.allowDownload}
            onChange={(e) =>
              setSettings((s) =>
                s
                  ? { ...s, pdfSettings: { ...s.pdfSettings, allowDownload: e.target.checked } }
                  : s
              )
            }
          />
          Letöltés engedélyezése
        </label>
        <label className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            className="accent-primary"
            checked={settings.pdfSettings.disableTextSelection}
            onChange={(e) =>
              setSettings((s) =>
                s
                  ? {
                      ...s,
                      pdfSettings: { ...s.pdfSettings, disableTextSelection: e.target.checked },
                    }
                  : s
              )
            }
          />
          Szöveg kijelölés tiltása
        </label>
        <label className="flex items-center gap-3 text-sm text-neutral-300 cursor-pointer">
          <input
            type="checkbox"
            className="accent-primary"
            checked={settings.pdfSettings.showPageNav}
            onChange={(e) =>
              setSettings((s) =>
                s
                  ? { ...s, pdfSettings: { ...s.pdfSettings, showPageNav: e.target.checked } }
                  : s
              )
            }
          />
          Oldalszámozás / lapozás
        </label>
        <PressAdminField label="Vízjel sablon">
          <PressAdminInput
            value={settings.pdfSettings.watermarkTemplate}
            onChange={(e) =>
              setSettings((s) =>
                s
                  ? {
                      ...s,
                      pdfSettings: { ...s.pdfSettings, watermarkTemplate: e.target.value },
                    }
                  : s
              )
            }
            placeholder="{{outlet}} — {{email}}"
          />
        </PressAdminField>
      </PressAdminPanel>

      <PressAdminPrimaryButton disabled={saving} onClick={handleSave}>
        {saving ? "Mentés…" : "Beállítások mentése"}
      </PressAdminPrimaryButton>
    </div>
  )
}
