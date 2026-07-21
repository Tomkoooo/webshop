"use client"

import { useEffect, useRef } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { Bold, Italic, Underline as UnderlineIcon, Palette } from "lucide-react"
import { useSurfaceDocEdit } from "@wse/core/features/template-cms/surface-doc-edit-context"
import { cn } from "@wse/core/lib/utils"

type Props = {
  path: string
  html: string
  className?: string
  /** Compact toolbar for headings/hero lines (bold + color). */
  toolbar?: "full" | "compact" | "none"
}

const QUICK_COLORS = [
  { label: "Default", value: "" },
  { label: "Gold", value: "#C9A227" },
  { label: "White", value: "#FFFFFF" },
  { label: "Muted", value: "#A3A3A3" },
  { label: "Red", value: "#DC2626" },
]

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Turn plain-text newlines into paragraphs so pasted line breaks survive. */
function plainTextToHtml(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("")
}

function htmlNeedsNewlineFix(html: string): boolean {
  if (!html) return false
  // Word/Google sometimes paste as spans with only <br> missing; keep as-is if structure exists.
  return !/<p[\s>]|<br\s*\/?>|<div[\s>]/i.test(html) && html.includes("\n")
}

export function EditableDocRichText({
  path,
  html,
  className,
  toolbar = "full",
}: Props) {
  const cms = useSurfaceDocEdit()
  const editorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editable: cms.enabled,
    extensions: [
      StarterKit.configure({
        hardBreak: {},
      }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextStyle,
      Color,
    ],
    content: html,
    onUpdate: ({ editor: current }) => {
      if (!cms.enabled) return
      cms.setPath(path, current.getHTML())
    },
    editorProps: {
      handlePaste(_view, event) {
        if (!cms.enabled) return false
        const clipboard = event.clipboardData
        if (!clipboard) return false
        const htmlPaste = clipboard.getData("text/html")
        const textPaste = clipboard.getData("text/plain")
        if (!textPaste.includes("\n")) return false
        if (htmlPaste && !htmlNeedsNewlineFix(htmlPaste) && /<(?:p|br|div)\b/i.test(htmlPaste)) {
          return false
        }
        event.preventDefault()
        editorRef.current?.commands.insertContent(plainTextToHtml(textPaste))
        return true
      },
      attributes: {
        class: cn(
          "outline-none min-h-[1.5em] [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1",
          className
        ),
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

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
        className={cn(
          "[&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1",
          className
        )}
        dangerouslySetInnerHTML={{ __html: html || "" }}
      />
    )
  }

  if (!editor) return null

  const showToolbar = toolbar !== "none"

  return (
    <div className="cms-admin-control rounded-lg bg-card/95 p-2 shadow-sm ring-2 ring-primary/25">
      {showToolbar ? (
        <div className="mb-2 flex flex-wrap items-center gap-1 border-b border-border/60 pb-2">
          <button
            type="button"
            className={cn(
              "rounded p-1.5 text-foreground hover:bg-muted",
              editor.isActive("bold") && "bg-muted"
            )}
            aria-label="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              "rounded p-1.5 text-foreground hover:bg-muted",
              editor.isActive("italic") && "bg-muted"
            )}
            aria-label="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              "rounded p-1.5 text-foreground hover:bg-muted",
              editor.isActive("underline") && "bg-muted"
            )}
            aria-label="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-3.5" />
          </button>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <Palette className="size-3.5 text-muted-foreground" aria-hidden />
          {QUICK_COLORS.map((color) => (
            <button
              key={color.label}
              type="button"
              title={color.label}
              className="size-5 rounded-full border border-border"
              style={{
                backgroundColor: color.value || "var(--theme-foreground, #fff)",
              }}
              onClick={() => {
                if (!color.value) {
                  editor.chain().focus().unsetColor().run()
                  return
                }
                editor.chain().focus().setColor(color.value).run()
              }}
            />
          ))}
          {toolbar === "full" ? (
            <span className="ml-2 text-[10px] text-muted-foreground">
              Enter = new paragraph · Shift+Enter = line break
            </span>
          ) : null}
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  )
}
