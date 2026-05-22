import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { safeAuthNextPath } from '@/lib/auth/safe-auth-next-path'
import { getRoleSubdomainFromHost } from '@/lib/subdomain-routing'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const rawHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  const defaultNext =
    getRoleSubdomainFromHost(rawHost) === 'vendor' ? '/dashboard/live' : '/dashboard'

  const nextParam = searchParams.get('next')
  const next = safeAuthNextPath(nextParam, defaultNext)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
