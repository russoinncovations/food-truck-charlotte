import { updateSession } from '@/lib/supabase/middleware'
import { getRoleSubdomainFromHost, roleHostRootRedirectTarget } from '@/lib/subdomain-routing'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)

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
