"use client"

import { pressStart2P } from "../../../fonts"
import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { CampListContent } from "../schemas"

export function CampListRender({ content }: { content: CampListContent; deps?: unknown }) {
  const c = content
  return (
    <div className={`minecraft-page-mineshow px-4 py-10 ${pressStart2P.variable}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-minecraft text-sm md:text-base text-[#2d2817] mb-2">
          <EditableDocText path="pageTitle" value={c.pageTitle} className="text-[#2d2817]" />
        </h1>
        <p className="font-minecraft-body text-sm text-[#5c4a32] mb-8">
          <EditableDocText path="pageIntro" value={c.pageIntro} multiline className="text-[#5c4a32]" />
        </p>
        <div className="minecraft-panel p-6 text-center font-minecraft-body text-sm text-[#5c4a32]">
          Turnuslista előnézet — a valódi oldalon a tábor plugin tölti be a turnusokat.
        </div>
      </div>
    </div>
  )
}
