"use server";

import { revalidatePath } from "next/cache";
import { sendTruckInterestToHost } from "@/lib/event-marketplace-email";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TruckRespondState = {
  error?: string;
  success?: boolean;
  already?: boolean;
};

function pick(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function formatEventDate(value: string): string {
  const d = new Date(value + "T12:00:00");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function respondToEventInquiry(
  _prev: TruckRespondState | undefined,
  formData: FormData,
): Promise<TruckRespondState> {
  const inquiryId = pick(formData, "inquiryId");
  if (!inquiryId) {
    return { error: "Missing event." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { error: "Server is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "You must be signed in." };
  }

  const emailNorm = user.email.trim().toLowerCase();

  const { data: truck, error: truckErr } = await supabase
    .from("trucks")
    .select("id, name, email, phone, instagram, website, active")
    .eq("email", emailNorm)
    .maybeSingle();

  if (truckErr || !truck) {
    return { error: "No truck profile found for this account." };
  }
  if (!truck.active) {
    return { error: "Your registration is pending approval." };
  }

  const { data: inquiry, error: inqErr } = await supabase
    .from("event_inquiries")
    .select(
      "id, host_name, host_email, host_phone, event_date, event_location, status",
    )
    .eq("id", inquiryId)
    .eq("status", "open")
    .maybeSingle();

  if (inqErr || !inquiry) {
    return { error: "This event request is no longer available." };
  }

  const { error: insErr } = await supabase.from("truck_responses").insert({
    inquiry_id: inquiryId,
    truck_id: truck.id,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      revalidatePath("/trucks/dashboard");
      return { success: true, already: true };
    }
    return { error: insErr.message };
  }

  const eventDateRaw =
    typeof inquiry.event_date === "string"
      ? inquiry.event_date
      : (inquiry.event_date as { toString?: () => string })?.toString?.() ?? "";

  const emailResult = await sendTruckInterestToHost({
    hostEmail: inquiry.host_email,
    hostName: inquiry.host_name,
    eventDate: formatEventDate(eventDateRaw),
    eventLocation: inquiry.event_location,
    truckName: truck.name,
    truckEmail: truck.email ?? emailNorm,
    truckPhone: truck.phone?.trim() || null,
    truckInstagram: truck.instagram?.trim() || null,
    truckWebsite: truck.website?.trim() || null,
  });

  if (!emailResult.ok) {
    await supabase.from("truck_responses").delete().eq("inquiry_id", inquiryId).eq("truck_id", truck.id);
    return { error: emailResult.error };
  }

  revalidatePath("/trucks/dashboard");
  return { success: true };
}
