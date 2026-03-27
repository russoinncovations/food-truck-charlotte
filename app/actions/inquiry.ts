"use server";

import { sendInquiryEmail } from "@/lib/inquiry-email";
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
  return { success: true };
}

export async function submitForTrucks(
  _prevState: InquiryFormState | undefined,
  formData: FormData,
): Promise<InquiryFormState> {
  const raw = pickFormData(formData, [
    "truckName",
    "contactName",
    "email",
    "phone",
    "cuisine",
    "serviceArea",
    "instagram",
    "website",
    "description",
  ]);
  const parsed = forTrucksSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const d = parsed.data;
  const body = [
    "Food Truck Charlotte — Join the Directory",
    "",
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
  return { success: true };
}
