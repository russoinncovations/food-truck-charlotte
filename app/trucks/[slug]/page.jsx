"use client";

import Link from "next/link";
import SiteNav from "@/components/SiteNav";

// ─── Replace with Supabase fetch by slug ─────────────────────────────────────
// import { createClient } from "@/lib/supabase/server";
// const supabase = createClient();
// const { data: truck } = await supabase.from("trucks").select("*").eq("slug", params.slug).single();
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_TRUCK = {
  name:        "Latin Stop",
  slug:        "latin-stop",
  cuisine:     "Latin",
  established: "2020",
  area:        ["South End", "Plaza Midwood", "NoDa", "Uptown", "Waxhaw", "Ballantyne", "Charlotte Metro"],
  tagline:     "Authentic tacos, arepas, and Latin street food made from scratch — rolling through Charlotte since 2020.",
  about:       "Latin Stop brings the flavors of Colombia, Mexico, and Venezuela to Charlotte's streets. Every taco is made to order, every arepa hand-pressed fresh. What started as a community staple in South End has grown into one of Charlotte's most-requested trucks for corporate events, breweries, and private parties.",
  eventTypes:  "Private · Corporate · Brewery",
  minGuests:   50,
  status:      "available",
  initial:     "L",
  color:       "#FDDCCE",
  textColor:   "#D94F1E",
  gradient:    "linear-gradient(135deg, #2C1810 0%, #5C3320 30%, #C4622A 60%, #E8A050 100%)",
  eventsCount: "50+",
  menu: [
    { name: "Carne Asada Taco",    desc: "Grilled skirt steak, pico de gallo, cotija, cilantro, corn tortilla", price: "$4.50", tag: "⭐ Top Pick" },
    { name: "Reina Pepiada Arepa", desc: "Shredded chicken, avocado, mayo, fresh herbs on a hand-pressed arepa",  price: "$7.00", tag: null },
    { name: "Black Bean Taco",     desc: "Spiced black beans, pickled red onion, jalapeño crema, queso fresco",   price: "$4.00", tag: "🌱 Veggie" },
    { name: "Al Pastor Plate",     desc: "3 al pastor tacos, Mexican rice, black beans, salsa verde",             price: "$14.00",tag: null },
  ],
  gallery: [
    { emoji: "🌮", label: "Signature Tacos", gradient: "linear-gradient(135deg, #B85C20 0%, #E8904A 100%)", span: "row-span-2" },
    { emoji: "🫓", label: "Fresh Arepas",    gradient: "linear-gradient(135deg, #5C3A1E 0%, #A0622A 100%)", span: "" },
    { emoji: "🥘", label: "Catering Setup",  gradient: "linear-gradient(135deg, #8B4513 0%, #D2691E 100%)", span: "" },
    { emoji: "🍹", label: "At South End",    gradient: "linear-gradient(135deg, #3D1C0A 0%, #7A3010 100%)", span: "" },
    { emoji: "🎉", label: "Event Ready",     gradient: "linear-gradient(135deg, #C44A28 0%, #E8864A 100%)", span: "" },
  ],
  reviews: [
    { initial: "M", name: "Maria T.",  source: "Food Truck Charlotte Community",   stars: 5, text: "Hands down the best tacos at any Charlotte event we've hosted. They showed up early, set up fast, and the line never stopped — that's a good problem to have." },
    { initial: "J", name: "James K.", source: "Corporate Event · Uptown Charlotte", stars: 5, text: "Booked Latin Stop for our company's summer event — 120 people. Effortless to work with, portions were generous, and everyone raved about the arepas." },
  ],
  similar: [
    { id: "saucy-girl-taco-truck", name: "Saucy Girl Taco Truck", type: "General · Waxhaw",          initial: "S", color: "#CCE0F4", textColor: "#185FA5" },
    { id: "annes-cuisine",         name: "Anne's Cuisine LLC",    type: "General · Charlotte Metro",   initial: "A", color: "#F4CCE0", textColor: "#993556" },
  ],
};

export default function TruckProfilePage({ params }) {
  // In production: fetch truck by params.slug from Supabase
  const truck = MOCK_TRUCK;

  return (
    <div style={{ background: "var(--ftc-cream)", color: "var(--ftc-ink)" }}>
      <SiteNav />

      {/* ── HERO BANNER ──────────────────────────────────── */}
      <div
        className="relative w-full flex items-end overflow-hidden"
        style={{ height: "420px", background: truck.gradient }}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(28,26,23,0.88) 0%, rgba(28,26,23,0.2) 55%, transparent 100%)" }}
        />

        {/* Content */}
        <div className="relative z-10 px-10 pb-10 w-full">
          <span
            className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-white px-3 py-[5px] rounded mb-4"
            style={{ background: "rgba(217,79,30,0.9)" }}
          >
            {truck.cuisine} · Food Truck
          </span>

          <h1
            className="font-serif italic font-semibold leading-none tracking-tight text-white mb-3"
            style={{ fontSize: "clamp(3rem, 5vw, 4.5rem)" }}
          >
            {truck.name}
          </h1>

          <p className="text-[15px] font-light text-white/70 max-w-[500px] leading-relaxed mb-4">
            {truck.tagline}
          </p>

          <div className="flex flex-wrap gap-3">
            <span className="text-[12px] text-white/80 border border-white/20 rounded-full px-3 py-[5px] flex items-center gap-2">
              <span className="w-[6px] h-[6px] rounded-full bg-green-400 inline-block" />
              Available to Book
            </span>
            <span className="text-[12px] text-white/80 border border-white/20 rounded-full px-3 py-[5px]">
              📍 {truck.area.slice(0, 3).join(" · ")}
            </span>
            <span className="text-[12px] text-white/80 border border-white/20 rounded-full px-3 py-[5px]">
              ⭐ Community Pick
            </span>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────── */}
      <div
        className="grid mx-auto px-8"
        style={{ gridTemplateColumns: "1fr 320px", maxWidth: "1200px", gap: "0 2rem", alignItems: "start" }}
      >
        {/* ── LEFT COLUMN ── */}
        <div className="py-10 pr-6">

          {/* Stats row */}
          <div
            className="flex rounded-xl overflow-hidden border mb-10"
            style={{ borderColor: "var(--ftc-border)" }}
          >
            {[
              { label: "Established", value: truck.established, sub: "Charlotte-based" },
              { label: "Cuisine",     value: truck.cuisine,     sub: "Tacos · Arepas" },
              { label: "Events",      value: truck.eventsCount, sub: "Catered this year" },
              { label: "Min. Event",  value: truck.minGuests,   sub: "Guests" },
            ].map(({ label, value, sub }, i) => (
              <div
                key={label}
                className="flex-1 px-5 py-4 flex flex-col gap-[3px]"
                style={{ borderLeft: i > 0 ? `1px solid var(--ftc-border)` : "none" }}
              >
                <span className="text-[10px] uppercase tracking-[0.08em] font-medium" style={{ color: "var(--ftc-subtle)" }}>{label}</span>
                <span className="font-display font-bold text-[15px]" style={{ color: "var(--ftc-ink)" }}>{value}</span>
                <span className="text-[11px]" style={{ color: "var(--ftc-hint)" }}>{sub}</span>
              </div>
            ))}
          </div>

          {/* About */}
          <SectionLabel text="About the Truck" />
          <p
            className="font-serif text-[17px] leading-[1.8] mb-10"
            style={{ color: "var(--ftc-ink-lt)" }}
            dangerouslySetInnerHTML={{ __html: truck.about.replace("Every taco", "<strong>Every taco") + "</strong>" }}
          />

          {/* Photo gallery */}
          <SectionLabel text="Gallery" />
          <div
            className="grid gap-2 rounded-xl overflow-hidden mb-10"
            style={{ gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "160px 160px" }}
          >
            {truck.gallery.map((photo, i) => (
              <div
                key={i}
                className={`relative overflow-hidden flex items-center justify-center ${photo.span}`}
                style={{ background: photo.gradient }}
              >
                <span style={{ fontSize: i === 0 ? "48px" : "30px" }}>{photo.emoji}</span>
                <span
                  className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-[3px] rounded tracking-[0.06em]"
                  style={{ background: "rgba(28,26,23,0.65)", color: "rgba(255,252,248,0.9)" }}
                >
                  {photo.label}
                </span>
              </div>
            ))}
          </div>

          {/* Menu highlights */}
          <SectionLabel text="Menu Highlights" />
          <div className="grid grid-cols-2 gap-3 mb-10">
            {truck.menu.map((item) => (
              <div
                key={item.name}
                className="relative rounded-xl p-5 overflow-hidden"
                style={{ background: "var(--ftc-cream-md)", border: "1px solid var(--ftc-border)" }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
                  style={{ background: "var(--ftc-orange)" }}
                />
                {item.tag && (
                  <span
                    className="float-right text-[10px] font-medium px-2 py-[3px] rounded uppercase tracking-[0.05em]"
                    style={{ background: "var(--ftc-orange-lt)", color: "var(--ftc-orange)" }}
                  >
                    {item.tag}
                  </span>
                )}
                <p className="font-display font-bold text-[15px] mb-1" style={{ color: "var(--ftc-ink)" }}>{item.name}</p>
                <p className="text-[12px] leading-relaxed mb-2" style={{ color: "var(--ftc-muted)" }}>{item.desc}</p>
                <p className="font-display font-bold text-[14px]" style={{ color: "var(--ftc-orange)" }}>{item.price}</p>
              </div>
            ))}
          </div>

          {/* Service areas */}
          <SectionLabel text="Service Areas" />
          <div className="flex flex-wrap gap-2 mb-10">
            {truck.area.map((a) => (
              <span
                key={a}
                className="text-[13px] px-4 py-[7px] rounded-lg flex items-center gap-2"
                style={{ background: "var(--ftc-cream-md)", border: "1px solid var(--ftc-border)", color: "#5C5750" }}
              >
                <span className="w-[5px] h-[5px] rounded-full inline-block opacity-60" style={{ background: "var(--ftc-orange)" }} />
                {a}
              </span>
            ))}
          </div>

          {/* Reviews */}
          <SectionLabel text="What People Are Saying" />
          <div className="flex flex-col gap-4">
            {truck.reviews.map((r) => (
              <div
                key={r.name}
                className="rounded-xl p-5"
                style={{ background: "#fff", border: "1px solid var(--ftc-border)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-[13px] flex-shrink-0"
                    style={{ background: "var(--ftc-cream-md)", color: "var(--ftc-orange)" }}
                  >
                    {r.initial}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: "var(--ftc-ink)" }}>{r.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--ftc-subtle)" }}>{r.source}</p>
                  </div>
                  <div className="ml-auto text-[12px] tracking-wide" style={{ color: "var(--ftc-orange)" }}>
                    {"★".repeat(r.stars)}
                  </div>
                </div>
                <p className="font-serif italic text-[14px] leading-[1.7]" style={{ color: "#4A4540" }}>
                  "{r.text}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="py-10" style={{ position: "sticky", top: "72px" }}>

          {/* Inquiry card */}
          <div
            className="rounded-xl overflow-hidden mb-3"
            style={{ border: "1.5px solid var(--ftc-ink)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="px-6 py-5" style={{ background: "var(--ftc-ink)" }}>
              <p className="font-display font-bold text-[16px] text-white mb-[3px]">Send an Inquiry</p>
              <p className="text-[12px] text-white/50">Response typically within 24 hours</p>
            </div>

            <div className="px-6 py-4 bg-white">
              {[
                { label: "Status",      val: <span className="font-medium" style={{ color: "var(--ftc-green)" }}>● Available</span> },
                { label: "Listing fee", val: "Free" },
                { label: "Event types", val: truck.eventTypes },
                { label: "Min. guests", val: truck.minGuests },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-[10px] text-[13px]"
                  style={{ borderBottom: "1px solid var(--ftc-cream-dk)" }}
                >
                  <span style={{ color: "var(--ftc-subtle)" }}>{label}</span>
                  <span style={{ color: "var(--ftc-ink)", fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>

            <Link
              href={`/book-a-truck?truck=${truck.slug}`}
              className="flex items-center justify-center w-full text-[15px] font-medium text-white py-[15px] transition-opacity"
              style={{ background: "var(--ftc-orange)", textDecoration: "none" }}
            >
              Send Inquiry →
            </Link>
          </div>

          {/* Share / Save */}
          <div className="flex gap-2 mb-4">
            {["↗ Share", "♡ Save"].map((label) => (
              <button
                key={label}
                className="flex-1 text-[12px] font-medium py-[9px] rounded-lg border cursor-pointer"
                style={{ background: "var(--ftc-cream-md)", color: "#5C5750", borderColor: "var(--ftc-border-md)" }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Owner card */}
          <div
            className="flex items-center gap-3 rounded-xl p-4 mb-6"
            style={{ background: "var(--ftc-cream-md)", border: "1px solid var(--ftc-border)" }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[18px] flex-shrink-0"
              style={{ background: truck.color, color: truck.textColor }}
            >
              {truck.initial}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium" style={{ color: "var(--ftc-ink)" }}>{truck.name} Team</p>
              <p className="text-[12px]" style={{ color: "var(--ftc-subtle)" }}>Truck Owner · Charlotte, NC</p>
            </div>
            <span
              className="text-[10px] font-medium px-2 py-[3px] rounded uppercase tracking-[0.06em]"
              style={{ background: "var(--ftc-green-lt)", color: "var(--ftc-green)" }}
            >
              Verified
            </span>
          </div>

          {/* Similar trucks */}
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-3"
            style={{ color: "var(--ftc-hint)" }}
          >
            Similar Trucks
          </p>
          <div className="flex flex-col gap-2">
            {truck.similar.map((s) => (
              <Link
                key={s.id}
                href={`/trucks/${s.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-[10px] border transition-colors"
                style={{ background: "#fff", borderColor: "var(--ftc-border)", textDecoration: "none" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--ftc-cream-md)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-[13px] flex-shrink-0"
                  style={{ background: s.color, color: s.textColor }}
                >
                  {s.initial}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium" style={{ color: "var(--ftc-ink)" }}>{s.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--ftc-subtle)" }}>{s.type}</p>
                </div>
                <span style={{ color: "var(--ftc-hint)", fontSize: "14px" }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap"
        style={{ color: "var(--ftc-hint)" }}
      >
        {text}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--ftc-border)" }} />
    </div>
  );
}
