"use client";

import { useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import MarqueeBar from "@/components/MarqueeBar";

const CUISINES = ["All", "Tacos", "BBQ", "Desserts", "Wings", "Latin", "Soul Food", "Coffee"];

const FEATURED_TRUCKS = [
  { id: "latin-stop",           name: "Latin Stop",            cuisine: "Latin",     area: "South End · Plaza Midwood",  status: "available", initial: "L", color: "#FDDCCE", textColor: "#D94F1E" },
  { id: "the-plated-palette",   name: "The Plated Palette",    cuisine: "American",  area: "NoDa · Uptown",              status: "inquire",   initial: "T", color: "#CCE8E0", textColor: "#0F6E56" },
  { id: "lelas-mini-donuts",    name: "Lela's Mini Donuts",    cuisine: "Desserts",  area: "South End · Ballantyne",     status: "event",     initial: "L", color: "#FAF0CC", textColor: "#BA7517" },
  { id: "saucy-girl-taco-truck",name: "Saucy Girl Taco Truck", cuisine: "General",   area: "Waxhaw · Marvin",            status: "available", initial: "S", color: "#CCE0F4", textColor: "#185FA5" },
  { id: "annes-cuisine",        name: "Anna's Cuisine LLC",    cuisine: "General",   area: "Charlotte Metro",            status: "inquire",   initial: "A", color: "#F4CCE0", textColor: "#993556" },
];

const STATUS_MAP = {
  available: { label: "Available", bg: "#CCE8E0", color: "#0F6E56" },
  event:     { label: "At Event",  bg: "#FDDCCE", color: "#D94F1E" },
  inquire:   { label: "Inquire",   bg: "#F4F0E8", color: "#7A7268", border: "#E8E2D8" },
};

export default function HeroSection() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div style={{ background: "var(--ftc-cream)", color: "var(--ftc-ink)" }}>
      <SiteNav />
      <MarqueeBar />

      {/* HERO BODY */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "1fr 340px", minHeight: "calc(100vh - 100px)" }}
      >
        {/* LEFT */}
        <div className="flex flex-col justify-center px-14 py-20">

          {/* Live tag */}
          <div className="flex items-center gap-2 mb-8">
            <span
              className="w-[7px] h-[7px] rounded-full animate-pulse-dot"
              style={{ background: "var(--ftc-orange)" }}
            />
            <span
              className="text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ color: "var(--ftc-orange)" }}
            >
              16 trucks active
            </span>
            <span style={{ color: "var(--ftc-hint)" }}>·</span>
            <span
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ color: "var(--ftc-subtle)" }}
            >
              Charlotte, NC
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-extrabold leading-[0.95] tracking-[-0.04em] mb-6"
            style={{ fontSize: "clamp(3.2rem, 5.5vw, 5rem)", color: "var(--ftc-ink)" }}
          >
            Charlotte's<br />
            food trucks,{" "}
            <span style={{ color: "var(--ftc-orange)" }}>all here.</span>
          </h1>

          <p
            className="text-base font-light leading-[1.65] mb-10 max-w-[420px]"
            style={{ color: "var(--ftc-muted)" }}
          >
            The only local guide built from Charlotte's own 35,000-member food
            truck community. Browse, discover, and book — free.
          </p>

          {/* Search bar */}
          <div
            className="flex items-center gap-3 rounded-[10px] p-[6px] pl-5 max-w-[500px] mb-8"
            style={{
              background: "#fff",
              border: "1.5px solid var(--ftc-ink)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <input
              type="text"
              placeholder="Search cuisine, truck name…"
              className="flex-1 bg-transparent outline-none text-[15px]"
              style={{ color: "var(--ftc-ink)" }}
            />
            <span
              className="h-6 w-px"
              style={{ background: "var(--ftc-border)" }}
            />
            <span className="text-[13px] whitespace-nowrap" style={{ color: "var(--ftc-subtle)" }}>
              📍 Charlotte, NC
            </span>
            <Link
              href="/trucks"
              className="text-[14px] font-medium text-white px-5 py-[11px] rounded-[7px] whitespace-nowrap"
              style={{ background: "var(--ftc-orange)" }}
            >
              Find Trucks
            </Link>
          </div>

          {/* Cuisine filters */}
          <div className="flex flex-wrap gap-2 mb-12">
            {CUISINES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveFilter(c)}
                className="text-[13px] px-4 py-[7px] rounded-full border transition-all cursor-pointer"
                style={
                  activeFilter === c
                    ? { background: "var(--ftc-ink)", color: "var(--ftc-cream)", borderColor: "var(--ftc-ink)" }
                    : { background: "var(--ftc-cream-md)", color: "#5C5750", borderColor: "var(--ftc-border-md)" }
                }
              >
                {c}
              </button>
            ))}
          </div>

          {/* Trust strip */}
          <div className="flex items-center gap-8">
            {[
              { num: "35K+",     label: "Community Members" },
              { num: "Since '20", label: "Charlotte-Based" },
              { num: "Free",     label: "Always" },
            ].map(({ num, label }, i, arr) => (
              <div key={label} className="flex items-center gap-8">
                <div className="flex flex-col gap-[2px]">
                  <span
                    className="font-display font-bold text-[24px] leading-none tracking-tight"
                    style={{ color: "var(--ftc-ink)" }}
                  >
                    {num}
                  </span>
                  <span
                    className="text-[11px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--ftc-subtle)" }}
                  >
                    {label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <span className="h-8 w-px" style={{ background: "var(--ftc-border)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div
          className="flex flex-col border-l"
          style={{ background: "var(--ftc-cream-md)", borderColor: "var(--ftc-border)" }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-6 py-5 border-b"
            style={{ borderColor: "var(--ftc-border)" }}
          >
            <span
              className="font-display text-[13px] font-bold uppercase tracking-[0.06em]"
              style={{ color: "var(--ftc-subtle)" }}
            >
              Featured Trucks
            </span>
            <span className="text-[12px]" style={{ color: "var(--ftc-hint)" }}>
              Showing 5 of 23
            </span>
          </div>

          {/* Truck rows */}
          <div className="flex-1">
            {FEATURED_TRUCKS.map((truck, i) => {
              const status = STATUS_MAP[truck.status];
              return (
                <Link
                  key={truck.id}
                  href={`/trucks/${truck.id}`}
                  className="flex items-center gap-4 px-6 py-4 border-b group transition-colors animate-slide-in"
                  style={{
                    borderColor: "var(--ftc-border)",
                    background: "var(--ftc-cream-md)",
                    animationDelay: `${i * 0.08}s`,
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--ftc-cream-dk)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "var(--ftc-cream-md)"}
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-[10px] flex items-center justify-center font-display font-bold text-lg flex-shrink-0"
                    style={{ background: truck.color, color: truck.textColor }}
                  >
                    {truck.initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-display font-bold text-[15px] tracking-tight truncate"
                      style={{ color: "var(--ftc-ink)" }}
                    >
                      {truck.name}
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--ftc-subtle)" }}>
                      {truck.cuisine} · {truck.area}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className="text-[10px] font-medium px-2 py-1 rounded uppercase tracking-[0.06em] flex-shrink-0"
                    style={{
                      background: status.bg,
                      color: status.color,
                      border: status.border ? `1px solid ${status.border}` : "none",
                    }}
                  >
                    {status.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* CTA */}
          <div className="p-5">
            <Link
              href="/trucks"
              className="flex items-center justify-center w-full text-[14px] font-medium rounded-lg py-[13px]"
              style={{ background: "var(--ftc-ink)", color: "var(--ftc-cream)" }}
            >
              Browse All Trucks →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
