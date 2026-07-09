"use client"

import { useState } from "react"
import { Save, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { ImageUpload } from "@wse/core/components/admin/ImageUpload"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { Card, CardContent, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { adminInputClass } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
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
    <AdminPageScaffold
      title={isEdit ? "Kategória szerkesztése" : "Új kategória"}
      actions={
        <Link href="/admin/categories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
      }
      className="pb-20"
    >
      <form
        action={isEdit ? updateCategory.bind(null, initialData._id.toString()) : createCategory}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Alapadatok</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <AdminFormField label="Kategória neve">
                <Input
                  name="name"
                  required
                  defaultValue={initialData?.name}
                  placeholder="Kézi szerszámok"
                />
              </AdminFormField>

              <AdminFormField
                label="Kiemelt lista index (főoldal)"
                hint="Kisebb szám = előrébb a kiemelt kategória sávban (automatikus mód)."
              >
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
                />
              </AdminFormField>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <AdminFormField label="Szülő kategória">
                  <select
                    name="parent"
                    defaultValue={initialData?.parent?._id?.toString() || initialData?.parent?.toString() || ""}
                    className={adminInputClass}
                  >
                    <option value="">Nincs (főkategória)</option>
                    {possibleParents.map((cat: any) => (
                      <option key={cat._id} value={cat._id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </AdminFormField>
                <AdminFormField
                  label="Kategória képe"
                  hint="Négyzet (1:1) vagy 16:9 — a boltban nagyítással teljes arány látszik."
                >
                  <ImageUpload
                    currentImage={imageUrl}
                    onUpload={(filename) => setImageUrl(filename)}
                    flexibleCrop
                    aspect={16 / 9}
                  />
                  <input type="hidden" name="image" value={imageUrl} />
                </AdminFormField>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">SEO beállítások</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <AdminFormField label="Meta cím">
                <Input
                  name="seo_title"
                  defaultValue={initialData?.seo?.title}
                  placeholder="Oldal címe"
                />
              </AdminFormField>

              <AdminFormField label="Meta leírás">
                <textarea
                  name="seo_description"
                  rows={3}
                  defaultValue={initialData?.seo?.description}
                  placeholder="Rövid leírás…"
                  className={cn(adminInputClass, "min-h-[80px] py-2")}
                />
              </AdminFormField>

              <AdminFormField label="Kulcsszavak">
                <Input
                  name="seo_keywords"
                  defaultValue={initialData?.seo?.keywords?.join(", ")}
                  placeholder="szerszám, minőség…"
                />
              </AdminFormField>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Műveletek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="submit" variant="default" className="h-12 w-full">
                <Save className="size-5" />
                {isEdit ? "Mentés" : "Létrehozás"}
              </Button>
              <Link href="/admin/categories" className="block">
                <Button type="button" variant="outline" className="h-11 w-full">
                  Mégse
                </Button>
              </Link>

              {isEdit && (
                <div className="border-t border-border pt-6">
                  <Button
                    formAction={() => deleteCategory(initialData._id.toString())}
                    type="submit"
                    variant="ghost"
                    className="h-12 w-full text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                  >
                    <Trash2 className="mr-3 size-5" />
                    Törlés
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </AdminPageScaffold>
  )
}
