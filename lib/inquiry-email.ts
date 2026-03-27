import { Resend } from "resend";

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function getInquiryConfig() {
  const to = process.env.INQUIRY_TO_EMAIL?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
  return { to, from, configured: Boolean(process.env.RESEND_API_KEY && to) };
}

export async function sendInquiryEmail(subject: string, textBody: string) {
  const { to, from, configured } = getInquiryConfig();
  if (!configured || !to) {
    return { ok: false as const, error: "Email is not configured on the server." };
  }

  const resend = getResendClient();
  if (!resend) {
    return { ok: false as const, error: "Email is not configured on the server." };
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      text: textBody,
    });

    if (error) {
      console.error("[Resend]", error);
      return { ok: false as const, error: "Email could not be sent. Please try again later." };
    }

    return { ok: true as const };
  } catch (e) {
    console.error("[Resend]", e);
    return { ok: false as const, error: "Email could not be sent. Please try again later." };
  }
}
