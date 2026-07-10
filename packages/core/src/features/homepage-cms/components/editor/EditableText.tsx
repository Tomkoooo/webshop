"use client"

import { useEffect, useState } from "react"
import { Button } from "@wse/core/components/ui/button"
import { Label } from "@wse/core/components/ui/label"
import { cmsInlineTextareaClass } from "@wse/core/lib/admin-ui"

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
}

export function EditableText({ label, value, onChange }: Props) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setDraft(value)
  }, [value])

  if (!editing) {
    return (
      <button
        type="button"
        className="w-full rounded-lg bg-muted/40 p-3 text-left ring-1 ring-dashed ring-border/60 transition-colors hover:ring-primary/40"
        onClick={() => setEditing(true)}
      >
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <p className="mt-1 text-sm text-foreground">{value || "Kattints a szerkesztéshez"}</p>
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-lg bg-card p-3 shadow-sm ring-1 ring-border/60">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className={cmsInlineTextareaClass}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onChange(draft)
            setEditing(false)
          }}
        >
          Mentés
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setDraft(value)
            setEditing(false)
          }}
        >
          Mégse
        </Button>
      </div>
    </div>
  )
}
