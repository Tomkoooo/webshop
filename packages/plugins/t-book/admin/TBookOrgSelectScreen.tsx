"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@wse/core/components/ui/card"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"
import { tbookOrgApi } from "./org-api"

export function TBookOrgSelectScreen() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<
    { id: string; name: string; slug: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void tbookOrgApi
      .myOrganizations()
      .then((res) => setOrganizations(res.organizations))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function selectOrg(id: string) {
    await tbookOrgApi.switchOrg(id)
    router.push("/admin")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <AdminPageScaffold
      title="Szervezet kiválasztása"
      description="Válaszd ki, melyik szervezet admin felületére szeretnél belépni."
    >
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {!error && organizations.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nincs elérhető szervezet a fiókodhoz. Kérd meg a szervezet adminját, hogy adjon hozzá, vagy
          fogadd el a meghívót e-mailben.
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                <Building2 className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">{org.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{org.slug}</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button type="button" onClick={() => void selectOrg(org.id)}>
                Belépés
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageScaffold>
  )
}
