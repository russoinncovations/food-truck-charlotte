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

type AuthMode = "password" | "signup" | "magic" | "forgot"

function modeHeading(mode: AuthMode): { title: string; description: string } {
  switch (mode) {
    case "password":
      return {
        title: "Vendor Login",
        description:
          "Sign in to view requests, respond to opportunities, and manage your truck profile.",
      }
    case "signup":
      return {
        title: "Create account",
        description: "Create a password account so you can return without requesting a new magic link.",
      }
    case "magic":
      return {
        title: "Send magic link",
        description: "We’ll send a one-time login link to your email.",
      }
    case "forgot":
      return {
        title: "Set a password",
        description:
          "Enter the email you use for FoodTruckCLT. We’ll send a link to set or reset your password.",
      }
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
  const heading = modeHeading(mode)

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-2 text-center">
        <Link
          href="/"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary"
        >
          <Truck className="h-6 w-6 text-primary-foreground" />
        </Link>
        <CardTitle className="font-display text-2xl">{heading.title}</CardTitle>
        <CardDescription>{heading.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                    : "Send password link"}
          </Button>
        </form>

        {mode === "password" ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Already received FoodTruckCLT request emails?
              <br />
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                onClick={() => switchMode("forgot")}
              >
                Set a password
              </button>{" "}
              for your existing account.
            </p>

            <div className="space-y-2 border-t border-border/60 pt-4 text-center text-sm text-muted-foreground">
              <p>
                New to FoodTruckCLT?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                  onClick={() => switchMode("signup")}
                >
                  Create account
                </button>
              </p>
              <p className="text-xs">
                Prefer email login?{" "}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={() => switchMode("magic")}
                >
                  Send magic link
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <p>
                Already received FoodTruckCLT request emails?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
                  onClick={() => switchMode("forgot")}
                >
                  Set a password
                </button>{" "}
                for your existing account.
              </p>
            ) : null}
            <p>
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => switchMode("password")}
              >
                Back to sign in
              </button>
            </p>
          </div>
        )}
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
