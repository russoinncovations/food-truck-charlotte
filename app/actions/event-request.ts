"use server";

import { getSupabase } from "@/lib/supabase";
import {
  sendEventRequestAdminNotification,
  sendEventRequestHostConfirmation,
  type EventInquiryRow,
} from "@/lib/event-marketplace-email";
import { eventRequestSchema, firstZodError } from "@/lib/validation/event-marketplace";

export type EventRequestState = {
  error?: string;
  success?: boolean;
};

const BUDGET_LABEL: Record<string, string> = {
  under_500: "Under $500",
  "500_1000": "$500–$1000",
  "1000_2000": "$1000–$2000",
  "2000_plus": "$2000+",
};

const INDOOR_LABEL: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Indoor & outdoor",
};

function pick(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function submitEventRequest(
  _prev: EventRequestState | undefined,
  formData: FormData,
): Promise<EventRequestState> {
  const parsed = eventRequestSchema.safeParse({
    hostName: pick(formData, "hostName"),
    hostEmail: pick(formData, "hostEmail"),
    hostPhone: pick(formData, "hostPhone"),
    eventDate: pick(formData, "eventDate"),
    eventLocation: pick(formData, "eventLocation"),
    guestCount: pick(formData, "guestCount"),
    indoorOutdoor: pick(formData, "indoorOutdoor"),
    cuisinePreferences: pick(formData, "cuisinePreferences"),
    budgetRange: pick(formData, "budgetRange"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const d = parsed.data;
  const budgetLabel = d.budgetRange ? BUDGET_LABEL[d.budgetRange] ?? d.budgetRange : null;
  const indoorLabel = INDOOR_LABEL[d.indoorOutdoor] ?? d.indoorOutdoor;

  const client = getSupabase();
  if (!client) {
    return { error: "Server storage is not configured." };
  }

  const row = {
    host_name: d.hostName.trim(),
    host_email: d.hostEmail.trim().toLowerCase(),
    host_phone: d.hostPhone.trim(),
    event_date: d.eventDate,
    event_location: d.eventLocation.trim(),
    guest_count: d.guestCount,
    indoor_outdoor: indoorLabel,
    cuisine_preferences: d.cuisinePreferences.trim(),
    budget_range: budgetLabel,
    status: "open" as const,
  };

  // Do not chain .select() after insert: anon RLS allows INSERT on event_inquiries but not
  // SELECT, so PostgREST cannot return the new row and .single() fails even when the row saved.
  const { error: insertErr } = await client.from("event_inquiries").insert(row);

  if (insertErr) {
    console.error("[event_inquiries] insert failed:", {
      message: insertErr.message,
      code: insertErr.code,
      details: insertErr.details,
      hint: insertErr.hint,
    });
    return { error: "We could not save your request. Please try again later." };
  }

  console.log("[event_inquiries] insert ok", {
    host_email: row.host_email,
    event_date: row.event_date,
  });

  const emailRow: EventInquiryRow = {
    host_name: row.host_name,
    host_email: row.host_email,
    host_phone: row.host_phone,
    event_date: row.event_date,
    event_location: row.event_location,
    guest_count: row.guest_count,
    indoor_outdoor: row.indoor_outdoor,
    cuisine_preferences: row.cuisine_preferences,
    budget_range: row.budget_range,
  };

  const hostResult = await sendEventRequestHostConfirmation(emailRow);
  if (!hostResult.ok) {
    return { error: hostResult.error };
  }

  void sendEventRequestAdminNotification(emailRow);

  return { success: true };
}
