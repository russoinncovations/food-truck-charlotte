"use server";

import { randomUUID } from "crypto";
import { sendTruckRegistrationAdminNotification, sendTruckRegistrationConfirmation } from "@/lib/event-marketplace-email";
import { slugifyForTrucksTable } from "@/lib/marketplace-slug";
import { getSupabase } from "@/lib/supabase";
import { firstZodError, truckRegisterSchema } from "@/lib/validation/event-marketplace";

export type TruckRegisterState = {
  error?: string;
  success?: boolean;
};

function pick(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function parseCuisineTypes(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function submitTruckRegistration(
  _prev: TruckRegisterState | undefined,
  formData: FormData,
): Promise<TruckRegisterState> {
  const parsed = truckRegisterSchema.safeParse({
    truckName: pick(formData, "truckName"),
    ownerName: pick(formData, "ownerName"),
    email: pick(formData, "email"),
    phone: pick(formData, "phone"),
    cuisineTypes: pick(formData, "cuisineTypes"),
    instagram: pick(formData, "instagram"),
    website: pick(formData, "website"),
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const d = parsed.data;
  const cuisineTypes = parseCuisineTypes(d.cuisineTypes);
  if (cuisineTypes.length === 0) {
    return { error: "Add at least one cuisine type." };
  }

  const client = getSupabase();
  if (!client) {
    return { error: "Server storage is not configured." };
  }

  const email = d.email.trim().toLowerCase();
  const baseSlug = slugifyForTrucksTable(d.truckName);
  const slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;
  const cuisineSummary = cuisineTypes.join(", ");

  const { error: insertErr } = await client.from("trucks").insert({
    name: d.truckName.trim(),
    slug,
    owner_name: d.ownerName.trim(),
    email,
    phone: d.phone.trim(),
    cuisine_types: cuisineTypes,
    cuisine: cuisineSummary,
    vendor_type: "truck",
    instagram: d.instagram?.trim() || null,
    website: d.website?.trim() || null,
    active: true,
    show_in_directory: false,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return { error: "An account with this email is already registered." };
    }
    console.error("[trucks] marketplace register:", insertErr.message);
    return { error: "We could not save your registration. Please try again." };
  }

  void sendTruckRegistrationAdminNotification({
    truckName: d.truckName.trim(),
    ownerName: d.ownerName.trim(),
    email,
    phone: d.phone.trim(),
    cuisineTypes,
  });

  void sendTruckRegistrationConfirmation(email, d.truckName.trim());

  return { success: true };
}
