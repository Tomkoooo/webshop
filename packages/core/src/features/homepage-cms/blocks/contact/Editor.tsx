"use client"

import Link from "next/link"
import type { ContactBlock } from "@wse/core/features/homepage-cms/types/block-types"
import { EditableHeading } from "@wse/core/features/homepage-cms/components/primitives/EditableHeading"
import { EditableText } from "@wse/core/features/homepage-cms/components/primitives/EditableText"

export function ContactBlockEditor({
  block,
  onPatch,
}: {
  block: ContactBlock
  onPatch: (field: keyof ContactBlock["data"], value: unknown) => void
}) {
  return (
    <section id="contact" className="py-20 border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-4 space-y-4">
        <EditableHeading
          value={block.data.title}
          onChange={(value) => onPatch("title", value)}
          editMode
          className="text-3xl text-white font-black"
        />
        <EditableText
          value={block.data.description}
          onChange={(value) => onPatch("description", value)}
          editMode
          multiline
          className="text-neutral-400"
        />
        <p className="text-xs uppercase tracking-widest text-emerald-300/90">
          Helyszín és térkép
        </p>
        <input
          value={block.data.venueShort ?? ""}
          onChange={(event) => onPatch("venueShort", event.target.value)}
          className="h-9 px-2 bg-black border border-white/20 text-sm text-white w-full"
          placeholder="Rövid helyszín (navbar badge, pl. Récsei Center, 2026 nyár)"
        />
        <input
          value={block.data.address}
          onChange={(event) => onPatch("address", event.target.value)}
          className="h-9 px-2 bg-black border border-white/20 text-sm text-white w-full"
          placeholder="Teljes cím (térkép felett megjelenő szöveg)"
        />
        <textarea
          value={block.data.mapEmbedUrl ?? ""}
          onChange={(event) => onPatch("mapEmbedUrl", event.target.value)}
          className="w-full min-h-[80px] px-2 py-2 bg-black border border-white/20 text-sm text-white font-mono"
          placeholder="Google Maps iframe src URL (embed link)"
        />
        <p className="text-[11px] text-neutral-500">
          A térképnél a Google Maps „Beágyazás” menüből másold az iframe{" "}
          <code className="text-neutral-300">src</code> értékét.
        </p>
        <p className="text-xs text-violet-200/90 border border-violet-500/30 bg-violet-500/10 px-3 py-2">
          E-mail címek csak az adminban:{" "}
          <Link href="/admin/cms/settings?section=contact" className="underline font-bold">
            CMS → Kapcsolat e-mailek
          </Link>
          . Itt csak telefon és cím szerkeszthető (opcionális felülírás).
        </p>
        <div className="grid md:grid-cols-2 gap-2">
          <input
            value={block.data.companyName}
            onChange={(event) => onPatch("companyName", event.target.value)}
            className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
            placeholder="Cégnév"
          />
          <input
            value={block.data.phone}
            onChange={(event) => onPatch("phone", event.target.value)}
            className="h-9 px-2 bg-black border border-white/20 text-sm text-white"
            placeholder="Telefonszám (üres = bolt alapértelmezett)"
          />
          <input
            value={block.data.email}
            onChange={(event) => onPatch("email", event.target.value)}
            className="h-9 px-2 bg-black border border-white/20 text-sm text-white md:col-span-2"
            placeholder="Ügyfélszolgálat email"
          />
        </div>
      </div>
    </section>
  )
}
