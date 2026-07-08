"use client"

import { useState } from "react"
import type { EditorProps } from "@wse/sdk/templates/types"
import type { AtelierFlowShellContent } from "./flow-shell-schema"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { toast } from "sonner"

export function AtelierFlowShellEditorPanel({ content, onSave }: EditorProps<unknown>) {
  const [draft, setDraft] = useState(content as AtelierFlowShellContent)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try {
      await onSave(draft)
      toast.success("Saved")
    } catch (error) {
      toast.error("Save failed")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Headline</Label>
        <Input value={draft.headline} onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))} />
      </div>
      <div className="space-y-2">
        <Label>Subhead</Label>
        <textarea
          className="w-full min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={draft.subhead ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, subhead: e.target.value || undefined }))}
        />
      </div>
      <Button type="button" disabled={saving} onClick={() => void handleSave()}>
        Save
      </Button>
    </div>
  )
}
