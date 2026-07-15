import { TBookSystemOrgDetailScreen } from "@wse/plugin-t-book/admin/TBookSystemOrgDetailScreen"

export default async function SystemOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TBookSystemOrgDetailScreen orgId={id} />
}
