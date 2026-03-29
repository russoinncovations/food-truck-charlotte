import { getSupabase } from "@/lib/supabase";
import { AddToDirectoryForm } from "./add-to-directory-form";

/** Must match `submitForTrucks` / admin-trucks `MSG` prefixes. */
const MSG = {
  whatYouServe: "What you serve:",
  vendorDescription: "Vendor description:",
  serviceAreas: "Service areas:",
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

export const metadata = {
  title: "Admin — Directory inquiries",
};

export const dynamic = "force-dynamic";

export default async function AdminTrucksPage() {
  const client = getSupabase();
  if (!client) {
    return (
      <div className="p-6 font-sans text-sm text-neutral-800">
        <p>Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).</p>
      </div>
    );
  }

  const { data: rows, error } = await client
    .from("inquiries")
    .select(
      "id, name, email, vendor_type, message, processed, created_at, website, photo_url, vendor_description",
    )
    .eq("type", "for_trucks")
    .or("processed.eq.false,processed.is.null")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6 font-sans text-sm text-red-700">
        <p>Failed to load inquiries: {error.message}</p>
      </div>
    );
  }

  const list = rows ?? [];

  return (
    <div className="mx-auto max-w-3xl p-6 font-sans text-sm text-neutral-800">
      <h1 className="mb-1 text-lg font-semibold">Directory inquiries (for trucks)</h1>
      <p className="mb-6 text-neutral-600">Unprocessed only · internal use only</p>

      {list.length === 0 ? (
        <p className="text-neutral-500">No pending inquiries.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((row) => {
            const m = row.message ?? "";
            const whatYouServe = forTrucksLine(m, MSG.whatYouServe);
            const vendorDescriptionCol = ((row as { vendor_description?: string | null }).vendor_description ?? "")
              .trim();
            const vendorDescription =
              vendorDescriptionCol && vendorDescriptionCol !== "—"
                ? vendorDescriptionCol
                : forTrucksLine(m, MSG.vendorDescription);
            const serviceArea = forTrucksLine(m, MSG.serviceAreas);
            const instagram = forTrucksLine(m, MSG.instagram);
            const websiteDisplay = (row.website ?? "").trim() || forTrucksLine(m, MSG.website) || "—";
            return (
              <li
                key={row.id}
                className="rounded border border-neutral-300 bg-white p-4 shadow-sm"
              >
                <p className="mb-1">
                  <span className="text-neutral-500">Truck name:</span> {row.name || "—"}
                </p>
                <p className="mb-1">
                  <span className="text-neutral-500">Contact name:</span> —
                </p>
                <p className="mb-1">
                  <span className="text-neutral-500">Email:</span> {row.email || "—"}
                </p>
                <p className="mb-1">
                  <span className="text-neutral-500">Cuisine:</span> {whatYouServe || "—"}
                </p>
                <p className="mb-1">
                  <span className="text-neutral-500">Service areas:</span> {serviceArea || "—"}
                </p>
                <p className="mb-1">
                  <span className="text-neutral-500">Vendor description:</span> {vendorDescription || "—"}
                </p>
                <p className="mb-1">
                  <span className="text-neutral-500">Instagram:</span> {instagram || "—"}
                </p>
                <p className="mb-1">
                  <span className="text-neutral-500">Website:</span>{" "}
                  {websiteDisplay !== "—" ? (
                    <a
                      href={
                        websiteDisplay.startsWith("http")
                          ? websiteDisplay
                          : `https://${websiteDisplay}`
                      }
                      className="text-blue-700 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {websiteDisplay}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
                {row.photo_url ? (
                  <p className="mb-2">
                    <span className="mb-1 block text-neutral-600">Photo</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.photo_url}
                      alt=""
                      className="max-h-40 rounded border border-neutral-200"
                    />
                  </p>
                ) : null}
                <p className="mb-3 text-xs text-neutral-400">
                  {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
                </p>
                <AddToDirectoryForm inquiryId={row.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
