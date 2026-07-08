"use client"

import { PressKitVisualEditor } from "./PressKitVisualEditor"
import { PressContentSettings } from "./PressContentSettings"

export function PressContentAdmin({ path }: { path?: string[] }) {
  const sub = path?.[0]
  if (sub === "settings") {
    return <PressContentSettings />
  }
  return <PressKitVisualEditor />
}
