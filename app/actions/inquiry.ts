"use server";

import {
  formatBookATruckInquirySubject,
  sendInquiryEmail,
  sendInquiryTextToRecipient,
} from "@/lib/inquiry-email";
import { getSupabase } from "@/lib/supabase";
import { uploadVendorListingPhoto } from "@/lib/upload-vendor-photo";
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

function cuisinesFromForm(formData: FormData): string[] {
  return formData
    .getAll("cuisines")
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** First non-empty trimmed string from FormData for any of the given field names. */
function optionalFormString(formData: FormData, ...names: string[]): string | null {
  for (const name of names) {
    const v = formData.get(name);
    if (typeof v === "string") {
      const t = v.trim();
      if (t) return t;
    }
  }
  return null;
}

async function saveInquiryToSupabase(payload: {
  type: "book_a_truck" | "for_trucks" | "for_venues";
  name: string;
  email: string;
  message: string;
  vendor_type?: string | null;
  website?: string | null;
  photo_url?: string | null;
  vendor_description?: string | null;
  instagram?: string | null;
  phone?: string | null;
  contact_name?: string | null;
  service_areas?: string | null;
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
    website: payload.website ?? null,
    photo_url: payload.photo_url ?? null,
    vendor_description: payload.vendor_description ?? null,
    instagram: payload.instagram ?? null,
    phone: payload.phone ?? null,
    contact_name: payload.contact_name ?? null,
    service_areas: payload.service_areas ?? null,
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

export async function submitBookingRequest(
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
    "notes",
  ]);
  const parsed = bookATruckSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const d = parsed.data;
  const cuisines = cuisinesFromForm(formData);
  const truck = optionalFormString(formData, "truck");
  const body = [
    "Food Truck Charlotte — Book a Truck inquiry",
    "",
    `Requested truck (slug): ${truck ?? "—"}`,
    "",
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    `Phone: ${d.phone ?? "—"}`,
    `Event type: ${d.eventType}`,
    `Date: ${d.date ?? "—"}`,
    `Location: ${d.location ?? "—"}`,
    `Estimated attendance: ${d.attendance ?? "—"}`,
    `Cuisines: ${cuisines.length > 0 ? cuisines.join(", ") : "—"}`,
    "",
    "Notes:",
    d.notes ?? "—",
  ].join("\n");

  let truckDisplayName: string | null = null;
  let ownerEmailForCopy: string | null = null;
  if (truck) {
    const client = getSupabase();
    if (client) {
      const { data: truckRow, error: truckErr } = await client
        .from("trucks")
        .select("name, owner_email")
        .eq("slug", truck)
        .maybeSingle();
      if (!truckErr && truckRow && typeof truckRow === "object") {
        const row = truckRow as { name?: string | null; owner_email?: string | null };
        if (typeof row.name === "string" && row.name.trim()) {
          truckDisplayName = row.name.trim();
        }
        if (typeof row.owner_email === "string" && row.owner_email.trim()) {
          ownerEmailForCopy = row.owner_email.trim();
        }
      }
    }
  }

  const subject = formatBookATruckInquirySubject(d.name, truckDisplayName);
  const result = await sendInquiryEmail(subject, body, {
    type: "book_a_truck",
    submitterEmail: d.email,
    name: d.name,
  });
  if (!result.ok) {
    return { error: result.error };
  }

  if (ownerEmailForCopy) {
    const copy = await sendInquiryTextToRecipient(ownerEmailForCopy, subject, body);
    if (!copy.ok) {
      console.error("[book-a-truck] truck owner inquiry copy failed:", copy.error);
    }
  }

  const client = getSupabase();
  if (client) {
    const attendanceRaw = d.attendance?.trim();
    const guestCountParsed = attendanceRaw ? Number.parseInt(attendanceRaw, 10) : null;
    const guest_count =
      attendanceRaw && Number.isFinite(guestCountParsed) ? guestCountParsed : null;

       const messageParts = [d.notes?.trim(), truck ? `Requested truck (slug): ${truck}` : null].filter(Boolean);
    const message = messageParts.length > 0 ? messageParts.join("\n\n") : null;

    const { error: bookingErr } = await client.from("booking_requests").insert({
      customer_name: d.name.trim(),
      email: d.email.trim(),
      phone: d.phone?.trim() || null,
      company_name: null,
      event_type: d.eventType.trim(),
      event_date: d.date?.trim() || null,
      event_time: null,
      guest_count,
      budget_min: null,
      budget_max: null,
      location_city: null,
      location_state: null,
      venue_name: d.location?.trim() || null,
      message,
      cuisines: cuisines.length > 0 ? cuisines : null,
      truck_count: null,
      is_flexible: false,
    });
    if (bookingErr) {
      console.error("[booking_requests] insert failed:", bookingErr.message);
      return { error: "We could not save your request. Please try again later." };
    }
  }

  await saveInquiryToSupabase({
    type: "book_a_truck",
    name: d.name,
    email: d.email,
    message: body,
    phone: d.phone ?? null,
  });
  return { success: true };
}

export async function submitBookATruck(
  prevState: InquiryFormState | undefined,
  formData: FormData,
): Promise<InquiryFormState> {
  return submitBookingRequest(prevState, formData);
}

export async function submitForTrucks(
  _prevState: InquiryFormState | undefined,
  formData: FormData,
): Promise<InquiryFormState> {
  const raw = {
    ...pickFormData(formData, [
      "truckName",
      "email",
      "whatYouServe",
      "serviceArea",
      "catering",
      "instagram",
      "website",
    ]),
    vendorTypes: pickVendorTypes(formData),
  };
  const parsed = forTrucksSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: firstZodError(parsed.error) };
  }

  const d = parsed.data;
  const client = getSupabase();

  const photoField = formData.get("photo");
  let photoUrl: string | null = null;
  if (photoField instanceof File && photoField.size > 0) {
    if (!client) {
      return { error: "Cannot upload photo: storage is not configured." };
    }
    const uploaded = await uploadVendorListingPhoto(client, photoField);
    if ("error" in uploaded) {
      return { error: uploaded.error };
    }
    photoUrl = uploaded.publicUrl;
  }

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
    `Truck / vendor name: ${d.truckName}`,
    `Email: ${d.email}`,
    `What you serve: ${d.whatYouServe}`,
    `Service areas: ${d.serviceArea}`,
    `Catering: ${d.catering === "yes" ? "Yes" : "No"}`,
    `Instagram: ${d.instagram ?? "—"}`,
    `Website: ${d.website ?? "—"}`,
    `Photo URL: ${photoUrl ?? "—"}`,
  ].join("\n");

  const result = await sendInquiryEmail(
    `[Food Truck Charlotte] Join Directory — ${d.truckName}`,
    body,
    { type: "for_trucks", submitterEmail: d.email, truckName: d.truckName },
  );
  if (!result.ok) {
    return { error: result.error };
  }

  const vendorDescriptionExplicit = optionalFormString(
    formData,
    "vendorDescription",
    "vendor_description",
  );
  const vendorDescription =
    vendorDescriptionExplicit ?? (d.whatYouServe.trim() ? d.whatYouServe : null);

  const contactName = optionalFormString(formData, "contactName", "contact_name");
  const phone = optionalFormString(formData, "phone", "phoneNumber");

  await saveInquiryToSupabase({
    type: "for_trucks",
    name: d.truckName,
    email: d.email,
    message: body,
    vendor_type: vendorTypeLine,
    website: d.website ?? null,
    photo_url: photoUrl,
    vendor_description: vendorDescription,
    instagram: d.instagram ?? null,
    phone,
    contact_name: contactName,
    service_areas: d.serviceArea,
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
    { type: "for_venues", submitterEmail: d.email, venueName: d.venueName },
  );
  if (!result.ok) {
    return { error: result.error };
  }
  await saveInquiryToSupabase({
    type: "for_venues",
    name: d.venueName,
    email: d.email,
    message: body,
    contact_name: d.contactName,
    phone: d.phone ?? null,
  });
  return { success: true };
}
