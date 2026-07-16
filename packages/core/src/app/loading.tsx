import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

/** Global Next.js route loading UI (storefront + admin). */
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}
