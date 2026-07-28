"use client"

import { Suspense, useState, FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { getRoleSubdomainFromHost } from "@/lib/subdomain-routing"
import { resolveVendorLoginCallbackNext } from "@/lib/dashboard/vendor-dashboard-opportunity-link"
import { cn } from "@/lib/utils"

type AuthMode = "password" | "signup" | "magic" | "forgot"

function modeDescription(mode: AuthMode): string {
  switch (mode) {
    case "password":
      return "Sign in with your email and password to stay logged in on this device."
    case "signup":
      return "Create a password account so you can return without requesting a new magic link."
    case "magic":
      return "Prefer email? We’ll send a one-time magic link as a backup option."
    case "forgot":
      return "Enter the email you use for FoodTruckCLT. We’ll send a link to set or reset your password."
  }
}

function VendorLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function resolvePostAuthPath() {
    const host = window.location.host
    const defaultPostAuthPath =
      getRoleSubdomainFromHost(host) === "vendor" ? "/dashboard/live" : "/dashboard"
    return resolveVendorLoginCallbackNext(searchParams.get("next"), defaultPostAuthPath)
  }

  function authCallbackUrl(nextPath: string) {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    setError(null)
    setSuccess(null)
    setPassword("")
    setConfirmPassword("")
  }

  async function handlePasswordSignIn() {
    const postAuthPath = resolvePostAuthPath()
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError) {
      setError(signInError.message)
      return
    }
    router.replace(postAuthPath)
    router.refresh()
  }

  async function handleSignUp() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    const postAuthPath = resolvePostAuthPath()
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: authCallbackUrl(postAuthPath),
      },
    })
    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data.session) {
      router.replace(postAuthPath)
      router.refresh()
      return
    }

    setSuccess(
      "Check your email to confirm your account. After confirming, you can sign in with your password."
    )
  }

  async function handleMagicLink() {
    const postAuthPath = resolvePostAuthPath()
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: authCallbackUrl(postAuthPath),
      },
    })
    if (signInError) {
      setError(signInError.message)
      return
    }
    setSuccess(
      "Check your email for a login link. Open the newest link on this same device and browser."
    )
  }

  async function handleForgotPassword() {
    const postAuthPath = resolvePostAuthPath()
    const supabase = createClient()
    const updatePasswordPath = `/vendor-login/update-password?next=${encodeURIComponent(postAuthPath)}`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authCallbackUrl(updatePasswordPath),
    })
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSuccess(
      "If an account exists for that email, you’ll receive a password reset link shortly. Open the newest link to set or reset your password."
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (mode === "password") await handlePasswordSignIn()
      else if (mode === "signup") await handleSignUp()
      else if (mode === "magic") await handleMagicLink()
      else await handleForgotPassword()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const showPassword = mode === "password" || mode === "signup"
  const showConfirm = mode === "signup"

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-2 text-center">
        <Link
          href="/"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary"
        >
          <Truck className="h-6 w-6 text-primary-foreground" />
        </Link>
        <CardTitle className="font-display text-2xl">FoodTruck CLT</CardTitle>
        <CardDescription>{modeDescription(mode)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-md border border-border/70 bg-muted/40 p-1">
          {(
            [
              ["password", "Password"],
              ["signup", "Create account"],
              ["magic", "Magic link"],
              ["forgot", "Forgot password"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMode(key)}
              className={cn(
                "rounded px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                mode === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="vendor-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="vendor-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {showPassword ? (
            <div className="space-y-2">
              <label htmlFor="vendor-password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="vendor-password"
                name="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "signup" ? 8 : 1}
                disabled={loading}
              />
            </div>
          ) : null}

          {showConfirm ? (
            <div className="space-y-2">
              <label htmlFor="vendor-password-confirm" className="text-sm font-medium text-foreground">
                Confirm password
              </label>
              <Input
                id="vendor-password-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <div className="space-y-1" role="status">
              <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
              {mode === "magic" ? (
                <p className="text-xs text-muted-foreground">
                  Older links expire or stop working after one use.
                </p>
              ) : null}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full bg-[#D94F1E] text-white font-medium hover:bg-[#b8441a]"
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : mode === "password"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : mode === "magic"
                    ? "Send login link"
                    : "Send reset link"}
          </Button>
        </form>

        {mode === "password" ? (
          <p className="text-center text-xs text-muted-foreground">
            Already use FoodTruckCLT with magic link? Use{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => switchMode("forgot")}
            >
              Forgot password
            </button>{" "}
            to set a password for your existing account.
          </p>
        ) : null}

        {mode === "signup" ? (
          <p className="text-center text-xs text-muted-foreground">
            Already received FoodTruckCLT request emails? Use{" "}
            <button
              type="button"
              className="underline underline-offset-2 hover:text-foreground"
              onClick={() => switchMode("forgot")}
            >
              Forgot password
            </button>{" "}
            instead of creating a new account.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default function VendorLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <VendorLoginForm />
      </Suspense>
    </div>
  )
}
