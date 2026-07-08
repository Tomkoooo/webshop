"use client"

import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import {
  KERAMIA_BRAND,
  KERAMIA_BRAND_SHORT,
  KERAMIA_BRAND_SUB,
  KERAMIA_LOGO,
} from "../lib/constants"

type Props = {
  href?: string
  logoSrc?: string
  brandName?: string
  onClick?: () => void
  light?: boolean
}

export function KeramiaBrandLogo({ href = "/", logoSrc, brandName, onClick, light = true }: Props) {
  const img = logoSrc || KERAMIA_LOGO
  const alt = brandName || KERAMIA_BRAND

  const inner = (
    <>
      <FallbackImage
        src={mediaImageSrc(img)}
        alt={alt}
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
      />
      <div className="flex flex-col">
        <span
          className={
            light
              ? "keramia-serif text-lg font-bold uppercase tracking-[0.2em] text-[#fffdf9] transition-colors group-hover:text-primary"
              : "keramia-serif text-lg font-bold uppercase tracking-[0.2em] text-foreground"
          }
        >
          {KERAMIA_BRAND_SHORT}
        </span>
        <span className="keramia-display text-[10px] tracking-[0.25em] text-primary uppercase">
          {KERAMIA_BRAND_SUB}
        </span>
      </div>
    </>
  )

  const className = "group flex min-h-11 items-center gap-3"

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {inner}
      </Link>
    )
  }

  return (
    <span className={className} onClick={onClick} role={onClick ? "button" : undefined}>
      {inner}
    </span>
  )
}
