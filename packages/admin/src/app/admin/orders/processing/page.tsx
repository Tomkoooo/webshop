import { redirect } from "next/navigation"

type ProcessingSearchParams = Promise<{
  status?: string
  dateFrom?: string
  dateTo?: string
  rangeStart?: string
  rangeEnd?: string
}>

/**
 * The standalone processing screen is now the "Munkamegosztás" (assignment) view
 * of the unified order workspace. Preserve any incoming filters on redirect.
 */
export default async function OrderProcessingPage({
  searchParams,
}: {
  searchParams: ProcessingSearchParams
}) {
  const params = await searchParams
  const query = new URLSearchParams({ view: "assign" })
  if (params.status && params.status !== "all") query.set("status", params.status)
  if (params.dateFrom) query.set("dateFrom", params.dateFrom)
  if (params.dateTo) query.set("dateTo", params.dateTo)
  if (params.rangeStart) query.set("assignStart", params.rangeStart)
  if (params.rangeEnd) query.set("assignEnd", params.rangeEnd)
  redirect(`/admin/orders?${query.toString()}`)
}
