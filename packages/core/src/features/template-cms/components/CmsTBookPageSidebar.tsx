"use client"

import { Input } from "@wse/core/components/ui/input"
import { Label } from "@wse/core/components/ui/label"
import { Textarea } from "@wse/core/components/ui/textarea"
import { adminFieldLabel } from "@wse/core/lib/admin-ui"
import { CmsStructureSidebar } from "@wse/core/features/template-cms/components/CmsStructureSidebar"

type FieldSpec = {
  path: string
  label: string
  multiline?: boolean
  hint?: string
}

const TBOOK_FIELD_GROUPS: Record<
  string,
  Array<{ title: string; description?: string; fields: FieldSpec[] }>
> = {
  "page:jegyek": [
    {
      title: "Fejléc",
      description: "Az oldal tetején megjelenő cím és bevezető.",
      fields: [
        { path: "pageTitle", label: "Oldalcím" },
        { path: "pageIntro", label: "Bevezető", multiline: true },
      ],
    },
    {
      title: "Eseménylista",
      fields: [
        { path: "bookCta", label: "Foglalás gomb felirata" },
        { path: "perPerson", label: "Ár / fő" },
        { path: "perBooking", label: "Ár / foglalás" },
      ],
    },
    {
      title: "Üres állapot",
      description: "Ha nincs elérhető esemény.",
      fields: [
        { path: "emptyTitle", label: "Cím" },
        { path: "emptyBody", label: "Szöveg", multiline: true },
      ],
    },
  ],
  "page:tbook-foglalas": [
    {
      title: "Lépések",
      fields: [
        { path: "stepTicket", label: "1. lépés" },
        { path: "stepDetails", label: "2. lépés" },
        { path: "stepReview", label: "3. lépés" },
      ],
    },
    {
      title: "Jegy és szállás",
      fields: [
        { path: "guestsLabel", label: "Résztvevők" },
        { path: "hotelLabel", label: "Szállás címke" },
        { path: "hotelNone", label: "Csak jegy opció" },
        { path: "nightsLabel", label: "Éjszakák" },
        { path: "roomTypeLabel", label: "Szobatípus" },
      ],
    },
    {
      title: "Adatok és fizetés",
      fields: [
        { path: "customerHeading", label: "Kapcsolattartó cím" },
        { path: "customerHint", label: "Kapcsolattartó súgó", multiline: true },
        { path: "attendeesHeading", label: "Résztvevők cím" },
        { path: "attendeesHint", label: "Résztvevők súgó", multiline: true },
        { path: "quoteCta", label: "Áttekintés gomb" },
        { path: "payCta", label: "Fizetés gomb" },
        { path: "backLabel", label: "Vissza" },
        { path: "nextLabel", label: "Tovább" },
      ],
    },
  ],
  "page:tbook-foglalas-siker": [
    {
      title: "Sikeres foglalás",
      fields: [
        { path: "loadingText", label: "Betöltés szöveg" },
        { path: "successTitle", label: "Siker cím" },
        { path: "successBody", label: "Siker szöveg", multiline: true },
        { path: "successCta", label: "Vissza gomb" },
      ],
    },
    {
      title: "Hiba",
      fields: [
        { path: "errorBody", label: "Hiba szöveg", multiline: true },
        { path: "errorCta", label: "Hiba gomb" },
      ],
    },
  ],
}

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (typeof acc !== "object" || acc === null) return undefined
    return (acc as Record<string, unknown>)[key]
  }, obj)
}

/** Sidebar copy editor for tBook CMS pages — complements inline canvas editing. */
export function CmsTBookPageSidebar({
  pageKey,
  draft,
  setPath,
}: {
  pageKey: string
  draft: Record<string, unknown>
  setPath: (path: string, value: unknown) => void
}) {
  const groups = TBOOK_FIELD_GROUPS[pageKey]
  if (!groups) return null

  return (
    <CmsStructureSidebar title="Oldal szövegei">
      <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">
        Itt gyorsan szerkesztheted a mezőket, vagy kattints közvetlenül az előnézeten.
      </p>
      {groups.map((group) => (
        <section key={group.title} className="space-y-2.5 rounded-lg bg-muted/30 p-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{group.title}</p>
            {group.description ? (
              <p className="text-xs text-muted-foreground">{group.description}</p>
            ) : null}
          </div>
          {group.fields.map((field) => {
            const value = String(getAtPath(draft, field.path) ?? "")
            return (
              <div key={field.path} className="space-y-1.5">
                <Label className={adminFieldLabel}>{field.label}</Label>
                {field.multiline ? (
                  <Textarea
                    value={value}
                    rows={3}
                    className="text-xs"
                    onChange={(e) => setPath(field.path, e.target.value)}
                  />
                ) : (
                  <Input
                    value={value}
                    className="h-8 text-xs"
                    onChange={(e) => setPath(field.path, e.target.value)}
                  />
                )}
                {field.hint ? <p className="text-[11px] text-muted-foreground">{field.hint}</p> : null}
              </div>
            )
          })}
        </section>
      ))}
    </CmsStructureSidebar>
  )
}
