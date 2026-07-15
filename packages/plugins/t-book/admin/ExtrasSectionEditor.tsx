"use client"

import type { TBookExtrasSection, TBookRoomType } from "../lib/pricing-types"
import { TBookField, TBookInput } from "./t-book-admin-ui"
import { OptionSchemaEditor } from "./OptionSchemaEditor"

const emptySection = (): TBookExtrasSection => ({
  label: "Extrák és felárak",
  description: "",
  options: [],
})

export function ExtrasSectionEditor({
  section,
  onChange,
  roomTypes = [],
}: {
  section: TBookExtrasSection | null
  onChange: (section: TBookExtrasSection | null) => void
  roomTypes?: TBookRoomType[]
}) {
  const current = section ?? emptySection()
  const hasContent =
    Boolean(current.label.trim()) ||
    Boolean(current.description?.trim()) ||
    current.options.length > 0

  const patch = (partial: Partial<TBookExtrasSection>) => {
    onChange({ ...current, ...partial })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-2">
        <p>
          Egy szakasz címmel és leírással — alatta közvetlenül a foglalási opciók (étkezés,
          parkolás, stb.). A szobatípus külön lépésben van.
        </p>
      </div>

      {!hasContent ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-6 text-center">
          Nincs extrák szakasz — csak szobatípus alapár fog szerepelni a foglalásban.
        </p>
      ) : null}

      <TBookField label="Szakasz címe (vendég látja)">
        <TBookInput
          value={current.label}
          onChange={(e) => patch({ label: e.target.value })}
          placeholder="Pl. Étkezés és kényelem"
        />
      </TBookField>
      <TBookField label="Szakasz leírása (opcionális, vendég látja)">
        <TBookInput
          value={current.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Pl. Válassz étkezési csomagot és extra szolgáltatásokat"
        />
      </TBookField>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Foglalási opciók</p>
        <OptionSchemaEditor
          options={current.options}
          onChange={(options) => patch({ options })}
          roomTypes={roomTypes}
        />
      </div>

      {hasContent ? (
        <button
          type="button"
          className="text-sm text-red-600 hover:underline"
          onClick={() => onChange(null)}
        >
          Extrák szakasz törlése
        </button>
      ) : (
        <button
          type="button"
          className="inline-flex h-10 items-center px-4 border border-border rounded-lg text-sm font-bold"
          onClick={() => onChange(emptySection())}
        >
          + Extrák szakasz hozzáadása
        </button>
      )}
    </div>
  )
}
