/**
 * Parse Supabase auth failure details from query params and/or URL hash fragments.
 * Magic-link failures often arrive as `#error=access_denied&error_code=otp_expired`
 * (hash is not visible to the server callback — only to the browser).
 */
export function parseAuthErrorParams(
  searchParams: URLSearchParams | null | undefined,
  hash: string | null | undefined
): {
  error: string | null
  errorCode: string | null
  errorDescription: string | null
} {
  const fromSearch = {
    error: searchParams?.get("error")?.trim() || null,
    errorCode: searchParams?.get("error_code")?.trim() || null,
    errorDescription: searchParams?.get("error_description")?.trim() || null,
  }

  const rawHash = (hash ?? "").trim()
  const hashQuery = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash
  let fromHash = { error: null as string | null, errorCode: null as string | null, errorDescription: null as string | null }
  if (hashQuery) {
    try {
      const hp = new URLSearchParams(hashQuery)
      fromHash = {
        error: hp.get("error")?.trim() || null,
        errorCode: hp.get("error_code")?.trim() || null,
        errorDescription: hp.get("error_description")?.trim() || null,
      }
    } catch {
      // ignore malformed hash
    }
  }

  return {
    error: fromSearch.error ?? fromHash.error,
    errorCode: fromSearch.errorCode ?? fromHash.errorCode,
    errorDescription: fromSearch.errorDescription ?? fromHash.errorDescription,
  }
}

export function authErrorUserMessage(opts: {
  error: string | null
  errorCode: string | null
  errorDescription: string | null
}): { title: string; detail: string; hint: string } {
  const code = (opts.errorCode ?? "").toLowerCase()
  const err = (opts.error ?? "").toLowerCase()
  const desc = (opts.errorDescription ?? "").toLowerCase()

  if (code === "otp_expired" || desc.includes("otp_expired") || desc.includes("expired")) {
    return {
      title: "Login link expired or already used",
      detail:
        "This magic link is no longer valid. Links expire after about an hour and can only be used once.",
      hint: "Request a new login link and open it on the same device and browser where you started sign-in.",
    }
  }

  if (code === "missing_auth_params" || code === "exchange_failed") {
    return {
      title: "Could not complete sign-in",
      detail:
        opts.errorDescription?.trim() ||
        "The login callback did not receive a usable auth code. This often means the link was opened in a different browser than where sign-in started.",
      hint: "Request a new link and open it in the same browser. Prefer www.foodtruckclt.com or vendor.foodtruckclt.com consistently.",
    }
  }

  if (err === "access_denied" || code === "access_denied") {
    return {
      title: "Sign-in was denied",
      detail: opts.errorDescription?.trim() || "Supabase denied this login attempt.",
      hint: "Request a fresh login link. If this keeps happening, confirm Supabase Redirect URLs include your callback domain.",
    }
  }

  if (opts.error || opts.errorCode || opts.errorDescription) {
    return {
      title: "Sign-in failed",
      detail: [opts.errorCode, opts.errorDescription || opts.error].filter(Boolean).join(" — "),
      hint: "Request a new login link from the vendor login page.",
    }
  }

  return {
    title: "Login link expired",
    detail: "Magic links expire after about an hour, or may have already been used.",
    hint: "Request a new one from the vendor login page and open it on the same device/browser.",
  }
}

/** Build /auth/error query string from callback failures (never includes secrets). */
export function buildAuthErrorPath(opts: {
  error?: string | null
  errorCode?: string | null
  errorDescription?: string | null
  next?: string | null
}): string {
  const params = new URLSearchParams()
  if (opts.error?.trim()) params.set("error", opts.error.trim())
  if (opts.errorCode?.trim()) params.set("error_code", opts.errorCode.trim())
  if (opts.errorDescription?.trim()) {
    params.set("error_description", opts.errorDescription.trim().slice(0, 300))
  }
  if (opts.next?.trim()?.startsWith("/") && !opts.next.includes("://")) {
    params.set("next", opts.next.trim())
  }
  const q = params.toString()
  return q ? `/auth/error?${q}` : "/auth/error"
}
