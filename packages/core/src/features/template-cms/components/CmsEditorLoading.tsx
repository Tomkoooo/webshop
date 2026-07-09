import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

export function CmsEditorLoading({ label = "CMS szerkesztő betöltése…" }: { label?: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl bg-muted/30 p-8 text-center">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
