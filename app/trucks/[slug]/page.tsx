import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type TruckPageProps = {
  params: Promise<{ slug: string }>;
};

type MenuItemVm = { name: string; desc: string; price: string; tag: string | null };
type GalleryItemVm = { emoji: string; label: string; gradient: string; span: string };
type ReviewVm = { initial: string; name: string; source: string; stars: number; text: string };
type SimilarVm = { slug: string; name: string; type: string; initial: string; color: string; textColor: string };

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #2C1810 0%, #5C3320 30%, #C4622A 60%, #E8A050 100%)";

const DEFAULT_GALLERY: GalleryItemVm[] = [
  { emoji: "🌮", label: "Signature dishes", gradient: "linear-gradient(135deg, #B85C20 0%, #E8904A 100%)", span: "row-span-2" },
  { emoji: "🚚", label: "On the road", gradient: "linear-gradient(135deg, #5C3A1E 0%, #A0622A 100%)", span: "" },
  { emoji: "🥘", label: "Catering", gradient: "linear-gradient(135deg, #8B4513 0%, #D2691E 100%)", span: "" },
  { emoji: "📍", label: "Charlotte", gradient: "linear-gradient(135deg, #3D1C0A 0%, #7A3010 100%)", span: "" },
  { emoji: "🎉", label: "Events", gradient: "linear-gradient(135deg, #C44A28 0%, #E8864A 100%)", span: "" },
];

function str(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function num(row: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function nameInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toUpperCase();
}

function parseAreas(row: Record<string, unknown>): string[] {
  const area = row.area;
  if (Array.isArray(area)) {
    return area.map((a) => String(a).trim()).filter(Boolean);
  }
  const raw = str(row, "service_areas", "service_area");
  if (!raw) return [];
  return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

function parseMenu(row: Record<string, unknown>): MenuItemVm[] {
  const raw = row.menu ?? row.menu_items ?? row.menu_highlights_json;
  if (Array.isArray(raw)) {
    if (raw.length && typeof raw[0] === "object" && raw[0] !== null) {
      return (raw as Record<string, unknown>[]).map((item) => ({
        name: str(item, "name", "title"),
        desc: str(item, "desc", "description"),
        price: str(item, "price") || "—",
        tag: str(item, "tag") || null,
      }));
    }
    return (raw as string[]).map((name) => ({
      name,
      desc: "",
      price: "—",
      tag: null,
    }));
  }
  const j = parseJson<unknown>(raw);
  if (Array.isArray(j)) {
    return parseMenu({ ...row, menu: j });
  }
  const highlights = row.menu_highlights;
  if (Array.isArray(highlights) && typeof highlights[0] === "string") {
    return (highlights as string[]).map((name) => ({ name, desc: "", price: "—", tag: null }));
  }
  return [];
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as T;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return null;
}

function parseGallery(row: Record<string, unknown>): GalleryItemVm[] {
  const raw = row.gallery ?? row.gallery_items ?? row.photo_gallery;
  const arr = Array.isArray(raw) ? raw : parseJson<unknown[]>(raw);
  if (!Array.isArray(arr) || arr.length === 0) {
    return DEFAULT_GALLERY;
  }
  return arr.map((item, i) => {
    if (typeof item === "object" && item !== null) {
      const o = item as Record<string, unknown>;
      return {
        emoji: str(o, "emoji", "icon") || "📷",
        label: str(o, "label", "title") || `Photo ${i + 1}`,
        gradient: str(o, "gradient") || DEFAULT_GALLERY[i % DEFAULT_GALLERY.length].gradient,
        span: str(o, "span") || (i === 0 ? "row-span-2" : ""),
      };
    }
    return {
      emoji: "📷",
      label: String(item),
      gradient: DEFAULT_GALLERY[i % DEFAULT_GALLERY.length].gradient,
      span: "",
    };
  });
}

function parseReviews(row: Record<string, unknown>): ReviewVm[] {
  const raw = row.reviews ?? row.reviews_json ?? row.testimonials;
  const arr = Array.isArray(raw) ? raw : parseJson<unknown[]>(raw);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const o = item as Record<string, unknown>;
      const stars = num(o, "stars", "rating") ?? 5;
      return {
        initial: str(o, "initial") || nameInitial(str(o, "name", "author")),
        name: str(o, "name", "author") || "Guest",
        source: str(o, "source", "from") || "Community",
        stars: Math.min(5, Math.max(1, Math.round(stars))),
        text: str(o, "text", "body", "review"),
      };
    })
    .filter((r): r is ReviewVm => r !== null && r.text.length > 0);
}

function establishedYear(row: Record<string, unknown>): string {
  const y = str(row, "established", "year_established", "founded");
  if (y) return y;
  const created = row.created_at;
  if (typeof created === "string") {
    const d = new Date(created);
    if (!Number.isNaN(d.getTime())) return String(d.getFullYear());
  }
  return "—";
}

function eventsCountDisplay(row: Record<string, unknown>): string {
  const n = num(row, "events_count", "events_booked_count");
  if (n != null) return `${n}+`;
  return str(row, "events_count_label") || "—";
}

function taglineFrom(row: Record<string, unknown>): string {
  return str(row, "tagline", "short_bio", "shortBio") || str(row, "description").slice(0, 220);
}

function aboutFrom(row: Record<string, unknown>): string {
  return str(row, "about", "long_description") || str(row, "description");
}

function eventTypesDisplay(row: Record<string, unknown>): string {
  const raw = row.event_types ?? row.event_types_served;
  if (Array.isArray(raw)) {
    return raw.map(String).join(" · ");
  }
  return str(row, "event_types", "eventTypes") || "Private · Corporate · Events";
}

type TruckVm = {
  name: string;
  slug: string;
  cuisine: string;
  established: string;
  area: string[];
  tagline: string;
  about: string;
  eventTypes: string;
  minGuests: number | string;
  status: string;
  initial: string;
  color: string;
  textColor: string;
  gradient: string;
  eventsCount: string;
  menu: MenuItemVm[];
  gallery: GalleryItemVm[];
  reviews: ReviewVm[];
  similar: SimilarVm[];
};

function mapRowToVm(row: Record<string, unknown>, similarRows: Record<string, unknown>[]): TruckVm {
  const name = str(row, "name") || "Food Truck";
  const slug = str(row, "slug") || "unknown";
  const cuisine = str(row, "cuisine") || "General";
  let area = parseAreas(row);
  if (area.length === 0) area = ["Charlotte Metro"];

  const color = str(row, "color") || "#FDDCCE";
  const textColor = str(row, "text_color", "textColor") || "#D94F1E";
  const initial = str(row, "initial") || nameInitial(name);
  const gradient = str(row, "gradient", "hero_gradient") || DEFAULT_GRADIENT;

  let menu = parseMenu(row);
  if (menu.length === 0) {
    menu = [{ name: "Menu", desc: "Contact the truck for current offerings.", price: "—", tag: null }];
  }

  const reviews = parseReviews(row);
  const similar: SimilarVm[] = similarRows.map((r) => {
    const sname = str(r, "name") || "Truck";
    const sslug = str(r, "slug") || "";
    const scuisine = str(r, "cuisine") || "General";
    const sareas = parseAreas(r);
    const areaBit = sareas[0] || "Charlotte";
    return {
      slug: sslug,
      name: sname,
      type: `${scuisine} · ${areaBit}`,
      initial: str(r, "initial") || nameInitial(sname),
      color: str(r, "color") || "#CCE0F4",
      textColor: str(r, "text_color", "textColor") || "#185FA5",
    };
  });

  const minG = num(row, "min_guests", "minGuests", "minimum_guests");
  const minGuests = minG ?? (str(row, "min_guests_label") || "—");

  return {
    name,
    slug,
    cuisine,
    established: establishedYear(row),
    area,
    tagline: taglineFrom(row) || `${name} serves the Charlotte area.`,
    about: aboutFrom(row) || `${name} is listed on Food Truck Charlotte.`,
    eventTypes: eventTypesDisplay(row),
    minGuests,
    status: str(row, "status") || "available",
    initial,
    color,
    textColor,
    gradient,
    eventsCount: eventsCountDisplay(row),
    menu,
    gallery: parseGallery(row),
    reviews,
    similar,
  };
}

async function fetchTruckRow(slug: string): Promise<Record<string, unknown> | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from("trucks")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .eq("show_in_directory", true)
    .maybeSingle();
  if (error) {
    console.error("[trucks/slug] fetch failed:", error.message);
    return null;
  }
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

async function fetchSimilarRows(slug: string, cuisine: string): Promise<Record<string, unknown>[]> {
  const client = getSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from("trucks")
    .select("*")
    .neq("slug", slug)
    .eq("active", true)
    .eq("show_in_directory", true)
    .limit(12);
  if (error || !data?.length) return [];
  const rows = data as Record<string, unknown>[];
  const same = rows.filter((r) => str(r, "cuisine") === cuisine);
  const rest = rows.filter((r) => str(r, "cuisine") !== cuisine);
  return [...same, ...rest].slice(0, 3);
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--ftc-hint)" }}
      >
        {text}
      </span>
      <div className="h-px flex-1" style={{ background: "var(--ftc-border)" }} />
    </div>
  );
}

export async function generateMetadata({ params }: TruckPageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await fetchTruckRow(slug);
  if (!row) {
    return { title: "Truck Not Found" };
  }
  const name = str(row, "name");
  const cuisine = str(row, "cuisine");
  const areas = parseAreas(row);
  const areaPart = areas.length ? ` in ${areas.slice(0, 2).join(", ")}` : "";
  return {
    title: `${name} in Charlotte`,
    description: `${name}. ${cuisine}${areaPart}. View details and book for your event.`,
  };
}

export default async function TruckPage({ params }: TruckPageProps) {
  const { slug } = await params;
  const row = await fetchTruckRow(slug);
  if (!row) {
    notFound();
  }

  const similarRows = await fetchSimilarRows(slug, str(row, "cuisine"));
  const truck = mapRowToVm(row, similarRows);

  const statusLabel =
    truck.status === "available"
      ? "Available to Book"
      : truck.status === "event"
        ? "At an event"
        : "Inquire";

  const heroAreas = truck.area.slice(0, 3).join(" · ");

  return (
    <div style={{ background: "var(--ftc-cream)", color: "var(--ftc-ink)" }}>
      <div
        className="relative flex w-full items-end overflow-hidden"
        style={{ height: "420px", background: truck.gradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(28,26,23,0.88) 0%, rgba(28,26,23,0.2) 55%, transparent 100%)",
          }}
        />

        <div className="relative z-10 w-full px-6 pb-10 sm:px-10">
          <span
            className="mb-4 inline-flex items-center gap-2 rounded px-3 py-[5px] text-[11px] font-medium uppercase tracking-[0.1em] text-white"
            style={{ background: "rgba(217,79,30,0.9)" }}
          >
            {truck.cuisine} · Food Truck
          </span>

          <h1
            className="font-serif mb-3 font-semibold italic leading-none tracking-tight text-white"
            style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
          >
            {truck.name}
          </h1>

          <p className="mb-4 max-w-[500px] text-[15px] font-light leading-relaxed text-white/70">{truck.tagline}</p>

          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-[5px] text-[12px] text-white/80">
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-green-400" />
              {statusLabel}
            </span>
            <span className="rounded-full border border-white/20 px-3 py-[5px] text-[12px] text-white/80">
              📍 {heroAreas}
            </span>
            <span className="rounded-full border border-white/20 px-3 py-[5px] text-[12px] text-white/80">
              ⭐ Community Pick
            </span>
          </div>
        </div>
      </div>

      <div
        className="mx-auto grid max-w-[1200px] grid-cols-1 gap-x-8 px-4 sm:px-8 lg:grid-cols-[1fr_320px]"
        style={{ alignItems: "start" }}
      >
        <div className="py-10 pr-0 lg:pr-6">
          <div
            className="mb-10 flex flex-col overflow-hidden rounded-xl border sm:flex-row"
            style={{ borderColor: "var(--ftc-border)" }}
          >
            {[
              { label: "Established", value: truck.established, sub: "Charlotte-based" },
              { label: "Cuisine", value: truck.cuisine, sub: "Menu highlights below" },
              { label: "Events", value: truck.eventsCount, sub: "Catered this year" },
              { label: "Min. Event", value: truck.minGuests, sub: "Guests" },
            ].map(({ label, value, sub }, i) => (
              <div
                key={label}
                className="flex flex-1 flex-col gap-[3px] px-5 py-4"
                style={{ borderLeft: i > 0 ? `1px solid var(--ftc-border)` : "none" }}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--ftc-subtle)" }}>
                  {label}
                </span>
                <span className="font-display text-[15px] font-bold" style={{ color: "var(--ftc-ink)" }}>
                  {value}
                </span>
                <span className="text-[11px]" style={{ color: "var(--ftc-hint)" }}>
                  {sub}
                </span>
              </div>
            ))}
          </div>

          <SectionLabel text="About the Truck" />
          <p className="font-serif mb-10 text-[17px] leading-[1.8]" style={{ color: "var(--ftc-ink-lt)" }}>
            {truck.about}
          </p>

          <SectionLabel text="Gallery" />
          <div
            className="mb-10 grid gap-2 overflow-hidden rounded-xl"
            style={{ gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "160px 160px" }}
          >
            {truck.gallery.map((photo, i) => (
              <div
                key={`${photo.label}-${i}`}
                className={`relative flex items-center justify-center overflow-hidden ${photo.span}`}
                style={{ background: photo.gradient }}
              >
                <span style={{ fontSize: i === 0 ? "48px" : "30px" }}>{photo.emoji}</span>
                <span
                  className="absolute bottom-2 left-2 rounded px-2 py-[3px] text-[10px] font-medium tracking-[0.06em]"
                  style={{ background: "rgba(28,26,23,0.65)", color: "rgba(255,252,248,0.9)" }}
                >
                  {photo.label}
                </span>
              </div>
            ))}
          </div>

          <SectionLabel text="Menu Highlights" />
          <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {truck.menu.map((item, mi) => (
              <div
                key={`${item.name}-${mi}`}
                className="relative overflow-hidden rounded-xl p-5"
                style={{ background: "var(--ftc-cream-md)", border: "1px solid var(--ftc-border)" }}
              >
                <div
                  className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-xl"
                  style={{ background: "var(--ftc-orange)" }}
                />
                {item.tag ? (
                  <span
                    className="float-right rounded px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.05em]"
                    style={{ background: "var(--ftc-orange-lt)", color: "var(--ftc-orange)" }}
                  >
                    {item.tag}
                  </span>
                ) : null}
                <p className="font-display mb-1 text-[15px] font-bold" style={{ color: "var(--ftc-ink)" }}>
                  {item.name}
                </p>
                {item.desc ? (
                  <p className="mb-2 text-[12px] leading-relaxed" style={{ color: "var(--ftc-muted)" }}>
                    {item.desc}
                  </p>
                ) : null}
                <p className="font-display text-[14px] font-bold" style={{ color: "var(--ftc-orange)" }}>
                  {item.price}
                </p>
              </div>
            ))}
          </div>

          <SectionLabel text="Service Areas" />
          <div className="mb-10 flex flex-wrap gap-2">
            {truck.area.map((a) => (
              <span
                key={a}
                className="flex items-center gap-2 rounded-lg px-4 py-[7px] text-[13px]"
                style={{ background: "var(--ftc-cream-md)", border: "1px solid var(--ftc-border)", color: "#5C5750" }}
              >
                <span className="inline-block h-[5px] w-[5px] rounded-full opacity-60" style={{ background: "var(--ftc-orange)" }} />
                {a}
              </span>
            ))}
          </div>

          <SectionLabel text="What People Are Saying" />
          {truck.reviews.length === 0 ? (
            <p className="mb-6 text-[14px]" style={{ color: "var(--ftc-muted)" }}>
              No reviews yet — be the first to share feedback after your event.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {truck.reviews.map((r) => (
                <div
                  key={`${r.name}-${r.text.slice(0, 24)}`}
                  className="rounded-xl p-5"
                  style={{ background: "#fff", border: "1px solid var(--ftc-border)" }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="font-display flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                      style={{ background: "var(--ftc-cream-md)", color: "var(--ftc-orange)" }}
                    >
                      {r.initial}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--ftc-ink)" }}>
                        {r.name}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--ftc-subtle)" }}>
                        {r.source}
                      </p>
                    </div>
                    <div className="ml-auto text-[12px] tracking-wide" style={{ color: "var(--ftc-orange)" }}>
                      {"★".repeat(r.stars)}
                    </div>
                  </div>
                  <p className="font-serif text-[14px] italic leading-[1.7]" style={{ color: "#4A4540" }}>
                    &ldquo;{r.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="py-10" style={{ position: "sticky", top: "72px" }}>
          <div
            className="mb-3 overflow-hidden rounded-xl"
            style={{ border: "1.5px solid var(--ftc-ink)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="px-6 py-5" style={{ background: "var(--ftc-ink)" }}>
              <p className="font-display mb-[3px] text-[16px] font-bold text-white">Send an Inquiry</p>
              <p className="text-[12px] text-white/50">Response typically within 24 hours</p>
            </div>

            <div className="bg-white px-6 py-4">
              {[
                {
                  label: "Status",
                  val: (
                    <span className="font-medium" style={{ color: "var(--ftc-green)" }}>
                      ● {truck.status === "available" ? "Available" : truck.status === "event" ? "At Event" : "Inquire"}
                    </span>
                  ),
                },
                { label: "Listing fee", val: "Free" },
                { label: "Event types", val: truck.eventTypes },
                { label: "Min. guests", val: truck.minGuests },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-[10px] text-[13px]"
                  style={{ borderBottom: "1px solid var(--ftc-cream-dk)" }}
                >
                  <span style={{ color: "var(--ftc-subtle)" }}>{label}</span>
                  <span style={{ color: "var(--ftc-ink)", fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/book-a-truck?truck=${encodeURIComponent(truck.slug)}`}
              className="flex w-full items-center justify-center py-[15px] text-[15px] font-medium text-white transition-opacity hover:opacity-95"
              style={{ background: "var(--ftc-orange)", textDecoration: "none" }}
            >
              Send Inquiry →
            </Link>
          </div>

          <div className="mb-4 flex gap-2">
            {["↗ Share", "♡ Save"].map((label) => (
              <button
                key={label}
                type="button"
                className="flex-1 cursor-default rounded-lg border py-[9px] text-[12px] font-medium"
                style={{ background: "var(--ftc-cream-md)", color: "#5C5750", borderColor: "var(--ftc-border-md)" }}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className="mb-6 flex items-center gap-3 rounded-xl p-4"
            style={{ background: "var(--ftc-cream-md)", border: "1px solid var(--ftc-border)" }}
          >
            <div
              className="font-display flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[18px] font-bold"
              style={{ background: truck.color, color: truck.textColor }}
            >
              {truck.initial}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium" style={{ color: "var(--ftc-ink)" }}>
                {truck.name} Team
              </p>
              <p className="text-[12px]" style={{ color: "var(--ftc-subtle)" }}>
                Truck Owner · Charlotte, NC
              </p>
            </div>
            <span
              className="rounded px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.06em]"
              style={{ background: "var(--ftc-green-lt)", color: "var(--ftc-green)" }}
            >
              Verified
            </span>
          </div>

          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--ftc-hint)" }}
          >
            Similar Trucks
          </p>
          <div className="flex flex-col gap-2">
            {truck.similar.length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--ftc-muted)" }}>
                No other listings right now.
              </p>
            ) : (
              truck.similar.map((s) => (
                <Link
                  key={s.slug}
                  href={`/trucks/${s.slug}`}
                  className="group flex items-center gap-3 rounded-lg border px-3 py-[10px] transition-colors"
                  style={{ background: "#fff", borderColor: "var(--ftc-border)", textDecoration: "none" }}
                >
                  <div
                    className="font-display flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[13px] font-bold"
                    style={{ background: s.color, color: s.textColor }}
                  >
                    {s.initial}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium" style={{ color: "var(--ftc-ink)" }}>
                      {s.name}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--ftc-subtle)" }}>
                      {s.type}
                    </p>
                  </div>
                  <span style={{ color: "var(--ftc-hint)", fontSize: "14px" }}>→</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
