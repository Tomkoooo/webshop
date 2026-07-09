"use client"

import { useState } from "react"
import { ArrowLeft, Info, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@wse/core/components/ui/button"
import { Input } from "@wse/core/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { AdminFormField } from "@wse/core/components/admin/AdminFormField"
import { AdminPanel } from "@wse/core/components/admin/AdminPanel"
import { RichTextEditor } from "./RichTextEditor"
import { updateEmailTemplate } from "@wse/core/actions/admin-emails"
import { CMSForm } from "./CMSForm"
import { adminAlertInfo, adminInputClass, adminPageTitle } from "@wse/core/lib/admin-ui"
import { cn } from "@wse/core/lib/utils"
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
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className={adminPageTitle}>
            Szerkesztés: {template.type.replace("_", " ")}
          </h1>
          <p className="text-sm text-muted-foreground">Szabja testre az üzenet tárgyát és tartalmát.</p>
        </div>
      </div>

      <CMSForm action={updateAction}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <AdminPanel>
              <AdminFormField label="Email tárgya">
                <Input
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={cn(adminInputClass, "h-12 text-base")}
                  placeholder="Adja meg a tárgyat…"
                />
              </AdminFormField>

              <AdminFormField label="Email tartalma (HTML)">
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Írja meg az üzenetét…"
                  themeColors={themeColors}
                  variant="mail"
                />
                <input type="hidden" name="body" value={body} />
              </AdminFormField>
            </AdminPanel>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Használható változók</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Használja a következő tokeneket a szövegben. A rendszer automatikusan behelyettesíti őket a valós adatokkal küldéskor.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {template.variables.map((variable: string) => (
                    <div
                      key={variable}
                      className="flex items-center justify-between rounded-lg bg-muted/40 p-3 group"
                    >
                      <code className="font-mono text-xs text-foreground">
                        {"{{"}{variable}{"}}"}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`{{${variable}}}`)}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Fontos</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A változókat pontosan úgy írja le, ahogy fent láthatóak, dupla kapcsos zárójelek között.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className={adminAlertInfo}>
              <h4 className="text-sm font-medium text-foreground">Súgó</h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Minden módosítás azonnal érvénybe lép a következő kiküldött üzenetnél. Érdemes először tesztelni.
              </p>
            </div>
          </div>
        </div>
      </CMSForm>
    </div>
  )
}
