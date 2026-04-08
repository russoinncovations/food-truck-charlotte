import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Find Food Vendors in Charlotte",
  description:
    "Browse Charlotte food vendors by cuisine and service area to find trusted local favorites for everyday stops and events.",
};

const CUISINE_PILLS = ["All", "Tacos", "BBQ", "Desserts", "Wings", "Latin", "Soul Food", "Coffee"] as const;

type TruckStatus = "available" | "event" | "inquire";

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

function strRow(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

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

function nameInitialFrom(name: string): string {
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

function rowToCard(row: Record<string, unknown>): TruckCard {
  const name = strRow(row, "name") || "Untitled";
  const cuisine = strRow(row, "cuisine") || "General";
  const area = strRow(row, "area", "service_areas") || "Charlotte area";
  const color = strRow(row, "color") || "#F7F2EA";
  const textColor = strRow(row, "text_color", "textColor") || "#1C1A17";
  const initial = strRow(row, "initial") || nameInitialFrom(name);
  const statusRaw = row.status;
  const statusStr = typeof statusRaw === "string" ? statusRaw : null;

  return {
    id: String(row.id ?? strRow(row, "slug") ?? ""),
    name,
    slug: strRow(row, "slug") || String(row.id ?? ""),
    cuisine,
    area,
    status: normalizeStatus(statusStr),
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
    .select("*")
    .eq("active", true)
    .eq("show_in_directory", true);

  if (error) {
    console.error("[find-food-trucks] fetch failed:", error.message);
    return [];
  }

  if (!data?.length) {
    return [];
  }

  return (data as Record<string, unknown>[]).map(rowToCard);
}

function filterTrucks(trucks: TruckCard[], cuisine: string, query: string): TruckCard[] {
  const q = query.trim().toLowerCase();
  return trucks.filter((t) => {
    const matchCuisine = cuisine === "All" || t.cuisine === cuisine;
    const matchQuery =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.cuisine.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q));
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
  const liveCount = trucks.length;

  return (
    <div
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 min-h-[100vh]"
      style={{ background: "var(--ftc-cream)", color: "var(--ftc-ink)" }}
    >
      {/* Full-width header */}
      <header className="border-b px-5 pb-10 pt-8 sm:px-8 lg:px-12" style={{ borderColor: "var(--ftc-border)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className="animate-pulse-dot h-[7px] w-[7px] rounded-full"
                  style={{ background: "var(--ftc-orange)" }}
                  aria-hidden
                />
                <span
                  className="text-[11px] font-medium uppercase tracking-[0.08em]"
                  style={{ color: "var(--ftc-orange)" }}
                >
                  {liveCount > 0 ? `${liveCount} truck${liveCount !== 1 ? "s" : ""} live` : "No trucks listed yet"}
                </span>
                <span style={{ color: "var(--ftc-hint)" }}>·</span>
                <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--ftc-subtle)" }}>
                  Charlotte, NC
                </span>
              </div>
              <h1
                className="font-display font-extrabold leading-[1.05] tracking-[-0.03em]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
                  color: "var(--ftc-ink)",
                }}
              >
                Find Food Trucks
              </h1>
            </div>
          </div>

          {/* Search — offset shadow like hero */}
          <form action="/find-food-trucks" method="get" className="mx-auto mb-8 max-w-[520px]">
            <input type="hidden" name="cuisine" value={cuisine} />
            <div
              className="flex items-center gap-3 rounded-[10px] p-[6px] pl-4 sm:pl-5"
              style={{
                background: "#fff",
                border: "1.5px solid var(--ftc-ink)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                className="shrink-0"
                style={{ color: "var(--ftc-subtle)" }}
                aria-hidden
              >
                <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search trucks, cuisines…"
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none sm:py-3"
                style={{ color: "var(--ftc-ink)" }}
                aria-label="Search trucks and cuisines"
              />
            </div>
          </form>

          {/* Horizontal scrolling cuisine pills */}
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex w-max min-w-full gap-2 px-1">
              {CUISINE_PILLS.map((c) => (
                <Link
                  key={c}
                  href={buildFindUrl({ cuisine: c, q })}
                  scroll={false}
                  className="shrink-0 rounded-full border px-4 py-[7px] text-[13px] transition-colors"
                  style={
                    cuisine === c
                      ? {
                          background: "var(--ftc-ink)",
                          color: "var(--ftc-cream)",
                          borderColor: "var(--ftc-ink)",
                        }
                      : {
                          background: "var(--ftc-cream-md)",
                          color: "#5C5750",
                          borderColor: "var(--ftc-border-md)",
                        }
                  }
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-12">
        <p className="mb-8 text-[12px]" style={{ color: "var(--ftc-subtle)" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {cuisine !== "All" ? ` · ${cuisine}` : ""}
          {q.trim() ? ` · “${q.trim()}”` : ""}
        </p>

        {filtered.length === 0 ? (
          <div
            className="rounded-2xl border px-8 py-16 text-center"
            style={{ borderColor: "var(--ftc-border)", background: "var(--ftc-cream-md)" }}
          >
            <p className="font-display text-xl font-bold" style={{ color: "var(--ftc-ink)" }}>
              {liveCount === 0 ? "No trucks in the directory yet" : "No trucks match your filters"}
            </p>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--ftc-muted)" }}>
              {liveCount === 0
                ? "Check back soon as vendors join Food Truck Charlotte."
                : "Try another cuisine, clear your search, or check back soon as more vendors join the directory."}
            </p>
            {liveCount > 0 ? (
              <Link
                href="/find-food-trucks"
                className="font-display mt-8 inline-block rounded-lg px-6 py-3 text-[14px] font-semibold text-white"
                style={{ background: "var(--ftc-orange)" }}
              >
                Reset filters
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((truck) => {
              const status = STATUS_MAP[truck.status];
              return (
                <Link
                  key={truck.id}
                  href={`/trucks/${truck.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(28,26,23,0.14)]"
                  style={{
                    background: "#fff",
                    border: "1px solid var(--ftc-border)",
                    borderLeft: `4px solid ${truck.color}`,
                    boxShadow: "var(--shadow-soft)",
                    textDecoration: "none",
                  }}
                >
                  <div className="flex flex-1 gap-4 p-5">
                    <div
                      className="font-display flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-[28px] font-bold leading-none"
                      style={{ background: truck.color, color: truck.textColor }}
                    >
                      {truck.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="mb-2 inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                        style={{ color: "var(--ftc-orange)", background: "var(--ftc-orange-lt)" }}
                      >
                        {truck.cuisine}
                      </span>
                      <h2
                        className="font-display mb-1 text-[18px] font-bold leading-snug tracking-tight"
                        style={{ color: "var(--ftc-ink)" }}
                      >
                        {truck.name}
                      </h2>
                      <p className="mb-3 text-[13px] leading-snug" style={{ color: "var(--ftc-muted)" }}>
                        {truck.area}
                      </p>
                      {truck.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {truck.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded px-2 py-0.5 text-[11px]"
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
                      ) : null}
                    </div>
                  </div>
                  <div
                    className="flex items-center justify-between border-t px-5 py-3"
                    style={{ borderColor: "var(--ftc-border)" }}
                  >
                    <span
                      className="rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.06em]"
                      style={{
                        background: status.bg,
                        color: status.color,
                        border: status.border ? `1px solid ${status.border}` : "none",
                      }}
                    >
                      {status.label}
                    </span>
                    <span className="text-[14px] font-semibold" style={{ color: "var(--ftc-orange)" }}>
                      View →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
