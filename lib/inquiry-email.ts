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

/** From address for auto-replies to submitters. Override with `RESEND_CONFIRMATION_FROM` (e.g. onboarding@resend.dev until domain is verified). */
export function getConfirmationFromEmail(): string {
  return process.env.RESEND_CONFIRMATION_FROM?.trim() || "noreply@foodtruckclt.com";
}

export type InquiryConfirmation =
  | { type: "for_trucks"; submitterEmail: string; truckName: string }
  | { type: "book_a_truck"; submitterEmail: string; name: string }
  | { type: "for_venues"; submitterEmail: string; venueName: string };

function buildConfirmationEmail(confirmation: InquiryConfirmation): { subject: string; text: string } {
  switch (confirmation.type) {
    case "for_trucks":
      return {
        subject: "You're on the list — Food Truck Charlotte",
        text: [
          `Hey ${confirmation.truckName} — Nicole here.`,
          "",
          "We received your listing request and you're officially in the queue as one of our founding vendors on foodtruckclt.com.",
          "",
          "I'll be in touch within 24 hours to get your full listing live. In the meantime, join our 35,000-member Facebook community:",
          "https://www.facebook.com/groups/foodtruckcharlotte",
          "",
          "— Nicole",
          "Food Truck Charlotte",
          "foodtruckclt.com",
        ].join("\n"),
      };
    case "book_a_truck":
      return {
        subject: "Got your request — Food Truck Charlotte",
        text: [
          `Hey ${confirmation.name} — we received your request and will match you with the right vendor within 24 hours.`,
          "",
          "— Nicole",
          "Food Truck Charlotte",
          "foodtruckclt.com",
        ].join("\n"),
      };
    case "for_venues":
      return {
        subject: "Got your venue inquiry — Food Truck Charlotte",
        text: [
          `Hey ${confirmation.venueName} — we received your inquiry and will follow up within 24 hours with vendor recommendations.`,
          "",
          "— Nicole",
          "Food Truck Charlotte",
          "foodtruckclt.com",
        ].join("\n"),
      };
  }
}

async function sendSubmitterConfirmationEmail(to: string, subject: string, text: string): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.error("[Resend] submitter confirmation skipped: RESEND_API_KEY not set");
    return;
  }

  const from = getConfirmationFromEmail();

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      text,
    });
    if (error) {
      console.error("[Resend] submitter confirmation failed:", error);
    }
  } catch (e) {
    console.error("[Resend] submitter confirmation failed:", e);
  }
}

export async function sendInquiryEmail(
  subject: string,
  textBody: string,
  confirmation?: InquiryConfirmation,
) {
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

    if (confirmation) {
      const { subject: cSubject, text: cText } = buildConfirmationEmail(confirmation);
      await sendSubmitterConfirmationEmail(confirmation.submitterEmail, cSubject, cText);
    }

    return { ok: true as const };
  } catch (e) {
    console.error("[Resend]", e);
    return { ok: false as const, error: "Email could not be sent. Please try again later." };
  }
}
