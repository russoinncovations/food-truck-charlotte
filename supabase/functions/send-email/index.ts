// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"

import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { Resend } from "npm:resend"

function subjectForAction(emailActionType: string): string {
  const s: Record<string, string> = {
    signup: "Confirm your email",
    recovery: "Reset your password",
    magiclink: "Your sign-in link",
    invite: "You've been invited",
    email_change: "Confirm your email change",
    email_change_new: "Confirm your new email",
    reauthentication: "Confirm it's you",
  }
  return s[emailActionType] ?? "Authentication email"
}

Deno.serve(async (req) => {
  console.log("[send-email] start")

  const resendKeyPresent = Boolean(Deno.env.get("RESEND_API_KEY"))
  const hookSecretPresent = Boolean(Deno.env.get("SEND_EMAIL_HOOK_SECRET"))
  console.log("[send-email] RESEND_API_KEY present:", resendKeyPresent)
  console.log("[send-email] SEND_EMAIL_HOOK_SECRET present:", hookSecretPresent)

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const hookSecret = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "").replace(
    "v1,whsec_",
    "",
  )
  const wh = new Webhook(hookSecret)

  type EmailData = {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
    token_new: string
    token_hash_new: string
  }

  let user: { email: string }
  let email_data: EmailData

  try {
    const verified = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: EmailData
    }
    user = verified.user
    email_data = verified.email_data
  } catch (error) {
    console.error("[send-email] webhook verification failed", error)
    return new Response(
      JSON.stringify({
        error: { message: (error as Error).message },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    )
  }

  const recipientEmail = user.email
  const emailActionType = email_data.email_action_type
  console.log(
    "[send-email] recipient email:",
    recipientEmail,
    "email_action_type:",
    emailActionType,
  )

  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL");
  }

  const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to ?? "")}`;

  const subject = subjectForAction(emailActionType)
  const hrefEsc = verifyUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
  const html = `<!DOCTYPE html>
<html>
  <body>
    <p>Click the link below to continue with FoodTruck CLT.</p>
    <p><a href="${hrefEsc}">Confirm / sign in</a></p>
  </body>
</html>`

  const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string)

  try {
    console.log("[send-email] sending email")

    const { data, error } = await resend.emails.send({
      from: "Auth <noreply@foodtruckclt.com>",
      to: [recipientEmail],
      subject,
      html,
    })

    console.log("[send-email] resend.emails.send() result", { data, error })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("[send-email] send failed", error)
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error)
    return new Response(
      JSON.stringify({
        error: { message },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})
