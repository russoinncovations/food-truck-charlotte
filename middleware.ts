import { updateSession } from '@/lib/supabase/middleware'
import { getRoleSubdomainFromHost, roleHostRootRedirectTarget } from '@/lib/subdomain-routing'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)

  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams

  /** When Supabase can't complete magic-link OAuth, Site URL `/` often gets `error` / `error_code` query params — keep users on-path with /auth/error (same host, including vendor.*). */
  if (
    pathname === '/' &&
    (searchParams.has('error_code') || searchParams.get('error') === 'access_denied')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/error'
    url.search = ''
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectResponse.headers.append(key, value)
      }
    })
    return redirectResponse
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const role = getRoleSubdomainFromHost(host)
  if (role && request.nextUrl.pathname === '/') {
    const target = roleHostRootRedirectTarget(role)
    const url = request.nextUrl.clone()
    url.pathname = target
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectResponse.headers.append(key, value)
      }
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
