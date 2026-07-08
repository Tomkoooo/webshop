import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background-dark">
      <LoadingSpinner size="lg" />
    </div>
  )
}
