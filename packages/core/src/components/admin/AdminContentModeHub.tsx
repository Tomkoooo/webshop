import Link from "next/link"
import { MessageSquare, Puzzle, Sparkles } from "lucide-react"
import { AdminNavCard, AdminNavCardGrid } from "@wse/core/components/admin/AdminNavCard"
import { AdminPageScaffold, AdminSection } from "@wse/core/components/admin/AdminPageScaffold"
import { Button } from "@wse/core/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@wse/core/components/ui/card"

export function AdminContentModeHub({
  plugins,
  pendingPlugins = [],
}: {
  plugins: Array<{ id: string; name: string; href: string }>
  pendingPlugins?: Array<{ id: string; name: string; settingsHref: string }>
}) {
  return (
    <AdminPageScaffold
      title="Admin"
      description="A webshop ki van kapcsolva. Válassz plugint a napi munkához, vagy a tartalom / rendszer menüket."
    >
      {pendingPlugins.length > 0 ? (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Bekapcsolandó pluginek</CardTitle>
            <CardDescription>
              Ezek telepítve vannak, de még nincsenek engedélyezve a rendszerbeállításokban.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPlugins.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">{p.name}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href={p.settingsHref}>Bekapcsolás</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <AdminSection title="Pluginek" description="Napi működés — foglalások, kampányok, egyedi modulok.">
        <AdminNavCardGrid columns="two">
          {plugins.map((p) => (
            <AdminNavCard
              key={p.id}
              href={p.href}
              title={p.name}
              description="Plugin admin felület megnyitása"
              icon={Puzzle}
              accent="settings"
            />
          ))}
        </AdminNavCardGrid>
      </AdminSection>

      <AdminSection title="Tartalom és üzenetek" description="Honlap szerkesztése és beérkező üzenetek.">
        <AdminNavCardGrid columns="two">
          <AdminNavCard
            href="/admin/cms"
            title="CMS"
            description="Oldalak, szövegek, téma, SEO és popup kampányok."
            icon={Sparkles}
            accent="settings"
          />
          <AdminNavCard
            href="/admin/contact"
            title="Kapcsolat"
            description="Beérkező üzenetek és válaszok kezelése."
            icon={MessageSquare}
          />
        </AdminNavCardGrid>
      </AdminSection>
    </AdminPageScaffold>
  )
}
