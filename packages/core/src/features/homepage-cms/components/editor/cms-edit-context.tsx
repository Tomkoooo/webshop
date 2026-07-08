"use client"

import { createContext, useContext } from "react"
import type { HomepageBlock, HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"

type CmsEditContextValue = {
  enabled: boolean
  snapshot: HomepageSnapshot | null
  updateField: (
    blockType: HomepageBlock["type"],
    field: string,
    value: unknown,
    blockId?: string
  ) => void
  /** Apply several `data` keys at once; optional `blockId` targets a specific block when multiple share a type. */
  patchBlockData: (
    blockType: HomepageBlock["type"],
    patch: Record<string, unknown>,
    blockId?: string
  ) => void
}

const CmsEditContext = createContext<CmsEditContextValue>({
  enabled: false,
  snapshot: null,
  updateField: () => undefined,
  patchBlockData: () => undefined,
})

export function CmsEditProvider({
  enabled,
  snapshot,
  updateField,
  patchBlockData,
  children,
}: {
  enabled: boolean
  snapshot: HomepageSnapshot | null
  updateField: CmsEditContextValue["updateField"]
  patchBlockData: CmsEditContextValue["patchBlockData"]
  children: React.ReactNode
}) {
  return (
    <CmsEditContext.Provider value={{ enabled, snapshot, updateField, patchBlockData }}>
      <div data-cms-editing={enabled ? "true" : undefined}>{children}</div>
    </CmsEditContext.Provider>
  )
}

export function useCmsEdit() {
  return useContext(CmsEditContext)
}
