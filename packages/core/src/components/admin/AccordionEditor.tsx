"use client"

import { useState } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Card, CardContent } from "@wse/core/components/ui/card"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { adminFieldHint, adminInputClass } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

interface AccordionItem {
  title: string
  content: string
}

interface AccordionEditorProps {
  initialData?: string // JSON string
  name: string
}

export function AccordionEditor({ initialData, name }: AccordionEditorProps) {
  const [items, setItems] = useState<AccordionItem[]>(() => {
    try {
      return initialData ? JSON.parse(initialData) : []
    } catch (e) {
      console.error("Failed to parse accordion data", e)
      return []
    }
  })

  const addItem = () => {
    setItems([...items, { title: "", content: "" }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof AccordionItem, value: string) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Accordion elemek</p>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Új elem
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index}>
            <CardContent className="group relative space-y-4 p-5">
              <div className="flex items-start gap-4">
                <div className="pt-3 text-muted-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-4">
                  <AdminFormField label="Cím">
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(index, "title", e.target.value)}
                      placeholder="Elem címe…"
                      className={adminInputClass}
                    />
                  </AdminFormField>
                  <AdminFormField label="Tartalom">
                    <textarea
                      value={item.content}
                      onChange={(e) => updateItem(index, "content", e.target.value)}
                      placeholder="Elem tartalma…"
                      rows={3}
                      className={cn(adminInputClass, "resize-none py-2 leading-relaxed")}
                    />
                  </AdminFormField>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-muted-foreground transition-colors hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
            <p className={adminFieldHint}>
              Nincs megadva egyedi elem. Az alapértelmezett értékek lesznek használva.
            </p>
          </div>
        )}
      </div>

      <input type="hidden" name={name} value={JSON.stringify(items)} />
    </div>
  )
}
