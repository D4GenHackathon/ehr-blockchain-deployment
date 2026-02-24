import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authPagePrefixes = ["/sign-in", "/sign-up", "/forgot-password"]
const systemPublicPrefixes = ["/errors"]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/sign-up", request.url))
  }

  const isAuthPage = authPagePrefixes.some((prefix) => pathname.startsWith(prefix))
  const isSystemPublicPage = systemPublicPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  )
  const hasSession = Boolean(request.cookies.get("d4gen_session")?.value)

  if (!hasSession && !isAuthPage && !isSystemPublicPage) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
