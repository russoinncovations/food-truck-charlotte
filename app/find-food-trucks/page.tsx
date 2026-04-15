"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

// ─── Replace with your real Supabase fetch ───────────────────────────────────
// import { createClient } from "@/lib/supabase/client";
// const { data: trucks } = await supabase.from("trucks").select("*");
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_TRUCKS = [
  { id: "latin-stop",            name: "Latin Stop",             cuisine: "Latin",     area: "South End",       status: "available", initial: "L", color: "#FDDCCE", textColor: "#D94F1E",  tags: ["Tacos","Arepas","Catering"] },
  { id: "the-plated-palette",    name: "The Plated Palette",     cuisine: "American",  area: "NoDa",            status: "inquire",   initial: "T", color: "#CCE8E0", textColor: "#0F6E56",  tags: ["Burgers","Comfort Food","Events"] },
  { id: "lelas-mini-donuts",     name: "Lela's Mini Donuts",     cuisine: "Desserts",  area: "South End",       status: "event",     initial: "L", color: "#FAF0CC", textColor: "#BA7517",  tags: ["Donuts","Sweets","Parties"] },
  { id: "saucy-girl-taco-truck", name: "Saucy Girl Taco Truck",  cuisine: "General",   area: "Waxhaw",          status: "available", initial: "S", color: "#CCE0F4", textColor: "#185FA5",  tags: ["Tacos","Private Events"] },
  { id: "annes-cuisine",         name: "Anne's Cuisine LLC",     cuisine: "General",   area: "Charlotte Metro", status: "inquire",   initial: "A", color: "#F4CCE0", textColor: "#993556",  tags: ["Catering","Corporate"] },
  { id: "naturally-sweet-cafe",  name: "Naturally Sweet Cafe",   cuisine: "Desserts",  area: "Uptown",          status: "available", initial: "N", color: "#D5EED5", textColor: "#2D6A2D",  tags: ["Pastries","Coffee","Vegan"] },
];

const CUISINE_FILTERS = ["All", "American", "Desserts", "General", "Latin", "BBQ", "Soul Food", "Coffee"];

const STATUS_MAP = {
  available: { label: "Available", bg: "#CCE8E0", color: "#0F6E56" },
  event:     { label: "At Event",  bg: "#FDDCCE", color: "#D94F1E" },
  inquire:   { label: "Inquire",   bg: "#F4F0E8", color: "#7A7268", border: "#E8E2D8" },
};

export default function FindTrucksPage() {
  const [cuisine, setCuisine] = useState("All");
  const [query, setQuery]     = useState("");

  const filtered = useMemo(() => {
    return PLACEHOLDER_TRUCKS.filter((t) => {
      const matchCuisine = cuisine === "All" || t.cuisine === cuisine;
      const matchQuery   = t.name.toLowerCase().includes(query.toLowerCase()) ||
                           t.cuisine.toLowerCase().includes(query.toLowerCase());
      return matchCuisine && matchQuery;
    });
  }, [cuisine, query]);

  return (
    <div style={{ background: "var(--ftc-cream)", minHeight: "100vh" }}>
      <SiteNav />

      {/* PAGE HEADER */}
      <div
        className="px-10 pt-12 pb-8 border-b"
        style={{ borderColor: "var(--ftc-border)" }}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] mb-3" style={{ color: "var(--ftc-orange)" }}>
          Charlotte, NC
        </p>
        <h1
          className="font-display font-extrabold tracking-tight mb-6"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--ftc-ink)" }}
        >
          Find Food Trucks
        </h1>

        {/* Search + type toggles */}
        <div className="flex flex-col gap-4">
          <div
            className="flex items-center gap-3 rounded-lg px-5 py-3 max-w-[480px]"
            style={{ background: "#fff", border: "1.5px solid var(--ftc-ink)", boxShadow: "var(--shadow-card)" }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: "var(--ftc-subtle)", flexShrink: 0 }}>
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trucks, cuisines…"
              className="flex-1 bg-transparent outline-none text-[15px]"
              style={{ color: "var(--ftc-ink)" }}
            />
          </div>

          {/* Cuisine pills */}
          <div className="flex flex-wrap gap-2">
            {CUISINE_FILTERS.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine(c)}
                className="text-[12px] px-4 py-[6px] rounded-full border transition-all cursor-pointer"
                style={
                  cuisine === c
                    ? { background: "var(--ftc-ink)", color: "var(--ftc-cream)", borderColor: "var(--ftc-ink)" }
                    : { background: "var(--ftc-cream-md)", color: "#5C5750", borderColor: "var(--ftc-border-md)" }
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div className="px-10 py-8">
        <p className="text-[12px] mb-6" style={{ color: "var(--ftc-subtle)" }}>
          {filtered.length} truck{filtered.length !== 1 ? "s" : ""} found
          {cuisine !== "All" ? ` in ${cuisine}` : ""}
        </p>

        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
        >
          {filtered.map((truck) => {
            const status = STATUS_MAP[truck.status];
            return (
              <Link
                key={truck.id}
                href={`/trucks/${truck.id}`}
                className="group block rounded-xl overflow-hidden border transition-all"
                style={{
                  background: "#fff",
                  borderColor: "var(--ftc-border)",
                  textDecoration: "none",
                  boxShadow: "var(--shadow-soft)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(28,26,23,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-soft)"; }}
              >
                {/* Card image zone */}
                <div
                  className="h-[140px] flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, ${truck.color} 0%, ${truck.color}99 100%)` }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-3xl"
                    style={{ background: "rgba(255,255,255,0.35)", color: truck.textColor }}
                  >
                    {truck.initial}
                  </div>
                  {/* Status badge top-right */}
                  <span
                    className="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded uppercase tracking-[0.06em]"
                    style={{
                      background: status.bg,
                      color: status.color,
                      border: status.border ? `1px solid ${status.border}` : "none",
                    }}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <p
                    className="text-[10px] font-medium uppercase tracking-[0.1em] mb-1"
                    style={{ color: "var(--ftc-orange)" }}
                  >
                    {truck.cuisine}
                  </p>
                  <h3
                    className="font-display font-bold text-[18px] tracking-tight mb-1"
                    style={{ color: "var(--ftc-ink)" }}
                  >
                    {truck.name}
                  </h3>
                  <p className="text-[12px] mb-4" style={{ color: "var(--ftc-subtle)" }}>
                    {truck.area}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {truck.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-1 rounded"
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
                    className="w-full text-center text-[13px] font-medium py-[10px] rounded-lg transition-all"
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
