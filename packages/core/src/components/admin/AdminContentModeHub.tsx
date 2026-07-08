import Link from "next/link"

export function AdminContentModeHub({
  plugins,
}: {
  plugins: Array<{ id: string; name: string; href: string }>
}) {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-xl">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 uppercase italic text-white">
          Admin <span className="admin-headline-accent">tartalom</span>
        </h1>
        <p className="text-white/40 font-medium italic">
          A webshop ki van kapcsolva. Válassz plugint az üzleti mutatókhoz, vagy a CMS / beállítások
          menüt a honlaphoz.
        </p>
      </div>
      <div className="flex flex-col gap-3 text-sm font-bold uppercase tracking-widest">
        {plugins.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-5 py-4 text-white hover:border-amber-400/50"
          >
            {p.name}
          </Link>
        ))}
        <Link
          href="/admin/cms"
          className="rounded-lg border border-white/15 bg-white/5 px-5 py-4 text-white hover:border-white/30"
        >
          CMS
        </Link>
        <Link
          href="/admin/contact"
          className="rounded-lg border border-white/15 bg-white/5 px-5 py-4 text-white hover:border-white/30"
        >
          Kapcsolat
        </Link>
        <Link
          href="/admin/info"
          className="rounded-lg border border-white/15 bg-white/5 px-5 py-4 text-white hover:border-white/30"
        >
          Beállítások
        </Link>
      </div>
    </div>
  )
}
