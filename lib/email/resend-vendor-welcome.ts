function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Welcome email after vendor application approval (admin bookings flow).
 * Uses project env: RESEND_API_KEY, RESEND_FROM_EMAIL (fallback sender matches booking notifications).
 */
export async function sendVendorApprovalWelcomeEmail(opts: {
  to: string
  truckName: string
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "FoodTruck CLT <noreply@foodtruckclt.com>"

  const to = opts.to.trim()
  if (!key || !to) return

  const greetingName = escapeHtml((opts.truckName ?? "").trim() || "there")

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(key)

    await resend.emails.send({
      from,
      to,
      subject: "You're live on FoodTruckCLT",
      html: `
<p>Hi ${greetingName},</p>
<p>You're now live on FoodTruckCLT.</p>
<p>A few quick steps so people can actually find and book you:</p>
<p><strong>1)</strong> Log in<br />
<a href="https://www.foodtruckclt.com/vendor-login">https://www.foodtruckclt.com/vendor-login</a></p>
<p>Please use this same email address when logging in, as your dashboard is connected to the email this message was sent to.</p>
<p><strong>2)</strong> Complete your profile — add your menu, photos, and contact info so customers know what you offer.</p>
<p><strong>3)</strong> When you're out serving, drop your location on the map. This is what makes you show up in real time when people are looking for a truck.</p>
<p><strong>4)</strong> Watch for booking requests — you'll start seeing opportunities come through your dashboard.</p>
<p>If you have any questions, just reply to this email.</p>
<p>— FoodTruckCLT</p>
`,
    })
  } catch (e) {
    console.error("[sendVendorApprovalWelcomeEmail] Resend failed:", e)
  }
}
