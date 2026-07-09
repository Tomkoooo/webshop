"use client"

import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type Editor,
} from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Color from "@tiptap/extension-color"
import TiptapImage from "@tiptap/extension-image"
import { TextStyle } from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"
import { 
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold, 
  Image as ImageIcon,
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Heading1, 
  Heading2, 
  Heading3,
  Palette,
  Quote,
  Undo,
  Redo,
  Upload
} from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { cn } from "@wse/core/lib/utils"
import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react"
import type { ThemeTokens } from "@wse/core/services/theme"

type RichTextEditorVariant = "default" | "mail"
type MailImageAlign = "left" | "center" | "right"
type ResizeHandleSide = "left" | "right"

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  themeColors?: Partial<ThemeTokens>
  className?: string
  editorClassName?: string
  variant?: RichTextEditorVariant
}

const FALLBACK_THEME_COLORS: Partial<ThemeTokens> = {
  primary: "#111827",
  primaryForeground: "#FFFFFF",
  secondary: "#1F2937",
  secondaryForeground: "#FFFFFF",
  accent: "#2563EB",
  accentForeground: "#FFFFFF",
  foreground: "#111827",
  mutedForeground: "#6B7280",
  success: "#16A34A",
  warning: "#D97706",
  error: "#DC2626",
}

const MAIL_IMAGE_MIN_WIDTH = 40
const MAIL_IMAGE_MAX_WIDTH = 1200

function buildColorOptions(themeColors?: Partial<ThemeTokens>) {
  const colors = { ...FALLBACK_THEME_COLORS, ...themeColors }
  return [
    { label: "Szöveg", value: colors.foreground },
    { label: "Primary foreground", value: colors.primaryForeground },
    { label: "Secondary", value: colors.secondary },
    { label: "Secondary foreground", value: colors.secondaryForeground },
    { label: "Accent", value: colors.accent },
    { label: "Muted", value: colors.mutedForeground },
    { label: "Success", value: colors.success },
    { label: "Warning", value: colors.warning },
    { label: "Error", value: colors.error },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))
}

function normalizeMailImageAlign(value: unknown): MailImageAlign {
  return value === "left" || value === "right" || value === "center" ? value : "center"
}

function normalizeMailImageWidth(value: unknown, fallback = "600px") {
  const raw = String(value ?? "").trim()
  if (!raw) return fallback
  if (/^\d+(\.\d+)?%$/.test(raw)) return raw

  const numeric = Number(raw.replace(/[^\d.]/g, ""))
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback

  const clamped = clampMailImageWidth(numeric)
  return `${clamped}px`
}

function clampMailImageWidth(width: number) {
  return Math.min(MAIL_IMAGE_MAX_WIDTH, Math.max(MAIL_IMAGE_MIN_WIDTH, Math.round(width)))
}

function mailImageWidthNumber(value: unknown) {
  const normalized = normalizeMailImageWidth(value)
  return clampMailImageWidth(Number(normalized.replace(/[^\d.]/g, "")) || 600)
}

function mailImageWidthInputValue(value: unknown) {
  const normalized = normalizeMailImageWidth(value)
  return String(Math.round(Number(normalized.replace(/[^\d.]/g, "")) || 600))
}

function buildMailImageStyle(width: unknown, align: unknown) {
  const imageWidth = normalizeMailImageWidth(width)
  const imageAlign = normalizeMailImageAlign(align)
  const margins: Record<MailImageAlign, string> = {
    left: "0 auto 16px 0",
    center: "0 auto 16px auto",
    right: "0 0 16px auto",
  }

  return [
    "display: block",
    `width: ${imageWidth}`,
    "max-width: 100%",
    "height: auto",
    "border: 0",
    "outline: none",
    "text-decoration: none",
    `margin: ${margins[imageAlign]}`,
  ].join("; ")
}

function toAbsoluteImageUrl(src: string) {
  const trimmed = src.trim()
  if (!trimmed || typeof window === "undefined") return trimmed

  try {
    return new URL(trimmed, window.location.origin).href
  } catch {
    return trimmed
  }
}

function insertMailImage(editor: Editor, src: string, alt = "") {
  const imageSrc = toAbsoluteImageUrl(src)
  if (!imageSrc) return

  editor
    .chain()
    .focus()
    .insertContent({
      type: "image",
      attrs: {
        src: imageSrc,
        alt,
        width: "600px",
        align: "center",
      },
    })
    .run()
}

function MailResizableImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [draftWidth, setDraftWidth] = useState<number | null>(null)
  const attrs = node.attrs as Record<string, unknown>
  const align = normalizeMailImageAlign(attrs.align)
  const width = draftWidth ? `${draftWidth}px` : normalizeMailImageWidth(attrs.width)
  const widthNumber = draftWidth ?? mailImageWidthNumber(attrs.width)

  const justifyClass: Record<MailImageAlign, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  const startResize = (event: PointerEvent<HTMLButtonElement>, side: ResizeHandleSide) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = imageRef.current?.getBoundingClientRect().width ?? widthNumber

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = moveEvent.clientX - startX
      const nextWidth = side === "right" ? startWidth + delta : startWidth - delta
      setDraftWidth(clampMailImageWidth(nextWidth))
    }

    const handlePointerUp = (upEvent: globalThis.PointerEvent) => {
      const delta = upEvent.clientX - startX
      const nextWidth = side === "right" ? startWidth + delta : startWidth - delta
      const clampedWidth = clampMailImageWidth(nextWidth)
      updateAttributes({ width: `${clampedWidth}px` })
      setDraftWidth(null)
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
    }

    document.addEventListener("pointermove", handlePointerMove)
    document.addEventListener("pointerup", handlePointerUp)
  }

  return (
    <NodeViewWrapper className={cn("mail-image-node-view flex w-full py-1", justifyClass[align])}>
      <span
        className={cn(
          "mail-image-frame relative inline-block max-w-full",
          selected && "is-selected"
        )}
        style={{ width }}
        data-drag-handle
      >
        {/* Email HTML needs a real img element, and this node view mirrors that editing surface. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={String(attrs.src ?? "")}
          alt={String(attrs.alt ?? "")}
          width={String(widthNumber)}
          data-align={align}
          data-mail-image="true"
          style={{ display: "block", width: "100%", maxWidth: "100%", height: "auto" }}
        />
        {selected ? (
          <>
            <button
              type="button"
              aria-label="Kép átméretezése bal oldalról"
              className="mail-image-resize-handle left"
              onPointerDown={(event) => startResize(event, "left")}
            />
            <button
              type="button"
              aria-label="Kép átméretezése jobb oldalról"
              className="mail-image-resize-handle right"
              onPointerDown={(event) => startResize(event, "right")}
            />
            <span className="mail-image-size-badge">{widthNumber}px</span>
          </>
        ) : null}
      </span>
    </NodeViewWrapper>
  )
}

const MailImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "600px",
        parseHTML: (element: HTMLElement) => element.getAttribute("width") || element.style.width || "600px",
      },
      align: {
        default: "center",
        parseHTML: (element: HTMLElement) => normalizeMailImageAlign(element.getAttribute("data-align")),
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const { width, align, ...attrs } = HTMLAttributes
    const imageWidth = normalizeMailImageWidth(width)
    const imageAlign = normalizeMailImageAlign(align)
    delete attrs.style

    return [
      "img",
      {
        ...this.options.HTMLAttributes,
        ...attrs,
        width: imageWidth.replace("px", ""),
        "data-align": imageAlign,
        "data-mail-image": "true",
        style: buildMailImageStyle(imageWidth, imageAlign),
      },
    ]
  },
  addNodeView() {
    return ReactNodeViewRenderer(MailResizableImageNodeView)
  },
})

const MenuBar = ({
  editor,
  themeColors,
  variant,
}: {
  editor: Editor | null
  themeColors?: Partial<ThemeTokens>
  variant: RichTextEditorVariant
}) => {
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  if (!editor) {
    return null
  }
  const colorOptions = buildColorOptions(themeColors)
  const isMailEditor = variant === "mail"
  const imageAttrs = editor.getAttributes("image")
  const selectedImageAlign = normalizeMailImageAlign(imageAttrs.align)
  const selectedImageWidth = mailImageWidthInputValue(imageAttrs.width)

  const updateSelectedImage = (attrs: Record<string, string>) => {
    editor.chain().focus().updateAttributes("image", attrs).run()
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    setIsUploadingImage(true)

    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.url) {
        throw new Error(typeof data?.error === "string" ? data.error : "A kép feltöltése sikertelen.")
      }
      insertMailImage(editor, data.url, file.name)
    } catch (error) {
      console.error("[rich-text-editor:image-upload]", error)
      window.alert(error instanceof Error ? error.message : "A kép feltöltése sikertelen.")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const items = [
    {
      icon: Bold,
      title: "Félkövér",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
    },
    {
      icon: Italic,
      title: "Dőlt",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
    },
    {
      icon: UnderlineIcon,
      title: "Aláhúzott",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive("underline"),
    },
    {
      type: "divider",
    },
    {
      icon: Heading1,
      title: "Címsor 1",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive("heading", { level: 1 }),
    },
    {
      icon: Heading2,
      title: "Címsor 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive("heading", { level: 2 }),
    },
    {
      icon: Heading3,
      title: "Címsor 3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive("heading", { level: 3 }),
    },
    {
      type: "divider",
    },
    {
      icon: List,
      title: "Felsorolás",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      title: "Számozott lista",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive("orderedList"),
    },
    {
      icon: Quote,
      title: "Idézet",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive("blockquote"),
    },
    {
      type: "divider",
    },
    {
      icon: LinkIcon,
      title: "Link",
      action: () => {
        const url = window.prompt("URL megadása:")
        if (url) {
          editor.chain().focus().setLink({ href: url }).run()
        }
      },
      isActive: () => editor.isActive("link"),
    },
    {
      type: "divider",
    },
    {
      icon: Undo,
      title: "Visszavonás",
      action: () => editor.chain().focus().undo().run(),
    },
    {
      icon: Redo,
      title: "Ismétlés",
      action: () => editor.chain().focus().redo().run(),
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-muted border-b border-border">
      {items.map((item, index) => (
        item.type === "divider" ? (
          <div key={index} className="w-px h-6 bg-muted mx-1 self-center" />
        ) : (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              item.action?.()
            }}
            className={cn(
              "w-8 h-8 rounded-md hover:bg-muted hover:text-foreground transition-colors",
              item.isActive?.() ? "bg-white/15 text-foreground" : "text-muted-foreground"
            )}
            title={item.title}
          >
            {item.icon && <item.icon className="w-4 h-4" />}
          </Button>
        )
      ))}
      {isMailEditor ? (
        <>
          <div className="w-px h-6 bg-muted mx-1 self-center" />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isUploadingImage}
            onClick={(event) => {
              event.preventDefault()
              uploadInputRef.current?.click()
            }}
            className="w-8 h-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            title="Kép feltöltése emailhez"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.preventDefault()
              const url = window.prompt("Kép URL megadása:")
              if (!url) return
              const alt = window.prompt("Kép alternatív szövege (opcionális):") ?? ""
              insertMailImage(editor, url, alt)
            }}
            className="w-8 h-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Kép beszúrása URL-ből"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </>
      ) : null}
      <div className="w-px h-6 bg-muted mx-1 self-center" />
      <div className="flex flex-wrap items-center gap-1 pl-1">
        <Palette className="h-4 w-4 text-muted-foreground" />
        {colorOptions.map((item) => (
          <button
            key={`${item.label}-${item.value}`}
            type="button"
            title={item.label}
            aria-label={`Szövegszín: ${item.label}`}
            onClick={(event) => {
              event.preventDefault()
              editor.chain().focus().setColor(item.value).run()
            }}
            className={cn(
              "h-7 w-7 rounded-md border border-border transition-transform hover:scale-110",
              editor.isActive("textStyle", { color: item.value }) && "ring-2 ring-white"
            )}
            style={{ backgroundColor: item.value }}
          />
        ))}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            editor.chain().focus().unsetColor().run()
          }}
          className="h-7 rounded-md border border-border px-2 text-xs font-medium text-muted-foreground text-foreground hover:bg-muted hover:text-foreground"
        >
          Alap
        </button>
      </div>
      {isMailEditor && editor.isActive("image") ? (
        <>
          <div className="w-px h-6 bg-muted mx-1 self-center" />
          <div className="flex flex-wrap items-center gap-1 pl-1 text-xs font-medium text-muted-foreground text-muted-foreground">
            <span className="px-1">Kép</span>
            <label className="flex items-center gap-1">
              <span>Szélesség</span>
              <input
                type="number"
                min={40}
                max={1200}
                value={selectedImageWidth}
                onChange={(event) => {
                  updateSelectedImage({ width: `${event.target.value}px` })
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.preventDefault()
                }}
                className="h-7 w-20 rounded-md border border-border bg-background px-2 text-xs font-bold text-foreground outline-none focus:border-white/40"
              />
              <span>px</span>
            </label>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                updateSelectedImage({ width: "100%" })
              }}
              className="h-7 rounded-md border border-border px-2 text-xs font-medium text-muted-foreground text-foreground hover:bg-muted hover:text-foreground"
            >
              100%
            </button>
            {[
              { align: "left", title: "Balra igazítás", icon: AlignLeft },
              { align: "center", title: "Középre igazítás", icon: AlignCenter },
              { align: "right", title: "Jobbra igazítás", icon: AlignRight },
            ].map((item) => (
              <button
                key={item.align}
                type="button"
                title={item.title}
                onClick={(event) => {
                  event.preventDefault()
                  updateSelectedImage({ align: item.align })
                }}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  selectedImageAlign === item.align && "bg-white/15 text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  themeColors,
  className,
  editorClassName,
  variant = "default",
}: RichTextEditorProps) {
  void placeholder
  const isMailEditor = variant === "mail"

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      ...(isMailEditor ? [MailImage.configure({ allowBase64: false })] : []),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "admin-link-accent cursor-pointer",
        },
      }),
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none min-h-[256px] p-6 text-black bg-white ql-editor",
          editorClassName
        ),
      },
    },
  })

  // Update logic to handle external value changes (like initial load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <div className={cn(
      "bg-white border border-border rounded-md overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary",
      className
    )}>
      <MenuBar editor={editor} themeColors={themeColors} variant={variant} />
      <EditorContent editor={editor} />
      
      <style jsx global>{`
        .prose h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 1.5rem; text-transform: uppercase; }
        .prose h2 { font-size: 1.875rem; font-weight: 800; margin-bottom: 1.25rem; text-transform: uppercase; }
        .prose h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; }
        .prose p { margin-bottom: 1rem; line-height: 1.6; }
        .prose ul, .prose ol { margin-left: 1.5rem; margin-bottom: 1rem; }
        .prose ul { list-style-type: disc; }
        .prose ol { list-style-type: decimal; }
        .prose blockquote { border-left: 4px solid #FF5500; padding-left: 1rem; font-style: italic; color: #555; }
        
        /* Ensure the editor content area looks consistent with the old design for better transition */
        .tiptap {
           color: #000 !important;
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .tiptap img[data-mail-image="true"] {
          cursor: pointer;
        }
        .tiptap img.ProseMirror-selectednode {
          outline: 3px solid #2563EB;
          outline-offset: 3px;
        }
        .tiptap .mail-image-node-view {
          margin: 0 0 1rem;
        }
        .tiptap .mail-image-frame.is-selected {
          outline: 3px solid #2563EB;
          outline-offset: 4px;
        }
        .tiptap .mail-image-resize-handle {
          position: absolute;
          top: 50%;
          width: 14px;
          height: 44px;
          transform: translateY(-50%);
          border: 2px solid #FFFFFF;
          background: #2563EB;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          cursor: ew-resize;
          z-index: 2;
        }
        .tiptap .mail-image-resize-handle.left {
          left: -10px;
        }
        .tiptap .mail-image-resize-handle.right {
          right: -10px;
        }
        .tiptap .mail-image-size-badge {
          position: absolute;
          right: 0;
          bottom: -30px;
          background: #111827;
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 4px 8px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
          line-height: 1;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
