"use client"

import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"

type Props = {
  html: string
  onChange: (html: string) => void
  editMode: boolean
}

export function EditableRichText({ html, onChange, editMode }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: editMode,
    extensions: [StarterKit, Link, Underline],
    content: html,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, { emitUpdate: false })
    }
    editor.setEditable(editMode)
  }, [editor, editMode, html])

  if (!editor) return null

  return (
    <div className="border border-white/10 bg-black/40 p-3">
      <EditorContent editor={editor} className="prose prose-invert max-w-none min-h-[120px]" />
    </div>
  )
}
