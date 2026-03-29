"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";

/** Line prefixes in `inquiries.message` for `for_trucks` — must match `submitForTrucks` in inquiry.ts. */
const MSG = {
  vendorTypes: "Vendor type(s):",
  whatYouServe: "What you serve:",
  vendorDescription: "Vendor description:",
  serviceAreas: "Service areas:",
  catering: "Catering:",
  instagram: "Instagram:",
  website: "Website:",
} as const;

function forTrucksLine(message: string, prefix: string): string {
  const line = message.split("\n").find((l) => l.startsWith(prefix));
  if (!line) return "";
  const v = line.slice(prefix.length).trim();
  if (!v || v === "—" || v === "-") return "";
  return v;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "vendor";
}

function inquiryVendorTypeToTruck(value: string | null): "truck" | "cart_tent" {
  if (!value) return "truck";
  const v = value.toLowerCase();
  if (v.includes("cart") || v.includes("tent") || v.includes("pop-up")) {
    return "cart_tent";
  }
  return "truck";
}

export type AddTruckFromInquiryState = { ok?: boolean; error?: string };

export async function addTruckFromInquiry(
  _prev: AddTruckFromInquiryState | undefined,
  formData: FormData,
): Promise<AddTruckFromInquiryState> {
  const inquiryId = formData.get("inquiryId");
  if (typeof inquiryId !== "string" || !inquiryId) {
    return { error: "Missing inquiry id." };
  }

  const client = getSupabase();
  if (!client) {
    return { error: "Supabase is not configured." };
  }

  const { data: inquiry, error: fetchErr } = await client
    .from("inquiries")
    .select("id, type, name, email, vendor_type, message, processed, website, photo_url, vendor_description")
    .eq("id", inquiryId)
    .maybeSingle();

  if (fetchErr || !inquiry) {
    return { error: fetchErr?.message ?? "Inquiry not found." };
  }
  if (inquiry.type !== "for_trucks") {
    return { error: "Not a directory inquiry." };
  }
  if (inquiry.processed === true) {
    return { error: "Already processed." };
  }

  const name = (inquiry.name ?? "").trim();
  if (!name) {
    return { error: "Inquiry has no truck name." };
  }

  const email = (inquiry.email ?? "").trim();
  if (!email) {
    return { error: "Inquiry has no email (required for directory upsert)." };
  }

  const msg = inquiry.message ?? "";
  const cuisine = forTrucksLine(msg, MSG.whatYouServe) || null;
  const descriptionFromColumn = ((inquiry as { vendor_description?: string | null }).vendor_description ?? "")
    .trim();
  const descriptionFromMessage = forTrucksLine(msg, MSG.vendorDescription);
  const description =
    descriptionFromColumn && descriptionFromColumn !== "—"
      ? descriptionFromColumn
      : descriptionFromMessage || null;
  const service_areas = forTrucksLine(msg, MSG.serviceAreas) || null;
  const instagram = forTrucksLine(msg, MSG.instagram) || null;

  const websiteCol = (inquiry.website ?? "").trim();
  const websiteMsg = forTrucksLine(msg, MSG.website);
  const website =
    websiteCol && websiteCol !== "—"
      ? websiteCol
      : websiteMsg && websiteMsg !== "—"
        ? websiteMsg
        : null;

  let slug = slugify(name);
  const { data: slugRow } = await client.from("trucks").select("slug,email").eq("slug", slug).maybeSingle();
  if (slugRow && slugRow.email !== email) {
    slug = `${slug}-${inquiryId.slice(0, 8)}`;
  }

  const vendorTypeFromColumn = (inquiry.vendor_type ?? "").trim();
  const vendorTypeFromMessage = forTrucksLine(msg, MSG.vendorTypes);
  const vendor_type = inquiryVendorTypeToTruck(
    vendorTypeFromColumn || vendorTypeFromMessage || null,
  );

  const photo_url = (inquiry.photo_url ?? "").trim() || null;
  const cateringLine = forTrucksLine(msg, MSG.catering).toLowerCase();
  const catering = cateringLine.startsWith("y");

  const payload = {
    name,
    slug,
    cuisine,
    description,
    service_areas,
    instagram,
    website,
    email,
    vendor_type,
    active: true,
    catering,
    photo_url,
  };

  const { error: upsertErr } = await client.from("trucks").upsert(payload, { onConflict: "email" });

  if (upsertErr) {
    return { error: upsertErr.message };
  }

  const { error: updateErr } = await client.from("inquiries").update({ processed: true }).eq("id", inquiryId);

  if (updateErr) {
    return { error: `Truck saved but failed to mark inquiry processed: ${updateErr.message}` };
  }

  revalidatePath("/admin/trucks");
  return { ok: true };
}
