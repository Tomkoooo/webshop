"use client"

import { useState } from "react"
import { Save, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { ImageUpload } from "@wse/core/components/admin/ImageUpload"
import { createCategory, updateCategory, deleteCategory } from "@wse/core/actions/admin-categories"

interface CategoryFormProps {
  categories: any[]
  initialData?: any
  isEdit?: boolean
}

export default function CategoryForm({ categories, initialData, isEdit }: CategoryFormProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.image || "")

  // Filter out the current category from the list of possible parents if we're editing
  const possibleParents = isEdit 
    ? categories.filter((cat: any) => cat._id.toString() !== initialData._id.toString())
    : categories

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/admin/categories">
          <Button variant="ghost" size="icon" className="hover:bg-white/5 text-neutral-400 hover:text-white rounded-none">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
            {isEdit ? "KATEGÓRIA" : "ÚJ"} <span className="admin-headline-accent">{isEdit ? "SZERKESZTÉSE" : "KATEGÓRIA"}</span>
          </h1>
        </div>
      </div>

      <form action={isEdit ? updateCategory.bind(null, initialData._id.toString()) : createCategory} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info */}
          <div className="bg-white/5 border border-white/10 rounded-none p-6 md:p-8 space-y-8">
            <h2 className="text-xl font-heading font-black italic uppercase tracking-wider flex items-center gap-3 text-white">
              <div className="w-1.5 h-6 admin-section-marker" />
              ALAPADATOK
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">Kategória Neve</label>
                <Input 
                  name="name" 
                  required 
                  defaultValue={initialData?.name}
                  placeholder="KÉZI SZERSZÁMOK" 
                  className="bg-black border-white/5 h-12 text-white font-bold uppercase tracking-widest focus-visible:ring-primary rounded-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">
                  Kiemelt lista index (főoldal)
                </label>
                <Input
                  name="featuredListIndex"
                  type="number"
                  step={1}
                  defaultValue={
                    initialData?.featuredListIndex != null
                      ? String(initialData.featuredListIndex)
                      : ""
                  }
                  placeholder="Üres = alap sorrend"
                  className="bg-black border-white/5 h-12 text-white font-mono rounded-none"
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Kisebb szám = előrébb a kiemelt kategória sávban (automatikus mód).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">Szülő Kategória</label>
                  <select 
                    name="parent"
                    defaultValue={initialData?.parent?._id?.toString() || initialData?.parent?.toString() || ""}
                    className="w-full bg-black border border-white/5 rounded-none h-12 px-3 text-white font-bold uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="">NINCS (FŐKATEGÓRIA)</option>
                    {possibleParents.map((cat: any) => (
                      <option key={cat._id} value={cat._id.toString()}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">Kategória Képe</label>
                  <ImageUpload
                    currentImage={imageUrl}
                    onUpload={(filename) => setImageUrl(filename)}
                    flexibleCrop
                    aspect={16 / 9}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    Négyzet (1:1) vagy 16:9 — a boltban nagyítással teljes arány látszik.
                  </p>
                  <input type="hidden" name="image" value={imageUrl} />
                </div>
              </div>
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-white/5 border border-white/10 rounded-none p-6 md:p-8 space-y-8">
            <h2 className="text-xl font-heading font-black italic uppercase tracking-wider flex items-center gap-3 text-white">
              <div className="w-1.5 h-6 admin-section-marker" />
              SEO BEÁLLÍTÁSOK
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">Meta Cím</label>
                <Input 
                  name="seo_title" 
                  defaultValue={initialData?.seo?.title}
                  placeholder="OLDAL CÍME" 
                  className="bg-black border-white/5 h-12 text-white font-bold uppercase tracking-widest focus-visible:ring-primary rounded-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">Meta Leírás</label>
                <textarea 
                  name="seo_description" 
                  rows={3}
                  defaultValue={initialData?.seo?.description}
                  placeholder="RÖVID LEÍRÁS..." 
                  className="w-full bg-black border border-white/5 rounded-none p-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">Kulcsszavak</label>
                <Input 
                  name="seo_keywords" 
                  defaultValue={initialData?.seo?.keywords?.join(", ")}
                  placeholder="SZERSZÁM, MINŐSÉG..." 
                  className="bg-black border-white/5 h-12 text-white font-bold uppercase tracking-widest focus-visible:ring-primary rounded-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-none p-8 sticky top-24 space-y-10">
            <div className="space-y-6">
              <h3 className="text-lg font-heading font-black text-white uppercase italic tracking-widest border-b border-white/5 pb-4">MŰVELETEK</h3>
              <div className="space-y-4">
                <Button type="submit" variant="krausz" className="w-full h-16 text-base tracking-[0.2em]">
                  <Save className="w-5 h-5" />
                  {isEdit ? "MENTÉS" : "LÉTREHOZÁS"}
                </Button>
                <Link href="/admin/categories" className="block">
                  <Button type="button" variant="outline" className="w-full h-14 border-white/10 text-white hover:bg-white/5 rounded-none uppercase tracking-[0.2em] text-[10px] font-black">
                    MÉGSE
                  </Button>
                </Link>

                {isEdit && (
                  <div className="pt-10 mt-10 border-t border-white/5">
                    <Button 
                      formAction={() => deleteCategory(initialData._id.toString())}
                      type="submit" 
                      variant="ghost" 
                      className="w-full text-rose-500 hover:text-white hover:bg-rose-500/20 rounded-none font-black uppercase tracking-widest text-[10px] h-12"
                    >
                      <Trash2 className="w-5 h-5 mr-3" />
                      TÖRLÉS
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
