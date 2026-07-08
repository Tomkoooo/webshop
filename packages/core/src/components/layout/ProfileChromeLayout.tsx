import Link from "next/link"
import type { FlowProfileRouteChromeProps } from "@wse/sdk/templates/types"

const navClass =
  "group flex items-center justify-between border border-border px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground transition-all hover:border-primary-foreground/40 hover:bg-primary/10"

/** Default profile area chrome (sidebar + main column). */
export function ProfileChromeLayout({ children, shopEnabled: _shopEnabled }: FlowProfileRouteChromeProps) {
  void _shopEnabled
  return (
    <div className="min-h-0 px-6 pb-20 pt-12 md:pt-16">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col gap-12 md:flex-row">
          <aside className="w-full shrink-0 space-y-2 md:w-64">
            <h1 className="mb-8 text-3xl font-black uppercase tracking-widest text-foreground">Profil</h1>
            <nav className="flex flex-col space-y-2">
              <Link href="/profile" className={navClass}>
                Adataim
              </Link>
              <Link href="/profile/orders" className={navClass}>
                Rendeléseim
              </Link>
              <Link href="/profile/feedback" className={navClass}>
                Bolt értékelése
              </Link>
            </nav>
          </aside>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
