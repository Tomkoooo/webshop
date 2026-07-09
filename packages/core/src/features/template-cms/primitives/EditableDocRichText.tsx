"use client"

import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"

type Props = {
  path: string
  html: string
  className?: string
}

export function EditableDocRichText({ path, html, className }: Props) {
  const cms = useSurfaceDocEdit()

  const editor = useEditor({
    immediatelyRender: false,
    editable: cms.enabled,
    extensions: [StarterKit, Link, Underline],
    content: html,
    onUpdate: ({ editor: current }) => {
      if (!cms.enabled) return
      cms.setPath(path, current.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, { emitUpdate: false })
    }
    editor.setEditable(cms.enabled)
  }, [editor, html, cms.enabled])

  if (!cms.enabled) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: html || "" }}
      />
    )
  }

  if (!editor) return null

  return (
    <div className="cms-admin-control rounded-lg bg-card/95 p-2 shadow-sm ring-2 ring-primary/25">
      <EditorContent editor={editor} className={className ?? "prose max-w-none min-h-[140px] text-sm"} />
    </div>
  )
}
