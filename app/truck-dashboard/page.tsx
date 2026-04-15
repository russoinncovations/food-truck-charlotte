"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TruckDashboardLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClientComponentClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) {
        router.replace("/truck-dashboard/profile");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClientComponentClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/truck-dashboard/profile");
  }

  return (
    <div
      className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16"
      style={{ background: "var(--ftc-cream)", color: "var(--ftc-ink)" }}
    >
      <h1
        className="font-display mb-2 text-center text-3xl font-extrabold tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "var(--ftc-ink)" }}
      >
        Truck owner login
      </h1>
      <p className="mb-8 text-center text-sm" style={{ color: "var(--ftc-muted)" }}>
        Sign in with the email on your listing.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border bg-white p-6" style={{ borderColor: "var(--ftc-border)", boxShadow: "var(--shadow-soft)" }}>
        <label className="flex flex-col gap-1.5 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border px-3 py-2.5 text-[15px] outline-none focus:ring-2"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium" style={{ color: "var(--ftc-ink-lt)" }}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border px-3 py-2.5 text-[15px] outline-none focus:ring-2"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          />
        </label>
        {error ? (
          <p className="text-sm" style={{ color: "var(--ftc-orange)" }}>
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="font-display mt-2 rounded-lg py-3 text-[15px] font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--ftc-orange)" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
