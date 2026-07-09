"use client"

import { useState } from "react"
import { Mail, Sparkles } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor"
import { adminFieldHint, adminInputClass, adminPanel } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"

interface NewsletterCampaignFormProps {
  action: (formData: FormData) => Promise<void>
}

export function NewsletterCampaignForm({ action }: NewsletterCampaignFormProps) {
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("<p>Kedves {{name}}!</p><p></p>")

  return (
    <div className={cn(adminPanel)}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-lg font-semibold">Új kampány</h2>
      </div>

      <form action={action} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <AdminFormField label="Kampány cím">
            <input name="title" placeholder="Kampány cím" className={cn(adminInputClass, "h-10")} required />
          </AdminFormField>
          <AdminFormField label="Email tárgy">
            <input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email tárgy"
              className={cn(adminInputClass, "h-10")}
              required
            />
          </AdminFormField>
          <AdminFormField label="Téma">
            <select name="topic" defaultValue="general" className={cn(adminInputClass, "h-10")}>
              <option value="general">Általános</option>
              <option value="discounts">Kedvezmények</option>
              <option value="coupons">Kuponok</option>
              <option value="new_products">Új termékek</option>
            </select>
          </AdminFormField>
          <AdminFormField label="Célközönség">
            <select name="audience" defaultValue="all_users" className={cn(adminInputClass, "h-10")}>
              <option value="all_users">Feliratkozott felhasználók</option>
              <option value="customers">Feliratkozott vásárló ügyfelek (rendeléssel)</option>
            </select>
          </AdminFormField>

          <p className={adminFieldHint}>
            A <code>{"{{name}}"}</code> változó automatikusan a címzett nevére lesz cserélve.
            A rendszer minden levél végére kötelezően hozzáadja a <strong>Leiratkozás</strong> linket.
          </p>
        </div>

        <AdminFormField label="Email tartalom">
          <RichTextEditor
            value={bodyHtml}
            onChange={setBodyHtml}
            placeholder="Írd meg a hírlevél tartalmát..."
            variant="mail"
          />
          <input type="hidden" name="bodyHtml" value={bodyHtml} />
        </AdminFormField>

        <div className="space-y-3 lg:col-span-2">
          <p className="text-sm font-medium">Előnézet</p>
          <div className="rounded-lg bg-white p-6 text-black shadow-sm">
            <p className="mb-3 text-sm text-neutral-700">
              <strong>Tárgy:</strong> {subject || "(nincs tárgy)"}
            </p>
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            <hr className="my-6 border-neutral-200" />
            <p className="text-xs text-neutral-600">
              Ezt az üzenetet azért kaptad, mert feliratkoztál a hírlevelünkre.
              <br />
              <a href="https://krauszbarkacs.hu/profile" className="text-primary font-medium hover:underline">
                Leiratkozás
              </a>
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Button type="submit" className="h-10">
            <Mail className="mr-2 size-4" />
            Kampány mentése
          </Button>
        </div>
      </form>
    </div>
  )
}
