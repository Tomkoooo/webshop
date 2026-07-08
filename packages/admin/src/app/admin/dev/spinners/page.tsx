import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SpinnerPreviewClient } from "@wse/core/components/admin/dev/SpinnerPreviewClient"

export default function AdminSpinnerPreviewPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <Link
          href="/admin/info"
          className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Beállítások
        </Link>
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
          Loading <span className="admin-headline-accent">spinners</span>
        </h1>
        <p className="text-white/40 font-medium italic max-w-2xl">
          Side-by-side preview of every spinner variant in the repo, with Tailwind classes and
          live theme CSS variables.
        </p>
      </div>

      <SpinnerPreviewClient />
    </div>
  )
}
