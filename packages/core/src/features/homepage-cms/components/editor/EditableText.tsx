"use client"

import { useEffect, useState } from "react"

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
        className="w-full text-left p-2 border border-dashed border-white/20 text-white hover:border-primary-foreground/40"
        onClick={() => setEditing(true)}
      >
        <span className="text-[10px] uppercase tracking-widest text-neutral-400">{label}</span>
        <p className="text-sm mt-1">{value || "Click to edit"}</p>
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-neutral-400">{label}</label>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="w-full min-h-[96px] p-2 bg-black border border-white/20 text-white"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            onChange(draft)
            setEditing(false)
          }}
          className="px-3 py-1 text-xs bg-primary text-white"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setEditing(false)
          }}
          className="px-3 py-1 text-xs border border-white/20 text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
