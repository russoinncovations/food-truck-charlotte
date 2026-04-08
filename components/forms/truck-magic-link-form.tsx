"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#1E1E1E]/15 bg-[#fffdf9] px-4 py-3 text-[15px] text-[#1E1E1E] outline-none ring-[#D97A2B] focus:ring-2";

const buttonClass =
  "inline-flex w-full max-w-full justify-center rounded-full bg-[#D97A2B] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:bg-[#c76e25] disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit";

type TruckMagicLinkFormProps = {
  /** When true, shows helper text between email and submit (e.g. /trucks/login). */
  showLoginHelper?: boolean;
};

export function TruckMagicLinkForm({ showLoginHelper = false }: TruckMagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage({ type: "err", text: error.message });
        return;
      }
      setMessage({
        type: "ok",
        text: "Check your email for a sign-in link. You can close this tab.",
      });
    } catch {
      setMessage({ type: "err", text: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-[#1E1E1E]/8 bg-[#fffdfa] p-5 md:p-6"
    >
      {message?.type === "ok" ? (
        <div
          className="rounded-xl border border-[#1E1E1E]/15 bg-[#f0ebe4] px-4 py-3 text-[15px] leading-7 text-[#1E1E1E]/90"
          role="status"
        >
          <p className="font-medium text-[#1E1E1E]">{message.text}</p>
        </div>
      ) : null}
      {message?.type === "err" ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-950"
          role="alert"
        >
          <p className="font-medium">{message.text}</p>
        </div>
      ) : null}

      <label className="block text-[15px] font-medium text-[#1E1E1E]">
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
          placeholder="Same email you used to register"
        />
      </label>

      {showLoginHelper ? (
        <p className="text-sm text-gray-500">
          For best results, open the magic link in the same browser you used to request it.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
