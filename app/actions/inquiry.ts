"use server";

import { sendInquiryEmail } from "@/lib/inquiry-email";
import { getSupabase } from "@/lib/supabase";
import {
  bookATruckSchema,
  firstZodError,
  forTrucksSchema,
  forVenuesSchema,
} from "@/lib/validation/inquiry-schemas";

export type InquiryFormState = {
  error?: string;
  success?: boolean;
};

function pickFormData(formData: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = formData.get(key);
    out[key] = typeof v === "string" ? v : "";
  }
  return out;
}

function pickVendorTypes(formData: FormData): string[] {
  return formData.getAll("vendorType").filter((v): v is string => typeof v === "string");
}

async function saveInquiryToSupabase(payload: {
  type: "book_a_truck" | "for_trucks" | "for_venues";
  name: string;
  email: string;
  message: string;
  vendor_type?: string | null;
}) {
  const client = getSupabase();
  if (!client) {
    return;
  }

  const row = {
    type: payload.type,
    name: payload.name,
    email: payload.email,
    message: payload.message,
    vendor_type: payload.vendor_type ?? null,
  };

  try {
    const { error } = await client.from("inquiries").insert(row);
    if (error) {
      console.error("[inquiries] Supabase insert failed:", error.message);
    }
  } catch (e) {
    console.error("[inquiries] Supabase insert error:", e);
  }
}

export async function submitBookATruck(
  _prevState: InquiryFormState | undefined,
  formData: FormData,
): Promise<InquiryFormState> {
  const raw = pickFormData(formData, [
    "name",
    "email",
    "phone",
    "eventType",
    "date",
    "location",
    "attendance",
    "cuisinePreference",
    "notes",
  ]);
  const parsed = bookATruckSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const d = parsed.data;
  const body = [
    "Food Truck Charlotte — Book a Truck inquiry",
    "",
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    `Phone: ${d.phone ?? "—"}`,
    `Event type: ${d.eventType}`,
    `Date: ${d.date ?? "—"}`,
    `Location: ${d.location ?? "—"}`,
    `Estimated attendance: ${d.attendance ?? "—"}`,
    `Cuisine preference: ${d.cuisinePreference ?? "—"}`,
    "",
    "Notes:",
    d.notes ?? "—",
  ].join("\n");

  const result = await sendInquiryEmail(
    `[Food Truck Charlotte] Book a Truck — ${d.name}`,
    body,
  );
  if (!result.ok) {
    return { error: result.error };
  }
  await saveInquiryToSupabase({
    type: "book_a_truck",
    name: d.name,
    email: d.email,
    message: body,
  });
  return { success: true };
}

export async function submitForTrucks(
  _prevState: InquiryFormState | undefined,
  formData: FormData,
): Promise<InquiryFormState> {
  const raw = {
    ...pickFormData(formData, [
      "truckName",
      "contactName",
      "email",
      "phone",
      "cuisine",
      "serviceArea",
      "instagram",
      "website",
      "description",
    ]),
    vendorTypes: pickVendorTypes(formData),
  };
  const parsed = forTrucksSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const d = parsed.data;
  const vendorTypeLabels: Record<(typeof d.vendorTypes)[number], string> = {
    food_truck: "Food Truck",
    food_cart: "Food Cart",
    tent_pop_up: "Tent / Pop-Up",
  };
  const vendorTypeLine = d.vendorTypes.map((v) => vendorTypeLabels[v]).join(", ");

  const body = [
    "Food Truck Charlotte — Join the Directory",
    "",
    `Vendor type(s): ${vendorTypeLine}`,
    `Truck name: ${d.truckName}`,
    `Contact name: ${d.contactName}`,
    `Email: ${d.email}`,
    `Phone: ${d.phone ?? "—"}`,
    `Cuisine: ${d.cuisine}`,
    `Service area: ${d.serviceArea}`,
    `Instagram: ${d.instagram ?? "—"}`,
    `Website: ${d.website ?? "—"}`,
    "",
    "Description:",
    d.description ?? "—",
  ].join("\n");

  const result = await sendInquiryEmail(
    `[Food Truck Charlotte] Join Directory — ${d.truckName}`,
    body,
  );
  if (!result.ok) {
    return { error: result.error };
  }
  await saveInquiryToSupabase({
    type: "for_trucks",
    name: d.truckName,
    email: d.email,
    message: body,
    vendor_type: vendorTypeLine,
  });
  return { success: true };
}

export async function submitForVenues(
  _prevState: InquiryFormState | undefined,
  formData: FormData,
): Promise<InquiryFormState> {
  const raw = pickFormData(formData, [
    "contactName",
    "venueName",
    "email",
    "phone",
    "eventType",
    "eventDate",
    "address",
    "attendance",
    "notes",
  ]);
  const parsed = forVenuesSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const d = parsed.data;
  const body = [
    "Food Truck Charlotte — Host / Venue inquiry",
    "",
    `Contact name: ${d.contactName}`,
    `Venue / business: ${d.venueName}`,
    `Email: ${d.email}`,
    `Phone: ${d.phone ?? "—"}`,
    `Event type: ${d.eventType ?? "—"}`,
    `Event date: ${d.eventDate ?? "—"}`,
    `Address: ${d.address ?? "—"}`,
    `Estimated attendance: ${d.attendance ?? "—"}`,
    "",
    "Notes:",
    d.notes ?? "—",
  ].join("\n");

  const result = await sendInquiryEmail(
    `[Food Truck Charlotte] Host inquiry — ${d.venueName}`,
    body,
  );
  if (!result.ok) {
    return { error: result.error };
  }
  await saveInquiryToSupabase({
    type: "for_venues",
    name: d.venueName,
    email: d.email,
    message: body,
  });
  return { success: true };
}
