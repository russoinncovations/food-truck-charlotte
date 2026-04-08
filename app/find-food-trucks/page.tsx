import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find Food Vendors in Charlotte",
  description:
    "Browse Charlotte food vendors by cuisine and service area to find trusted local favorites for everyday stops and events.",
};

type TruckStatus = "available" | "event" | "inquire";

type TrucksDirectoryRow = {
  id: string;
  name: string;
  slug: string;
  cuisine: string | null;
  area: string | null;
  status: string | null;
  color: string | null;
  text_color: string | null;
  initial: string | null;
  tags: string[] | null;
};

type TruckCard = {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  area: string;
  status: TruckStatus;
  color: string;
  textColor: string;
  initial: string;
  tags: string[];
};

const STATUS_MAP = {
  available: { label: "Available", bg: "#CCE8E0", color: "#0F6E56" as const, border: undefined as string | undefined },
  event: { label: "At Event", bg: "#FDDCCE", color: "#D94F1E" as const, border: undefined as string | undefined },
  inquire: { label: "Inquire", bg: "#F4F0E8", color: "#7A7268" as const, border: "#E8E2D8" as const },
} as const;

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t)).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((t) => String(t)).filter(Boolean);
      }
    } catch {
      return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function nameInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toUpperCase();
}

function normalizeStatus(raw: string | null | undefined): TruckStatus {
  if (raw === "available" || raw === "event" || raw === "inquire") {
    return raw;
  }
  return "inquire";
}

function rowToCard(row: TrucksDirectoryRow): TruckCard {
  const name = (row.name ?? "").trim() || "Untitled";
  const cuisine = (row.cuisine ?? "").trim() || "General";
  const area = (row.area ?? "").trim() || "Charlotte area";
  const color = (row.color ?? "").trim() || "#F7F2EA";
  const textColor = (row.text_color ?? "").trim() || "#1C1A17";
  const initial = (row.initial ?? "").trim() || nameInitial(name);

  return {
    id: String(row.id ?? row.slug),
    name,
    slug: (row.slug ?? "").trim() || String(row.id),
    cuisine,
    area,
    status: normalizeStatus(row.status),
    color,
    textColor,
    initial,
    tags: normalizeTags(row.tags),
  };
}

function buildFindUrl(params: { cuisine: string; q: string }): string {
  const sp = new URLSearchParams();
  if (params.cuisine && params.cuisine !== "All") {
    sp.set("cuisine", params.cuisine);
  }
  if (params.q.trim()) {
    sp.set("q", params.q.trim());
  }
  const qs = sp.toString();
  return qs ? `/find-food-trucks?${qs}` : "/find-food-trucks";
}

async function fetchDirectoryTrucks(): Promise<TruckCard[]> {
  const client = getSupabase();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("trucks")
    .select("id, name, slug, cuisine, area, status, color, text_color, initial, tags")
    .eq("active", true)
    .eq("show_in_directory", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[find-food-trucks] Supabase:", error.message);
    return [];
  }

  if (!data?.length) {
    return [];
  }

  return (data as TrucksDirectoryRow[]).map(rowToCard);
}

function filterTrucks(trucks: TruckCard[], cuisine: string, query: string): TruckCard[] {
  const q = query.trim().toLowerCase();
  return trucks.filter((t) => {
    const matchCuisine = cuisine === "All" || t.cuisine === cuisine;
    const matchQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.cuisine.toLowerCase().includes(q);
    return matchCuisine && matchQuery;
  });
}

export default async function FindFoodTrucksPage({
  searchParams,
}: {
  searchParams: Promise<{ cuisine?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const cuisine = !sp.cuisine || sp.cuisine === "All" ? "All" : sp.cuisine;
  const q = typeof sp.q === "string" ? sp.q : "";

  const trucks = await fetchDirectoryTrucks();
  const filtered = filterTrucks(trucks, cuisine, q);

  const cuisineFilters = [
    "All",
    ...[...new Set(trucks.map((t) => t.cuisine).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
  ];

  return (
    <div className="min-h-[100vh]" style={{ background: "var(--ftc-cream)" }}>
      <div className="border-b px-6 pb-8 pt-10 sm:px-10" style={{ borderColor: "var(--ftc-border)" }}>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: "var(--ftc-orange)" }}>
          Charlotte, NC
        </p>
        <h1
          className="font-display mb-6 font-extrabold tracking-tight"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--ftc-ink)" }}
        >
          Find Food Trucks
        </h1>

        <div className="flex flex-col gap-4">
          <form action="/find-food-trucks" method="get" className="max-w-[480px]">
            <input type="hidden" name="cuisine" value={cuisine} />
            <div
              className="flex items-center gap-3 rounded-lg px-5 py-3"
              style={{ background: "#fff", border: "1.5px solid var(--ftc-ink)", boxShadow: "var(--shadow-card)" }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                style={{ color: "var(--ftc-subtle)", flexShrink: 0 }}
                aria-hidden
              >
                <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search trucks, cuisines…"
                className="flex-1 bg-transparent text-[15px] outline-none"
                style={{ color: "var(--ftc-ink)" }}
                aria-label="Search trucks and cuisines"
              />
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            {cuisineFilters.map((c) => (
              <Link
                key={c}
                href={buildFindUrl({ cuisine: c, q })}
                className="cursor-pointer rounded-full border px-4 py-[6px] text-[12px] transition-all"
                style={
                  cuisine === c
                    ? { background: "var(--ftc-ink)", color: "var(--ftc-cream)", borderColor: "var(--ftc-ink)" }
                    : { background: "var(--ftc-cream-md)", color: "#5C5750", borderColor: "var(--ftc-border-md)" }
                }
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-8 sm:px-10">
        <p className="mb-6 text-[12px]" style={{ color: "var(--ftc-subtle)" }}>
          {filtered.length} truck{filtered.length !== 1 ? "s" : ""} found
          {cuisine !== "All" ? ` in ${cuisine}` : ""}
        </p>

        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {filtered.map((truck) => {
            const status = STATUS_MAP[truck.status];
            return (
              <Link
                key={truck.id}
                href={`/trucks/${truck.slug}`}
                className="group block overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(28,26,23,0.1)]"
                style={{
                  background: "#fff",
                  borderColor: "var(--ftc-border)",
                  textDecoration: "none",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <div
                  className="relative flex h-[140px] items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${truck.color} 0%, ${truck.color}99 100%)` }}
                >
                  <div
                    className="font-display flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold"
                    style={{ background: "rgba(255,255,255,0.35)", color: truck.textColor }}
                  >
                    {truck.initial}
                  </div>
                  <span
                    className="absolute right-3 top-3 rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.06em]"
                    style={{
                      background: status.bg,
                      color: status.color,
                      border: status.border ? `1px solid ${status.border}` : "none",
                    }}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="p-5">
                  <p
                    className="mb-1 text-[10px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: "var(--ftc-orange)" }}
                  >
                    {truck.cuisine}
                  </p>
                  <h3
                    className="font-display mb-1 text-[18px] font-bold tracking-tight"
                    style={{ color: "var(--ftc-ink)" }}
                  >
                    {truck.name}
                  </h3>
                  <p className="mb-4 text-[12px]" style={{ color: "var(--ftc-subtle)" }}>
                    {truck.area}
                  </p>

                  <div className="mb-5 flex flex-wrap gap-2">
                    {truck.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded px-2 py-1 text-[11px]"
                        style={{
                          background: "var(--ftc-cream-md)",
                          color: "var(--ftc-muted)",
                          border: "1px solid var(--ftc-border)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div
                    className="w-full rounded-lg py-[10px] text-center text-[13px] font-medium transition-all group-hover:opacity-95"
                    style={{ background: "var(--ftc-orange)", color: "#fff" }}
                  >
                    View Truck →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
