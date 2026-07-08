"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@wse/core/components/ui/button";
import { RichTextEditor } from "@wse/core/components/admin/RichTextEditor";

interface NewsletterCampaignFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function NewsletterCampaignForm({ action }: NewsletterCampaignFormProps) {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p>Kedves {{name}}!</p><p></p>");

  return (
    <div className="bg-white/5 border border-white/10 p-6 space-y-6">
      <div className="flex items-center gap-2 text-white">
        <Sparkles className="w-4 h-4 admin-icon-accent" />
        <h2 className="font-black uppercase tracking-wider">Új kampány</h2>
      </div>

      <form action={action} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <input
            name="title"
            placeholder="Kampány cím"
            className="h-12 w-full bg-black border border-white/10 px-4 text-white focus:outline-none focus:border-white/40"
            required
          />
          <input
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email tárgy"
            className="h-12 w-full bg-black border border-white/10 px-4 text-white focus:outline-none focus:border-white/40"
            required
          />
          <select
            name="topic"
            defaultValue="general"
            className="h-12 w-full bg-black border border-white/10 px-4 text-white focus:outline-none focus:border-white/40"
          >
            <option value="general">Általános</option>
            <option value="discounts">Kedvezmények</option>
            <option value="coupons">Kuponok</option>
            <option value="new_products">Új termékek</option>
          </select>
          <select
            name="audience"
            defaultValue="all_users"
            className="h-12 w-full bg-black border border-white/10 px-4 text-white focus:outline-none focus:border-white/40"
          >
            <option value="all_users">Feliratkozott felhasználók</option>
            <option value="customers">Feliratkozott vásárló ügyfelek (rendeléssel)</option>
          </select>

          <p className="text-xs text-neutral-500 leading-relaxed">
            A <code>{"{{name}}"}</code> változó automatikusan a címzett nevére lesz cserélve.
            A rendszer minden levél végére kötelezően hozzáadja a{" "}
            <strong>Leiratkozás</strong> linket.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">
              Email tartalom
            </p>
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Írd meg a hírlevél tartalmát..."
              variant="mail"
            />
            <input type="hidden" name="bodyHtml" value={bodyHtml} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-black">
            Előnézet
          </p>
          <div className="bg-white border border-white/10 p-6 text-black">
            <p className="text-sm text-neutral-700 mb-3">
              <strong>Tárgy:</strong> {subject || "(nincs tárgy)"}
            </p>
            <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            <hr className="my-6 border-neutral-200" />
            <p className="text-xs text-neutral-600">
              Ezt az üzenetet azért kaptad, mert feliratkoztál a hírlevelünkre.
              <br />
              <a href="https://krauszbarkacs.hu/profile" className="admin-link-accent">
                Leiratkozás
              </a>
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Button type="submit" className="h-12 rounded-none bg-primary hover:bg-primary/85 text-white font-black uppercase tracking-widest text-[10px]">
            <Mail className="w-4 h-4 mr-2" />
            Kampány mentése
          </Button>
        </div>
      </form>
    </div>
  );
}
