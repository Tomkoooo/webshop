"use client"

import { useState } from "react"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"

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
        <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">
          ACCORDION ELEMEK
        </label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addItem}
          className="h-8 rounded-none border-white/10 text-white hover:bg-white/5 uppercase tracking-widest text-[9px] font-black"
        >
          <Plus className="w-3.5 h-3.5 mr-2" />
          ÚJ ELEM
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="bg-black/40 border border-white/5 p-5 space-y-4 group relative">
            <div className="flex items-start gap-4">
              <div className="pt-3 text-neutral-700">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">CÍM</label>
                  <Input 
                    value={item.title}
                    onChange={(e) => updateItem(index, "title", e.target.value)}
                    placeholder="ELEM CÍME..."
                    className="bg-black border-white/5 h-10 text-white font-bold uppercase tracking-widest rounded-none focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">TARTALOM</label>
                  <textarea 
                    value={item.content}
                    onChange={(e) => updateItem(index, "content", e.target.value)}
                    placeholder="ELEM TARTALMA..."
                    rows={3}
                    className="w-full bg-black border border-white/5 rounded-none p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>
              <button 
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 text-neutral-600 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-8 border border-dashed border-white/5 text-center">
            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest italic">
              Nincs megadva egyedi elem. Az alapértelmezett értékek lesznek használva.
            </p>
          </div>
        )}
      </div>

      {/* Hidden input to hold the JSON string for form submission */}
      <input type="hidden" name={name} value={JSON.stringify(items)} />
    </div>
  )
}
