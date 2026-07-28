"use client"

import { Suspense, useMemo, useState, FormEvent, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { resolveVendorLoginCallbackNext } from "@/lib/dashboard/vendor-dashboard-opportunity-link"

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const nextPath = useMemo(
    () => resolveVendorLoginCallbackNext(searchParams.get("next"), "/dashboard"),
    [searchParams]
  )

  useEffect(() => {
    let cancelled = false
    async function check() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!cancelled) {
        setHasSession(Boolean(session))
        setCheckingSession(false)
      }
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setSuccess(true)
      router.replace(nextPath)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <p className="text-sm text-muted-foreground">Checking your session…</p>
  }

  if (!hasSession) {
    return (
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-display text-2xl">Link expired or missing</CardTitle>
          <CardDescription>
            Open the newest password reset email on this device, or request another link from the
            vendor login page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={`/vendor-login?next=${encodeURIComponent(nextPath)}`}>Back to vendor login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-2 text-center">
        <Link
          href="/"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary"
        >
          <Truck className="h-6 w-6 text-primary-foreground" />
        </Link>
        <CardTitle className="font-display text-2xl">Set your password</CardTitle>
        <CardDescription>
          Choose a password so you can stay signed in and respond to booking opportunities without
          requesting a new magic link each time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium text-foreground">
              New password
            </label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">
              Confirm password
            </label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-sm text-green-700 dark:text-green-400" role="status">
              Password updated. Taking you to your dashboard…
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Save password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function VendorUpdatePasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  )
}
