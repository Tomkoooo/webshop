"use client"

import { EditableDocText } from "@wse/core/features/template-cms/primitives/EditableDocText"
import type { CampSuccessContent } from "../schemas"

export function CampSuccessRender({ content }: { content: CampSuccessContent; deps?: unknown }) {
  const c = content
  return (
    <div className="minecraft-panel max-w-lg mx-auto p-8 text-center">
      <p className="font-minecraft-body text-sm mb-4">
        <EditableDocText path="loadingText" value={c.loadingText} />
      </p>
      <h1 className="font-minecraft text-lg text-[#2d5016] mb-4">
        <EditableDocText path="successTitle" value={c.successTitle} />
      </h1>
      <p className="font-minecraft-body text-sm mb-6">
        <EditableDocText path="successBody" value={c.successBody} multiline />
      </p>
      <span className="minecraft-btn inline-block">
        <EditableDocText path="successCta" value={c.successCta} />
      </span>
      <hr className="my-8 border-[#3d2817]/20" />
      <p className="font-minecraft-body text-red-800 mb-4">
        <EditableDocText path="errorBody" value={c.errorBody} multiline />
      </p>
      <span className="minecraft-btn inline-block">
        <EditableDocText path="errorCta" value={c.errorCta} />
      </span>
    </div>
  )
}
