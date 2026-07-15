import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { TBookTestPlayground } from "@wse/plugin-t-book/storefront/TBookTestPlayground"
import { resolveTBookServerApiBase } from "@wse/plugin-t-book/lib/tbook-api-base"

export default async function TBookTestPage() {
  const enabled = await PluginService.isEnabled("t-book")
  if (!enabled) notFound()

  const defaultApiKey = process.env.NEXT_PUBLIC_TBOOK_TEST_API_KEY ?? ""
  const apiBase = resolveTBookServerApiBase()

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10">
      <TBookTestPlayground defaultApiKey={defaultApiKey} apiBase={apiBase} />
    </main>
  )
}
