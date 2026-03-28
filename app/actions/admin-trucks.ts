"use server";

import { revalidatePath } from "next/cache";
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
  if (inquiry.processed) {
    return { error: "Already processed." };
  }

  const name = (inquiry.name ?? "").trim();
  if (!name) {
    return { error: "Inquiry has no truck name." };
  }

  let slug = slugify(name);
  const { data: existing } = await client.from("trucks").select("slug").eq("slug", slug).maybeSingle();
  if (existing) {
    slug = `${slug}-${inquiryId.slice(0, 8)}`;
  }

  const vendor_type = inquiryVendorTypeToTruck(inquiry.vendor_type);
  const email = (inquiry.email ?? "").trim();

  const inq = inquiry as typeof inquiry & { website?: string | null; photo_url?: string | null };

  const { error: insertErr } = await client.from("trucks").insert({
    name,
    slug,
    email: email || null,
    vendor_type,
    active: true,
    description: (inquiry.message ?? "").trim() || null,
    website: (inq.website ?? "").trim() || null,
    photo_url: (inq.photo_url ?? "").trim() || null,
  });

  if (insertErr) {
    return { error: insertErr.message };
  }

  const { error: updateErr } = await client.from("inquiries").update({ processed: true }).eq("id", inquiryId);

  if (updateErr) {
    return { error: `Truck created but failed to mark inquiry processed: ${updateErr.message}` };
  }

  revalidatePath("/admin/trucks");
  return { ok: true };
}
