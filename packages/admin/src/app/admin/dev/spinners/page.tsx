import { SpinnerPreviewClient } from "@wse/core/components/admin/dev/SpinnerPreviewClient"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"

export default function AdminSpinnerPreviewPage() {
  return (
    <AdminPageScaffold
      backHref="/admin/info"
      backLabel="Beállítások"
      title="Loading spinners"
      description="Side-by-side preview of every spinner variant in the repo, with Tailwind classes and live theme CSS variables."
    >
      <SpinnerPreviewClient />
    </AdminPageScaffold>
  )
}
