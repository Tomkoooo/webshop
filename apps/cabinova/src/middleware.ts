import type { NextFetchEvent, NextRequest } from "next/server"
import { storefrontMiddleware } from "@wse/core/middleware"

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  return storefrontMiddleware(request, event as never)
}

/** Kept inline so Next can statically read the matcher (mirrors @wse/core/middleware). */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
