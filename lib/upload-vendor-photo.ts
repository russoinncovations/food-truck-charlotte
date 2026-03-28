import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "truck-photos";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export async function uploadVendorListingPhoto(
  client: SupabaseClient,
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Photo must be a JPEG or PNG image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Photo must be 5MB or smaller." };
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await client.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}
