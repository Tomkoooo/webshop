"use client"

import Link from "next/link"
import type { PressKitSettingsDto } from "./press-api"
import { PressPdfUploadField } from "./PressPdfUploadField"
import { PressAdminField, PressAdminInput, PressAdminPanel } from "./press-admin-ui"

type Props = {
  pdfMediaFilename: string
  pdfSettings: PressKitSettingsDto["pdfSettings"]
  onChange: (patch: {
    pdfMediaFilename?: string
    pdfSettings?: Partial<PressKitSettingsDto["pdfSettings"]>
  }) => void
}

export function PressKitPdfSidebarPanel({ pdfMediaFilename, pdfSettings, onChange }: Props) {
  return (
    <PressAdminPanel title="Képregény PDF" className="!p-4 space-y-3">
      <p className="text-[11px] text-neutral-400 leading-relaxed">
        A feltöltött PDF a sajtóportál alján jelenik meg védett előnézetként. Részletes belépési
        beállítások:{" "}
        <Link href="/admin/plugins/press-kit/content/settings" className="text-primary underline">
          Oldal beállítások
        </Link>
        .
      </p>
      <PressPdfUploadField
        value={pdfMediaFilename}
        onChange={(v) => onChange({ pdfMediaFilename: v })}
      />
      <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
        <input
          type="checkbox"
          className="accent-primary"
          checked={pdfSettings.allowDownload}
          onChange={(e) => onChange({ pdfSettings: { allowDownload: e.target.checked } })}
        />
        Letöltés engedélyezése
      </label>
      <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
        <input
          type="checkbox"
          className="accent-primary"
          checked={pdfSettings.disableTextSelection}
          onChange={(e) => onChange({ pdfSettings: { disableTextSelection: e.target.checked } })}
        />
        Szöveg kijelölés tiltása
      </label>
      <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
        <input
          type="checkbox"
          className="accent-primary"
          checked={pdfSettings.showPageNav}
          onChange={(e) => onChange({ pdfSettings: { showPageNav: e.target.checked } })}
        />
        Lapozás
      </label>
      <PressAdminField label="Vízjel">
        <PressAdminInput
          value={pdfSettings.watermarkTemplate}
          onChange={(e) => onChange({ pdfSettings: { watermarkTemplate: e.target.value } })}
          placeholder="{{outlet}} — {{email}}"
        />
      </PressAdminField>
    </PressAdminPanel>
  )
}
