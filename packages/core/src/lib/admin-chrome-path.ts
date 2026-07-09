/** Paths that use the admin operator chrome — skip storefront client sync (cart, popups, etc.). */
export function isAdminChromePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth/admin-login")
  )
}
