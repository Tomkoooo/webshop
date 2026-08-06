import { NextResponse } from "next/server"
import { auth } from "@wse/core/auth"
import { absoluteAppUrl } from "@wse/core/lib/auth-redirect"
import { activeOrgCookieOptions } from "@wse/plugin-t-book/lib/org-cookie"
import { resolveTBookPostLoginTarget } from "@wse/plugin-t-book/lib/post-login-redirect"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.redirect(absoluteAppUrl("/auth/admin-login", request.url))
  }

  const url = new URL(request.url)
  const callbackUrl = url.searchParams.get("callbackUrl")
  const { redirectPath, autoSelectOrgId } = await resolveTBookPostLoginTarget(callbackUrl)

  const response = NextResponse.redirect(absoluteAppUrl(redirectPath, request.url))

  if (autoSelectOrgId) {
    const cookie = activeOrgCookieOptions(autoSelectOrgId)
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      secure: cookie.secure,
      path: cookie.path,
      maxAge: cookie.maxAge,
    })
  }

  return response
}
