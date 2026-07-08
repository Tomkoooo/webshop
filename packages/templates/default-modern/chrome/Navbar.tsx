import { Navbar as DefaultModernNavbarImpl } from "@wse/core/components/layout/Navbar"
import type { ChromeProps } from "@wse/sdk/templates/types"

export function Navbar({
  brandName,
  logoSrc,
  shopEnabled = true,
  cmsChromePreview,
  NavbarSearch,
}: ChromeProps) {
  return (
    <DefaultModernNavbarImpl
      brandName={brandName}
      logoSrc={logoSrc}
      shopEnabled={shopEnabled}
      cmsChromePreview={cmsChromePreview}
      NavbarSearch={NavbarSearch}
    />
  )
}
