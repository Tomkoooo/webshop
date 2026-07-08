import Link from "next/link"
import type { ChromeProps } from "@wse/sdk/templates/types"

export function Navbar({ brandName, logoSrc, venueBadge }: ChromeProps) {
  return (
    <header className="minecraft-nav sticky top-0 z-50 border-b-4 border-[#2d1810] bg-[#2d3a2a]">
      <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-9 w-9 object-contain pixelated" />
          ) : null}
          <span className="font-minecraft text-[8px] md:text-[10px] text-white drop-shadow-[2px_2px_0_#000] hidden sm:inline">
            {brandName}
          </span>
        </Link>
        {venueBadge ? (
          <span className="hidden md:inline-block rounded-md bg-[#1a3d5c] px-3 py-1.5 font-minecraft text-[8px] text-white border-2 border-[#0d2840] max-w-[220px] truncate">
            {venueBadge}
          </span>
        ) : null}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/#taborok"
            className="font-minecraft text-[8px] text-white/90 hover:underline hidden sm:inline"
          >
            Turnusok
          </Link>
          <Link
            href="/jegyvasarlas"
            className="minecraft-btn text-[8px] md:text-[10px] py-2 px-3 bg-[#5D9B38]"
          >
            Jelentkezés
          </Link>
        </div>
      </div>
      {venueBadge ? (
        <p className="md:hidden text-center pb-2 font-minecraft text-[8px] text-white/80 px-4">
          {venueBadge}
        </p>
      ) : null}
    </header>
  )
}
