export type AspectPreset = {
  id: string
  label: string
  aspect: number | null
}

export function buildAspectPresets(recommendedAspect?: number): AspectPreset[] {
  const presets: AspectPreset[] = [
    { id: "square", label: "Négyzet 1:1", aspect: 1 },
    { id: "landscape", label: "16:9", aspect: 16 / 9 },
    { id: "wide", label: "21:9", aspect: 21 / 9 },
    { id: "portrait", label: "3:4", aspect: 3 / 4 },
    { id: "logo", label: "Logó", aspect: 512 / 160 },
    { id: "custom", label: "Egyéni", aspect: -1 },
  ]
  if (recommendedAspect && Number.isFinite(recommendedAspect)) {
    presets.unshift({ id: "recommended", label: "Javasolt", aspect: recommendedAspect })
  }
  presets.push({ id: "full", label: "Teljes kép", aspect: null })
  return presets
}

export function defaultFlexiblePresetId(presets: AspectPreset[]) {
  return (
    presets.find((p) => p.id === "recommended")?.id ??
    presets.find((p) => p.id === "logo")?.id ??
    presets[0]?.id ??
    "square"
  )
}
