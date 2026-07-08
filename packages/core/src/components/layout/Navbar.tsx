"use client"

import * as React from "react"
import Link from "next/link"
import { RevealHeader } from "@wse/core/components/motion/css-reveal"
import { ShoppingCart, Search, Menu, UserRound } from "lucide-react"
import { cn } from "@wse/core/lib/utils"
import { Button } from "@wse/core/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@wse/core/components/ui/sheet"
import { Badge } from "@wse/core/components/ui/badge"

import type { ComponentType } from "react"
import { UserNav } from "./UserNav"
import { LiveSearch } from "./LiveSearch"
import { useCartStore } from "@wse/core/store/useCartStore"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import type { NavbarSearchSlotProps } from "@wse/sdk/templates/types"

const ALL_NAV_LINKS = [
  { name: "Rólunk", href: "/#about" },
  { name: "Üzenetünk", href: "/#features" },
  { name: "Bolt", href: "/shop", shopOnly: true as const },
  { name: "Kapcsolat", href: "/#contact" },
]

interface NavbarProps {
  brandName?: string
  logoSrc?: string
  /** Defaults to true. When false, shop/cart/search affordances are hidden. */
  shopEnabled?: boolean
  /**
   * Visual CMS editors: strip is not viewport-fixed; looks like storefront chrome but does not navigate
   * or open sheets; branding comes from props only (no refetch overwrite).
   */
  cmsChromePreview?: boolean
  /** Template `commerceSlots.NavbarSearch` overrides engine `LiveSearch` when storefront + shop enabled. */
  NavbarSearch?: ComponentType<NavbarSearchSlotProps>
}

export function Navbar({
  brandName = "Generic Webshop",
  logoSrc = "/generic-logo.svg",
  shopEnabled = true,
  cmsChromePreview = false,
  NavbarSearch,
}: NavbarProps) {
  const navLinks = shopEnabled ? ALL_NAV_LINKS : ALL_NAV_LINKS.filter((l) => !("shopOnly" in l))
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const resolvedBrand = { brandName, logoSrc }

  const closeMobileMenuOnLinkClick = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.target instanceof HTMLElement ? event.target : null
    if (target?.closest("a[href]")) {
      setIsMobileMenuOpen(false)
    }
  }, [])

  React.useEffect(() => {
    if (cmsChromePreview) return
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [cmsChromePreview])

  const logoBlock = (
    <div className="relative h-10 w-40 sm:h-12 sm:w-48 lg:h-14 lg:w-56">
      <FallbackImage
        src={resolvedBrand.logoSrc}
        alt={resolvedBrand.brandName}
        fill
        className="object-contain"
        priority
      />
    </div>
  )

  const linkClass =
    "text-[11px] font-black uppercase tracking-[0.25em] whitespace-nowrap text-muted-foreground"

  const centerNav = cmsChromePreview ? (
    <nav
      aria-label="Menü előnézet (nem kattintható)"
      className="hidden items-center justify-center gap-8 lg:flex xl:gap-14"
    >
      {navLinks.map((link) => (
        <span key={link.name} className={cn(linkClass, "relative cursor-default")}>
          {link.name}
          <span className="absolute -bottom-2 left-0 h-[2px] w-full bg-primary-foreground/40" aria-hidden />
        </span>
      ))}
    </nav>
  ) : (
    <nav className="hidden min-w-0 items-center justify-center gap-6 lg:flex xl:gap-14">
      {navLinks.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className="group relative whitespace-nowrap text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {link.name}
          <span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-primary-foreground transition-all duration-300 group-hover:w-full" />
        </Link>
      ))}
    </nav>
  )

  const actions = cmsChromePreview ? (
    <div className="flex flex-none cursor-default items-center gap-6 text-muted-foreground lg:gap-10 select-none">
      {shopEnabled ? (
        <>
          <Search className="hidden h-5 w-5 lg:block" aria-hidden />
          <div className="relative hidden lg:block">
            <ShoppingCart className="h-6 w-6" aria-hidden />
          </div>
        </>
      ) : null}
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70">
        <UserRound className="h-5 w-5" aria-hidden />
      </span>
    </div>
  ) : (
    <div className="flex min-w-0 flex-none items-center gap-4 lg:gap-6 2xl:gap-10">
      {shopEnabled ? (
        <>
          <div className="hidden min-w-0 shrink lg:block">
            {NavbarSearch ? (
              <NavbarSearch className="w-36 transition-all duration-300 focus-within:w-44 2xl:w-44 2xl:focus-within:w-52" />
            ) : (
              <LiveSearch className="w-36 transition-all duration-300 focus-within:w-44 2xl:w-44 2xl:focus-within:w-52" />
            )}
          </div>

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="group relative h-10 w-10 p-0 hover:bg-transparent"
          >
            <Link href="/cart">
              <ShoppingCart className="h-6 w-6 text-foreground transition-colors group-hover:text-primary-foreground" />
              <CartCountBadge />
            </Link>
          </Button>
        </>
      ) : null}

      <UserNav />

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-2 h-10 w-10 p-0 md:hidden lg:hidden">
            <Menu className="h-8 w-8 text-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full border-border bg-background-dark sm:max-w-md"
          onClickCapture={closeMobileMenuOnLinkClick}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="mt-20 flex flex-col gap-10 px-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="font-heading text-3xl font-black uppercase tracking-widest text-foreground transition-colors hover:text-primary-foreground"
              >
                {link.name}
              </Link>
            ))}

            {shopEnabled ? (
              <div className="mt-10">
                {NavbarSearch ? (
                  <NavbarSearch placeholder="SEARCH..." inputClassName="h-16 text-lg" />
                ) : (
                  <LiveSearch placeholder="SEARCH..." inputClassName="h-16 text-lg" />
                )}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )

  const bar = (
    <div className="container mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6">
      <div className="min-w-0 justify-self-start">
        {cmsChromePreview ? (
          <div className="pointer-events-none flex items-center select-none">{logoBlock}</div>
        ) : (
          <Link href="/" className="group flex items-center">
            {logoBlock}
          </Link>
        )}
      </div>

      <div className="hidden min-w-0 justify-self-center lg:block">{centerNav}</div>

      <div className="min-w-0 justify-self-end">{actions}</div>
    </div>
  )

  if (cmsChromePreview) {
    return (
      <header
        className="relative z-10 w-full shrink-0 border-b border-white/10 bg-background-dark/95 py-5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)]"
        aria-label="Fejléc előnézet a CMS-ben (nem ragadós, nem vezet navigáció)"
      >
        {bar}
      </header>
    )
  }

  return (
    <RevealHeader
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-background-dark/95 py-4 supports-[(-webkit-touch-callout:none)]:backdrop-blur-none supports-[(-webkit-touch-callout:none)]:bg-background-dark supports-[(-webkit-touch-callout:none)]:[-webkit-backdrop-filter:none] backdrop-blur-2xl"
          : "bg-transparent py-10"
      )}
    >
      {bar}
    </RevealHeader>
  )
}

function CartCountBadge() {
  const [mounted, setMounted] = React.useState(false)
  const totalItems = useCartStore((state) => state.totalItems)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (totalItems === 0) return null

  return (
    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center border-none bg-primary p-0 text-[10px] font-black text-white">
      {totalItems}
    </Badge>
  )
}
