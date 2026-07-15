"use client"

import { Suspense, useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { authErrorUserMessage, parseAuthErrorParams } from "@/lib/auth/auth-error-message"
import { safeAuthNextPath } from "@/lib/auth/safe-auth-next-path"

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange)
  return () => window.removeEventListener("hashchange", onStoreChange)
}

function getHashSnapshot() {
  return window.location.hash || ""
}

function getServerHashSnapshot() {
  return ""
}

function useLocationHash() {
  return useSyncExternalStore(subscribeHash, getHashSnapshot, getServerHashSnapshot)
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const hash = useLocationHash()

  const parsed = useMemo(
    () => parseAuthErrorParams(new URLSearchParams(searchParams.toString()), hash),
    [searchParams, hash]
  )
  const message = authErrorUserMessage(parsed)
  const next = safeAuthNextPath(searchParams.get("next"), "/dashboard")
  const loginHref =
    next && next !== "/dashboard"
      ? `/vendor-login?next=${encodeURIComponent(next)}`
      : "/vendor-login"

  return (
    <div className="text-center max-w-md px-4">
      <h1 className="text-2xl font-bold mb-2">{message.title}</h1>
      <p className="text-muted-foreground mb-3">{message.detail}</p>
      <p className="text-sm text-muted-foreground mb-6">{message.hint}</p>
      {(parsed.errorCode || parsed.error) && (
        <p className="text-xs text-muted-foreground mb-6 font-mono break-all">
          {[parsed.errorCode, parsed.error].filter(Boolean).join(" · ")}
        </p>
      )}
      <Link href={loginHref} className="text-primary underline">
        Request a new login link
      </Link>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  )
}
