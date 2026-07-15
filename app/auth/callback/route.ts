import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { safeAuthNextPath } from "@/lib/auth/safe-auth-next-path"
import { buildAuthErrorPath } from "@/lib/auth/auth-error-message"
import { getRoleSubdomainFromHost } from "@/lib/subdomain-routing"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const rawHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? ""
  const defaultNext =
    getRoleSubdomainFromHost(rawHost) === "vendor" ? "/dashboard/live" : "/dashboard"

  const nextParam = searchParams.get("next")
  const next = safeAuthNextPath(nextParam, defaultNext)

  /** Supabase may bounce failed verifies with query error params (hash handled client-side on /auth/error). */
  const inboundError = searchParams.get("error")
  const inboundErrorCode = searchParams.get("error_code")
  const inboundErrorDescription = searchParams.get("error_description")
  if (inboundError || inboundErrorCode) {
    return NextResponse.redirect(
      `${origin}${buildAuthErrorPath({
        error: inboundError,
        errorCode: inboundErrorCode,
        errorDescription: inboundErrorDescription,
        next,
      })}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(
      `${origin}${buildAuthErrorPath({
        error: "access_denied",
        errorCode: error.code ?? "exchange_failed",
        errorDescription: error.message,
        next,
      })}`
    )
  }

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "magiclink" | "recovery" | "invite" | "signup" | "email_change",
    })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(
      `${origin}${buildAuthErrorPath({
        error: "access_denied",
        errorCode: error.code ?? "otp_verify_failed",
        errorDescription: error.message,
        next,
      })}`
    )
  }

  /**
   * No code/token in the query string. Common when Supabase put failure details in the URL hash
   * (`#error=access_denied&error_code=otp_expired`) — the server cannot read the hash, so the
   * client /auth/error page must parse it. Preserve `next` for retry.
   */
  return NextResponse.redirect(
    `${origin}${buildAuthErrorPath({
      error: "access_denied",
      errorCode: "missing_auth_params",
      errorDescription:
        "No auth code was present on the callback URL. The link may be expired, already used, or opened in a different browser than where sign-in started.",
      next,
    })}`
  )
}
