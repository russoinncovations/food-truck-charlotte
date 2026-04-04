import { Resend } from "resend";
import { getConfirmationFromEmail, getInquiryConfig } from "@/lib/inquiry-email";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
}

export type EventInquiryRow = {
  host_name: string;
  host_email: string;
  host_phone: string;
  event_date: string;
  event_location: string;
  guest_count: number;
  indoor_outdoor: string;
  cuisine_preferences: string;
  budget_range: string | null;
};

function formatEventDetails(e: EventInquiryRow): string {
  return [
    `Name: ${e.host_name}`,
    `Email: ${e.host_email}`,
    `Phone: ${e.host_phone}`,
    `Event date: ${e.event_date}`,
    `Location: ${e.event_location}`,
    `Guest count: ${e.guest_count}`,
    `Indoor / outdoor: ${e.indoor_outdoor}`,
    `Cuisine preferences: ${e.cuisine_preferences}`,
    `Budget: ${e.budget_range ?? "—"}`,
  ].join("\n");
}

const disclaimer = [
  "",
  "Disclaimer: foodtruckclt.com connects hosts with trucks. We do not employ or guarantee any truck. All bookings are made directly between host and truck.",
].join("\n");

export async function sendEventRequestHostConfirmation(
  row: EventInquiryRow,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email is not configured on the server." };
  }

  const subject = "Your event request has been received — Food Truck CLT";
  const text = [
    `Hi ${row.host_name},`,
    "",
    "Thanks for submitting your event request on Food Truck Charlotte.",
    "",
    "We saved your details and registered food trucks on our platform can view open leads and reach out to you directly if they're available.",
    "",
    "Your request summary:",
    formatEventDetails(row),
    disclaimer,
    "",
    "— Food Truck Charlotte",
    "foodtruckclt.com",
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: getConfirmationFromEmail(),
      to: [row.host_email],
      subject,
      text,
    });
    if (error) {
      console.error("[Resend] event host confirmation:", error);
      return { ok: false, error: "Confirmation email could not be sent." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[Resend] event host confirmation:", e);
    return { ok: false, error: "Confirmation email could not be sent." };
  }
}

export async function sendEventRequestAdminNotification(
  row: EventInquiryRow,
): Promise<void> {
  const { to, configured } = getInquiryConfig();
  if (!configured || !to) {
    console.error("[Resend] event admin notification skipped: INQUIRY_TO_EMAIL / API key");
    return;
  }

  const resend = getResend();
  if (!resend) return;

  const subject = `[Food Truck CLT] New event marketplace request — ${row.host_name}`;
  const text = ["New event inquiry (marketplace):", "", formatEventDetails(row), disclaimer].join(
    "\n",
  );

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: [to],
      subject,
      text,
    });
    if (error) {
      console.error("[Resend] event admin notification:", error);
    }
  } catch (e) {
    console.error("[Resend] event admin notification:", e);
  }
}

export async function sendTruckInterestToHost(params: {
  hostEmail: string;
  hostName: string;
  eventDate: string;
  eventLocation: string;
  truckName: string;
  truckEmail: string;
  truckPhone: string | null;
  truckInstagram: string | null;
  truckWebsite: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email is not configured on the server." };
  }

  const subject = `A food truck is interested in your event — ${params.eventDate}`;
  const text = [
    `Hi ${params.hostName},`,
    "",
    "A registered vendor on Food Truck Charlotte marked themselves as available for your open event request.",
    "",
    `Event date: ${params.eventDate}`,
    `Location: ${params.eventLocation}`,
    "",
    "Vendor contact:",
    `Business: ${params.truckName}`,
    `Email: ${params.truckEmail}`,
    `Phone: ${params.truckPhone ?? "—"}`,
    `Instagram: ${params.truckInstagram ?? "—"}`,
    `Website: ${params.truckWebsite ?? "—"}`,
    disclaimer,
    "",
    "Please contact them directly to confirm details and pricing.",
    "",
    "— Food Truck Charlotte",
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: getConfirmationFromEmail(),
      to: [params.hostEmail],
      subject,
      text,
    });
    if (error) {
      console.error("[Resend] truck interest to host:", error);
      return { ok: false, error: "Could not email the host." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[Resend] truck interest to host:", e);
    return { ok: false, error: "Could not email the host." };
  }
}

export async function sendTruckRegistrationAdminNotification(params: {
  truckName: string;
  ownerName: string;
  email: string;
  phone: string;
  cuisineTypes: string[];
}): Promise<void> {
  const { to, configured } = getInquiryConfig();
  if (!configured || !to) return;

  const resend = getResend();
  if (!resend) return;

  const text = [
    "New truck registration (event marketplace — active for leads, not in public directory until show_in_directory is true):",
    "",
    `Truck: ${params.truckName}`,
    `Owner: ${params.ownerName}`,
    `Email: ${params.email}`,
    `Phone: ${params.phone}`,
    `Cuisine types: ${params.cuisineTypes.join(", ") || "—"}`,
    "",
    "To list them on /find-food-trucks, set show_in_directory = true when their profile is ready.",
  ].join("\n");

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: [to],
      subject: `[Food Truck CLT] New truck registration — ${params.truckName}`,
      text,
    });
  } catch (e) {
    console.error("[Resend] truck registration admin:", e);
  }
}

export async function sendTruckRegistrationConfirmation(truckEmail: string, truckName: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  try {
    await resend.emails.send({
      from: getConfirmationFromEmail(),
      to: [truckEmail],
      subject: "You're registered — Food Truck CLT",
      text: [
        `Hi ${truckName},`,
        "",
        "You're registered on Food Truck Charlotte's event lead system.",
        "",
        "You can sign in with this email right away to view open event requests and respond to hosts. Your truck will not appear on the public directory until your profile is fully set up (we'll turn on your public listing when it's ready).",
        "",
        "— Food Truck Charlotte",
        "foodtruckclt.com",
      ].join("\n"),
    });
  } catch (e) {
    console.error("[Resend] truck registration confirmation:", e);
  }
}
