import { getSupabase } from "@/lib/supabase";
import { AddToDirectoryForm } from "./add-to-directory-form";

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
    .select("id, name, email, vendor_type, message, processed, created_at")
    .eq("type", "for_trucks")
    .order("processed", { ascending: true })
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
      <p className="mb-6 text-neutral-600">
        {list.length} total · internal use only
      </p>

      {list.length === 0 ? (
        <p className="text-neutral-500">No inquiries yet.</p>
      ) : (
        <ul className="space-y-4">
          {list.map((row) => (
            <li
              key={row.id}
              className="rounded border border-neutral-300 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-medium">{row.name || "—"}</span>
                {row.processed ? (
                  <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700">Processed</span>
                ) : (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">Pending</span>
                )}
              </div>
              <p className="mb-1">
                <span className="text-neutral-500">Email:</span> {row.email || "—"}
              </p>
              <p className="mb-1">
                <span className="text-neutral-500">Vendor type:</span> {row.vendor_type || "—"}
              </p>
              <p className="mb-3 text-neutral-500">
                <span className="block text-neutral-600">Message / notes</span>
                <span className="mt-1 block whitespace-pre-wrap break-words text-neutral-800">
                  {row.message || "—"}
                </span>
              </p>
              <p className="mb-3 text-xs text-neutral-400">
                {row.created_at ? new Date(row.created_at).toLocaleString() : ""}
              </p>
              {!row.processed ? (
                <AddToDirectoryForm inquiryId={row.id} />
              ) : (
                <p className="text-xs text-neutral-500">Added to directory (or marked done).</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
