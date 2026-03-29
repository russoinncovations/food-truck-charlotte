"use server";

import { revalidatePath } from "next/cache";
import { parseForTrucksInquiryMessage } from "@/lib/parse-for-trucks-inquiry";
import { getSupabase } from "@/lib/supabase";

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

function messageLine(message: string, prefix: string): string {
  const lines = message.split("\n");
  const line = lines.find((l) => l.startsWith(prefix));
  if (!line) return "";
  return line.slice(prefix.length).trim();
}

function cleanMessageValue(value: string): string {
  const t = value.trim();
  if (!t || t === "—" || t === "-") return "";
  return t;
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
    .select("id, type, name, email, vendor_type, message, processed, website, photo_url")
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
  const parsed = parseForTrucksInquiryMessage(msg);
  const cuisine = parsed.whatYouServe || null;
  const vendor_description = cleanMessageValue(messageLine(msg, "Vendor description:")) || null;
  const description = vendor_description;
  const service_areas = parsed.serviceAreas || null;
  const instagram = parsed.instagram || null;
  const websiteRaw = (inquiry.website ?? "").trim() || parsed.websiteFromMessage || null;
  const website = websiteRaw && websiteRaw !== "—" ? websiteRaw : null;

  let slug = slugify(name);
  const { data: slugRow } = await client.from("trucks").select("slug,email").eq("slug", slug).maybeSingle();
  if (slugRow && slugRow.email !== email) {
    slug = `${slug}-${inquiryId.slice(0, 8)}`;
  }

  const vendorTypeFromMessage = messageLine(msg, "Vendor type(s):");
  const vendor_type = inquiryVendorTypeToTruck(vendorTypeFromMessage || null);
  const photo_url = (inquiry.photo_url ?? "").trim() || null;
  const catering = parsed.cateringYes;

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
