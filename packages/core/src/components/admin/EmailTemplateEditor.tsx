"use client"

import { useState } from "react"
import { ArrowLeft, Info, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { RichTextEditor } from "./RichTextEditor"
import { updateEmailTemplate } from "@wse/core/actions/admin-emails"
import { CMSForm } from "./CMSForm"
import type { ThemeTokens } from "@wse/core/services/theme"

interface EmailTemplateEditorProps {
  template: {
    type: string
    subject: string
    body: string
    variables: string[]
  }
  themeColors?: Partial<ThemeTokens>
}

export function EmailTemplateEditor({ template, themeColors }: EmailTemplateEditorProps) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)

  const updateAction = updateEmailTemplate.bind(null, template.type)

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <Link href="/admin/emails">
          <Button variant="ghost" size="icon" className="hover:bg-white/10 text-neutral-500 hover:text-white border border-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight mb-1 uppercase italic text-white leading-[0.9]">
            SZERKESZTÉS: <span className="admin-text-accent">{template.type.replace('_', ' ')}</span>
          </h1>
          <p className="text-white/40 font-medium italic text-sm">Szabja testre az üzenet tárgyát és tartalmát.</p>
        </div>
      </div>

      <CMSForm action={updateAction}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white/5 border border-white/10 p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">
                  EMAIL TÁRGYA
                </label>
                <Input 
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-black border-white/5 h-14 text-lg font-bold text-white uppercase tracking-widest rounded-none focus-visible:ring-primary"
                  placeholder="ADJA MEG A TÁRGYAT..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-500 block uppercase tracking-[0.2em]">
                  EMAIL TARTALMA (HTML)
                </label>
                <RichTextEditor 
                  value={body}
                  onChange={setBody}
                  placeholder="ÍRJA MEG AZ ÜZENETÉT..."
                  themeColors={themeColors}
                  variant="mail"
                />
                {/* Hidden input to pass the HTML content to the form action */}
                <input type="hidden" name="body" value={body} />
              </div>
            </div>
          </div>

          {/* Sidebar / Reference */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 space-y-6">
              <div className="flex items-center gap-3 text-white">
                <div className="w-1 h-5 admin-section-marker" />
                <h3 className="font-heading font-black italic uppercase tracking-wider">Használható Változók</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Használja a következő tokeneket a szövegben. A rendszer automatikusan behelyettesíti őket a valós adatokkal küldéskor.
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  {template.variables.map((variable: string) => (
                    <div key={variable} className="bg-black border border-white/5 p-3 flex items-center justify-between group">
                      <code className="admin-value font-black text-[11px] tracking-wider italic">
                        {"{{"}{variable}{"}}"}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-white"
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`{{${variable}}}`)}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-neutral-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Fontos</span>
                </div>
                <p className="text-xs text-neutral-600 font-medium leading-relaxed italic">
                  A változókat pontosan úgy írja le, ahogy fent láthatóak, dupla kapcsos zárójelek között.
                </p>
              </div>
            </div>

            <div className="p-6 bg-primary/5 border border-primary/10 space-y-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Súgó</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                Minden módosítás azonnal érvénybe lép a következő kiküldött üzenetnél. Érdemes először tesztelni.
              </p>
            </div>
          </div>
        </div>
      </CMSForm>
    </div>
  )
}
