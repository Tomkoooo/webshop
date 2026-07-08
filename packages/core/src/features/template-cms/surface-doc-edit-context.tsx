"use client"

import { createContext, useContext } from "react"

export type SurfaceDocEditApi = {
  enabled: boolean
  setPath: (path: string, value: unknown) => void
}

const SurfaceDocEditContext = createContext<SurfaceDocEditApi | null>(null)

export function SurfaceDocEditProvider({
  enabled,
  setPath,
  children,
}: {
  enabled: boolean
  setPath: (path: string, value: unknown) => void
  children: React.ReactNode
}) {
  return (
    <SurfaceDocEditContext.Provider value={{ enabled, setPath }}>
      <div data-cms-editing={enabled ? "true" : undefined}>{children}</div>
    </SurfaceDocEditContext.Provider>
  )
}

export function useSurfaceDocEdit(): SurfaceDocEditApi {
  return useContext(SurfaceDocEditContext) ?? { enabled: false, setPath: () => {} }
}
